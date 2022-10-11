import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, Observable } from "rxjs";

import { SecretListView } from "@bitwarden/common/src/models/view/secretListView";

import { SecretService } from "../../secrets/secret.service";

@Component({
  selector: "sm-project-secrets",
  templateUrl: "./project-secrets.component.html",
})
export class ProjectSecretsComponent {
  secrets: Observable<SecretListView[]>;

  constructor(private route: ActivatedRoute, private secretService: SecretService) {
    this.secrets = this.route.params.pipe(
      concatMap((params) => {
        return this.secretService.getSecretsByProject(params.organizationId, params.projectId);
      })
    );
  }
}
