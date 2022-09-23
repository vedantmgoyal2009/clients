import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { sortBy, sortedIndexBy, ValueIteratee } from "lodash";

import { SelectionReadOnly } from "@bitwarden/cli/src/models/selectionReadOnly";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CollectionData } from "@bitwarden/common/models/data/collectionData";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { CollectionDetailsResponse } from "@bitwarden/common/models/response/collectionResponse";
import { OrganizationUserUserDetailsResponse } from "@bitwarden/common/models/response/organizationUserResponse";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

class FormSelectionList<TModel extends { id: string }, TControlValue> {
  selectedOptions: TModel[] = [];
  deselectedOptions: TModel[] = [];

  constructor(
    private formArray: FormArray,
    private controlFactory: (model: TModel) => AbstractControl<Partial<TControlValue>>,
    private iteratee?: ValueIteratee<TModel>
  ) {}

  selectItems(ids: string[]) {
    for (const id of ids) {
      this.selectItem(id);
    }
  }

  deselectItems(ids: string[]) {
    for (const id of ids) {
      this.deselectItem(id);
    }
  }

  selectItem(id: string, initialValue?: TControlValue) {
    const index = this.deselectedOptions.findIndex((o) => o.id === id);

    if (index === -1) {
      return;
    }

    const selectedOption = this.deselectedOptions[index];

    // Remove from the list of available options
    this.deselectedOptions.splice(index, 1);

    // Insert into the form array (sorted)
    const sortedInsertIndex = sortedIndexBy(this.selectedOptions, selectedOption, this.iteratee);
    this.selectedOptions.splice(sortedInsertIndex, 0, selectedOption);

    const formControl = this.controlFactory(selectedOption);
    if (initialValue) {
      formControl.setValue(initialValue);
    }

    this.formArray.insert(sortedInsertIndex, formControl);
  }

  deselectItem(id: string) {
    const index = this.selectedOptions.findIndex((o) => o.id === id);

    if (index === -1) {
      return;
    }

    const deselectedOption = this.selectedOptions[index];

    // Remove from the list of selected options
    this.selectedOptions.splice(index, 1);
    this.formArray.removeAt(index);

    // Insert into the form array (sorted)
    const sortedInsertIndex = sortedIndexBy(
      this.deselectedOptions,
      deselectedOption,
      this.iteratee
    );
    this.deselectedOptions.splice(sortedInsertIndex, 0, deselectedOption);
  }

  populateItems(items: TModel[], selectedValues: [string, TControlValue?][] = []) {
    this.deselectedOptions = sortBy(items, this.iteratee);
    for (const selectedValue of selectedValues) {
      this.selectItem(selectedValue[0], selectedValue[1]);
    }
  }
}

const fromSelectionReadonly = (value: SelectionReadOnly) => {
  if (value.readOnly) {
    return value.hidePasswords
      ? CollectionPermission.VIEW_EXCEPT_PASSWORDS
      : CollectionPermission.VIEW;
  } else {
    return value.hidePasswords
      ? CollectionPermission.EDIT_EXCEPT_PASSWORDS
      : CollectionPermission.EDIT;
  }
};

enum CollectionPermission {
  VIEW,
  VIEW_EXCEPT_PASSWORDS,
  EDIT,
  EDIT_EXCEPT_PASSWORDS,
}

type GroupCollectionView = SelectionReadOnly & { name: string };
type GroupCollectionSelection = { id: string; permission: CollectionPermission };

export type ControlsOf<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Record<any, any> ? FormGroup<ControlsOf<T[K]>> : FormControl<T[K]>;
};

@Component({
  selector: "app-group-add-edit",
  templateUrl: "group-add-edit.component.html",
})
export class GroupAddEditComponent implements OnInit {
  @Input() groupId: string;
  @Input() organizationId: string;
  @Output() onSavedGroup = new EventEmitter();
  @Output() onDeletedGroup = new EventEmitter();

  tabIndex = 0;
  loading = true;
  editMode = false;
  title: string;
  access: "all" | "selected" = "selected";
  collections: CollectionView[] = [];
  members: OrganizationUserUserDetailsResponse[] = [];
  formPromise: Promise<any>;
  deletePromise: Promise<any>;
  permissions = CollectionPermission;
  initialPermission = CollectionPermission.VIEW;

  groupForm = this.formBuilder.group({
    name: new FormControl("", Validators.required),
    externalId: new FormControl(""),
    members: this.formBuilder.array<FormControl<string>>([]),
    collections: this.formBuilder.array<FormGroup<ControlsOf<GroupCollectionSelection>>>([]),
  });

  memberListSelection = new FormSelectionList<OrganizationUserUserDetailsResponse, string>(
    this.groupForm.controls.members as FormArray,
    (m) => new FormControl<string>(m.id),
    (m) => m.name + m.email + m.id
  );

  collectionListSelection = new FormSelectionList<GroupCollectionView, GroupCollectionSelection>(
    this.groupForm.controls.collections,
    (m) =>
      this.formBuilder.nonNullable.group({
        id: m.id,
        permission: this.initialPermission,
      }),
    (m) => m.name + m.id
  );

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private collectionService: CollectionService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private formBuilder: FormBuilder
  ) {}

  async ngOnInit() {
    this.editMode = this.loading = this.groupId != null;
    const collectionsPromise = this.loadCollections();
    const membersPromise = this.loadMembers();

    await Promise.all([collectionsPromise, membersPromise]);

    if (this.editMode) {
      this.editMode = true;
      this.title = this.i18nService.t("editGroup");
      try {
        const group = await this.apiService.getGroupDetails(this.organizationId, this.groupId);
        const users = await this.apiService.getGroupUsers(this.organizationId, this.groupId);
        this.access = group.accessAll ? "all" : "selected";
        this.groupForm.patchValue({
          name: group.name,
          externalId: group.externalId,
        });
        this.collectionListSelection.populateItems(
          this.collections,
          group.collections.map((c) => [c.id, { id: c.id, permission: fromSelectionReadonly(c) }])
        );
        this.memberListSelection.populateItems(
          this.members,
          users.map((u) => [u, u])
        );
      } catch (e) {
        this.logService.error(e);
      }
    } else {
      this.title = this.i18nService.t("addGroup");
      this.collectionListSelection.populateItems(this.collections);
      this.memberListSelection.populateItems(this.members);
    }

    this.loading = false;
  }

  logForm() {
    console.log(this.groupForm.value);
  }

  async loadCollections() {
    const response = await this.apiService.getCollections(this.organizationId);
    const collections = response.data.map(
      (r) => new Collection(new CollectionData(r as CollectionDetailsResponse))
    );
    this.collections = await this.collectionService.decryptMany(collections);
  }

  async loadMembers() {
    const response = await this.apiService.getOrganizationUsers(this.organizationId);
    this.members = response.data;
  }

  addMember(event: Event) {
    const target = event.target as HTMLSelectElement;
    const addedId = target.value;
    this.memberListSelection.selectItem(addedId);
    target.value = "";
  }

  addCollection(event: Event) {
    const target = event.target as HTMLSelectElement;
    const addedId = target.value;
    this.collectionListSelection.selectItem(addedId);
    target.value = "";
  }

  check(c: CollectionView, select?: boolean) {
    (c as any).checked = select == null ? !(c as any).checked : select;
    if (!(c as any).checked) {
      c.readOnly = false;
    }
  }

  selectAll(select: boolean) {
    this.collections.forEach((c) => this.check(c, select));
  }

  async submit() {
    // const request = new GroupRequest();
    // request.name = this.name;
    // request.externalId = this.externalId;
    // request.accessAll = this.access === "all";
    // if (!request.accessAll) {
    //   request.collections = this.collections
    //     .filter((c) => (c as any).checked)
    //     .map((c) => new SelectionReadOnlyRequest(c.id, !!c.readOnly, !!c.hidePasswords));
    // }
    //
    // try {
    //   if (this.editMode) {
    //     this.formPromise = this.apiService.putGroup(this.organizationId, this.groupId, request);
    //   } else {
    //     this.formPromise = this.apiService.postGroup(this.organizationId, request);
    //   }
    //   await this.formPromise;
    //   this.platformUtilsService.showToast(
    //     "success",
    //     null,
    //     this.i18nService.t(this.editMode ? "editedGroupId" : "createdGroupId", this.name)
    //   );
    //   this.onSavedGroup.emit();
    // } catch (e) {
    //   this.logService.error(e);
    // }
  }

  async delete() {
    // if (!this.editMode) {
    //   return;
    // }
    //
    // const confirmed = await this.platformUtilsService.showDialog(
    //   this.i18nService.t("deleteGroupConfirmation"),
    //   this.name,
    //   this.i18nService.t("yes"),
    //   this.i18nService.t("no"),
    //   "warning"
    // );
    // if (!confirmed) {
    //   return false;
    // }
    //
    // try {
    //   this.deletePromise = this.apiService.deleteGroup(this.organizationId, this.groupId);
    //   await this.deletePromise;
    //   this.platformUtilsService.showToast(
    //     "success",
    //     null,
    //     this.i18nService.t("deletedGroupId", this.name)
    //   );
    //   this.onDeletedGroup.emit();
    // } catch (e) {
    //   this.logService.error(e);
    // }
  }
}
