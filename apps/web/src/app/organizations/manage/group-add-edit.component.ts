import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AbstractControl, FormArray, FormBuilder, FormControl, Validators } from "@angular/forms";

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

function findSortedIndex<T>(sortedArray: T[], val: T, compareFn: (a: T, b: T) => number) {
  let low = 0;
  let high = sortedArray.length || 0;
  let mid = -1,
    c = 0;
  while (low < high) {
    mid = Math.floor((low + high) / 2);
    c = compareFn(sortedArray[mid], val);
    if (c < 0) {
      low = mid + 1;
    } else if (c > 0) {
      high = mid;
    } else {
      return mid;
    }
  }
  return low;
}

class SelectionList<TItem extends { id: string }, TControlValue extends { id: string }> {
  selectedOptions: TItem[] = [];
  deselectedOptions: TItem[] = [];
  formArray: FormArray<AbstractControl<Partial<TControlValue>, TControlValue>>;

  constructor(
    private controlFactory: (item: TItem) => AbstractControl<Partial<TControlValue>, TControlValue>,
    private compareFn: (a: TItem, b: TItem) => number
  ) {
    this.formArray = new FormArray([]);
  }

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

  selectItem(id: string, initialValue?: Partial<TControlValue>): TItem | undefined {
    const index = this.deselectedOptions.findIndex((o) => o.id === id);

    if (index === -1) {
      return;
    }

    const selectedOption = this.deselectedOptions[index];

    // Remove from the list of deselected options
    this.deselectedOptions.splice(index, 1);

    // Insert into the sorted selected options list
    const sortedInsertIndex = findSortedIndex(this.selectedOptions, selectedOption, this.compareFn);
    this.selectedOptions.splice(sortedInsertIndex, 0, selectedOption);

    const newControl = this.controlFactory(selectedOption);

    newControl.patchValue({
      id,
      ...initialValue,
    });

    this.formArray.insert(sortedInsertIndex, newControl);

    return selectedOption;
  }

  deselectItem(id: string): TItem | undefined {
    const index = this.selectedOptions.findIndex((o) => o.id === id);

    if (index === -1) {
      return;
    }

    const deselectedOption = this.selectedOptions[index];

    // Remove from the list of selected options
    this.selectedOptions.splice(index, 1);
    this.formArray.removeAt(index);

    // Insert into the form array (sorted)
    const sortedInsertIndex = findSortedIndex(
      this.deselectedOptions,
      deselectedOption,
      this.compareFn
    );
    this.deselectedOptions.splice(sortedInsertIndex, 0, deselectedOption);

    return deselectedOption;
  }

  populateItems(
    items: TItem[],
    selectedItems: { id: string; initialValue?: TControlValue }[] = []
  ) {
    this.deselectedOptions = items.sort(this.compareFn);
    for (const selectedItem of selectedItems) {
      this.selectItem(selectedItem.id, selectedItem.initialValue);
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

type EditGroupCollectionView = {
  id: string;
  collection: CollectionView;
  permission: CollectionPermission;
};
type EditGroupMemberView = { member: OrganizationUserUserDetailsResponse; id: string };
type GroupCollectionSelection = { id: string; permission: CollectionPermission };

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
  formPromise: Promise<any>;
  deletePromise: Promise<any>;
  permissions = CollectionPermission;
  initialPermission = CollectionPermission.VIEW;
  collections: EditGroupCollectionView[] = [];
  members: EditGroupMemberView[] = [];

  collectionList = new SelectionList<EditGroupCollectionView, GroupCollectionSelection>(
    (item) =>
      this.formBuilder.group({
        id: item.id,
        permission: item.permission,
      }),
    (a, b) => this.i18nService.collator.compare(a.collection.name, b.collection.name)
  );

  memberList = new SelectionList<EditGroupMemberView, { id: string }>(
    (item) => this.formBuilder.group({ id: item.id }),
    (a, b) =>
      this.i18nService.collator.compare(
        a.member.name + a.member.email + a.member.id,
        b.member.name + b.member.email + b.member.id
      )
  );

  groupForm = this.formBuilder.group({
    name: new FormControl("", Validators.required),
    externalId: new FormControl(""),
    members: this.memberList.formArray,
    collections: this.collectionList.formArray,
  });

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

        this.collectionList.populateItems(
          this.collections,
          group.collections.map((gc) => ({
            id: gc.id,
            initialValue: { id: gc.id, permission: fromSelectionReadonly(gc) },
          }))
        );

        this.memberList.populateItems(
          this.members,
          users.map((u) => ({ id: u, initialValue: { id: u } }))
        );
      } catch (e) {
        this.logService.error(e);
      }
    } else {
      this.title = this.i18nService.t("addGroup");
      this.memberList.populateItems(this.members);
      this.collectionList.populateItems(this.collections);
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
    const decryptedCollections = await this.collectionService.decryptMany(collections);
    this.collections = decryptedCollections
      .sort((a, b) => this.i18nService.collator.compare(a.name, b.name))
      .map((c) => ({
        id: c.id,
        collection: c,
        permission: fromSelectionReadonly(c),
      }));
  }

  async loadMembers() {
    const response = await this.apiService.getOrganizationUsers(this.organizationId);
    this.members = response.data.map((m) => ({
      id: m.id,
      member: m,
    }));
  }

  addMember(event: Event) {
    const target = event.target as HTMLSelectElement;
    const addedId = target.value;
    this.memberList.selectItem(addedId);
    target.value = "";
  }

  addCollection(event: Event) {
    const target = event.target as HTMLSelectElement;
    const addedId = target.value;
    this.collectionList.selectItem(addedId, {
      permission: this.initialPermission,
    });
    target.value = "";
  }

  check(c: CollectionView, select?: boolean) {
    (c as any).checked = select == null ? !(c as any).checked : select;
    if (!(c as any).checked) {
      c.readOnly = false;
    }
  }

  selectAll(select: boolean) {
    // this.collections.forEach((c) => this.check(c, select));
  }

  findMember(id: string) {
    return this.members.find((m) => m.member.id === id);
  }

  findCollection(id: string) {
    return this.collections.find((c) => c.collection.id === id);
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
