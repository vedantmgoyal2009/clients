import { Meta, Story } from "@storybook/angular";

import { TypographyDirective } from "./typography.directive";

export default {
  title: "Component Library/Typography",
  component: TypographyDirective,
  args: {
    bitTypography: "body1",
  },
} as Meta;

const Template: Story = (args) => ({
  props: args,
  template: `<span [bitTypography]="bitTypography">Content</span>`,
});

export const H1 = Template.bind({});
H1.args = {
  bitTypography: "h1",
};

export const H2 = Template.bind({});
H2.args = {
  bitTypography: "h2",
};

export const H3 = Template.bind({});
H3.args = {
  bitTypography: "h3",
};

export const H4 = Template.bind({});
H4.args = {
  bitTypography: "h4",
};

export const H5 = Template.bind({});
H5.args = {
  bitTypography: "h5",
};

export const H6 = Template.bind({});
H6.args = {
  bitTypography: "h6",
};

export const Body1 = Template.bind({});
Body1.args = {
  bitTypography: "body1",
};

export const Body2 = Template.bind({});
Body2.args = {
  bitTypography: "body2",
};

export const Helper = Template.bind({});
Helper.args = {
  bitTypography: "helper",
};
