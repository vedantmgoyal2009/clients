import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { Organization } from "@bitwarden/common/models/domain/organization";

@Component({
  selector: "app-org-billing-tab",
  templateUrl: "organization-billing-tab.component.html",
})
export class OrganizationBillingTabComponent implements OnInit {
  organization: Organization;

  constructor(private route: ActivatedRoute, private organizationService: OrganizationService) {}

  ngOnInit() {
    this.route.parent.params.subscribe(async (params) => {
      this.organization = await this.organizationService.get(params.organizationId);
    });
  }
}
