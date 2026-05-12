import { ethers } from "ethers";

const DEFAULT_ABI = [
  "function certificates(string _ref) view returns (string name, string matricNumber, string department, string classOfDegree, string date, bool isRegistered, address issuer)",
];

const SEPOLIA_CHAIN_ID = 11155111;
/** Hardhat / local node default */
const LOCAL_CHAIN_ID = 31337;

/** Public Sepolia endpoints (rpc.sepolia.org often returns 404 — omit). */
const SEPOLIA_FALLBACK_RPCS = [
  "https://ethereum-sepolia.publicnode.com",
  "https://1rpc.io/sepolia",
  "https://sepolia.drpc.org",
];

/** First contract address Hardhat assigns on a fresh local chain — not deployed on Sepolia by default. */
export const HARDHAT_DEFAULT_CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export type OnChainCertificateRow = {
  name: string;
  matricNumber: string;
  department: string;
  classOfDegree: string;
  date: string;
  isRegistered: boolean;
  issuer: string;
};

export function normalizeCertificateRef(ref: string | string[] | undefined): string {
  if (!ref) return "";
  const raw = Array.isArray(ref) ? ref[0] : ref;
  try {
    return decodeURIComponent(String(raw)).trim();
  } catch {
    return String(raw).trim();
  }
}

/**
 * Contract used for ALL reads (verify page, certificate load, API).
 * Must match the deployment you use when issuing — set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local.
 * We intentionally do NOT read from localStorage here: that caused verify to hit a different contract than .env.
 */
export function getContractAddressForRead(): string {
  return (
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
}

function isLocalRpc(rpcUrl: string): boolean {
  return (
    rpcUrl.includes("localhost") ||
    rpcUrl.includes("127.0.0.1") ||
    rpcUrl.includes("0.0.0.0")
  );
}

/**
 * Order RPCs so Sepolia public endpoints are tried before a possibly-offline local node.
 * That avoids ethers spamming "failed to detect network; retry in 1s" when Hardhat isn't running.
 */
function buildRpcList(): string[] {
  const primary = (process.env.NEXT_PUBLIC_RPC_URL || "").trim();
  const ordered: string[] = [];

  if (primary && !isLocalRpc(primary)) {
    ordered.push(primary);
  }
  for (const u of SEPOLIA_FALLBACK_RPCS) {
    if (!ordered.includes(u)) ordered.push(u);
  }
  if (primary && isLocalRpc(primary) && !ordered.includes(primary)) {
    ordered.push(primary);
  }
  return ordered;
}

function jsonRpcProviderForUrl(rpcUrl: string): ethers.JsonRpcProvider {
  const isLocal = isLocalRpc(rpcUrl);
  const chainId = isLocal ? LOCAL_CHAIN_ID : SEPOLIA_CHAIN_ID;
  return new ethers.JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true });
}

function rowIsRegistered(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return r.isRegistered === true;
}

/** Safe label for logs / API (no API keys in path). */
export function redactRpcLabel(rpcUrl: string): string {
  try {
    const u = new URL(rpcUrl);
    const host = u.hostname;
    if (
      host.includes("infura.io") ||
      host.includes("alchemy.com") ||
      host.includes("quicknode") ||
      host.includes("blastapi.io")
    ) {
      return `${u.protocol}//${host}/***`;
    }
    if (isLocalRpc(rpcUrl)) {
      return `${u.protocol}//${host}${u.pathname || ""}`;
    }
    return `${u.protocol}//${host}`;
  } catch {
    return "(configured RPC)";
  }
}

export type RpcReadAttempt = {
  rpcLabel: string;
  phase: "error" | "responded" | "success";
  detail?: string;
};

export type ReadCertificateDiagnostics = {
  row: OnChainCertificateRow | null;
  contractAddress: string;
  attempts: RpcReadAttempt[];
};

/**
 * Human-readable hints for common failure patterns (wrong network / wrong address).
 * When `verified` is true, returns [] so local Hardhat success is not labeled “wrong network”.
 */
export function explainVerificationFailures(
  contractAddress: string,
  attempts: RpcReadAttempt[],
  verified: boolean
): string[] {
  if (verified) return [];

  const notes: string[] = [];
  const addr = contractAddress.trim().toLowerCase();

  if (addr === HARDHAT_DEFAULT_CONTRACT_ADDRESS.toLowerCase()) {
    notes.push(
      "This contract address is Hardhat's default on a local chain. Sepolia will not have your registry there unless you deployed it. Deploy to Sepolia (or your target network), copy the deployed address into NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local, and restart npm run dev."
    );
  }

  const emptyCallData = attempts.some(
    (a) =>
      a.phase === "error" &&
      typeof a.detail === "string" &&
      a.detail.includes("BAD_DATA") &&
      (a.detail.includes("0x") || a.detail.includes("could not decode"))
  );
  if (emptyCallData) {
    notes.push(
      "BAD_DATA / empty result (0x) from eth_call: the node returned no contract data at this address. Typical causes: wrong chain, wrong contract address, or the registry was never deployed to this network."
    );
  }

  return notes;
}

/**
 * Same as readCertificateOnChainDirect but records each RPC outcome for verify / debugging UI.
 */
export async function readCertificateOnChainDirectWithDiagnostics(
  ref: string
): Promise<ReadCertificateDiagnostics> {
  const normalized = normalizeCertificateRef(ref);
  const attempts: RpcReadAttempt[] = [];
  const contractAddress = getContractAddressForRead();

  if (!normalized) {
    return { row: null, contractAddress, attempts };
  }

  const rpcList = buildRpcList();

  for (const rpc of rpcList) {
    const rpcLabel = redactRpcLabel(rpc);
    try {
      const provider = jsonRpcProviderForUrl(rpc);
      const contract = new ethers.Contract(contractAddress, DEFAULT_ABI, provider);
      const row = await contract.certificates(normalized);
      if (rowIsRegistered(row)) {
        attempts.push({
          rpcLabel,
          phase: "success",
          detail: "certificate is registered",
        });
        return { row: row as OnChainCertificateRow, contractAddress, attempts };
      }
      attempts.push({
        rpcLabel,
        phase: "responded",
        detail: "contract responded; this reference is not registered on-chain",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      attempts.push({ rpcLabel, phase: "error", detail: message });
    }
  }

  return { row: null, contractAddress, attempts };
}

/**
 * Direct RPC read (works on server and client; uses env only for address + RPC list).
 */
export async function readCertificateOnChainDirect(
  ref: string
): Promise<OnChainCertificateRow | null> {
  const { row } = await readCertificateOnChainDirectWithDiagnostics(ref);
  return row;
}

/**
 * Browser: try same-origin API first (server env, no wallet), then direct RPC.
 */
export async function readCertificateOnChain(ref: string): Promise<OnChainCertificateRow | null> {
  const normalized = normalizeCertificateRef(ref);
  if (!normalized) return null;

  if (typeof window !== "undefined") {
    try {
      const res = await fetch(
        `/api/certificate/onchain?ref=${encodeURIComponent(normalized)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const body = (await res.json()) as {
          found?: boolean;
          certificate?: OnChainCertificateRow;
        };
        if (body.found && body.certificate && rowIsRegistered(body.certificate)) {
          return body.certificate;
        }
      }
    } catch {
      // fall through to direct read
    }
  }

  return readCertificateOnChainDirect(normalized);
}
