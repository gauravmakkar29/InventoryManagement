import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockChangeLanguage = vi.fn();

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        language: "en-US",
        changeLanguage: mockChangeLanguage,
      },
    }),
  };
});

// Import after mocks are set up
import { LocaleSwitcher } from "@/app/components/locale-switcher";

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
  });

  it("renders a select element with language options", () => {
    render(<LocaleSwitcher />);
    const select = screen.getByRole("combobox", { name: /select language/i });
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThanOrEqual(2);
  });

  it("shows full language labels in default mode", () => {
    render(<LocaleSwitcher />);
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows short codes in compact mode", () => {
    render(<LocaleSwitcher compact />);
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("ES")).toBeInTheDocument();
  });

  it("calls changeLanguage when a new locale is selected", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);
    const select = screen.getByRole("combobox", { name: /select language/i });

    await user.selectOptions(select, "es-ES");
    expect(mockChangeLanguage).toHaveBeenCalledWith("es-ES");
  });
});
