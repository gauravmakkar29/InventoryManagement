import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./form-field";
import { FormInput } from "./form-input";

const meta: Meta<typeof FormField> = {
  title: "Form/FormField",
  component: FormField,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  render: () => (
    <FormField label="Device Name" htmlFor="device-name">
      <FormInput id="device-name" placeholder="e.g. SW-CORE-01" />
    </FormField>
  ),
};

export const Required: Story = {
  render: () => (
    <FormField label="Serial Number" htmlFor="serial" required>
      <FormInput id="serial" placeholder="Enter serial number" />
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField label="IP Address" htmlFor="ip" required error="Invalid IP address format">
      <FormInput id="ip" error defaultValue="999.999.999" />
    </FormField>
  ),
};
