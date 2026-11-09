import type { ProductOptionGroup } from '../types/catalog';

const NUMBER_BALLOON_OPTIONS = Array.from({ length: 10 }, (_, number) => String(number));

export function getProductOptionGroups(
  name: string,
  description: string,
  optionGroups: ProductOptionGroup[] = []
): ProductOptionGroup[] {
  const isNumberFoilBalloon =
    /\bnumber\b.*\bfoil\b.*\bballoon\b/i.test(`${name} ${description}`);
  const hasNumberOption = optionGroups.some((group) => /\bnumber\b/i.test(group.name));

  if (!isNumberFoilBalloon || hasNumberOption) return optionGroups;

  return [
    ...optionGroups,
    {
      id: 'balloon-number',
      name: 'Balloon Number',
      options: NUMBER_BALLOON_OPTIONS,
    },
  ];
}

export function normalizeNumberBalloonCopy(name: string, value: string): string {
  if (!/\bnumber\b.*\bfoil\b.*\bballoon\b/i.test(name)) return value;
  return value.replace(/\bNumbe(?=\s+Foil\s+Balloon)/i, 'Number');
}
