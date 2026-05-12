"use client";
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { logActivity } from '@/utils/logger';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, SendHorizontal, Printer } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { ethers } from 'ethers';
import { supabase } from '@/utils/supabaseClient';
import { readCertificateOnChain, normalizeCertificateRef } from '@/lib/readCertificateOnChain';

export default function CertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const { showLoading, showAlert } = useModal();

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
    const viewTypeFromUrl = searchParams.get("viewType");

    const init = async () => {
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
    router.back();
  };

  return (
    <div className="min-h-screen bg-[#020202] py-10 flex flex-col items-center print:bg-white print:py-0 font-sans relative overflow-hidden selection:bg-cyan-500/30">
      
      {/* Cyber Orbs (Hidden during print) */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen print:hidden" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen print:hidden" />

      {/* Control Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-12 px-8 py-6 print:hidden bg-[#0A0A0A]/80 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-20 relative"
      >
        <button
          onClick={handleBack}
          className="text-cyan-400 hover:text-white transition-colors flex items-center space-x-3 mb-6 md:mb-0 md:absolute md:left-8 uppercase tracking-[0.2em] text-[10px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>back</span>
        </button>

        <div className="flex items-center space-x-4 w-full justify-center">
          {!isAnchoredOnChain && (
            <>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveDraft} 
                className="group relative bg-[#020202]/80 border-2 border-white/10 text-white px-6 py-4 rounded-2xl font-black hover:border-purple-400 hover:bg-white/5 transition-all flex items-center space-x-3 lowercase tracking-tight shadow-inner"
              >
                <Save className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" /> 
                <span>save draft.</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmitToBlockchain}
                className="group relative bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-100 px-6 py-4 rounded-2xl font-black hover:bg-emerald-500/30 transition-all flex items-center space-x-3 lowercase tracking-tight shadow-inner"
              >
                <SendHorizontal className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform" />
                <span>add to blockchain.</span>
              </motion.button>
            </>
          )}

          {isAnchoredOnChain && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint} 
              className="group relative bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-8 py-4 rounded-2xl font-black shadow-[0_10px_30px_rgba(34,211,238,0.3)] hover:brightness-110 transition-all flex items-center space-x-3 lowercase tracking-tight overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              <Printer className="w-5 h-5" strokeWidth={3} />
              <span>print out.</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* The Certificate Layout */}
      <div 
        ref={printRef}
        className="w-[210mm] h-[297mm] bg-white p-12 pb-20 relative flex flex-col border-[12px] border-double border-[#7a1b1b] text-black shadow-2xl print:shadow-none print:m-0 print:border-[10px] overflow-hidden"
      >
        {/* Reference number at the absolute top right */}
        <div className="absolute top-10 right-14 text-right">
          <p className="font-bold text-base tracking-widest text-gray-900">REF. NO. {data.ref}</p>
        </div>

        {/* Header Section */}
        <div className="text-center mb-4 pt-2">
          <div className="flex justify-center mb-4">
            <img src="/miulogo.png" alt="MIU Logo" className="w-20 h-auto object-contain" />
          </div>
          <h1 className="text-2xl font-serif font-black text-[#7a1b1b] tracking-tight leading-none uppercase">
            MEWAR INTERNATIONAL UNIVERSITY
          </h1>
          <p className="text-[11px] font-bold text-[#1e40af] mt-1 uppercase tracking-wider">
            Km 21 Abuja Keffi Road, Masaka, Nasarawa State, Nigeria
          </p>
        </div>

        {/* Contact Block & Date */}
        <div className="flex justify-between items-start mb-6 px-4">
          <div className="text-[10px] leading-[1.2] space-y-0.5 w-2/3 text-gray-900 font-medium">
            <p className="font-bold">VICE-CHANCELLOR: Prof. Mehtab Alam</p>
            <p className="text-[9px] text-gray-700">B.SC, M.SC, M.Tech. PhD, D.Sc. (Comp. Sc.)</p>
            <p className="font-bold pt-1">REGISTRAR: ALH. Mamoon A. Abubakar</p>
            <p className="text-[9px] text-gray-700">NCE, BA.ED, RAMN, FICEN</p>
            <div className="pt-2 leading-tight">
              <p>Website: www.miu.edu.ng</p>
              <p>E-Mail: registrar@miu.edu.ng</p>
              <p>Telephone: +2348096417574</p>
            </div>
          </div>
          
          <div className="text-right w-1/3 pt-12">
            <p className="text-sm font-bold">DATE: {data.date}</p>
          </div>
        </div>

        {/* Main Body - Balanced for A4 fit */}
        <div className="text-center flex-grow flex flex-col items-center justify-start space-y-6">
          <div className="mb-2">
            <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">
              NOTIFICATION OF DEGREE EXAMINATIONS RESULT 2024/2025
            </h2>
          </div>

          <p className="text-lg font-medium text-gray-700 italic">This is to certify that</p>
          
          <div className="w-full max-w-[580px] border-b-2 border-dotted border-gray-400">
            <h3 className="text-3xl font-serif pb-1 italic text-gray-950 font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {data.name}
            </h3>
          </div>

          <div className="flex justify-center items-center space-x-2 text-lg">
            <span>With Registration Number:</span>
            <span className="font-bold border-b border-gray-400 px-6 font-mono text-gray-950 text-xl tracking-tight uppercase">
              {data.matric}
            </span>
          </div>

          <div className="max-w-2xl mx-auto text-xl leading-relaxed text-gray-800 font-medium px-8">
            has satisfied the Examiners and the Senate of the University in all the requirements for the award of the degree of
          </div>

          <div className="w-full max-w-[580px]">
            <div className="text-2xl font-serif italic border-b-2 border-gray-400 pb-1 text-[#7a1b1b] font-semibold">
              Bachelor of Science ({data.dept})
            </div>
          </div>

          <div className="flex justify-center items-center space-x-2 text-xl italic font-bold text-gray-950">
            <span>with</span>
            <span className="border-b border-gray-400 px-6">{data.class}</span>
          </div>

          <div className="max-w-2xl mx-auto text-sm leading-relaxed px-10 text-gray-700">
            The Degree will be conferred on you at the next Convocation ceremony of the University.
          </div>

          <p className="text-xl italic font-medium text-gray-800">Accept our congratulations.</p>
        </div>

        {/* Signature & QR Area - lifted up to prevent blocking */}
        <div className="flex justify-between items-end px-6 pb-6 border-t border-transparent">
          <div className="text-center">
            <div className="w-60 border-b border-black mb-1.5 flex justify-center h-12 items-center">
                {/* Visual signature line */}
                <div className="w-48 h-[0.5px] bg-gray-200"></div>
            </div>
            <p className="font-bold text-base text-gray-950">Alh. Mamoon A. Abubakar</p>
            <p className="text-xs uppercase font-bold text-gray-600 tracking-widest">REGISTRAR</p>
          </div>

          <div className="flex flex-col items-center p-2 bg-white border border-gray-100 rounded-xl shadow-sm">
             <div className="p-1 border border-gray-100">
                <QRCodeSVG value={typeof window !== 'undefined' ? `${window.location.origin}/verify/${data.ref}` : `https://blockchain-certificate-verification-eta.vercel.app/verify/${data.ref}`} size={105} />
             </div>
             <p className="text-[8px] mt-2 font-mono uppercase text-gray-400 tracking-tighter">Verify Authenticity</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}