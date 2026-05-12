"use client";
import ActivityLogTemplate from '@/components/ActivityLogTemplate';

export default function IssuedCerts() {
  return (
    <ActivityLogTemplate 
      title="Issued Certificates"
      subtitle="Audit log of issued assets natively minted on the network"
      baseFilter={(a) => a.action.startsWith('Issued Certificate') && !a.action.includes('(Draft)')}
    />
  );
}
