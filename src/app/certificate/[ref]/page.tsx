"use client";
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { logActivity } from '@/utils/logger';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, SendHorizontal, Printer } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { ethers } from 'ethers';
import { supabase } from '@/utils/supabaseClient';
import { readCertificateOnChain, normalizeCertificateRef } from '@/lib/readCertificateOnChain';

/** CSS px per mm at 96dpi — used to size the fixed A4 sheet and compute uniform scale on screen. */
const MM_TO_CSS_PX = 96 / 25.4;
const A4_WIDTH_PX = 210 * MM_TO_CSS_PX;
const A4_HEIGHT_PX = 297 * MM_TO_CSS_PX;

export default function CertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const scaleViewportRef = useRef<HTMLDivElement>(null);
  const [sheetScale, setSheetScale] = useState(1);
  const { showLoading, showAlert, showConfirm } = useModal();

  const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "30th March, 2026";
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'long' });
    const year = date.getFullYear();

    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${getOrdinal(day)} ${month}, ${year}`;
  };

  const certificateRef =
    normalizeCertificateRef(params.ref as string | string[] | undefined) || 'MIU-Ab3kP1xQ9';

  const [dbRow, setDbRow] = useState<{
    student_name: string;
    matric_number: string;
    department: string;
    class_of_degree: string;
    date_issued: string | null;
    action_type: string | null;
  } | null>(null);

  const viewType =
    dbRow?.action_type ||
    searchParams.get('viewType') ||
    'issue';

  const data = useMemo(
    () => ({
      ref: certificateRef,
      name: dbRow
        ? toTitleCase(dbRow.student_name)
        : toTitleCase(searchParams.get('name') || 'Kachalla Al Ameen Mustapha'),
      matric: dbRow?.matric_number ?? searchParams.get('matric') ?? 'MIUSTD2022532',
      dept: dbRow?.department ?? searchParams.get('dept') ?? 'Software Engineering',
      class: dbRow?.class_of_degree ?? searchParams.get('class') ?? 'First Class',
      date: formatDate(
        dbRow?.date_issued ||
          searchParams.get('date') ||
          ''
      ),
    }),
    [certificateRef, dbRow, searchParams]
  );

  const [isSaved, setIsSaved] = useState(false);
  /** True only after a successful on-chain registration (verified via contract or after tx). */
  const [isAnchoredOnChain, setIsAnchoredOnChain] = useState(false);
  /** True after chain + DB hydration so "unsaved" back prompt is not shown prematurely. */
  const [loadSettled, setLoadSettled] = useState(false);

  useLayoutEffect(() => {
    const el = scaleViewportRef.current;
    if (!el) return;

    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w <= 0) return;
      setSheetScale(Math.min(1, w / A4_WIDTH_PX));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handlePrint = () => {
    if (!isAnchoredOnChain) {
      showAlert(
        "Cannot print yet",
        "Add this certificate to the blockchain before printing.",
        "info"
      );
      return;
    }
    window.print();
  };

  useEffect(() => {
    let cancelled = false;
    setLoadSettled(false);
    const viewTypeFromUrl = searchParams.get("viewType");

    const init = async () => {
      try {
      const viewTypeFallback = viewTypeFromUrl || "issue";

      let chainRow: {
        student_name: string;
        matric_number: string;
        department: string;
        class_of_degree: string;
        date_issued: string | null;
        action_type: string | null;
      } | null = null;

      const onChain = await readCertificateOnChain(certificateRef);
      if (!cancelled && onChain?.isRegistered) {
        chainRow = {
          student_name: onChain.name,
          matric_number: onChain.matricNumber,
          department: onChain.department,
          class_of_degree: onChain.classOfDegree,
          date_issued: onChain.date || null,
          action_type: viewTypeFallback,
        };
      }

      let dbRowLocal: typeof chainRow | null = null;
      try {
        const { data: row, error } = await supabase
          .from("certificates")
          .select(
            "student_name, matric_number, department, class_of_degree, date_issued, action_type, reference_id"
          )
          .eq("reference_id", certificateRef)
          .maybeSingle();
        if (!error && row) {
          dbRowLocal = {
            student_name: row.student_name,
            matric_number: row.matric_number,
            department: row.department,
            class_of_degree: row.class_of_degree,
            date_issued: row.date_issued,
            action_type: row.action_type,
          };
        }
      } catch {
        // Supabase unavailable
      }

      if (cancelled) return;

      // Row in `certificates` is only inserted after tx.wait() in this app → treat as anchored for UI.
      if (dbRowLocal) {
        setIsAnchoredOnChain(true);
        setIsSaved(true);
      }

      if (chainRow) {
        setIsAnchoredOnChain(true);
        setIsSaved(true);
        if (dbRowLocal) {
          setDbRow({
            ...chainRow,
            action_type: dbRowLocal.action_type ?? chainRow.action_type,
            date_issued: chainRow.date_issued || dbRowLocal.date_issued,
          });
        } else {
          setDbRow(chainRow);
        }
      } else if (dbRowLocal) {
        setDbRow(dbRowLocal);
      }
      } finally {
        if (!cancelled) {
          setLoadSettled(true);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [certificateRef, searchParams]);

  const handleSaveDraft = () => {
    showLoading(true);
    setTimeout(() => {
      const actionName = viewType === 'issue' ? 'Issued Certificate' : 'Registered Certificate';
      const url = window.location.pathname + window.location.search;
      logActivity(`${actionName} (Draft)`, `ref ${data.ref} — draft for ${data.name} (${data.matric})`, url);
      setIsSaved(true);
      showLoading(false);
      showAlert("Draft Anchored", "The document draft was successfully saved to the ledger.", "success");
    }, 800);
  };

  const handleSubmitToBlockchain = async () => {
    if (isAnchoredOnChain) {
      showAlert("Already on blockchain", "This certificate is already registered on-chain.", "info");
      return;
    }

    try {
      showLoading(true);

      const { count, error: duplicateCheckError } = await supabase
        .from('certificates')
        .select('reference_id', { count: 'exact', head: true })
        .eq('reference_id', data.ref);

      if (duplicateCheckError) {
        const isNetworkFailure =
          typeof duplicateCheckError.message === 'string' &&
          duplicateCheckError.message.toLowerCase().includes('failed to fetch');

        if (!isNetworkFailure) {
          showLoading(false);
          showAlert("Validation Failed", duplicateCheckError.message || "Unable to validate reference uniqueness.", "error");
          return;
        }
      }

      if ((count ?? 0) > 0) {
        showLoading(false);
        showAlert("Duplicate Reference", "This reference number already exists. Generate a new certificate from dashboard.", "error");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        showLoading(false);
        showAlert("Wallet Missing", "MetaMask (or compatible wallet) is required for blockchain submission.", "error");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (switchError: any) {
        showLoading(false);
        console.error("Failed to switch to Sepolia Testnet", switchError);
        showAlert("Network Error", "Please switch your wallet network to Sepolia Testnet.", "error");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contractAddress =
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
        localStorage.getItem('contract_address') ||
        "0x5FbDB2315678afecb367f032d93F642f64180aa3";

      const abi = [
        "function issueCertificate(string _ref, string _name, string _matricNumber, string _department, string _classOfDegree, string _date) public"
      ];

      const contract = new ethers.Contract(contractAddress, abi, signer);
      const rawDate = searchParams.get('date') || '';
      const tx = await contract.issueCertificate(
        data.ref,
        data.name,
        data.matric,
        data.dept,
        data.class,
        rawDate
      );
      await tx.wait();
      setIsAnchoredOnChain(true);
      setIsSaved(true);

      const { error: supabaseError } = await supabase.from('certificates').insert([
        {
          reference_id: data.ref,
          student_name: data.name,
          matric_number: data.matric,
          department: data.dept,
          class_of_degree: data.class,
          date_issued: rawDate || null,
          action_type: viewType,
        }
      ]);

      if (supabaseError) {
        console.error("Supabase insert failed:", supabaseError);
        // Keep the operation successful when chain write is already confirmed.
        const actionName = viewType === 'issue' ? 'Issued Certificate' : 'Registered Certificate';
        const url = window.location.pathname + window.location.search;
        await logActivity(`${actionName} (Unsynced)`, `ref ${data.ref} — ${data.name} (${data.matric}) on-chain; database unreachable`, url);
        showLoading(false);
        showAlert(
          "On-Chain Success (Unsynced)",
          "Certificate was added to blockchain, but the database could not be reached. Retry sync later when Supabase is available.",
          "info"
        );
        return;
      }

      const actionName = viewType === 'issue' ? 'Issued Certificate' : 'Registered Certificate';
      const url = window.location.pathname + window.location.search;
      await logActivity(actionName, `ref ${data.ref} — ${data.name} (${data.matric}) submitted to blockchain`, url);

      showLoading(false);
      showAlert("Submission Successful", "Certificate has been submitted to blockchain and stored in the database.", "success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      showLoading(false);
      console.error("Blockchain submission failed:", err);
      if (err?.code === 'ACTION_REJECTED' || err?.code === 4001) {
        showAlert("Transaction Cancelled", "Transaction was cancelled in wallet.", "info");
        return;
      }
      showAlert("Submission Failed", "Unable to submit certificate to blockchain right now.", "error");
    }
  };

  const handleBack = () => {
    if (!loadSettled) return;
    if (!isSaved && !isAnchoredOnChain) {
      showConfirm(
        'Leave without saving?',
        'You have not saved a draft or added this certificate to the blockchain. If you go back now, this certificate will be lost and will not appear in your records.',
        () => {
          router.back();
        }
      );
      return;
    }
    router.back();
  };

  return (
    <div className="relative flex min-h-screen min-h-dvh flex-col items-center overflow-x-hidden overflow-y-auto bg-[#020202] px-3 py-4 font-sans selection:bg-cyan-500/30 print:min-h-0 print:bg-white print:px-0 print:py-0 sm:px-6 sm:py-8">
      
      {/* Cyber Orbs (Hidden during print) */}
      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-[min(500px,100vw)] w-[min(500px,100vw)] rounded-full bg-cyan-600/10 blur-[150px] mix-blend-screen print:hidden" />
      <div className="pointer-events-none fixed bottom-0 right-0 -z-10 h-[min(500px,100vw)] w-[min(500px,100vw)] rounded-full bg-purple-600/10 blur-[150px] mix-blend-screen print:hidden" />

      {/* Control Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="relative z-20 mb-6 flex w-full max-w-5xl flex-col items-stretch gap-4 rounded-3xl border-2 border-white/5 bg-[#0A0A0A]/80 px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl print:hidden sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-[3rem] sm:px-8 sm:py-6"
      >
        <button
          type="button"
          disabled={!loadSettled}
          aria-busy={!loadSettled}
          onClick={handleBack}
          className="order-2 flex shrink-0 items-center justify-center space-x-2 text-[10px] uppercase tracking-[0.2em] text-cyan-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:order-1 sm:absolute sm:left-8 sm:justify-start"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>back</span>
        </button>

        <div className="order-1 flex w-full flex-wrap items-center justify-center gap-3 sm:order-2 sm:gap-4">
          {!isAnchoredOnChain && (
            <>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleSaveDraft} 
                className="group relative flex min-w-0 flex-1 items-center justify-center space-x-2 rounded-2xl border-2 border-white/10 bg-[#020202]/80 px-4 py-3 font-black lowercase tracking-tight text-white shadow-inner transition-all hover:border-purple-400 hover:bg-white/5 sm:flex-initial sm:space-x-3 sm:px-6 sm:py-4"
              >
                <Save className="h-5 w-5 shrink-0 text-purple-400 transition-transform group-hover:scale-110" /> 
                <span className="truncate">save draft.</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleSubmitToBlockchain}
                className="group relative flex min-w-0 flex-1 items-center justify-center space-x-2 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/20 px-4 py-3 font-black lowercase tracking-tight text-emerald-100 shadow-inner transition-all hover:bg-emerald-500/30 sm:flex-initial sm:space-x-3 sm:px-6 sm:py-4"
              >
                <SendHorizontal className="h-5 w-5 shrink-0 text-emerald-300 transition-transform group-hover:scale-110" />
                <span className="truncate text-left leading-tight">add to blockchain.</span>
              </motion.button>
            </>
          )}

          {isAnchoredOnChain && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handlePrint} 
              className="group relative flex w-full items-center justify-center space-x-3 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-black lowercase tracking-tight text-black shadow-[0_10px_30px_rgba(34,211,238,0.3)] transition-all hover:brightness-110 sm:w-auto sm:px-8 sm:py-4"
            >
              <div className="absolute inset-0 translate-x-[-100%] skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-[100%]" />
              <Printer className="h-5 w-5 shrink-0" strokeWidth={3} />
              <span>print out.</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Fixed A4 layout — same on all viewports; scaled to fit width on small screens */}
      <div
        ref={scaleViewportRef}
        className="certificate-scale-viewport mx-auto w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[210mm] print:max-w-none"
      >
        <div
          className="certificate-scale-clip relative mx-auto overflow-hidden print:!m-0 print:!h-auto print:!w-auto print:!overflow-visible"
          style={{
            width: A4_WIDTH_PX * sheetScale,
            height: A4_HEIGHT_PX * sheetScale,
          }}
        >
          <div
            ref={printRef}
            className="certificate-sheet absolute left-0 top-0 flex flex-col overflow-hidden border-[12px] border-double border-[#7a1b1b] bg-white p-12 pb-20 text-black shadow-2xl print:relative print:left-auto print:top-auto print:shadow-none print:!m-0 print:!h-[297mm] print:!w-[210mm] print:!max-w-none print:!border-[10px] print:!transform-none"
            style={{
              width: A4_WIDTH_PX,
              height: A4_HEIGHT_PX,
              transform: `scale(${sheetScale})`,
              transformOrigin: 'top left',
            }}
          >
        {/* Reference number at the absolute top right */}
        <div className="absolute right-14 top-10 text-right">
          <p className="text-base font-bold tracking-widest text-gray-900">REF. NO. {data.ref}</p>
        </div>

        {/* Header Section */}
        <div className="mb-4 pt-2 text-center">
          <div className="mb-4 flex justify-center">
            <img src="/miulogo.png" alt="MIU Logo" className="h-auto w-20 object-contain" />
          </div>
          <h1 className="font-serif text-2xl font-black uppercase leading-none tracking-tight text-[#7a1b1b]">
            MEWAR INTERNATIONAL UNIVERSITY
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#1e40af]">
            Km 21 Abuja Keffi Road, Masaka, Nasarawa State, Nigeria
          </p>
        </div>

        {/* Contact Block & Date */}
        <div className="mb-6 flex items-start justify-between px-4">
          <div className="w-2/3 space-y-0.5 text-[10px] font-medium leading-[1.2] text-gray-900">
            <p className="font-bold">VICE-CHANCELLOR: Prof. Mehtab Alam</p>
            <p className="text-[9px] text-gray-700">B.SC, M.SC, M.Tech. PhD, D.Sc. (Comp. Sc.)</p>
            <p className="pt-1 font-bold">REGISTRAR: ALH. Mamoon A. Abubakar</p>
            <p className="text-[9px] text-gray-700">NCE, BA.ED, RAMN, FICEN</p>
            <div className="pt-2 leading-tight">
              <p>Website: www.miu.edu.ng</p>
              <p>E-Mail: registrar@miu.edu.ng</p>
              <p>Telephone: +2348096417574</p>
            </div>
          </div>
          
          <div className="w-1/3 pt-12 text-right">
            <p className="text-sm font-bold">DATE: {data.date}</p>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-grow flex-col items-center justify-start space-y-6 text-center">
          <div className="mb-2">
            <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">
              NOTIFICATION OF DEGREE EXAMINATIONS RESULT 2024/2025
            </h2>
          </div>

          <p className="text-lg font-medium italic text-gray-700">This is to certify that</p>
          
          <div className="w-full max-w-[580px] border-b-2 border-dotted border-gray-400">
            <h3 className="overflow-hidden text-ellipsis whitespace-nowrap pb-1 font-serif text-3xl font-semibold italic tracking-tight text-gray-950">
              {data.name}
            </h3>
          </div>

          <div className="flex items-center justify-center space-x-2 text-lg">
            <span>With Registration Number:</span>
            <span className="border-b border-gray-400 px-6 font-mono text-xl font-bold uppercase tracking-tight text-gray-950">
              {data.matric}
            </span>
          </div>

          <div className="mx-auto max-w-2xl px-8 text-xl font-medium leading-relaxed text-gray-800">
            has satisfied the Examiners and the Senate of the University in all the requirements for the award of the degree of
          </div>

          <div className="w-full max-w-[580px]">
            <div className="border-b-2 border-gray-400 pb-1 font-serif text-2xl font-semibold italic text-[#7a1b1b]">
              Bachelor of Science ({data.dept})
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xl font-bold italic text-gray-950">
            <span>with</span>
            <span className="border-b border-gray-400 px-6">{data.class}</span>
          </div>

          <div className="mx-auto max-w-2xl px-10 text-sm leading-relaxed text-gray-700">
            The Degree will be conferred on you at the next Convocation ceremony of the University.
          </div>

          <p className="text-xl font-medium italic text-gray-800">Accept our congratulations.</p>
        </div>

        {/* Signature & QR Area */}
        <div className="flex items-end justify-between border-t border-transparent px-6 pb-6">
          <div className="text-center">
            <div className="mb-1.5 flex h-12 w-60 items-center justify-center border-b border-black">
                <div className="h-[0.5px] w-48 bg-gray-200" />
            </div>
            <p className="text-base font-bold text-gray-950">Alh. Mamoon A. Abubakar</p>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">REGISTRAR</p>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
             <div className="certificate-qr border border-gray-100 p-1">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/verify/${data.ref}` : `https://blockchain-certificate-verification-eta.vercel.app/verify/${data.ref}`}
                  size={105}
                />
             </div>
             <p className="mt-2 font-mono text-[8px] uppercase tracking-tighter text-gray-400">Verify Authenticity</p>
          </div>
        </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .certificate-scale-viewport {
            max-width: none !important;
            width: 100% !important;
          }
          .certificate-scale-clip {
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
          }
          .certificate-sheet {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            transform: none !important;
            width: 210mm !important;
            height: 297mm !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            overflow: hidden !important;
          }
          .certificate-qr svg {
            width: 105px !important;
            height: 105px !important;
          }
        }
      `}</style>
    </div>
  );
}