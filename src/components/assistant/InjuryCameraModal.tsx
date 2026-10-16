import React, { useState, useRef } from 'react';
import {
  Camera,
  X,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Check,
  Sparkles,
  FileText,
  Upload,
  Info,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { InjuryAnalysisResult, ProcessedDocument } from '../../types/clinical';

interface InjuryCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavedToRecords?: (doc: ProcessedDocument) => void;
}

export const InjuryCameraModal: React.FC<InjuryCameraModalProps> = ({
  isOpen,
  onClose,
  onSavedToRecords,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [injuryType, setInjuryType] = useState<'burn' | 'wound' | 'cut' | 'visible_injury'>('burn');
  const [userDescription, setUserDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<InjuryAnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG or PNG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 15 MB limit. Please select a smaller photo.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setAnalysisResult(null);
      setSavedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setSavedSuccess(false);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await ApiService.analyzeInjuryPhoto({
        imageData: capturedImage,
        injuryType,
        userDescription: userDescription.trim(),
      });

      if (res && res.success) {
        setAnalysisResult(res);
      } else {
        setErrorMessage(res?.error || 'Failed to analyze injury photo.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with vision analysis service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToRecords = async () => {
    if (!capturedImage || !analysisResult) return;

    setIsSaving(true);
    try {
      const payload = {
        ...analysisResult,
        previewUrl: capturedImage,
      };
      const res = await ApiService.saveInjuryRecord(payload);
      if (res && res.success) {
        setSavedSuccess(true);
        if (onSavedToRecords && res.document) {
          onSavedToRecords(res.document);
        }
      }
    } catch (err: any) {
      setErrorMessage('Could not save record to health vault.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetAndClose = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setSavedSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-200 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#006D60] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Take Photo • Injury &amp; Wound Check</h2>
              <p className="text-[10px] text-slate-500 font-medium">Informational first-aid guidance only</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Important Clinical Safeguard Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong className="block font-bold">Clinical Care Notice:</strong>
              Photos cannot replace an in-person physical examination. If you have severe bleeding, deep burns, or dizziness, call <strong>112 / 108</strong> immediately.
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select Type & Capture */}
          {!capturedImage ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                  Type of Visible Condition
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'burn', label: '🔥 Burn' },
                    { id: 'wound', label: '🩹 Wound' },
                    { id: 'cut', label: '🩸 Cut / Bleed' },
                    { id: 'visible_injury', label: '⚡ Other Injury' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInjuryType(item.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        injuryType === item.id
                          ? 'bg-teal-50 border-[#006D60] text-[#006D60] shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                  Brief Description (Optional)
                </label>
                <input
                  type="text"
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  placeholder="e.g. Touched hot stove 10 mins ago, minor redness on finger"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                />
              </div>

              {/* Hidden File Input supporting rear camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 rounded-2xl bg-[#006D60] hover:bg-[#005a4f] text-white font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-[0.99]"
                >
                  <Camera className="w-5 h-5 text-teal-200" />
                  <span>Open Camera to Take Photo</span>
                </button>

                <div className="text-center text-[11px] text-slate-400">or select an existing photo from gallery</div>

                <label
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Select from Gallery / Files</span>
                </label>
              </div>
            </div>
          ) : (
            /* STEP 2: Preview & Analysis Results */
            <div className="space-y-4 animate-fadeIn">
              {/* Photo Preview Card */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video flex items-center justify-center shadow-inner">
                <img
                  src={capturedImage}
                  alt="Captured injury preview"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRetake}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              </div>

              {/* Action Buttons if not analyzed yet */}
              {!analysisResult && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleAnalyze}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#006D60] hover:bg-[#005a4f] disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Analyzing with Clinical AI Vision...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-200" />
                        <span>Confirm &amp; Analyze Injury</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Analysis is confidential and evaluated against clinical decision support protocols.
                  </p>
                </div>
              )}

              {/* Analysis Results Display */}
              {analysisResult && (
                <div className="space-y-3 pt-1 animate-fadeIn">
                  {/* Emergency Warning Banner if critical */}
                  {analysisResult.requiresEmergencyCare && (
                    <div className="p-3 bg-rose-600 text-white rounded-2xl flex items-start gap-2.5 shadow-md">
                      <ShieldAlert className="w-5 h-5 text-white shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-xs font-black uppercase tracking-wider">
                          EMERGENCY WARNING
                        </strong>
                        <p className="text-[11px] text-rose-100 leading-relaxed mt-0.5">
                          This injury may require immediate emergency medical care. Call 112 / 108 or go to the nearest hospital immediately.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Immediate First Aid Recommendations */}
                  <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2 text-emerald-950">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Immediate First-Aid Measures</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-900 leading-relaxed">
                      {analysisResult.immediateFirstAid.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Red Flag Warning Signs */}
                  <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 space-y-2 text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Warning Signs to Watch For</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed">
                      {analysisResult.emergencyWarningSigns.map((sign, idx) => (
                        <li key={idx}>{sign}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations Statement */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Limitations of Photo Assessment
                    </span>
                    <ul className="text-[10px] text-slate-600 list-disc list-inside space-y-0.5">
                      {analysisResult.limitations.map((lim, idx) => (
                        <li key={idx}>{lim}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Explicit Save Consent Section */}
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    {savedSuccess ? (
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-[#006D60] font-bold flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>Saved to My Medical History</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSaveToRecords}
                        className="w-full py-3 px-4 rounded-2xl bg-[#006D60] hover:bg-[#005a4f] text-white font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-teal-200" />
                        <span>{isSaving ? 'Saving to Records...' : 'Save to My Health History (Explicit Consent)'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleRetake}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                    >
                      Discard Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
