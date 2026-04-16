"use client";
import ActivityLogTemplate from '@/components/ActivityLogTemplate';

export default function RecordCerts() {
  return (
    <ActivityLogTemplate 
      title="Certificate Records"
      subtitle="Comprehensive view of all committed files (Issued & Registered) that are not drafts"
      baseFilter={(a) => !a.action.includes('(Draft)')}
      showTypeFilter={false} // Since this only contains saved records, no need for the type filter
    />
  );
}
