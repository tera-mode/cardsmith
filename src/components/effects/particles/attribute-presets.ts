export const ATTRIBUTE_COLORS = {
  sei:  { main: '#fde68a', sub: '#ffffff', name: '聖' },
  mei:  { main: '#a78bfa', sub: '#1e1b4b', name: '冥' },
  shin: { main: '#86efac', sub: '#14532d', name: '森' },
  en:   { main: '#fb923c', sub: '#7f1d1d', name: '焔' },
  sou:  { main: '#7dd3fc', sub: '#0c4a6e', name: '蒼' },
  kou:  { main: '#cbd5e1', sub: '#334155', name: '鋼' },
} as const;

export type AttributeKey = keyof typeof ATTRIBUTE_COLORS;
