import { NextResponse } from "next/server";
import {
  readCertificateOnChainDirectWithDiagnostics,
  normalizeCertificateRef,
  explainVerificationFailures,
} from "@/lib/readCertificateOnChain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = normalizeCertificateRef(searchParams.get("ref") || undefined);

  if (!ref) {
    return NextResponse.json({ ok: false, error: "missing ref" }, { status: 400 });
  }

  try {
    const { row, contractAddress, attempts } =
      await readCertificateOnChainDirectWithDiagnostics(ref);

    if (!row?.isRegistered) {
      const diagnosticNotes = explainVerificationFailures(
        contractAddress,
        attempts,
        false
      );
      return NextResponse.json({
        ok: true,
        found: false,
        contractAddress: contractAddress || null,
        rpcAttempts: attempts,
        diagnosticNotes,
        hint:
          "This reference is not registered on the configured contract, or every RPC endpoint failed.",
      });
    }

    return NextResponse.json({
      ok: true,
      found: true,
      contractAddress: contractAddress || null,
      rpcAttempts: attempts,
      certificate: {
        name: row.name,
        matricNumber: row.matricNumber,
        department: row.department,
        classOfDegree: row.classOfDegree,
        date: row.date,
        isRegistered: row.isRegistered,
        issuer: row.issuer,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
