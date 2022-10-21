import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormControl, Validators } from "@angular/forms";

import { FormSelectionList, SelectionItemId } from "@bitwarden/angular/utils/FormSelectionList";
import { SelectionReadOnly } from "@bitwarden/cli/src/models/selectionReadOnly";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { GroupServiceAbstraction } from "@bitwarden/common/abstractions/group";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { CollectionData } from "@bitwarden/common/models/data/collection.data";
import { Collection } from "@bitwarden/common/models/domain/collection";
import { GroupRequest } from "@bitwarden/common/models/request/group.request";
import { SelectionReadOnlyRequest } from "@bitwarden/common/models/request/selection-read-only.request";
import { CollectionDetailsResponse } from "@bitwarden/common/models/response/collection.response";
import { OrganizationUserUserDetailsResponse } from "@bitwarden/common/models/response/organization-user.response";
import { CollectionView } from "@bitwarden/common/models/view/collection.view";
import { GroupView } from "@bitwarden/common/models/view/group-view";

enum CollectionPermission {
  VIEW = "view",
  VIEW_EXCEPT_PASSWORDS = "viewExceptPass",
  EDIT = "edit",
  EDIT_EXCEPT_PASSWORDS = "editExceptPass",
}

const convertToPermission = (value: SelectionReadOnly) => {
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

const isReadonly = (perm: CollectionPermission) =>
  [CollectionPermission.VIEW, CollectionPermission.VIEW_EXCEPT_PASSWORDS].includes(perm);

const hidePassword = (perm: CollectionPermission) =>
  [CollectionPermission.VIEW_EXCEPT_PASSWORDS, CollectionPermission.EDIT_EXCEPT_PASSWORDS].includes(
    perm
  );

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
  formPromise: Promise<any>;
  deletePromise: Promise<any>;
  permissionList = [
    { perm: CollectionPermission.VIEW, labelId: "canView" },
    { perm: CollectionPermission.VIEW_EXCEPT_PASSWORDS, labelId: "canViewExceptPass" },
    { perm: CollectionPermission.EDIT, labelId: "canEdit" },
    { perm: CollectionPermission.EDIT_EXCEPT_PASSWORDS, labelId: "canEditExceptPass" },
  ];
  initialPermission = CollectionPermission.VIEW;
  collections: CollectionView[] = [];
  members: OrganizationUserUserDetailsResponse[] = [];
  group: GroupView;

  collectionList = new FormSelectionList<CollectionView, GroupCollectionSelection>(
    (item) =>
      this.formBuilder.group({
        id: item.id,
        permission: this.initialPermission,
      }),
    (a, b) => this.i18nService.collator.compare(a.name, b.name)
  );

  memberList = new FormSelectionList<OrganizationUserUserDetailsResponse, SelectionItemId>(
    (item) => this.formBuilder.group({ id: item.id }),
    (a, b) => this.i18nService.collator.compare(a.name + a.email + a.id, b.name + b.email + b.id)
  );

  groupForm = this.formBuilder.group({
    accessAll: new FormControl(false),
    name: new FormControl("", Validators.required),
    externalId: new FormControl(""),
    members: this.memberList.formArray,
    collections: this.collectionList.formArray,
  });

  constructor(
    private apiService: ApiService,
    private groupService: GroupServiceAbstraction,
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
        this.group = await this.groupService.get(this.organizationId, this.groupId);
        const users = await this.apiService.getGroupUsers(this.organizationId, this.groupId);
        this.groupForm.patchValue({
          name: this.group.name,
          externalId: this.group.externalId,
          accessAll: this.group.accessAll,
        });

        this.collectionList.populateItems(
          this.collections,
          this.group.collections.map((gc) => ({
            id: gc.id,
            permission: convertToPermission(gc),
          }))
        );

        this.memberList.populateItems(
          this.members,
          users.map((u) => ({ id: u }))
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

  async submit() {
    const request = new GroupRequest();
    const formValue = this.groupForm.value;
    request.name = formValue.name;
    request.externalId = formValue.externalId;
    request.accessAll = formValue.accessAll;
    request.users = formValue.members?.map((m) => m.id) ?? [];

    if (!request.accessAll) {
      request.collections = formValue.collections.map(
        (c) =>
          new SelectionReadOnlyRequest(c.id, isReadonly(c.permission), hidePassword(c.permission))
      );
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
        this.i18nService.t(this.editMode ? "editedGroupId" : "createdGroupId", formValue.name)
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
      this.group.name,
      this.i18nService.t("yes"),
      this.i18nService.t("no"),
      "warning"
    );
    if (!confirmed) {
      return false;
    }

    try {
      this.deletePromise = this.groupService.delete(this.organizationId, this.groupId);
      await this.deletePromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("deletedGroupId", this.group.name)
      );
      this.onDeletedGroup.emit();
    } catch (e) {
      this.logService.error(e);
    }
  }
}
