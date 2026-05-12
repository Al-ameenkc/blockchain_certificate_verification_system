"use client";
import ActivityLogTemplate from '@/components/ActivityLogTemplate';

export default function RecordCerts() {
  return (
    <ActivityLogTemplate 
      title="Certificate Records"
      subtitle="All issued and registered activity, including drafts and finalized records"
      baseFilter={(a) =>
        a.action.startsWith('Issued Certificate') || a.action.startsWith('Registered Certificate')
      }
      showTypeFilter={false} // Since this only contains saved records, no need for the type filter
    />
  );
}
