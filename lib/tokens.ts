/** Design tokens – single source of truth for layout styles */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

export const typography = {
  title: 'text-2xl font-bold tracking-tight',
  body: 'text-base',
  small: 'text-sm text-muted-foreground',
  mono: 'text-xs font-mono text-muted-foreground',
} as const;

export const colors = {
  background: 'bg-background',
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  border: 'border-border',
  card: 'bg-card',
  cardHover: 'hover:bg-muted/30',
} as const;

export const radius = 'rounded-lg' as const;

/** Page-level layout helpers */
export const page = {
  container: 'max-w-4xl mx-auto px-4 py-8',
  title: 'text-2xl font-bold tracking-tight text-foreground',
  section: 'space-y-4',
} as const;
