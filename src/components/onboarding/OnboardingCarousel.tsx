import React, { useState } from 'react';
import { AyuHealthLogo } from '../common/AppLogo';

interface OnboardingCarouselProps {
  onFinish: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeSugarPeriod, setActiveSugarPeriod] = useState<'morning' | 'afternoon' | 'night'>('afternoon');

  const totalSlides = 3;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <AyuHealthLogo size="md" />
        <button
          type="button"
          onClick={onFinish}
          className="px-3.5 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
        >
          <span>Skip</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>

      {/* Main Slide Graphic / Visual Section */}
      <div className="flex-1 flex flex-col items-center justify-center my-6">
        {/* SLIDE 0: Ask Questions to AI (Image 10) */}
        {currentSlide === 0 && (
          <div className="w-full space-y-3 max-w-sm animate-fadeIn">
            {/* Assistant Bubble */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#1E293B] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 leading-relaxed pt-0.5">
                Sure, it is a prescription given by <span className="font-bold">Dr. S. Rajan</span>. It is as follows:
              </div>
            </div>

            {/* Tablets Card */}
            <div className="bg-[#EAF1FB] rounded-2xl p-3 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span>Tablets</span>
                <div className="flex items-center gap-6">
                  <span>Morning</span>
                  <span>Afternoon</span>
                  <span>Evening</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/70 p-2 rounded-xl">
                <div>
                  <div className="font-bold text-slate-900">TAB.Bengreat-4</div>
                  <div className="text-[10px] text-slate-500">For 2 weeks</div>
                </div>
                <div className="flex items-center gap-8 pr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                  <span className="w-2.5 h-2.5"></span>
                  <span className="w-2.5 h-2.5"></span>
                </div>
              </div>
            </div>

            {/* Syrups Card */}
            <div className="bg-[#EAF1FB] rounded-2xl p-3 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span>Syrups</span>
                <div className="flex items-center gap-6">
                  <span>Morning</span>
                  <span>Afternoon</span>
                  <span>Evening</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/70 p-2 rounded-xl">
                <div>
                  <div className="font-bold text-slate-900">Coldover P Suspension</div>
                  <div className="text-[10px] text-slate-500">60ml • For 4 weeks</div>
                </div>
                <div className="flex items-center gap-6 text-[11px] font-bold text-slate-800 pr-1">
                  <span>2 ml</span>
                  <span className="text-slate-300">-</span>
                  <span>2 ml</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 font-medium pl-2">
              Is there anything else I can help you with?
            </div>

            {/* Feedback chips */}
            <div className="flex items-center gap-2 pl-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                <span className="material-symbols-outlined text-[13px]">thumb_up</span> Helpful
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                <span className="material-symbols-outlined text-[13px]">thumb_down</span> Not helpful
              </span>
            </div>
          </div>
        )}

        {/* SLIDE 1: Upload Your Documents (Image 11) */}
        {currentSlide === 1 && (
          <div className="w-full flex flex-col items-center justify-center py-6 animate-fadeIn">
            <div className="relative w-56 h-64 flex items-center justify-center">
              {/* Back Card (X-ray / Radiology) */}
              <div className="absolute w-44 h-56 bg-slate-800 rounded-2xl rotate-6 shadow-md border-2 border-slate-700 flex flex-col items-center justify-center p-3 opacity-90">
                <div className="w-full h-full border border-dashed border-slate-600 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-teal-400 text-[48px] opacity-70">
                    radiology
                  </span>
                </div>
              </div>

              {/* Front Card (Prescription with stamp and signature) */}
              <div className="absolute w-48 h-56 bg-white rounded-2xl -rotate-3 shadow-xl border border-slate-200 p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                    <div className="w-16 h-2 bg-teal-700 rounded"></div>
                    <div className="w-8 h-2 bg-slate-200 rounded"></div>
                  </div>
                  {/* Handwritten-like squiggles */}
                  <div className="space-y-1.5 pt-1">
                    <div className="w-3/4 h-1.5 bg-slate-300 rounded-full"></div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full"></div>
                    <div className="w-2/3 h-1.5 bg-slate-300 rounded-full"></div>
                    <div className="w-5/6 h-1.5 bg-slate-200 rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                  {/* Doctor Signature */}
                  <div className="w-20 h-4 border-b-2 border-slate-400 font-serif italic text-[10px] text-slate-500">
                    Dr. S. Rajan
                  </div>
                  {/* Medical Stamp */}
                  <div className="w-8 h-8 rounded-full border border-teal-600 flex items-center justify-center text-teal-700">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: Track Your Health (Image 12) */}
        {currentSlide === 2 && (
          <div className="w-full max-w-sm space-y-3 animate-fadeIn">
            {/* Period Toggle Pill */}
            <div className="flex justify-center">
              <div className="bg-slate-200/80 p-1 rounded-full flex items-center gap-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveSugarPeriod('morning')}
                  className={`px-3 py-1 rounded-full transition ${
                    activeSugarPeriod === 'morning' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'
                  }`}
                >
                  Morning
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSugarPeriod('afternoon')}
                  className={`px-3 py-1 rounded-full transition ${
                    activeSugarPeriod === 'afternoon' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'
                  }`}
                >
                  Afternoon
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSugarPeriod('night')}
                  className={`px-3 py-1 rounded-full transition ${
                    activeSugarPeriod === 'night' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'
                  }`}
                >
                  Night
                </button>
              </div>
            </div>

            {/* Glucose Trend Curve Chart */}
            <div className="relative h-44 bg-white/60 rounded-3xl p-4 border border-rose-100 flex flex-col justify-between">
              {/* Y-axis labels */}
              <div className="absolute right-3 top-3 bottom-8 flex flex-col justify-between text-[10px] font-mono text-slate-400 text-right">
                <span>300</span>
                <span>250</span>
                <span className="font-bold text-rose-500">180</span>
                <span>70</span>
                <span>54</span>
              </div>

              {/* Spline curve visual */}
              <svg className="w-full h-28" viewBox="0 0 300 100" fill="none">
                {/* Horizontal guide lines */}
                <line x1="0" y1="50" x2="250" y2="50" stroke="#F1F5F9" strokeDasharray="4 4" />
                <line x1="0" y1="20" x2="250" y2="20" stroke="#FEE2E2" strokeDasharray="4 4" />

                {/* Spline */}
                <path
                  d="M10 80 Q 75 70, 140 60 T 260 40"
                  stroke="#F87171"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Data point circle */}
                <circle cx="140" cy="60" r="5" fill="#991B1B" />
                <circle cx="140" cy="60" r="8" stroke="#FCA5A5" strokeWidth="2" fill="none" />
              </svg>

              {/* X-axis days */}
              <div className="flex justify-between pr-14 text-[11px] font-semibold text-slate-400">
                <span>Mon</span>
                <span className="text-slate-900 font-bold">Tue</span>
                <span>Wed</span>
              </div>
            </div>

            {/* Stable Sugar Status Badge */}
            <div className="bg-teal-50 text-teal-800 border border-teal-200 rounded-2xl p-2.5 text-center text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs">
              <span className="text-sm">✨</span>
              <span>Your monthly sugar levels look stable.</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Card Container with Title, Description, Dots, and Action Button */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        {currentSlide === 0 && (
          <div className="space-y-1 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ask Questions to AI</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Get instant, reliable answers to your health questions anytime and anywhere!
            </p>
          </div>
        )}

        {currentSlide === 1 && (
          <div className="space-y-1 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload Your Documents</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Upload your documents to digitise and access them anytime.
            </p>
          </div>
        )}

        {currentSlide === 2 && (
          <div className="space-y-1 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Track Your Health</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Track your health and understand what your numbers mean to spot changes early.
            </p>
          </div>
        )}

        {/* Pagination Dots and Action Button */}
        <div className="flex items-center justify-between pt-2">
          {/* 3 Pagination Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`transition-all rounded-full ${
                  currentSlide === idx ? 'w-6 h-2 bg-slate-900' : 'w-2 h-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Next / Get Started Button */}
          <button
            type="button"
            onClick={handleNext}
            className="px-8 py-3 bg-[#1E293B] hover:bg-slate-900 active:scale-95 text-white font-bold text-sm rounded-full transition shadow-md cursor-pointer"
          >
            {currentSlide === 2 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
