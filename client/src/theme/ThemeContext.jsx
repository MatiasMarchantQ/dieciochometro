import { createContext, useContext, useEffect } from 'react';
import { useEffectiveTheme } from './useEffectiveTheme.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const value = useEffectiveTheme();

    useEffect(() => {
        document.title = value.theme.appName;
    }, [value.theme.appName]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}
