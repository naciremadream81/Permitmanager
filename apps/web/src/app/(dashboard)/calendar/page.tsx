import { PageHeader } from '@/components/ui/PageHeader';
import { DeadlineCalendar } from '@/components/calendar/DeadlineCalendar';

export default function CalendarPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Calendar"
        description="Track permit deadlines and inspection schedules."
      />
      <DeadlineCalendar />
    </div>
  );
}
