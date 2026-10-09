import {
  EMPTY_DIFFERENTIATION_MESSAGE,
  isDifferentiationShape,
  isRecord,
  nonEmptyListItems,
} from '@/lib/lesson/content';

type SectionValueViewProps = {
  value: unknown;
};

function headingForKey(key: string): string {
  if (key.length === 0) return key;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function SectionValueView({ value }: SectionValueViewProps) {
  if (!isRecord(value)) return null;

  const blocks = Object.entries(value).flatMap(([key, nested]) => {
    const items = nonEmptyListItems(nested);
    if (items.length === 0) return [];
    const heading = headingForKey(key);
    return [
      <div key={key}>
        <h3>{heading}</h3>
        <ul>
          {items.map((item, index) => (
            <li key={`${key}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>,
    ];
  });

  if (blocks.length > 0) {
    return <>{blocks}</>;
  }

  if (isDifferentiationShape(value)) {
    return <p className="text-text-secondary">{EMPTY_DIFFERENTIATION_MESSAGE}</p>;
  }

  return null;
}
