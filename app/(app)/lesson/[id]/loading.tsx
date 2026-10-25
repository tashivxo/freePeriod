export default function LessonLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-pulse">
      <div className="h-4 w-32 bg-surface rounded mb-4" />
      <div className="h-8 w-2/3 bg-surface rounded mb-2" />
      <div className="h-4 w-1/3 bg-surface rounded mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  );
}
