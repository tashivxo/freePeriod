'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { HistoryFilterChips, type HistoryFilterChip } from '@/features/history/components/HistoryFilterChips';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useT } from '@/providers/locale';
import { formatGradeLabel } from '@/lib/utils/grades';

const MOBILE_QUERY = '(max-width: 639px)';
const filterDropdownClass = 'w-full min-w-0 lg:w-auto lg:min-w-[9rem]';

type HistoryToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  subjectFilter: string;
  gradeFilter: string;
  curriculumFilter: string;
  onSubjectFilterChange: (value: string) => void;
  onGradeFilterChange: (value: string) => void;
  onCurriculumFilterChange: (value: string) => void;
  allSubjects: string[];
  allGrades: string[];
  allCurricula: string[];
};

function FacetDropdowns({
  idPrefix,
  allSubjects,
  allGrades,
  allCurricula,
  subjectFilter,
  gradeFilter,
  curriculumFilter,
  onSubjectFilterChange,
  onGradeFilterChange,
  onCurriculumFilterChange,
}: Pick<
  HistoryToolbarProps,
  | 'allSubjects'
  | 'allGrades'
  | 'allCurricula'
  | 'subjectFilter'
  | 'gradeFilter'
  | 'curriculumFilter'
  | 'onSubjectFilterChange'
  | 'onGradeFilterChange'
  | 'onCurriculumFilterChange'
> & { idPrefix: string }) {
  const t = useT();

  return (
    <>
      <AnimatedDropdown
        id={`${idPrefix}-subject`}
        text={t('history.allSubjects')}
        items={allSubjects.map((s) => ({ name: s, value: s } as DropdownItem))}
        selectedValue={subjectFilter || undefined}
        onSelect={(item) => onSubjectFilterChange(item.value ?? '')}
        clearable
        onClear={() => onSubjectFilterChange('')}
        clearAriaLabel={t('history.clearSubjectFilter')}
        className={filterDropdownClass}
      />
      <AnimatedDropdown
        id={`${idPrefix}-grade`}
        text={t('history.allGrades')}
        items={allGrades.map((g) => ({
          name: formatGradeLabel(g, t),
          value: g,
        }))}
        selectedValue={gradeFilter || undefined}
        onSelect={(item) => onGradeFilterChange(item.value ?? '')}
        clearable
        onClear={() => onGradeFilterChange('')}
        clearAriaLabel={t('history.clearGradeFilter')}
        className={filterDropdownClass}
      />
      <AnimatedDropdown
        id={`${idPrefix}-curriculum`}
        text={t('history.allCurricula')}
        items={allCurricula.map((c) => ({ name: c, value: c } as DropdownItem))}
        selectedValue={curriculumFilter || undefined}
        onSelect={(item) => onCurriculumFilterChange(item.value ?? '')}
        clearable
        onClear={() => onCurriculumFilterChange('')}
        clearAriaLabel={t('history.clearCurriculumFilter')}
        className={filterDropdownClass}
      />
    </>
  );
}

export function HistoryToolbar({
  search,
  onSearchChange,
  subjectFilter,
  gradeFilter,
  curriculumFilter,
  onSubjectFilterChange,
  onGradeFilterChange,
  onCurriculumFilterChange,
  allSubjects,
  allGrades,
  allCurricula,
}: HistoryToolbarProps) {
  const t = useT();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) setFiltersOpen(false);
  }, [isMobile]);

  const facetCount = [subjectFilter, gradeFilter, curriculumFilter].filter(Boolean).length;

  const chips: HistoryFilterChip[] = [];
  if (subjectFilter) {
    chips.push({
      key: 'subject',
      label: subjectFilter,
      ariaLabel: t('history.removeSubjectFilter', { value: subjectFilter }),
      onRemove: () => onSubjectFilterChange(''),
    });
  }
  if (gradeFilter) {
    const gradeLabel = formatGradeLabel(gradeFilter, t);
    chips.push({
      key: 'grade',
      label: gradeLabel,
      ariaLabel: t('history.removeGradeFilter', { value: gradeLabel }),
      onRemove: () => onGradeFilterChange(''),
    });
  }
  if (curriculumFilter) {
    chips.push({
      key: 'curriculum',
      label: curriculumFilter,
      ariaLabel: t('history.removeCurriculumFilter', { value: curriculumFilter }),
      onRemove: () => onCurriculumFilterChange(''),
    });
  }

  const filtersLabel =
    facetCount > 0
      ? t('history.filtersWithCount', { count: String(facetCount) })
      : t('history.filters');

  const facetDropdownProps = {
    allSubjects,
    allGrades,
    allCurricula,
    subjectFilter,
    gradeFilter,
    curriculumFilter,
    onSubjectFilterChange,
    onGradeFilterChange,
    onCurriculumFilterChange,
  };

  const clearAllFacets = () => {
    onSubjectFilterChange('');
    onGradeFilterChange('');
    onCurriculumFilterChange('');
  };

  return (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <div
        data-testid="history-toolbar"
        className="sticky top-14 z-30 -mx-4 max-sm:mb-6 max-sm:border-b max-sm:border-border/50 bg-background px-4 py-2.5 sm:static sm:z-auto sm:mx-0 sm:px-0 sm:py-0"
      >
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-2 lg:flex lg:grid-cols-none lg:items-center lg:gap-4">
          <div className="relative min-w-0 w-full flex-1 sm:col-span-2">
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
              <Search className="size-4 text-text-secondary" aria-hidden />
            </span>
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              aria-label={t('history.searchAriaLabel')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-13 w-full rounded-xl border-2 border-border bg-surface py-0 ps-9 pe-3 text-base font-body text-text-primary placeholder:text-text-secondary hover:border-coral/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
            />
          </div>
          <div
            className="sm:hidden"
            inert={!isMobile || undefined}
            aria-hidden={!isMobile || undefined}
          >
            <SheetTrigger asChild>
              <button
                type="button"
                className="h-11 shrink-0 rounded-xl border-2 border-border bg-surface px-3 font-body text-base text-text-primary hover:border-coral/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
              >
                {filtersLabel}
              </button>
            </SheetTrigger>
          </div>
          <div
            className="contents max-sm:hidden"
            inert={isMobile || undefined}
            aria-hidden={isMobile || undefined}
          >
            <FacetDropdowns idPrefix="history-desktop" {...facetDropdownProps} />
          </div>
        </div>
        {isMobile && facetCount > 0 ? (
          <HistoryFilterChips chips={chips} />
        ) : null}

        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          className="motion-reduce:animate-none motion-reduce:transition-none pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle>{t('history.filtersSheetTitle')}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4">
            <FacetDropdowns idPrefix="history-sheet" {...facetDropdownProps} />
          </div>
          <SheetFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" onClick={clearAllFacets}>
              {t('history.clearAllFilters')}
            </Button>
            <SheetClose asChild>
              <Button type="button">{t('history.filtersDone')}</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </div>
    </Sheet>
  );
}
