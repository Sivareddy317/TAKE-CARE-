import React, { useState } from 'react';
import { UserProfile } from '../../types/clinical';
import { ApiService } from '../../services/api';
import {
  ArrowLeft,
  HeartPulse,
  Activity,
  AlertTriangle,
  Phone,
  ShieldAlert,
  User,
  Trash2,
  Check,
} from 'lucide-react';

interface AyuEditProfileViewProps {
  profile?: UserProfile | null;
  onBack: () => void;
  onSaveSuccess: (updated: UserProfile) => void;
  onAccountDeleted: () => void;
}

export const AyuEditProfileView: React.FC<AyuEditProfileViewProps> = ({
  profile,
  onBack,
  onSaveSuccess,
  onAccountDeleted,
}) => {
  const [phoneNumber] = useState(
    profile?.mobile ? `+91${profile.mobile.replace(/^\+91/, '')}` : ''
  );

  const initialFirst = profile?.fullName
    ? profile.fullName.split(' ')[0]
    : '';
  const initialLast = profile?.fullName
    ? profile.fullName.split(' ').slice(1).join(' ')
    : '';

  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [dob, setDob] = useState(profile?.dob || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || '');
  const [emergencyName, setEmergencyName] = useState(profile?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyContactPhone || '');
  const [hasHighBp, setHasHighBp] = useState<string>(
    profile?.hasHighBp === true ? 'yes' : profile?.hasHighBp === false ? 'no' : ''
  );
  const [latestBp, setLatestBp] = useState(profile?.latestBp || '');
  const [hasDiabetes, setHasDiabetes] = useState<string>(
    profile?.hasDiabetes === true ? 'yes' : profile?.hasDiabetes === false ? 'no' : ''
  );
  const [latestBloodSugar, setLatestBloodSugar] = useState(profile?.latestBloodSugar || '');
  const [allergiesSummary, setAllergiesSummary] = useState(profile?.allergiesSummary || '');
  const [currentMedicinesSummary, setCurrentMedicinesSummary] = useState(profile?.currentMedicinesSummary || '');

  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setFeedbackMessage('First name is required.');
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    const full = `${firstName.trim()} ${lastName.trim()}`.trim();
    const updatedData: Partial<UserProfile> = {
      fullName: full,
      dob: dob.trim(),
      age: age ? parseInt(age, 10) : undefined,
      gender: gender as any,
      bloodGroup: bloodGroup.trim(),
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      hasHighBp: hasHighBp === 'yes' ? true : hasHighBp === 'no' ? false : undefined,
      hasDiabetes: hasDiabetes === 'yes' ? true : hasDiabetes === 'no' ? false : undefined,
      latestBp: latestBp.trim(),
      latestBloodSugar: latestBloodSugar.trim(),
      allergiesSummary: allergiesSummary.trim(),
      currentMedicinesSummary: currentMedicinesSummary.trim(),
      isComplete: Boolean(
        full &&
        (dob.trim() || age.trim()) &&
        gender &&
        bloodGroup &&
        emergencyName.trim() &&
        emergencyPhone.trim()
      ),
      updatedAt: Date.now(),
    };

    try {
      const saved = await ApiService.updateProfile(updatedData);
      onSaveSuccess(saved);
      onBack();
    } catch {
      // Local fallback
      const fallback: UserProfile = {
        id: profile?.id || 'prof_user',
        userId: profile?.userId || 'usr_user',
        fullName: full,
        dob: dob.trim(),
        age: age ? parseInt(age, 10) : undefined,
        gender: gender as any,
        bloodGroup: bloodGroup.trim(),
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        hasHighBp: hasHighBp === 'yes' ? true : hasHighBp === 'no' ? false : undefined,
        hasDiabetes: hasDiabetes === 'yes' ? true : hasDiabetes === 'no' ? false : undefined,
        latestBp: latestBp.trim(),
        latestBloodSugar: latestBloodSugar.trim(),
        allergiesSummary: allergiesSummary.trim(),
        currentMedicinesSummary: currentMedicinesSummary.trim(),
        mobile: phoneNumber.replace(/^\+91/, ''),
        isMobileVerified: true,
        isComplete: Boolean(
          full &&
          (dob.trim() || age.trim()) &&
          gender &&
          bloodGroup &&
          emergencyName.trim() &&
          emergencyPhone.trim()
        ),
        updatedAt: Date.now(),
      };
      onSaveSuccess(fallback);
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await ApiService.deleteAccount();
    } catch (err) {
      console.warn('Error deleting backend record:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      onAccountDeleted();
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none pb-28"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="space-y-5">
        {/* Top Header */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Health Profile</h2>
            <p className="text-[10px] text-slate-500 font-medium">Keep your core medical profile accurate</p>
          </div>
        </div>

        {feedbackMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} id="edit-profile-form" className="space-y-4">
          {/* Section 1: Basic Identity */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Basic Information
            </span>

            {/* Phone Number */}
            {phoneNumber && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Phone Number (Verified)</label>
                <input
                  type="text"
                  value={phoneNumber}
                  readOnly
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 rounded-xl text-slate-500 font-semibold text-xs cursor-not-allowed select-none"
                />
              </div>
            )}

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                />
              </div>
            </div>

            {/* DOB & Age */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Or Age (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                />
              </div>
            </div>

            {/* Gender & Blood Group */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroupOptions.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Minimum Health Profile */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              2. Minimum Health Profile
            </span>

            {/* High Blood Pressure */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>High BP Status</span>
                <span className="text-[10px] text-slate-400 font-normal">Hypertension diagnosis</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'no', label: 'No' },
                  { id: 'yes', label: 'Yes' },
                  { id: '', label: 'Unknown' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHasHighBp(opt.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      hasHighBp === opt.id
                        ? 'bg-teal-50 border-[#006D60] text-[#006D60]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={latestBp}
                onChange={(e) => setLatestBp(e.target.value)}
                placeholder="Latest BP reading if known (e.g. 120/80 mmHg)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60] mt-1"
              />
            </div>

            {/* Diabetes Status */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Diabetes Status</span>
                <span className="text-[10px] text-slate-400 font-normal">Blood sugar condition</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'no', label: 'No' },
                  { id: 'yes', label: 'Yes' },
                  { id: '', label: 'Unknown' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHasDiabetes(opt.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      hasDiabetes === opt.id
                        ? 'bg-teal-50 border-[#006D60] text-[#006D60]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={latestBloodSugar}
                onChange={(e) => setLatestBloodSugar(e.target.value)}
                placeholder="Latest Fasting/HbA1c if known (e.g. 110 mg/dL or 6.2%)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60] mt-1"
              />
            </div>

            {/* Allergies Summary */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Allergies (or "No known allergies")
              </label>
              <input
                type="text"
                value={allergiesSummary}
                onChange={(e) => setAllergiesSummary(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Dust Mites (or No known allergies)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
              />
            </div>

            {/* Current Medicines */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Current Medicines Currently Being Taken
              </label>
              <input
                type="text"
                value={currentMedicinesSummary}
                onChange={(e) => setCurrentMedicinesSummary(e.target.value)}
                placeholder="e.g. Metformin 500mg (or None)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
              />
            </div>
          </div>

          {/* Section 3: Emergency Contact */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              3. Emergency Contact (Required for Emergency Summary)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Contact Name</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Contact Phone</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#006D60]/20 focus:border-[#006D60]"
                />
              </div>
            </div>
          </div>

          {/* Delete Account Link */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account &amp; Erase Records</span>
            </button>
          </div>
        </form>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          type="submit"
          form="edit-profile-form"
          disabled={isSaving}
          className="w-full py-4 bg-[#006D60] hover:bg-[#005a4f] active:scale-[0.99] disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{isSaving ? 'Saving Profile...' : 'Save Health Profile'}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All your uploaded medical documents, clinical notes, and emergency sharing access will be permanently deleted from our servers.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
