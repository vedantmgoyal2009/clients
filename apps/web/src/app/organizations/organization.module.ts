import { NgModule } from "@angular/core";

import { SharedModule } from "../shared";

import { AccessSelectorModule } from "./components/access-selector";
import { GroupAddEditComponent } from "./manage/group-add-edit.component";
import { GroupsComponent } from "./manage/groups.component";
import { OrganizationsRoutingModule } from "./organization-routing.module";

@NgModule({
  imports: [SharedModule, AccessSelectorModule, OrganizationsRoutingModule],
  declarations: [GroupsComponent, GroupAddEditComponent],
})
export class OrganizationModule {}
