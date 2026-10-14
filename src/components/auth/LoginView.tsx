import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import {
  signInWithGoogle,
  signInWithEmailAndPassword,
  getRememberedUser,
  syncFirebaseUserWithApp,
  RememberedUser,
} from '../../services/auth';
import { AuthUser, UserProfile } from '../../types/clinical';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser, profile: UserProfile) => void;
  onNavigateToSignup: () => void;
  onEnableDemoMode: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
  onEnableDemoMode,
}) => {
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberedUser, setRememberedUserState] = useState<RememberedUser | null>(null);

  useEffect(() => {
    const remembered = getRememberedUser();
    if (remembered) {
      setRememberedUserState(remembered);
      if (remembered.email) {
        setEmail(remembered.email);
        setAuthMethod('email');
      }
      if (remembered.mobile) {
        setMobile(remembered.mobile);
      }
    }
  }, []);

  // Direct 1-click access for returning users
  const handleDirectAccess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (rememberedUser?.provider === 'google') {
        const { user: fbUser } = await signInWithGoogle();
        const synced = await syncFirebaseUserWithApp(fbUser);
        if (synced) {
          onLoginSuccess(synced.user, synced.profile);
          return;
        }
      }

      // Try current token check or direct session login
      const me = await ApiService.getMe();
      if (me?.user && me?.profile) {
        onLoginSuccess(me.user, me.profile);
        return;
      }

      // If password is required for returning email, prompt them
      if (rememberedUser?.email) {
        setAuthMethod('email');
        setEmail(rememberedUser.email);
        setErrorMessage('Welcome back! Please enter your password to directly access your records.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Direct access session expired. Please log in again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user: fbUser } = await signInWithGoogle();
      const synced = await syncFirebaseUserWithApp(fbUser);
      if (synced) {
        onLoginSuccess(synced.user, synced.profile);
      } else {
        throw new Error('Could not synchronize profile.');
      }
    } catch (err: any) {
      // In restricted iframe environments, provide informative message
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Google Sign-In popup was blocked by the browser. Please allow popups or use Email/Mobile login.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please try again.');
      } else {
        setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit for Mobile or Email login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsLoading(true);
    try {
      if (authMethod === 'email') {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }
        // First authenticate with Firebase Auth
        let fbSynced: { user: AuthUser; profile: UserProfile } | null = null;
        try {
          const cred = await signInWithEmailAndPassword(email.trim(), password);
          fbSynced = await syncFirebaseUserWithApp(cred.user);
        } catch (fbErr: any) {
          // If Firebase account doesn't exist yet, try backend login
          console.warn('Firebase email auth note:', fbErr.code);
        }

        if (fbSynced) {
          onLoginSuccess(fbSynced.user, fbSynced.profile);
          return;
        }

        // Backend login with email identifier
        const data = await ApiService.login(email.trim(), password);
        onLoginSuccess(data.user, data.profile);
      } else {
        const cleanMobile = mobile.replace(/\D/g, '');
        if (!cleanMobile) {
          throw new Error('Please enter your 10-digit mobile number.');
        }

        // Try Firebase Auth with synthetic mobile email
        try {
          const cred = await signInWithEmailAndPassword(cleanMobile, password);
          const synced = await syncFirebaseUserWithApp(cred.user);
          if (synced) {
            onLoginSuccess(synced.user, synced.profile);
            return;
          }
        } catch {}

        const data = await ApiService.login(cleanMobile, password);
        onLoginSuccess(data.user, data.profile);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (name: string, phone: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await ApiService.devQuickLogin(name, phone);
      onLoginSuccess(data.user, data.profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto px-4 py-8 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[30px]">lock</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Log in to Take Care</h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Access your personal health records, verified documents, and doctor sharing tokens.
        </p>
      </div>

      {/* Returning User Direct Access Card (From second time - directly access) */}
      {rememberedUser && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-3xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                {(rememberedUser.name || rememberedUser.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-teal-950">
                  {rememberedUser.name || 'Returning User'}
                </p>
                <p className="text-[11px] text-teal-700 truncate max-w-[200px]">
                  {rememberedUser.email || rememberedUser.mobile || 'Previous session'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
              2nd Time Fast Track
            </span>
          </div>

          <button
            type="button"
            onClick={handleDirectAccess}
            disabled={isLoading}
            className="w-full h-10 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Directly Access My Account</span>
          </button>
        </div>
      )}

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
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or continue with</span>
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
          {authMethod === 'mobile' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number
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
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
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
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
                <span>Authenticating with Firebase...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignup}
            className="font-bold text-teal-700 hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </div>
      </div>

      {/* Developer Quick-Test Account Switcher (For Evaluation & Verification) */}
      <div className="mt-6 space-y-3">
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-teal-600 text-[18px]">bolt</span>
              Testing &amp; Evaluation Shortcuts
            </span>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
              Quick Test
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Instantly spin up fresh isolated test accounts to verify 0-data initialization and strict multi-user isolation:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('Ananya Sharma', '9811100001')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 text-left transition cursor-pointer active:scale-98"
            >
              <strong className="block text-xs text-slate-900">User A (Fresh)</strong>
              <span className="text-[10px] text-slate-500">Ananya • 0 records</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('Vikram Patel', '9811100002')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 text-left transition cursor-pointer active:scale-98"
            >
              <strong className="block text-xs text-slate-900">User B (Isolated)</strong>
              <span className="text-[10px] text-slate-500">Vikram • 0 records</span>
            </button>
          </div>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onEnableDemoMode}
              className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
            >
              Or open Fictional Demo Mode sandbox →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
