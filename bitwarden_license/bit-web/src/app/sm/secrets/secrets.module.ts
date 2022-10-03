import { NgModule } from "@angular/core";

import { SecretsSharedModule } from "../shared/sm-shared.module";

import { SecretDeleteDialogComponent } from "./dialog/secret-delete.component";
import { SecretDialogComponent } from "./dialog/secret-dialog.component";
import { SecretsRoutingModule } from "./secrets-routing.module";
import { SecretsComponent } from "./secrets.component";
import { SecretsSecretsSharedModule } from "./shared/sm-secrets.shared.module";

@NgModule({
  imports: [SecretsSharedModule, SecretsSecretsSharedModule, SecretsRoutingModule],
  declarations: [SecretsComponent, SecretDialogComponent, SecretDeleteDialogComponent],
  exports: [],
  providers: [],
})
export class SecretsModule {}
