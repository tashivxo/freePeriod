'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type LessonEditingContextValue = {
  isEditing: boolean;
  setEditing: (editing: boolean) => void;
};

const LessonEditingContext = createContext<LessonEditingContextValue>({
  isEditing: false,
  setEditing: () => {},
});

export function LessonEditingProvider({ children }: { children: ReactNode }) {
  const [isEditing, setEditing] = useState(false);
  const value = useMemo(() => ({ isEditing, setEditing }), [isEditing]);

  useEffect(() => {
    if (isEditing) {
      document.documentElement.dataset.lessonEditing = 'true';
    } else {
      delete document.documentElement.dataset.lessonEditing;
    }
    return () => {
      delete document.documentElement.dataset.lessonEditing;
    };
  }, [isEditing]);

  return (
    <LessonEditingContext.Provider value={value}>{children}</LessonEditingContext.Provider>
  );
}

export function useLessonEditing() {
  return useContext(LessonEditingContext);
}
