import { Meta, Story, moduleMetadata } from "@storybook/angular";

import { PreloadedEnglishI18nModule } from "../../../tests/preloaded-english-i18n.module";

import { BreadcrumbsComponent } from "./breadcrumbs.component";

export default {
  title: "Web/Breadcrumbs",
  component: BreadcrumbsComponent,
  decorators: [
    moduleMetadata({
      imports: [PreloadedEnglishI18nModule],
      declarations: [],
    }),
  ],
  args: {},
} as Meta;

const Template: Story<BreadcrumbsComponent> = (args: BreadcrumbsComponent) => ({
  props: args,
});

export const TopLevel = Template.bind({});
