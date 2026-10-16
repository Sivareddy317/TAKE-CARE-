import React, { useState } from 'react';
import { ArrowLeft, Mail, Globe, AlertCircle, ChevronDown } from 'lucide-react';

interface AyuRegisterViewProps {
  initialMobile: string;
  onContinue: (data: { firstName: string; lastName: string; dob: string; gender: string }) => void;
  onBack: () => void;
}

export const AyuRegisterView: React.FC<AyuRegisterViewProps> = ({
  initialMobile,
  onContinue,
  onBack,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('Apr');
  const [year, setYear] = useState('2006');
  const [gender, setGender] = useState('Male');
  const [error, setError] = useState<string | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!day || parseInt(day) < 1 || parseInt(day) > 31) {
      setError('Please enter a valid day for date of birth');
      return;
    }

    onContinue({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob: `${day} ${month} ${year}`,
      gender,
    });
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Top Bar with "Register" and icons (Image 8) */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Register</h2>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <Mail className="w-4 h-4" />
          <Globe className="w-4 h-4" />
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="my-auto py-6 space-y-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Welcome to Take Care!
        </h1>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
              placeholder="Enter your first name"
              className="w-full px-4 py-3 bg-[#EFF1F4] rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 block">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              className="w-full px-4 py-3 bg-[#EFF1F4] rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition"
            />
          </div>

          {/* Date of Birth & Gender Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* DOB: Day, Month, Year */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                Date of Birth *
              </label>
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  placeholder="DD"
                  className="w-full px-2 py-3 bg-[#EFF1F4] rounded-2xl text-center text-slate-900 font-semibold text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition"
                  required
                />
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-1 py-3 bg-[#EFF1F4] rounded-2xl text-center text-slate-900 font-semibold text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition appearance-none cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1920"
                  max="2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="YYYY"
                  className="w-full px-1 py-3 bg-[#EFF1F4] rounded-2xl text-center text-slate-900 font-semibold text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 transition"
                  required
                />
              </div>
            </div>

            {/* Gender Dropdown */}
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
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="pt-4">
        <button
          type="submit"
          form="register-form"
          className="w-full py-4 bg-[#006D60] hover:bg-[#005248] active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue</span>
        </button>
      </div>
    </div>
  );
};
