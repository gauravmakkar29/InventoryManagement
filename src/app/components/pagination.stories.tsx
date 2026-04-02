import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./pagination";

const meta: Meta<typeof Pagination> = {
  title: "UI/Pagination",
  component: Pagination,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    page: 1,
    totalPages: 10,
    total: 247,
    pageSize: 25,
    onPageChange: () => undefined,
  },
};

export const MiddlePage: Story = {
  args: {
    page: 5,
    totalPages: 10,
    total: 247,
    pageSize: 25,
    onPageChange: () => undefined,
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
    totalPages: 10,
    total: 247,
    pageSize: 25,
    onPageChange: () => undefined,
  },
};

export const WithPageSizeSelector: Story = {
  args: {
    page: 1,
    totalPages: 25,
    total: 247,
    pageSize: 10,
    onPageChange: () => undefined,
    onPageSizeChange: () => undefined,
  },
};

export const FewPages: Story = {
  args: {
    page: 2,
    totalPages: 3,
    total: 28,
    pageSize: 10,
    onPageChange: () => undefined,
  },
};

export const Interactive: Story = {
  render: function InteractivePagination() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const total = 247;
    const totalPages = Math.ceil(total / pageSize);

    return (
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    );
  },
};
