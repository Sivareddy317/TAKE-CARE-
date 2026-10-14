import React, { useState } from 'react';

export interface MedicineReminder {
  id: string;
  name: string;
  dosage: string;
  type: 'Tablet' | 'Syrup' | 'Capsule' | 'Injection' | 'Drops';
  periods: ('morning' | 'afternoon' | 'evening' | 'night')[];
  duration: string;
  takenToday: boolean;
  notes?: string;
}

interface MedicineRemindersViewProps {
  onBack: () => void;
}

export const MedicineRemindersView: React.FC<MedicineRemindersViewProps> = ({ onBack }) => {
  const [reminders, setReminders] = useState<MedicineReminder[]>([
    {
      id: 'rem-1',
      name: 'TAB.Bengreat-4',
      dosage: '1 tablet',
      type: 'Tablet',
      periods: ['morning'],
      duration: 'For 2 weeks',
      takenToday: true,
      notes: 'Take after breakfast',
    },
    {
      id: 'rem-2',
      name: 'Coldover P Suspension 60ml',
      dosage: '2 ml',
      type: 'Syrup',
      periods: ['morning', 'evening'],
      duration: 'For 4 weeks',
      takenToday: false,
      notes: 'Shake well before use',
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newType, setNewType] = useState<MedicineReminder['type']>('Tablet');
  const [newPeriods, setNewPeriods] = useState<('morning' | 'afternoon' | 'evening' | 'night')[]>(['morning']);
  const [newDuration, setNewDuration] = useState('For 2 weeks');

  const togglePeriod = (p: 'morning' | 'afternoon' | 'evening' | 'night') => {
    setNewPeriods((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newRem: MedicineReminder = {
      id: 'rem-' + Date.now(),
      name: newMedName.trim(),
      dosage: newDosage.trim() || '1 unit',
      type: newType,
      periods: newPeriods.length > 0 ? newPeriods : ['morning'],
      duration: newDuration.trim() || 'Ongoing',
      takenToday: false,
    };

    setReminders((prev) => [newRem, ...prev]);
    setIsAdding(false);
    setNewMedName('');
    setNewDosage('');
  };

  const handleToggleTaken = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, takenToday: !r.takenToday } : r))
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Medicine Reminders</h1>
            <p className="text-xs text-slate-500">Track and take your prescriptions on schedule</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 bg-[#006D60] hover:bg-[#005248] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">{isAdding ? 'close' : 'add'}</span>
          <span>{isAdding ? 'Cancel' : 'Add New'}</span>
        </button>
      </div>

      {/* Add Reminder Card */}
      {isAdding && (
        <form onSubmit={handleAddReminder} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 animate-fadeIn">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">New Medicine Reminder</h3>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Medicine Name *</label>
            <input
              type="text"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              placeholder="e.g. Paracetamol 650 or Amoxicillin"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Dosage</label>
              <input
                type="text"
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                placeholder="e.g. 1 tablet / 5 ml"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Form</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="Tablet">Tablet</option>
                <option value="Syrup">Syrup</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Drops">Drops</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Time of Day</label>
            <div className="flex flex-wrap gap-1.5">
              {(['morning', 'afternoon', 'evening', 'night'] as const).map((p) => {
                const selected = newPeriods.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePeriod(p)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                      selected ? 'bg-[#006D60] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#006D60] hover:bg-[#005248] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Save Reminder
          </button>
        </form>
      )}

      {/* Reminders List */}
      <div className="space-y-2.5">
        {reminders.map((rem) => (
          <div
            key={rem.id}
            className={`p-4 rounded-2xl border transition-all ${
              rem.takenToday
                ? 'bg-[#F0FDF4] border-emerald-200 shadow-2xs'
                : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{rem.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {rem.type}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{rem.dosage}</span>
                  <span>•</span>
                  <span>{rem.duration}</span>
                </div>

                {/* Periods badges */}
                <div className="flex items-center gap-1.5 pt-1">
                  {rem.periods.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold text-[10px] uppercase tracking-wider"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleTaken(rem.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    rem.takenToday
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {rem.takenToday ? 'check_circle' : 'circle'}
                  </span>
                  <span>{rem.takenToday ? 'Taken' : 'Take'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteReminder(rem.id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <span className="material-symbols-outlined text-slate-400 text-[32px]">notifications_none</span>
            <p className="text-xs font-bold text-slate-800">No active medicine reminders</p>
            <p className="text-[11px] text-slate-500">Tap "Add New" to set up your daily medicine alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
};
