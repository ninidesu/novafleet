import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState(null); // 'light' | 'dark' | null (follow system)

  const scheme = override || systemScheme || 'light';
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      scheme,
      colors,
      isDark: scheme === 'dark',
      toggleTheme: () => setOverride(scheme === 'dark' ? 'light' : 'dark'),
    }),
    [scheme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
