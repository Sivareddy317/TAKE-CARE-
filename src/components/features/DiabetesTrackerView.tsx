import React, { useState } from 'react';

export interface BloodSugarLog {
  id: string;
  value: number; // mg/dL
  type: 'Fasting' | 'Post-Prandial' | 'Random' | 'Bedtime';
  period: 'morning' | 'afternoon' | 'night';
  date: string;
  notes?: string;
}

interface DiabetesTrackerViewProps {
  onBack: () => void;
}

export const DiabetesTrackerView: React.FC<DiabetesTrackerViewProps> = ({ onBack }) => {
  const [activePeriod, setActivePeriod] = useState<'morning' | 'afternoon' | 'night'>('afternoon');
  const [isLogging, setIsLogging] = useState(false);
  const [readingInput, setReadingInput] = useState('');
  const [typeInput, setTypeInput] = useState<BloodSugarLog['type']>('Post-Prandial');
  const [notesInput, setNotesInput] = useState('');

  const [logs, setLogs] = useState<BloodSugarLog[]>([
    {
      id: 'log-1',
      value: 124,
      type: 'Post-Prandial',
      period: 'afternoon',
      date: 'Today, 2:30 PM',
      notes: '2 hrs after lunch',
    },
    {
      id: 'log-2',
      value: 95,
      type: 'Fasting',
      period: 'morning',
      date: 'Today, 8:00 AM',
      notes: 'Fasting reading',
    },
    {
      id: 'log-3',
      value: 112,
      type: 'Bedtime',
      period: 'night',
      date: 'Yesterday, 10:15 PM',
      notes: 'Before sleep',
    },
  ]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(readingInput, 10);
    if (!val || val <= 0) return;

    const newLog: BloodSugarLog = {
      id: 'log-' + Date.now(),
      value: val,
      type: typeInput,
      period: activePeriod,
      date: 'Just now',
      notes: notesInput.trim() || undefined,
    };

    setLogs((prev) => [newLog, ...prev]);
    setReadingInput('');
    setNotesInput('');
    setIsLogging(false);
  };

  const getStatusBadge = (val: number, type: BloodSugarLog['type']) => {
    if (type === 'Fasting') {
      if (val < 100) {
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Normal Fasting</span>;
      } else if (val <= 125) {
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Elevated Fasting</span>;
      } else {
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">High Fasting</span>;
      }
    } else {
      if (val < 140) {
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Normal Glucose</span>;
      } else if (val <= 199) {
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Elevated</span>;
      } else {
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">High Glucose</span>;
      }
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto pb-20 space-y-4 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Track Diabetes</h1>
            <p className="text-xs text-slate-500">Monitor blood glucose trends and stability</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLogging(!isLogging)}
          className="px-3 py-1.5 bg-[#006D60] hover:bg-[#005248] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">{isLogging ? 'close' : 'add'}</span>
          <span>{isLogging ? 'Cancel' : 'Log Sugar'}</span>
        </button>
      </div>

      {/* Log Sugar Form */}
      {isLogging && (
        <form onSubmit={handleAddLog} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 animate-fadeIn">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Log Blood Glucose</h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Reading (mg/dL) *</label>
              <input
                type="number"
                value={readingInput}
                onChange={(e) => setReadingInput(e.target.value)}
                placeholder="e.g. 110"
                min={20}
                max={600}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Measurement Type</label>
              <select
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500"
              >
                <option value="Fasting">Fasting</option>
                <option value="Post-Prandial">Post-Prandial (After meal)</option>
                <option value="Random">Random</option>
                <option value="Bedtime">Bedtime</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Notes (optional)</label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Had fruit salad earlier"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#006D60] hover:bg-[#005248] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Save Reading
          </button>
        </form>
      )}

      {/* Chart Section (Matching Image 12) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
        {/* Morning / Afternoon / Night Toggle Pill */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1 rounded-full flex items-center gap-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActivePeriod('morning')}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                activePeriod === 'morning' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'
              }`}
            >
              Morning
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod('afternoon')}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                activePeriod === 'afternoon' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'
              }`}
            >
              Afternoon
            </button>
            <button
              type="button"
              onClick={() => setActivePeriod('night')}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                activePeriod === 'night' ? 'bg-slate-900 text-white' : 'hover:text-slate-900'
              }`}
            >
              Night
            </button>
          </div>
        </div>

        {/* Spline Chart */}
        <div className="relative h-48 bg-slate-50/60 rounded-2xl p-4 border border-rose-100 flex flex-col justify-between">
          <div className="absolute right-3 top-3 bottom-8 flex flex-col justify-between text-[10px] font-mono text-slate-400 text-right">
            <span>300</span>
            <span>250</span>
            <span className="font-bold text-rose-500">180</span>
            <span>70</span>
            <span>54</span>
          </div>

          {/* Spline curve visual */}
          <svg className="w-full h-32" viewBox="0 0 300 120" fill="none">
            <line x1="0" y1="90" x2="250" y2="90" stroke="#E2E8F0" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="250" y2="50" stroke="#FEE2E2" strokeDasharray="3 3" />
            <line x1="0" y1="20" x2="250" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />

            <path
              d="M10 95 Q 60 85, 110 70 T 210 50 T 255 45"
              stroke="#F87171"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />

            <circle cx="110" cy="70" r="5" fill="#991B1B" />
            <circle cx="110" cy="70" r="9" stroke="#FCA5A5" strokeWidth="2" fill="none" />

            <circle cx="210" cy="50" r="4" fill="#991B1B" />
          </svg>

          {/* X-axis days */}
          <div className="flex justify-between pr-14 text-[11px] font-semibold text-slate-400">
            <span>Mon</span>
            <span className="text-slate-900 font-bold">Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-teal-50 text-teal-800 border border-teal-200 rounded-2xl p-3 text-center text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs">
          <span className="text-base">✨</span>
          <span>Your monthly sugar levels look stable.</span>
        </div>
      </div>

      {/* Recent Logs List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">
          Recent Glucose Logs
        </h3>

        {logs.map((log) => (
          <div
            key={log.id}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900 font-mono">
                  {log.value} <span className="text-xs font-normal text-slate-500">mg/dL</span>
                </span>
                {getStatusBadge(log.value, log.type)}
              </div>
              <p className="text-[11px] text-slate-500">
                {log.type} • {log.date}
              </p>
              {log.notes && <p className="text-[10px] text-slate-400 italic">"{log.notes}"</p>}
            </div>

            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
              {log.period}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
