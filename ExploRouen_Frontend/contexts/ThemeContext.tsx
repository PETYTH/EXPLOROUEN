import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    accent: string;
    buttonPrimary: string;
    link: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const colors = isDark ? {
    background: '#1A1A1A',
    surface: '#2D2D2D',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    primary: '#1E40AF', // Bleu Seine
    border: '#374151',
    accent: '#F59E0B', // Doré
    buttonPrimary: '#1E40AF', // Bleu Seine partout
    link: '#1E40AF', // Bleu Seine partout
  } : {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    primary: '#1E40AF', // Bleu Seine
    border: '#E5E7EB',
    accent: '#F59E0B', // Doré
    buttonPrimary: '#1E40AF', // Bleu Seine partout
    link: '#1E40AF', // Bleu Seine partout
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}