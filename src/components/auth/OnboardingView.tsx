import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import { UserProfile } from '../../types/clinical';

interface OnboardingViewProps {
  initialProfile: UserProfile;
  onFinishOnboarding: (updatedProfile: UserProfile) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  initialProfile,
  onFinishOnboarding,
}) => {
  const [fullName, setFullName] = useState(initialProfile.fullName || '');
  const [dob, setDob] = useState(initialProfile.dob || '');
  const [gender, setGender] = useState(initialProfile.gender || '');
  const [emergencyName, setEmergencyName] = useState(initialProfile.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(initialProfile.emergencyContactPhone || '');
  const [bloodGroup, setBloodGroup] = useState(initialProfile.bloodGroup || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const updated = await ApiService.updateProfile({
        fullName: fullName.trim(),
        dob,
        gender: gender as any,
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        bloodGroup,
      });
      onFinishOnboarding(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onFinishOnboarding(initialProfile);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 py-8 animate-fadeIn">
      <div className="text-center space-y-2 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
          <span className="material-symbols-outlined text-[30px]">person_add</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set up your Profile</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Add your basic information to complete your clinical record header. You can edit this anytime.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">error</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition cursor-pointer"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Blood Group <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition cursor-pointer"
            >
              <option value="">Select Blood Group (if known)</option>
              <option value="A+ Positive">A+ Positive</option>
              <option value="A- Negative">A- Negative</option>
              <option value="B+ Positive">B+ Positive</option>
              <option value="B- Negative">B- Negative</option>
              <option value="O+ Positive">O+ Positive</option>
              <option value="O- Negative">O- Negative</option>
              <option value="AB+ Positive">AB+ Positive</option>
              <option value="AB- Negative">AB- Negative</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Emergency Contact <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Contact Name"
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="Contact Phone"
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Enter Dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full h-10 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Skip for now &amp; go to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
