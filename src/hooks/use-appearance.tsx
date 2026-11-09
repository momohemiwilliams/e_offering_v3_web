import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

/** Used until the user picks a theme with the toggle or on the Appearance settings page. */
export const DEFAULT_APPEARANCE: Appearance = 'light';

const STORAGE_KEY = 'appearance';
/** Marks a value the user chose explicitly (older builds also stored the default automatically). */
const CHOSEN_KEY = 'appearance-chosen';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * The saved appearance, or the default. Earlier builds wrote "system" to storage on every
 * page load even when nobody chose it; such an unconfirmed "system" is dropped once so the
 * light default applies. Explicit choices (light, dark, or system picked after this change) are kept.
 */
function savedAppearance(): Appearance {
    try {
        const saved = localStorage.getItem(STORAGE_KEY) as Appearance | null;

        if (saved === 'system' && localStorage.getItem(CHOSEN_KEY) !== '1') {
            localStorage.removeItem(STORAGE_KEY);
            return DEFAULT_APPEARANCE;
        }

        return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : DEFAULT_APPEARANCE;
    } catch {
        return DEFAULT_APPEARANCE;
    }
}

const handleSystemThemeChange = () => {
    applyTheme(savedAppearance());
};

export function initializeTheme() {
    applyTheme(savedAppearance());

    // Only matters when the user chose "system".
    mediaQuery.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => savedAppearance());

    /** An explicit choice by the user: apply it and remember it. */
    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        try {
            localStorage.setItem(STORAGE_KEY, mode);
            localStorage.setItem(CHOSEN_KEY, '1');
        } catch {
            // Storage unavailable (private mode): the choice still applies for this page.
        }
        applyTheme(mode);
    };

    useEffect(() => {
        // Sync with storage on mount without saving anything the user did not choose.
        const current = savedAppearance();
        setAppearance(current);
        applyTheme(current);

        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }, []);

    return { appearance, updateAppearance };
}
