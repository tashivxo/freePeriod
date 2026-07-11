'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface ZenModeContextValue {
  zenMode: boolean;
  setZenMode: (enabled: boolean) => void;
}

const ZenModeContext = createContext<ZenModeContextValue>({
  zenMode: false,
  setZenMode: () => {},
});

export function ZenModeProvider({ children }: { children: ReactNode }) {
  const [zenMode, setZenModeState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fp-zen-mode');
    if (stored === 'true') {
      setZenModeState(true);
    }
  }, []);

  function setZenMode(enabled: boolean) {
    setZenModeState(enabled);
    localStorage.setItem('fp-zen-mode', String(enabled));
  }

  return (
    <ZenModeContext.Provider value={{ zenMode, setZenMode }}>
      {children}
    </ZenModeContext.Provider>
  );
}

export function useZenMode() {
  return useContext(ZenModeContext);
}
