'use client';

import { useState } from 'react';

export const CUSTOM_OPTION = 'Custom' as const;

export function isPresetValue(value: string | null | undefined, presets: readonly string[]): boolean {
  return Boolean(value && presets.includes(value));
}

export function usePresetField(initialValue?: string | null, presets: readonly string[] = []) {
  const initialIsPreset = isPresetValue(initialValue, presets);
  const [select, setSelect] = useState<string>(
    initialIsPreset ? (initialValue ?? '') : initialValue ? CUSTOM_OPTION : '',
  );
  const [custom, setCustom] = useState<string>(
    !initialIsPreset && initialValue ? initialValue : '',
  );

  const value = select === CUSTOM_OPTION ? custom : select;
  const isCustom = select === CUSTOM_OPTION;

  return {
    select,
    setSelect,
    custom,
    setCustom,
    value,
    isCustom,
  };
}
