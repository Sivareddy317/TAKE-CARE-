import React, { useState } from 'react';

interface ScanDoctorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectDoctorCode: (code: string) => void;
}

export const ScanDoctorQrModal: React.FC<ScanDoctorQrModalProps> = ({
  isOpen,
  onClose,
  onConnectDoctorCode,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim().length >= 6) {
      onConnectDoctorCode(manualCode.trim().toUpperCase());
      onClose();
    }
  };

  const handleSimulateScan = () => {
    onConnectDoctorCode('DOC-482910');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006D60] text-[22px]">qr_code_scanner</span>
            <h3 className="text-base font-bold text-slate-900">Scan Doctor's QR Code</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Frame */}
        <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4">
          <div className="w-48 h-48 border-2 border-teal-400 rounded-2xl relative flex items-center justify-center">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-400 -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-400 translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-400 -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-400 translate-x-1 translate-y-1"></div>

            {/* Laser scanning line */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_#2dd4bf] animate-bounce"></div>

            <p className="absolute bottom-3 text-[10px] text-teal-200 font-mono">
              Align clinic QR inside frame
            </p>
          </div>

          <button
            type="button"
            onClick={handleSimulateScan}
            className="mt-3 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-[11px] font-semibold transition"
          >
            Tap to test simulated clinic scan
          </button>
        </div>

        {/* Or Enter 6-digit Code */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 text-center">
            Or enter the doctor's 6-digit clinic station code:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. 849201"
              maxLength={8}
              className="flex-1 px-3 py-2 bg-slate-100 rounded-xl text-center font-mono font-bold text-sm tracking-widest text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={manualCode.length < 6}
              className="px-4 py-2 bg-[#006D60] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition"
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
