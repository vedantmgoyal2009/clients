import { Injectable, OnInit } from "@angular/core";

import { VaultFilter } from "@bitwarden/angular/modules/vault-filter/models/vault-filter.model";
import { VaultFilterService as BaseVaultFilterService } from "@bitwarden/angular/modules/vault-filter/vault-filter.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/abstractions/folder.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { OrganizationService } from "@bitwarden/common/abstractions/organization.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { Organization } from "@bitwarden/common/models/domain/organization";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

@Injectable()
export class VaultFilterService extends BaseVaultFilterService {
  vaultFilter: VaultFilter = new VaultFilter();
  allVaults = "allVaults";
  myVault = "myVault";
  modified = false;

  constructor(
    stateService: StateService,
    organizationService: OrganizationService,
    folderService: FolderService,
    cipherService: CipherService,
    collectionService: CollectionService,
    policyService: PolicyService,
    private i18nService: I18nService
  ) {
    super(
      stateService,
      organizationService,
      folderService,
      cipherService,
      collectionService,
      policyService
    );

    this.vaultFilter.myVaultOnly = false;
    this.vaultFilter.selectedOrganizationId = null;
  }

  async setDefaultFilter() {
    const defaultVaultFilterSet = await this.stateService.getDefaultVaultFilter();
    if (defaultVaultFilterSet === "myVault") {
      this.setVaultFilter("myVault");
    } else if (defaultVaultFilterSet !== "allVaults") {
      this.setVaultFilter(defaultVaultFilterSet);
    }
    console.log(defaultVaultFilterSet);
  }

  async showVaultFilter() {
    const organizations = await this.buildOrganizations();
    return (
      (organizations.length > 0 && !(await this.checkForSingleOrganizationPolicy())) ||
      (organizations.length > 1 && (await this.checkForPersonalOwnershipPolicy()))
    );
  }

  async getVaultFilterOptions(): Promise<{ key: string; value: string }[]> {
    const options: { key: string; value: string }[] = [
      { key: "allVaults", value: this.i18nService.t("allVaults") },
    ];
    if (!(await this.checkForPersonalOwnershipPolicy())) {
      options.push({ key: "myVault", value: this.i18nService.t("myVault") });
    }
    const orgs = (await this.buildOrganizations()).sort((a, b) => a.name.localeCompare(b.name));
    orgs.forEach((o) => {
      options.push({ key: o.id, value: o.name });
    });

    return options;
  }

  async getVaultFilter() {
    if (!this.modified) {
      await this.setDefaultFilter();
    }
    return this.vaultFilter;
  }

  setVaultFilter(filter: string) {
    if (filter === this.allVaults) {
      this.vaultFilter.myVaultOnly = false;
      this.vaultFilter.selectedOrganizationId = null;
    } else if (filter === this.myVault) {
      this.vaultFilter.myVaultOnly = true;
      this.vaultFilter.selectedOrganizationId = null;
    } else {
      this.vaultFilter.myVaultOnly = false;
      this.vaultFilter.selectedOrganizationId = filter;
    }
    this.modified = true;
  }

  clear() {
    this.setVaultFilter(this.allVaults);
  }

  filterCipherForSelectedVault(cipher: CipherView) {
    if (!this.vaultFilter.selectedOrganizationId && !this.vaultFilter.myVaultOnly) {
      return false;
    }
    if (this.vaultFilter.selectedOrganizationId) {
      if (cipher.organizationId === this.vaultFilter.selectedOrganizationId) {
        return false;
      }
    } else if (this.vaultFilter.myVaultOnly) {
      if (!cipher.organizationId) {
        return false;
      }
    }
    return true;
  }
}
