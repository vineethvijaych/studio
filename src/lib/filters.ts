export type Filter = {
  name: string;
  id: 'none' | 'sunset' | 'sepia' | 'grayscale';
  style: React.CSSProperties;
};

export const filters: Filter[] = [
  { name: 'None', id: 'none', style: { filter: 'none' } },
  { name: 'Sepia', id: 'sepia', style: { filter: 'sepia(1)' } },
  { name: 'B & W', id: 'grayscale', style: { filter: 'grayscale(1)' } },
  { name: 'Sunset', id: 'sunset', style: { filter: 'sepia(0.5) hue-rotate(-15deg) contrast(1.1) saturate(1.4)' } },
];

export type FilterType = typeof filters[0];
