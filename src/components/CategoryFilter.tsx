"use client";

import React from "react";
import { LINK_CATEGORIES } from "@/lib/categories";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: "전체", value: "ALL" },
  ...LINK_CATEGORIES.map(({ label, value }) => ({ label, value })),
];

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {CATEGORY_TABS.map((tab) => {
        const isSelected = selectedCategory === tab.value;
        const count = categoryCounts[tab.value] ?? 0;

        return (
          <button
            key={tab.value}
            onClick={() => onSelectCategory(tab.value)}
            className={`h-8.5 px-3.5 rounded-full text-[13px] font-semibold transition shrink-0 border flex items-center gap-1.5 socar-press active:scale-[0.95] ${
              isSelected
                ? "bg-[#EBF5FF] border-[#0078FF] text-[#0078FF]"
                : "bg-white border-[#E5E8EF] text-[#697383] hover:bg-[#F2F3F8]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                isSelected
                  ? "bg-[#0078FF] text-white"
                  : "bg-[#F2F3F8] text-[#99A1B1]"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
