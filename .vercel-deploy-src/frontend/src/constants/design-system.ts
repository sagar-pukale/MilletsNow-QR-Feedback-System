export const colorPalette = {
  brand: {
    50: '#FCF5F7',
    100: '#F8E8ED',
    200: '#F1D1DB',
    300: '#E4AEBF',
    400: '#D27E99',
    500: '#B95172',
    600: '#97324F',
    700: '#7B1E3A',
    800: '#681C34',
    900: '#581B30',
    950: '#310B18',
  },
  secondary: '#F8F6F3',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#2563EB',
} as const

export const typography = {
  fontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
  display: { fontSize: '3rem', lineHeight: '1.08', fontWeight: 700 },
  h1: { fontSize: '2.25rem', lineHeight: '1.2', fontWeight: 700 },
  h2: { fontSize: '1.875rem', lineHeight: '1.25', fontWeight: 700 },
  h3: { fontSize: '1.5rem', lineHeight: '1.33', fontWeight: 700 },
  h4: { fontSize: '1.25rem', lineHeight: '1.4', fontWeight: 700 },
  bodyLarge: { fontSize: '1rem', lineHeight: '1.625', fontWeight: 500 },
  body: { fontSize: '0.9375rem', lineHeight: '1.5', fontWeight: 500 },
  bodySmall: { fontSize: '0.875rem', lineHeight: '1.25', fontWeight: 500 },
  caption: { fontSize: '0.75rem', lineHeight: '1', fontWeight: 600 },
} as const

export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export const radii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '0.875rem',
  xl: '1rem',
  full: '9999px',
} as const

export const shadows = {
  soft: '0 2px 16px rgb(49 11 24 / 6%)',
  card: '0 1px 3px rgb(31 24 27 / 4%), 0 8px 24px rgb(49 11 24 / 5%)',
  floating: '0 12px 32px rgb(49 11 24 / 12%)',
} as const

export const chartColors = [
  colorPalette.brand[700],
  colorPalette.brand[500],
  colorPalette.success,
  colorPalette.warning,
  colorPalette.info,
] as const

export const layoutTokens = {
  sidebarWidth: '17.5rem',
  navbarHeight: '4rem',
  contentMaxWidth: '90rem',
} as const
