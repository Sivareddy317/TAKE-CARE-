import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Pill,
  Calendar,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface MedicineReminder {
  id: string;
  name: string;
  dosage: string;
  type: 'Tablet' | 'Syrup' | 'Capsule' | 'Injection' | 'Drops';
  periods: ('morning' | 'afternoon' | 'evening' | 'night')[];
  scheduledTimes: {
    morning?: string;
    afternoon?: string;
    evening?: string;
    night?: string;
  };
  startDate: string;
  endDate?: string;
  sourceDoc?: string;
  isConfirmedByUser: boolean;
  userResponse?: 'reported_taken' | 'skipped' | 'snoozed' | 'pending';
  lastResponseTime?: number;
  notes?: string;
}

export interface FollowUpReminder {
  id: string;
  title: string;
  doctorName?: string;
  hospital?: string;
  followUpDate: string;
  sourceDoc?: string;
  notes?: string;
  status: 'upcoming' | 'completed' | 'dismissed';
}

export interface SecurityNotification {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'security';
}

interface MedicineRemindersViewProps {
  onBack: () => void;
}

const STORAGE_KEY_MEDS = 'takecare_confirmed_med_reminders';
const STORAGE_KEY_FOLLOWUPS = 'takecare_followup_reminders';
const STORAGE_KEY_PRIVACY = 'takecare_lockscreen_privacy';
const STORAGE_KEY_ENABLED = 'takecare_reminders_enabled';

export const MedicineRemindersView: React.FC<MedicineRemindersViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'medications' | 'followups' | 'security'>('medications');

  // Reminders Enabled Toggle
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_ENABLED);
      return v !== null ? JSON.parse(v) : true;
    } catch {
      return true;
    }
  });

  // Lockscreen Privacy Mode (Never expose sensitive drug names on lock screen)
  const [lockscreenPrivacy, setLockscreenPrivacy] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_PRIVACY);
      return v !== null ? JSON.parse(v) : true;
    } catch {
      return true;
    }
  });

  // Notification Permission State
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Clean initial state (starts empty for new users as required)
  const [medReminders, setMedReminders] = useState<MedicineReminder[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_MEDS);
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });

  const [followUps, setFollowUps] = useState<FollowUpReminder[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_FOLLOWUPS);
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityNotification[]>(() => {
    try {
      const v = localStorage.getItem('takecare_family_audit');
      if (v) {
        const parsed = JSON.parse(v);
        return parsed.map((a: any) => ({
          id: a.id || `sec_${a.timestamp}`,
          timestamp: a.timestamp,
          title: `Security: ${a.action.replace('_', ' ').toUpperCase()}`,
          message: `${a.actorName} performed ${a.action} for ${a.targetProfileName}. Permission: ${a.permissionLevel}.`,
          severity: a.action === 'access_revoked' ? 'warning' : 'info',
        }));
      }
    } catch {}
    return [];
  });

  // Form State for Adding Medication Reminder
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [dosageInput, setDosageInput] = useState('');
  const [typeInput, setTypeInput] = useState<MedicineReminder['type']>('Tablet');
  const [periodsInput, setPeriodsInput] = useState<('morning' | 'afternoon' | 'evening' | 'night')[]>(['morning']);
  const [notesInput, setNotesInput] = useState('');

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEDS, JSON.stringify(medReminders));
    } catch {}
  }, [medReminders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLLOWUPS, JSON.stringify(followUps));
    } catch {}
  }, [followUps]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(lockscreenPrivacy));
    } catch {}
  }, [lockscreenPrivacy]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, JSON.stringify(remindersEnabled));
    } catch {}
  }, [remindersEnabled]);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
      } catch {}
    }
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const newMed: MedicineReminder = {
      id: 'rem_' + Date.now(),
      name: nameInput.trim(),
      dosage: dosageInput.trim() || '1 dose',
      type: typeInput,
      periods: periodsInput.length > 0 ? periodsInput : ['morning'],
      scheduledTimes: {
        morning: '08:00',
        afternoon: '13:00',
        evening: '18:00',
        night: '21:00',
      },
      startDate: new Date().toISOString().split('T')[0],
      isConfirmedByUser: true,
      userResponse: 'pending',
      notes: notesInput.trim() || undefined,
    };

    setMedReminders((prev) => [newMed, ...prev]);
    setNameInput('');
    setDosageInput('');
    setNotesInput('');
    setIsAddingMed(false);
  };

  const handleResponse = (id: string, response: 'reported_taken' | 'skipped' | 'snoozed') => {
    setMedReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              userResponse: response,
              lastResponseTime: Date.now(),
            }
          : r
      )
    );
  };

  const handleDeleteMed = (id: string) => {
    setMedReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-20 space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Reminders</h1>
            <p className="text-xs text-slate-500">Low-noise reminders for prescriptions, follow-ups, and security</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRemindersEnabled(!remindersEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              remindersEnabled
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {remindersEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            <span>{remindersEnabled ? 'Reminders On' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Lockscreen Privacy & Permission Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Lock-Screen Privacy Guard</p>
              <p className="text-[11px] text-slate-500">
                {lockscreenPrivacy
                  ? 'Showing generic notice: "Time for your scheduled medicine" (drug names hidden)'
                  : 'Showing detailed medicine names on lock screen'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLockscreenPrivacy(!lockscreenPrivacy)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            {lockscreenPrivacy ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{lockscreenPrivacy ? 'Privacy Active' : 'Reveal Names'}</span>
          </button>
        </div>

        {notifPermission !== 'granted' && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">System notification permissions needed for timely alerts.</span>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="px-3 py-1 rounded-lg bg-[#006D60] text-white font-bold hover:bg-[#005a50] transition cursor-pointer"
            >
              Enable Notifications
            </button>
          </div>
        )}
      </div>

      {/* Notification Categories Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('medications')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
            activeTab === 'medications'
              ? 'border-[#006D60] text-[#006D60]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Prescriptions ({medReminders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('followups')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
            activeTab === 'followups'
              ? 'border-[#006D60] text-[#006D60]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Follow-Ups ({followUps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
            activeTab === 'security'
              ? 'border-[#006D60] text-[#006D60]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security Notices ({securityEvents.length})</span>
        </button>
      </div>

      {/* TAB 1: MEDICATIONS */}
      {activeTab === 'medications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Only user-confirmed medicines generate reminders. Never auto-scheduled from unverified OCR.
            </p>
            <button
              type="button"
              onClick={() => setIsAddingMed(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#006D60] text-white font-bold text-xs hover:bg-[#005a50] transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Schedule</span>
            </button>
          </div>

          {medReminders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
              <Pill className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No active medication reminders</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload and review your prescription or tap "Add Schedule" to configure confirmed reminder times.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {medReminders.map((rem) => {
                const response = rem.userResponse;
                return (
                  <div
                    key={rem.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#006D60] flex items-center justify-center font-bold">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{rem.name}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {rem.type} • {rem.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Schedule: {rem.periods.join(', ')} {rem.notes && `• ${rem.notes}`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMed(rem.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Patient Response Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Response:</span>
                        {response === 'reported_taken' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Reported Taken by Patient
                          </span>
                        ) : response === 'skipped' ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3.5 h-3.5" />
                            Dose Skipped
                          </span>
                        ) : response === 'snoozed' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5" />
                            Snoozed 15m
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Scheduled for next period</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResponse(rem.id, 'reported_taken')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition cursor-pointer"
                        >
                          Mark Taken
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResponse(rem.id, 'snoozed')}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition cursor-pointer"
                        >
                          Snooze
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResponse(rem.id, 'skipped')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition cursor-pointer"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FOLLOW-UPS */}
      {activeTab === 'followups' && (
        <div className="space-y-3">
          {followUps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No scheduled clinical follow-ups</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When a doctor's prescription or discharge summary includes a follow-up revisit date, it will appear here.
              </p>
            </div>
          ) : (
            followUps.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{f.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Date: {f.followUpDate} • {f.hospital || 'Hospital Revisit'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#006D60] font-bold text-xs">
                  {f.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SECURITY NOTICES */}
      {activeTab === 'security' && (
        <div className="space-y-3">
          {securityEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
              <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No security alerts logged</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Access grants, permission revocations, and authentication events will appear here in chronological order.
              </p>
            </div>
          ) : (
            securityEvents.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">{s.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(s.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{s.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Add Medication Schedule */}
      {isAddingMed && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#006D60]" />
                <h3 className="font-bold text-slate-900 text-base">Schedule Medicine Reminder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingMed(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMed} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650mg"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Tablet"
                    value={dosageInput}
                    onChange={(e) => setDosageInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Injection">Injection</option>
                    <option value="Drops">Drops</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Periods</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['morning', 'afternoon', 'evening', 'night'] as const).map((p) => {
                    const isSelected = periodsInput.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPeriodsInput((prev) =>
                            isSelected ? prev.filter((item) => item !== p) : [...prev, p]
                          );
                        }}
                        className={`py-1.5 rounded-xl font-bold capitalize border text-xs cursor-pointer ${
                          isSelected
                            ? 'border-[#006D60] bg-teal-50 text-[#006D60]'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. After breakfast with warm water"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingMed(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#006D60] hover:bg-[#005a50] shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
