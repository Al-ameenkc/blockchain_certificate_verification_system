"use client";
import ActivityLogTemplate from '@/components/ActivityLogTemplate';

export default function RegisteredCerts() {
  return (
    <ActivityLogTemplate 
      title="Registered Certificates"
      subtitle="Audit log of legacy records committed to the ledger"
      baseFilter={(a) => a.action.includes('Registered')}
    />
  );
}
