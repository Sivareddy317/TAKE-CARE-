import React, { useState } from 'react';
import { ArrowLeft, Mail, Globe } from 'lucide-react';

interface DataUsageConsentViewProps {
  onConsentGiven: () => void;
  onBack: () => void;
}

export const DataUsageConsentView: React.FC<DataUsageConsentViewProps> = ({
  onConsentGiven,
  onBack,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data usage</h2>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <Mail className="w-4 h-4" />
          <Globe className="w-4 h-4" />
        </div>
      </div>

      {/* Main Content (Image 9) */}
      <div className="my-auto py-4 space-y-4 text-xs text-slate-700 leading-relaxed">
        {/* Numbered Points */}
        <div className="space-y-2.5 font-medium text-slate-800 text-xs">
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-900">4.</span>
            <span>Voice messages you send for transcription</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-900">5.</span>
            <span>Context needed to provide health-related responses</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-slate-900">6.</span>
            <span>Metadata required to deliver and improve the service</span>
          </div>
        </div>

        {/* AI Guarantee Card */}
        <div className="pt-2 space-y-3">
          <p className="font-semibold text-slate-900 leading-normal">
            AI providers do not use your health data to train their models. Your data is encrypted in transit and at rest.
          </p>

          <p className="text-slate-600">
            AI is central to how Take Care works, it's how your records are read, organised, and made useful. Because of this, AI processing cannot be turned off independently.
          </p>

          <p className="text-slate-600">
            To withdraw your consent to AI processing, go to <span className="font-semibold text-slate-900">Settings → Delete Account</span>.
          </p>
        </div>

        {/* Links */}
        <div className="pt-2 space-y-2 text-xs font-bold text-slate-900">
          <div>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="underline hover:text-teal-700 cursor-pointer"
            >
              Our Privacy Policy.
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setActiveModal('rights')}
              className="underline hover:text-teal-700 cursor-pointer"
            >
              Your Data Rights.
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setActiveModal('grievance')}
              className="underline hover:text-teal-700 cursor-pointer"
            >
              Contact our Grievance Officer.
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Section: Checkbox + Continue Button */}
      <div className="pt-4 space-y-3">
        {/* Consent Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded text-slate-900 border-slate-300 focus:ring-slate-400 cursor-pointer"
          />
          <span className="text-[11px] text-slate-600 group-hover:text-slate-900 leading-tight">
            I've read this and I'm okay with Take Care using AI to process my health data.
          </span>
        </label>

        {/* Continue Button */}
        <button
          type="button"
          onClick={onConsentGiven}
          disabled={!isChecked}
          className="w-full py-4 bg-[#71717A] hover:bg-slate-900 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue</span>
        </button>
      </div>

      {/* Transparency Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'rights' && 'Your Data Rights'}
                {activeModal === 'grievance' && 'Grievance Officer'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeModal === 'privacy' &&
                'Take Care uses end-to-end 256-bit encryption for stored clinical documents. No clinical data is ever shared with third-party advertising networks.'}
              {activeModal === 'rights' &&
                'Under the Digital Personal Data Protection Act (DPDP), you retain full rights to inspect, export, or permanently erase all medical documents and AI extractions.'}
              {activeModal === 'grievance' &&
                'Grievance Officer: Dr. A. Sharma (Compliance & Clinical Ethics), grievance@takecare.health, Mumbai, Maharashtra.'}
            </p>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
