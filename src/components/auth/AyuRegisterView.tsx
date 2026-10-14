import React, { useState } from 'react';

interface AyuRegisterViewProps {
  initialMobile?: string;
  onContinue: (data: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
  }) => void;
  onBack: () => void;
}

export const AyuRegisterView: React.FC<AyuRegisterViewProps> = ({
  initialMobile,
  onContinue,
  onBack,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First Name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last Name is required');
      return;
    }
    if (!dob.trim()) {
      setError('Date Of Birth is required');
      return;
    }
    if (!gender) {
      setError('Please select your Gender');
      return;
    }

    setError(null);
    onContinue({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob: dob.trim(),
      gender,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none">
      {/* Top Bar with "Register" and icons (Image 8) */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Register</h2>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined text-[20px]">mail</span>
          <span className="material-symbols-outlined text-[20px]">language</span>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="my-auto py-6 space-y-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Welcome to Ayu!
        </h1>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} id="register-form" className="space-y-4">
          {/* First Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className="w-full px-4 py-3 bg-[#EFF1F4] rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition"
              required
              autoFocus
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Last Name *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              className="w-full px-4 py-3 bg-[#EFF1F4] rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition"
              required
            />
          </div>

          {/* DOB and Gender side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                Date Of Birth *
              </label>
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="e.g. 1 Apr 2006"
                className="w-full px-3 py-3 bg-[#EFF1F4] rounded-2xl text-slate-900 font-semibold text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                Gender *
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-3 bg-[#EFF1F4] rounded-2xl text-slate-900 font-semibold text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition appearance-none cursor-pointer pr-8"
                  required
                >
                  <option value="" disabled>Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-slate-500 absolute right-2.5 top-3 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Sticky Action Button (Image 8) */}
      <div className="pt-4">
        <button
          type="submit"
          form="register-form"
          className="w-full py-4 bg-[#27272A] hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue</span>
        </button>
      </div>
    </div>
  );
};
