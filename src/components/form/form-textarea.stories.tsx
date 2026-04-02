import type { Meta, StoryObj } from "@storybook/react";
import { FormTextarea } from "./form-textarea";

const meta: Meta<typeof FormTextarea> = {
  title: "Form/FormTextarea",
  component: FormTextarea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormTextarea>;

export const Default: Story = {
  args: {
    placeholder: "Enter description...",
    rows: 4,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Firmware update required for CVE-2024-1234 patch.",
    rows: 4,
  },
};

export const ErrorState: Story = {
  args: {
    error: true,
    defaultValue: "",
    placeholder: "This field is required",
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Read-only notes from previous deployment.",
    rows: 4,
  },
};
