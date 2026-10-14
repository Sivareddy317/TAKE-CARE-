import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import {
  signInWithGoogle,
  createUserWithEmailAndPassword,
  syncFirebaseUserWithApp,
} from '../../services/auth';
import { AuthUser, UserProfile } from '../../types/clinical';

interface SignupViewProps {
  onSignupSuccess: (mobile: string, devCode?: string) => void;
  onDirectLoginSuccess?: (user: AuthUser, profile: UserProfile) => void;
  onNavigateToLogin: () => void;
  onEnableDemoMode: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({
  onSignupSuccess,
  onDirectLoginSuccess,
  onNavigateToLogin,
  onEnableDemoMode,
}) => {
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google Continue
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user: fbUser } = await signInWithGoogle();
      const synced = await syncFirebaseUserWithApp(fbUser);
      if (synced && onDirectLoginSuccess) {
        onDirectLoginSuccess(synced.user, synced.profile);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Google popup was blocked. Please allow popups or use Email/Mobile registration.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Registration cancelled.');
      } else {
        setErrorMessage(err.message || 'Google account creation failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMethod === 'email') {
        if (!email.trim() || !email.includes('@')) {
          setErrorMessage('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }

        // 1. Create user in Firebase Auth
        let fbSynced: { user: AuthUser; profile: UserProfile } | null = null;
        try {
          const cred = await createUserWithEmailAndPassword(email.trim(), password, fullName.trim());
          fbSynced = await syncFirebaseUserWithApp(cred.user);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error('An account with this email already exists. Please log in.');
          }
          console.warn('Firebase user creation note:', fbErr.message);
        }

        if (fbSynced && onDirectLoginSuccess) {
          onDirectLoginSuccess(fbSynced.user, fbSynced.profile);
          return;
        }

        // 2. Also register in backend
        const data = await ApiService.register(email.trim(), password, fullName.trim());
        if (data.devVerificationCode) {
          onSignupSuccess(email.trim(), data.devVerificationCode);
        } else {
          onNavigateToLogin();
        }
      } else {
        const cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length < 10) {
          setErrorMessage('Please enter a valid 10-digit mobile number.');
          setIsLoading(false);
          return;
        }

        const data = await ApiService.register(cleanMobile, password, fullName.trim());
        onSignupSuccess(cleanMobile, data.devVerificationCode);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 py-8 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[30px]">local_hospital</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create your Take Care account</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Start with a clean, private health repository. Only your verified documents will build your profile.
        </p>
      </div>

      {/* Main Signup Form Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">error</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Google Continue Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2.5 transition cursor-pointer active:scale-[0.99] shadow-2xs disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or sign up with</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Method Toggle: Mobile vs Email */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setAuthMethod('mobile')}
            className={`h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
              authMethod === 'mobile'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mobile Number
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('email')}
            className={`h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
              authMethod === 'email'
                ? 'bg-white text-teal-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Email Address
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          {authMethod === 'mobile' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full h-11 pl-12 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Used for verification code.</p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || (!mobile && !email) || !password}
            className="w-full h-12 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span>Creating Firebase Account...</span>
              </>
            ) : (
              <>
                <span>{authMethod === 'email' ? 'Create Account' : 'Continue to Verification'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="font-bold text-teal-700 hover:underline cursor-pointer"
          >
            Log in
          </button>
        </div>
      </div>

      {/* Opt-in Demo Mode shortcut */}
      <div className="mt-6 text-center">
        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">science</span>
            <span>Just evaluating Take Care?</span>
          </div>
          <p className="text-[11px] text-slate-500">
            You can launch an isolated Demo Sandbox using fictional clinical records without registering.
          </p>
          <button
            type="button"
            onClick={onEnableDemoMode}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 cursor-pointer"
          >
            Launch Fictional Demo Mode →
          </button>
        </div>
      </div>
    </div>
  );
};
