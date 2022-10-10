import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { PreloadedEnglishI18nModule } from "../../../tests/preloaded-english-i18n.module";

import { BreadcrumbComponent } from "./breadcrumb.component";
import { BreadcrumbsComponent } from "./breadcrumbs.component";

export default {
  title: "Web/Breadcrumbs",
  component: BreadcrumbsComponent,
  decorators: [
    moduleMetadata({
      imports: [PreloadedEnglishI18nModule],
      declarations: [BreadcrumbComponent],
    }),
  ],
  args: {
    items: [],
  },
} as Meta;

const Template: Story<BreadcrumbsComponent> = (args: BreadcrumbsComponent) => ({
  props: args,
  template: `
    <bit-breadcrumbs>
      <bit-breadcrumb *ngFor="let item of items" [icon]="item.icon">{{item.name}}</bit-breadcrumb>
    </bit-breadcrumbs>
  `,
});

export const TopLevel = Template.bind({});
TopLevel.args = {
  items: [{ icon: "bwi-star", name: "Acme Vault" }] as Breadcrumb[],
};

interface Breadcrumb {
  icon?: string;
  name: string;
}
