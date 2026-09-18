import { durationSince } from '../utils/dateUtils';

export default function RelationshipCounter({
  startDate,
  compact = false,
}: {
  startDate: string;
  compact?: boolean;
}) {
  const { years, months, days } = durationSince(startDate);

  if (compact) {
    return (
      <p className="text-sm text-muted">
        {years > 0 && `${years}y `} {months}m {days}d together
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs tracking-wide text-muted mb-2">Together for</p>
      <p className="heading-serif text-3xl md:text-4xl text-paper leading-tight">
        {years > 0 && <span>{years} {years === 1 ? 'year' : 'years'} · </span>}
        <span>{months} {months === 1 ? 'month' : 'months'} · </span>
        <span>{days} {days === 1 ? 'day' : 'days'}</span>
      </p>
    </div>
  );
}
