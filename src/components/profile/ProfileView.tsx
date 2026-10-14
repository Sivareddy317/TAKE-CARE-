import React from 'react';
import { UserProfile } from '../../types/clinical';

interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onEdit, onBack }) => {
  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Profile</h1>
            <p className="text-xs text-slate-500">Your personal details and emergency contacts.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-teal-50 border-2 border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xl flex-shrink-0">
            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {profile.fullName || 'Name Not Provided'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-mono text-[11px]">+91 {profile.mobile}</span>
              {profile.isMobileVerified ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <span className="material-symbols-outlined text-[12px]">verified</span> Verified
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">Unverified</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion Indicator */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">
              {profile.isComplete ? 'check_circle' : 'pending'}
            </span>
            <span className="font-medium text-slate-700">
              Profile Status: {profile.isComplete ? 'Complete' : 'Incomplete (Optional fields remaining)'}
            </span>
          </div>
          {!profile.isComplete && (
            <button
              onClick={onEdit}
              className="text-teal-700 font-bold hover:underline cursor-pointer text-xs"
            >
              Complete Now
            </button>
          )}
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Date of Birth</span>
            <span className="font-semibold text-slate-900 mt-0.5 block truncate">
              {profile.dob || 'Not provided'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Gender</span>
            <span className="font-semibold text-slate-900 mt-0.5 block truncate">
              {profile.gender || 'Not specified'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Blood Group</span>
            <span className="font-semibold text-slate-900 mt-0.5 block truncate">
              {profile.bloodGroup || 'Not documented'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Language</span>
            <span className="font-semibold text-slate-900 mt-0.5 block truncate">
              {profile.preferredLanguage || 'English'}
            </span>
          </div>
        </div>

        {/* Contact & Emergency Details */}
        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Contact &amp; Emergency</h3>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Email Address:</span>
              <span className="font-medium text-slate-800">{profile.email || 'None added'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Emergency Contact:</span>
              <span className="font-medium text-slate-800">
                {profile.emergencyContactName
                  ? `${profile.emergencyContactName} (${profile.emergencyContactPhone || 'No phone'})`
                  : 'Not provided'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
