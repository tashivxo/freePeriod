'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocale } from '@/providers/locale';
import {
  COLOR_BENDS_ATMOSPHERE_STORAGE_KEY,
  type ColorBendsAtmosphere,
} from '@/lib/utils/brand-colors';
import { resolveColorBendsAtmosphere } from '@/lib/utils/color-bends-atmosphere';

interface ProfileSignals {
  country: string | null;
  curriculum: string | null;
}

interface ColorBendsAtmosphereContextValue {
  atmosphere: ColorBendsAtmosphere | null;
  setAtmosphere: (next: ColorBendsAtmosphere) => void;
  resolvedAtmosphere: ColorBendsAtmosphere;
  setProfileSignals: (signals: ProfileSignals) => void;
}

function readStoredAtmosphere(): ColorBendsAtmosphere | null {
  const stored = localStorage.getItem(COLOR_BENDS_ATMOSPHERE_STORAGE_KEY);
  if (stored === 'brand' || stored === 'rainbow') return stored;
  return null;
}

const ColorBendsAtmosphereContext = createContext<ColorBendsAtmosphereContextValue>({
  atmosphere: null,
  setAtmosphere: () => {},
  resolvedAtmosphere: 'rainbow',
  setProfileSignals: () => {},
});

export function ColorBendsAtmosphereProvider({
  initialCountry,
  initialCurriculum,
  children,
}: {
  initialCountry: string | null;
  initialCurriculum: string | null;
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const [atmosphere, setAtmosphereState] = useState<ColorBendsAtmosphere | null>(null);
  const [country, setCountry] = useState<string | null>(initialCountry);
  const [curriculum, setCurriculum] = useState<string | null>(initialCurriculum);

  useEffect(() => {
    const stored = readStoredAtmosphere();
    if (stored) setAtmosphereState(stored);
  }, []);

  function setAtmosphere(next: ColorBendsAtmosphere) {
    setAtmosphereState(next);
    localStorage.setItem(COLOR_BENDS_ATMOSPHERE_STORAGE_KEY, next);
  }

  function setProfileSignals({ country: nextCountry, curriculum: nextCurriculum }: ProfileSignals) {
    setCountry(nextCountry);
    setCurriculum(nextCurriculum);
  }

  const resolvedAtmosphere = resolveColorBendsAtmosphere({
    override: atmosphere,
    country,
    curriculum,
    locale,
  });

  return (
    <ColorBendsAtmosphereContext.Provider
      value={{ atmosphere, setAtmosphere, resolvedAtmosphere, setProfileSignals }}
    >
      {children}
    </ColorBendsAtmosphereContext.Provider>
  );
}

export function useColorBendsAtmosphere() {
  return useContext(ColorBendsAtmosphereContext);
}
