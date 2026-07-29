// Design tokens mirrored from the NovaFleet web admin (client/src/styles.css)
// and the driver-app wireframe, so the driver mobile app stays visually
// consistent with the rest of the product.

export const lightColors = {
  navy: '#0B1F3A',
  navySoft: '#12345A',
  accent: '#2E6BE6',
  accentDim: '#EFF5FF',
  bg: '#F5F7FA',
  panel: '#FFFFFF',
  text: '#101828',
  muted: '#64748B',
  line: '#E4E8F0',
  lineSoft: '#EEF2F7',
  success: '#15803D',
  successBg: '#DCFCE7',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  info: '#1D4ED8',
  infoBg: '#DBEAFE',
};

export const darkColors = {
  navy: '#0B1F3A',
  navySoft: '#12345A',
  accent: '#4C86F0',
  accentDim: '#16233D',
  bg: '#06162B',
  panel: '#172033',
  text: '#E5EDF8',
  muted: '#A3B0C2',
  line: '#334155',
  lineSoft: '#263448',
  success: '#22C55E',
  successBg: '#123321',
  danger: '#F87171',
  dangerBg: '#3B1414',
  warning: '#FBBF24',
  warningBg: '#3A2A0C',
  info: '#60A5FA',
  infoBg: '#132A4D',
};

export const radius = { sm: 9, md: 12, lg: 14, xl: 18, full: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const fontFamily = {
  display: 'PlusJakartaSans_800ExtraBold',
  displaySemibold: 'PlusJakartaSans_700Bold',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemibold: 'IBMPlexSans_600SemiBold',
  bodyBold: 'IBMPlexSans_700Bold',
};

export const STATUS_COLORS = {
  Scheduled: { bg: 'infoBg', fg: 'info' },
  Ready: { bg: 'infoBg', fg: 'info' },
  'In Progress': { bg: 'accentDim', fg: 'accent' },
  Completed: { bg: 'successBg', fg: 'success' },
  Cancelled: { bg: 'dangerBg', fg: 'danger' },
  'Pending Review': { bg: 'warningBg', fg: 'warning' },
  Draft: { bg: 'lineSoft', fg: 'muted' },
  'Saved Offline': { bg: 'warningBg', fg: 'warning' },
  Pending: { bg: 'warningBg', fg: 'warning' },
  Approved: { bg: 'successBg', fg: 'success' },
  Rejected: { bg: 'dangerBg', fg: 'danger' },
  Active: { bg: 'successBg', fg: 'success' },
};
