import type { Meta, StoryObj } from "@storybook/react";
import { FormInput } from "./form-input";

const meta: Meta<typeof FormInput> = {
  title: "Form/FormInput",
  component: FormInput,
  tags: ["autodocs"],
  args: {
    placeholder: "Enter value...",
  },
};

export default meta;
type Story = StoryObj<typeof FormInput>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: "192.168.1.1",
  },
};

export const ErrorState: Story = {
  args: {
    error: true,
    defaultValue: "invalid",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Read-only value",
  },
};

export const WithType: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
  },
};
