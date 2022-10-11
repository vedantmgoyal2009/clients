import { NgModule } from "@angular/core";

import { SecretsSharedModule } from "../../shared/sm-shared.module";

import { SecretsListComponent } from "./secrets-list.component";

@NgModule({
  imports: [SecretsSharedModule],
  declarations: [SecretsListComponent],
  exports: [SecretsListComponent],
  providers: [],
})
export class SecretsSecretsSharedModule {}
