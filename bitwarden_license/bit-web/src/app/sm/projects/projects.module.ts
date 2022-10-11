import { NgModule } from "@angular/core";

import { SecretsSecretsSharedModule } from "../secrets/shared/sm-secrets.shared.module";
import { SecretsSharedModule } from "../shared/sm-shared.module";

import { ProjectDialogComponent } from "./dialog/project-dialog.component";
import { ProjectsListComponent } from "./project-list/projects-list.component";
import { ProjectSecretsComponent } from "./project/project-secrets.component";
import { ProjectComponent } from "./project/project.component";
import { ProjectsRoutingModule } from "./projects-routing.module";
import { ProjectsComponent } from "./projects/projects.component";

@NgModule({
  imports: [SecretsSharedModule, SecretsSecretsSharedModule, ProjectsRoutingModule],
  declarations: [
    ProjectComponent,
    ProjectsComponent,
    ProjectsListComponent,
    ProjectSecretsComponent,
    ProjectDialogComponent,
  ],
  providers: [],
})
export class ProjectsModule {}
