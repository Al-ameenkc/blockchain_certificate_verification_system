"use client";
import { useSearchParams, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useRef, useState } from 'react';
import { logActivity } from '@/utils/logger';

export default function CertificatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

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

  const data = {
    ref: params.ref?.toString().replace(/\D/g, '').slice(0, 4) || '0034',
    name: toTitleCase(searchParams.get('name') || 'Kachalla Al Ameen Mustapha'),
    matric: searchParams.get('matric') || 'MIUSTD2022532',
    dept: searchParams.get('dept') || 'Software Engineering',
    class: searchParams.get('class') || 'First Class',
    date: formatDate(searchParams.get('date') || ''),
  };

  const viewType = searchParams.get('viewType') || 'issue';

  const [isSaved, setIsSaved] = useState(false);

  const handlePrint = () => window.print();

  const handleSaveDraft = () => {
    const actionName = viewType === 'issue' ? 'Issued Certificate' : 'Registered Certificate';
    const url = window.location.pathname + window.location.search;
    logActivity(`${actionName} (Draft)`, `Draft for ${data.name} (${data.matric})`, url);
    setIsSaved(true);
    alert('Draft saved successfully!');
  };

  const handleSaveFile = () => {
    const actionName = viewType === 'issue' ? 'Issued Certificate' : 'Registered Certificate';
    const url = window.location.pathname + window.location.search;
    logActivity(actionName, `File saved locally for ${data.name}`, url);
    setIsSaved(true);
    alert('File saved successfully!');
  };

  const handleBack = () => {
    if (!isSaved) {
      if (window.confirm("You have unsaved work, do you want to save as draft?")) {
        handleSaveDraft();
        window.history.back();
      } else {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-10 flex flex-col items-center print:bg-white print:py-0 font-sans">
      {/* Control Bar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 px-6 print:hidden text-white overflow-x-auto gap-4">
        <button onClick={handleBack} className="text-purple-400 font-bold hover:text-purple-300 transition-colors flex items-center space-x-2 shrink-0">
          <span>←</span> <span>Back to Console</span>
        </button>
        <div className="flex items-center space-x-3 shrink-0">
          <button onClick={handleSaveFile} className="bg-[#111] border border-purple-500/20 text-white px-5 py-3 rounded-2xl font-bold hover:bg-purple-900/20 transition-all flex items-center space-x-2">
            <span>💾</span> <span>Save File</span>
          </button>
          <button onClick={handleSaveDraft} className="bg-[#111] border border-purple-500/20 text-white px-5 py-3 rounded-2xl font-bold hover:bg-purple-900/20 transition-all flex items-center space-x-2">
            <span>📝</span> <span>Save as Draft</span>
          </button>
          <button onClick={handlePrint} className="bg-white text-black px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-purple-600 hover:text-white transition-all active:scale-95">
            Print Document
          </button>
        </div>
      </div>

      {/* The Certificate Layout */}
      <div 
        ref={printRef}
        className="w-[210mm] h-[297mm] bg-white p-12 pb-20 relative flex flex-col border-[12px] border-double border-[#7a1b1b] text-black shadow-2xl print:shadow-none print:m-0 print:border-[10px] overflow-hidden"
      >
        {/* S/NO. at the absolute top right */}
        <div className="absolute top-10 right-14 text-right">
          <p className="font-bold text-base tracking-widest text-gray-900">S/NO. {data.ref}</p>
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
                <QRCodeSVG value={`https://miu-verify.vercel.app/verify/${data.ref}`} size={105} />
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