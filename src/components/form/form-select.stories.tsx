import type { Meta, StoryObj } from "@storybook/react";
import { FormSelect } from "./form-select";

const meta: Meta<typeof FormSelect> = {
  title: "Form/FormSelect",
  component: FormSelect,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormSelect>;

export const Default: Story = {
  render: (args) => (
    <FormSelect {...args}>
      <option value="">Select a region...</option>
      <option value="us-east-1">US East (N. Virginia)</option>
      <option value="us-west-2">US West (Oregon)</option>
      <option value="eu-west-1">EU (Ireland)</option>
      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
    </FormSelect>
  ),
};

export const WithSelection: Story = {
  render: (args) => (
    <FormSelect {...args} defaultValue="us-east-1">
      <option value="us-east-1">US East (N. Virginia)</option>
      <option value="us-west-2">US West (Oregon)</option>
      <option value="eu-west-1">EU (Ireland)</option>
    </FormSelect>
  ),
};

export const ErrorState: Story = {
  render: (args) => (
    <FormSelect {...args} error>
      <option value="">Select a status...</option>
      <option value="active">Active</option>
      <option value="decommissioned">Decommissioned</option>
    </FormSelect>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <FormSelect {...args} disabled defaultValue="active">
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </FormSelect>
  ),
};
