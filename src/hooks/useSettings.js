import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'chess-review-settings-v1';

/** Board colour themes (light square / dark square). */
export const BOARD_THEMES = {
  wood: { light: '#ecd0a2', dark: '#8c5b31' },
  ocean: { light: '#e3ebf2', dark: '#6f93b3' },
  classic: { light: '#eeeed2', dark: '#769656' },
  walnut: { light: '#f0d9b5', dark: '#b58863' },
  slate: { light: '#d5dae3', dark: '#7b8499' },
};

/**
 * showBestArrow  – draw the engine's best move on the board (OFF by default).
 *                  Only a display option: analysis always keeps running.
 * boardTheme     – key of BOARD_THEMES.
 */
export const DEFAULT_SETTINGS = {
  showBestArrow: false,
  boardTheme: 'wood',
};

/** Accept only known keys with valid values, so a corrupted store can't break the UI. */
function sanitize(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    showBestArrow:
      typeof s.showBestArrow === 'boolean' ? s.showBestArrow : DEFAULT_SETTINGS.showBestArrow,
    boardTheme: Object.prototype.hasOwnProperty.call(BOARD_THEMES, s.boardTheme)
      ? s.boardTheme
      : DEFAULT_SETTINGS.boardTheme,
  };
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS }; // storage blocked, empty or corrupted
  }
}

/** Personal settings, remembered in this browser (localStorage). */
export function useSettings() {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* private mode or quota: settings simply won't persist */
    }
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((prev) => sanitize({ ...prev, ...patch }));
  }, []);

  return { settings, update };
}
