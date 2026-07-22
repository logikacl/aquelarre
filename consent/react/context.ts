import { createContext } from 'react';
import type { ConsentManager } from '../core/consent-manager';

export interface ConsentContextValue {
  manager: ConsentManager;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

export const ConsentContext = createContext<ConsentContextValue | null>(null);
