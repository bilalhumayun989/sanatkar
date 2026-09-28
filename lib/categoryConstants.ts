export const FIXED_CATEGORY_OPTIONS = [
  { value: 'machines', label: 'Machines' },
  { value: 'parts', label: 'Parts' },
  { value: 'attachments', label: 'Attachments' },
  { value: 'others', label: 'Others' },
] as const;

export type FixedCategoryValue = (typeof FIXED_CATEGORY_OPTIONS)[number]['value'];

export const FIXED_CATEGORY_VALUES = FIXED_CATEGORY_OPTIONS.map((option) => option.value);

export function normalizeCategoryValue(value?: string | null): FixedCategoryValue {
  const candidate = (value || '').trim().toLowerCase();
  return FIXED_CATEGORY_VALUES.includes(candidate as FixedCategoryValue)
    ? (candidate as FixedCategoryValue)
    : 'others';
}

export function getCategoryOption(value?: string | null) {
  const normalizedValue = normalizeCategoryValue(value);
  return FIXED_CATEGORY_OPTIONS.find((option) => option.value === normalizedValue) || FIXED_CATEGORY_OPTIONS[3];
}
