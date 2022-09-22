import { DialogRef } from "@angular/cdk/dialog";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AbstractControl, FormArray, FormBuilder, FormControl, Validators } from "@angular/forms";
import { remove, sortBy, sortedIndexBy, ValueIteratee } from "lodash";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CollectionData } from "@bitwarden/common/models/data/collectionData";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { GroupRequest } from "@bitwarden/common/models/request/groupRequest";
import { SelectionReadOnlyRequest } from "@bitwarden/common/models/request/selectionReadOnlyRequest";
import { CollectionDetailsResponse } from "@bitwarden/common/models/response/collectionResponse";
import { OrganizationUserUserDetailsResponse } from "@bitwarden/common/models/response/organizationUserResponse";
import { CollectionView } from "@bitwarden/common/models/view/collectionView";

class FormListSelection<TModel, TControl extends AbstractControl> {
  allOptions: TModel[] = [];
  selectedOptions: TModel[] = [];
  availableOptions: TModel[] = [];

  constructor(
    private formArray: FormArray<TControl>,
    private mapper: (model: TModel) => TControl,
    private iteratee?: ValueIteratee<TModel>
  ) {}

  selectOptions(indices: number[]) {
    const sortedIndices = indices.sort();
    // Go through indices in reverse order to avoid messing up index order
    for (let i = sortedIndices.length - 1; i >= 0; i--) {
      this.selectOption(sortedIndices[i]);
    }
  }

  deselectOptions(indices: number[]) {
    const sortedIndices = indices.sort();
    // Go through indices in reverse order to avoid messing up index order
    for (let i = sortedIndices.length - 1; i >= 0; i--) {
      this.deselectOption(sortedIndices[i]);
    }
  }

  selectOption(index: number) {
    const selectedOption = this.availableOptions[index];

    if (selectedOption == undefined) {
      return;
    }

    // Remove from the list of available options
    this.availableOptions.splice(index, 1);

    // Insert into the form array (sorted)
    const sortedInsertIndex = sortedIndexBy(this.selectedOptions, selectedOption, this.iteratee);
    this.selectedOptions.splice(sortedInsertIndex, 0, selectedOption);
    this.formArray.insert(sortedInsertIndex, this.mapper(selectedOption));
  }

  deselectOption(index: number) {
    const deselectedOption = this.selectedOptions[index];

    if (deselectedOption == undefined) {
      return;
    }

    // Remove from the list of selected options
    this.selectedOptions.splice(index, 1);
    this.formArray.removeAt(index);

    // Insert into the form array (sorted)
    const sortedInsertIndex = sortedIndexBy(this.availableOptions, deselectedOption, this.iteratee);
    this.availableOptions.splice(sortedInsertIndex, 0, deselectedOption);
  }

  populateOptions(options: TModel[]) {
    this.allOptions = sortBy(options, this.iteratee);
    this.availableOptions = [...this.allOptions];
  }
}

@Component({
  selector: "app-group-add-edit",
  templateUrl: "group-add-edit.component.html",
})
export class GroupAddEditComponent implements OnInit {
  @Input() groupId: string;
  @Input() organizationId: string;
  @Output() onSavedGroup = new EventEmitter();
  @Output() onDeletedGroup = new EventEmitter();

  loading = true;
  editMode = false;
  title: string;
  name: string;
  externalId: string;
  access: "all" | "selected" = "selected";
  collections: CollectionView[] = [];
  members: OrganizationUserUserDetailsResponse[] = [];
  selectedMembers: OrganizationUserUserDetailsResponse[] = [];
  availableToAddMembers: OrganizationUserUserDetailsResponse[] = [];
  formPromise: Promise<any>;
  deletePromise: Promise<any>;

  groupForm = this.formBuilder.group({
    name: new FormControl("", Validators.required),
    externalId: new FormControl(""),
    members: this.formBuilder.array<string>([]),
    collections: this.formBuilder.array([]),
  });

  memberListSelection = new FormListSelection<
    OrganizationUserUserDetailsResponse,
    FormControl<string>
  >(
    this.groupForm.controls.members,
    (m) => new FormControl<string>(m.id),
    (m) => m.name || m.email || m.id
  );

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private collectionService: CollectionService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private formBuilder: FormBuilder,
    public dialogRef: DialogRef
  ) {}

  async ngOnInit() {
    this.editMode = this.loading = this.groupId != null;
    const collectionsPromise = this.loadCollections();
    const membersPromise = this.loadMembers();

    await Promise.all([collectionsPromise, membersPromise]);

    this.availableToAddMembers = this.members;
    this.memberListSelection.populateOptions(this.members);

    if (this.editMode) {
      this.editMode = true;
      this.title = this.i18nService.t("editGroup");
      try {
        const group = await this.apiService.getGroupDetails(this.organizationId, this.groupId);
        this.access = group.accessAll ? "all" : "selected";
        this.name = group.name;
        this.externalId = group.externalId;
        if (group.collections != null && this.collections != null) {
          group.collections.forEach((s) => {
            const collection = this.collections.filter((c) => c.id === s.id);
            if (collection != null && collection.length > 0) {
              (collection[0] as any).checked = true;
              collection[0].readOnly = s.readOnly;
              collection[0].hidePasswords = s.hidePasswords;
            }
          });
        }
      } catch (e) {
        this.logService.error(e);
      }
    } else {
      this.title = this.i18nService.t("addGroup");
    }

    this.loading = false;
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
    const addedIndex = parseInt(target.value);
    this.memberListSelection.selectOption(addedIndex);
    // const addedMember = this.members.find((m) => m.id == addedId);
    // this.groupForm.controls.members.push(new FormControl(addedId));
    // this.selectedMembers.push(addedMember);
    // remove(this.availableToAddMembers, addedMember);
    target.value = "";
  }

  removeMember(member: OrganizationUserUserDetailsResponse) {
    this.groupForm.controls.members.removeAt(
      this.groupForm.value.members.findIndex((m) => m === member.id)
    );

    remove(this.selectedMembers, member);
    this.availableToAddMembers.push(member);
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
    const request = new GroupRequest();
    request.name = this.name;
    request.externalId = this.externalId;
    request.accessAll = this.access === "all";
    if (!request.accessAll) {
      request.collections = this.collections
        .filter((c) => (c as any).checked)
        .map((c) => new SelectionReadOnlyRequest(c.id, !!c.readOnly, !!c.hidePasswords));
    }

    try {
      if (this.editMode) {
        this.formPromise = this.apiService.putGroup(this.organizationId, this.groupId, request);
      } else {
        this.formPromise = this.apiService.postGroup(this.organizationId, request);
      }
      await this.formPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t(this.editMode ? "editedGroupId" : "createdGroupId", this.name)
      );
      this.onSavedGroup.emit();
    } catch (e) {
      this.logService.error(e);
    }
  }

  async delete() {
    if (!this.editMode) {
      return;
    }

    const confirmed = await this.platformUtilsService.showDialog(
      this.i18nService.t("deleteGroupConfirmation"),
      this.name,
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      this.deletePromise = this.apiService.deleteGroup(this.organizationId, this.groupId);
      await this.deletePromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("deletedGroupId", this.name)
      );
      this.onDeletedGroup.emit();
    } catch (e) {
      this.logService.error(e);
    }
  }
}
