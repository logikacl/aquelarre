"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createConsentManager } from '../core/consent-manager';
import { consentConfig } from '../config';
import { ConsentContext, type ConsentContextValue } from './context';
import ConsentBanner from './ConsentBanner';
import ConsentSettings from './ConsentSettings';

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const manager = useMemo(() => createConsentManager(consentConfig), []);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Inyecta scripts ya consentidos por un visitante que vuelve.
  useEffect(() => {
    manager.init();
  }, [manager]);

  const value = useMemo<ConsentContextValue>(
    () => ({
      manager,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [manager, settingsOpen],
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      <ConsentBanner />
      <ConsentSettings />
    </ConsentContext.Provider>
  );
};

export default ConsentProvider;
