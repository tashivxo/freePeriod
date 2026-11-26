'use client';

import { Search } from 'lucide-react';
import { AnimatedDropdown, type DropdownItem } from '@/components/ui/animated-dropdown';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useT } from '@/providers/locale';
import { formatGradeLabel } from '@/lib/utils/grades';
import { cn } from '@/lib/utils';

const COMPACT_TOOLBAR_QUERY = '(max-width: 1023px)';
const desktopDropdownClass = 'w-full min-w-0 lg:w-auto lg:min-w-[9rem]';
const compactDropdownClass = 'min-w-0 w-full';
const compactTriggerClass =
  'h-11 px-3 text-sm font-body border-2 border-border bg-surface hover:border-coral/60';
const compactValueClass = 'truncate text-sm';
const compactChevronClass = 'h-[14px] w-[14px]';

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
  compact,
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
> & { compact: boolean; idPrefix: string }) {
  const t = useT();

  const subjectText = compact ? t('history.facetSubject') : t('history.allSubjects');
  const gradeText = compact ? t('history.facetGrade') : t('history.allGrades');
  const curriculumText = compact ? t('history.facetCurriculum') : t('history.allCurricula');

  const dropdownClass = compact ? compactDropdownClass : desktopDropdownClass;

  return (
    <>
      <AnimatedDropdown
        id={`${idPrefix}-subject`}
        text={subjectText}
        items={allSubjects.map((s) => ({ name: s, value: s } as DropdownItem))}
        selectedValue={subjectFilter || undefined}
        onSelect={(item) => onSubjectFilterChange(item.value ?? '')}
        clearable
        onClear={() => onSubjectFilterChange('')}
        clearAriaLabel={t('history.clearSubjectFilter')}
        className={dropdownClass}
        triggerClassName={compact ? compactTriggerClass : undefined}
        valueClassName={compact ? compactValueClass : undefined}
        chevronClassName={compact ? compactChevronClass : undefined}
      />
      <AnimatedDropdown
        id={`${idPrefix}-grade`}
        text={gradeText}
        items={allGrades.map((g) => ({
          name: formatGradeLabel(g, t),
          value: g,
        }))}
        selectedValue={gradeFilter || undefined}
        onSelect={(item) => onGradeFilterChange(item.value ?? '')}
        clearable
        onClear={() => onGradeFilterChange('')}
        clearAriaLabel={t('history.clearGradeFilter')}
        className={dropdownClass}
        triggerClassName={compact ? compactTriggerClass : undefined}
        valueClassName={compact ? compactValueClass : undefined}
        chevronClassName={compact ? compactChevronClass : undefined}
      />
      <AnimatedDropdown
        id={`${idPrefix}-curriculum`}
        text={curriculumText}
        items={allCurricula.map((c) => ({ name: c, value: c } as DropdownItem))}
        selectedValue={curriculumFilter || undefined}
        onSelect={(item) => onCurriculumFilterChange(item.value ?? '')}
        clearable
        onClear={() => onCurriculumFilterChange('')}
        clearAriaLabel={t('history.clearCurriculumFilter')}
        className={dropdownClass}
        triggerClassName={compact ? compactTriggerClass : undefined}
        valueClassName={compact ? compactValueClass : undefined}
        chevronClassName={compact ? compactChevronClass : undefined}
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
  const isCompactToolbar = useMediaQuery(COMPACT_TOOLBAR_QUERY);

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

  return (
    <div data-testid="history-toolbar" className="w-full">
      <div
        data-testid="history-toolbar-compact-layout"
        className={cn(
          'flex w-full flex-col gap-2',
          'lg:flex-row lg:items-center lg:gap-4',
        )}
      >
        <div className="relative min-w-0 w-full lg:min-w-0 lg:flex-1">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
            <Search className="size-4 text-text-secondary" aria-hidden />
          </span>
          <input
            type="text"
            placeholder={t('history.searchPlaceholder')}
            aria-label={t('history.searchAriaLabel')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'w-full rounded-xl border-2 border-border bg-surface py-0 ps-9 pe-3 font-body text-text-primary',
              'placeholder:text-text-secondary hover:border-coral/60 focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20',
              'h-11 text-base lg:h-13',
            )}
          />
        </div>
        <div
          data-testid="history-facet-grid"
          className="grid min-w-0 grid-cols-3 gap-2 lg:contents"
        >
          <FacetDropdowns
            compact={isCompactToolbar}
            idPrefix="history-facet"
            {...facetDropdownProps}
          />
        </div>
      </div>
    </div>
  );
}