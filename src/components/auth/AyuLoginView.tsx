import React, { useState, useEffect } from 'react';
import { AyuHealthLogo } from '../common/AppLogo';
import { ChevronDown, Mail, Globe, AlertCircle, ArrowRight } from 'lucide-react';
import { ApiService } from '../../services/api';
import {
  signInWithGoogle,
  signInWithEmailAndPassword,
  getRememberedUser,
  syncFirebaseUserWithApp,
  RememberedUser,
} from '../../services/auth';
import { AuthUser, UserProfile } from '../../types/clinical';

interface AyuLoginViewProps {
  onLoginSuccess: (user: AuthUser, profile: UserProfile) => void;
  onNavigateToRegister: (phone: string) => void;
  onPhoneOtpRequired: (phone: string, devCode?: string) => void;
}

export const AyuLoginView: React.FC<AyuLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onPhoneOtpRequired,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [authMode, setAuthMode] = useState<'phone' | 'google' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberedUser, setRememberedUserState] = useState<RememberedUser | null>(null);

  useEffect(() => {
    const remembered = getRememberedUser();
    if (remembered) {
      setRememberedUserState(remembered);
      if (remembered.mobile) {
        setPhoneNumber(remembered.mobile.replace(/^\+91/, ''));
      }
      if (remembered.email) {
        setEmail(remembered.email);
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

      // Check current active session
      const me = await ApiService.getMe();
      if (me?.user && me?.profile) {
        onLoginSuccess(me.user, me.profile);
        return;
      }

      if (rememberedUser?.email) {
        setAuthMode('email');
        setErrorMessage('Welcome back! Please enter your password to directly access your records.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Direct access expired. Please enter your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Phone Number Continue
  const handleContinueWithPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const fullMobile = `${countryCode}${cleanDigits}`;
      // Request phone sign-in via backend OTP service or mock OTP
      const res = await ApiService.requestPhoneOtp(cleanDigits);
      if (res && res.requiresRegistration) {
        onNavigateToRegister(fullMobile);
      } else {
        onPhoneOtpRequired(fullMobile, res?.devCode || '123456');
      }
    } catch (err: any) {
      // If user is new or network error, proceed to registration
      onNavigateToRegister(`${countryCode}${cleanDigits}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user: fbUser } = await signInWithGoogle();
      const synced = await syncFirebaseUserWithApp(fbUser);
      if (synced) {
        onLoginSuccess(synced.user, synced.profile);
      } else {
        throw new Error('Unable to synchronize user profile.');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Google popup was blocked. Please allow popups or use phone sign-in.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please try again.');
      } else {
        setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email / Password
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user: fbUser } = await signInWithEmailAndPassword(email, password);
      const synced = await syncFirebaseUserWithApp(fbUser);
      if (synced) {
        onLoginSuccess(synced.user, synced.profile);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full animate-fadeIn select-none">
      {/* Top Branding Section (Matching Image 3) */}
      <div className="pt-6 sm:pt-10 flex flex-col items-center text-center space-y-2">
        <AyuHealthLogo size="lg" showSubtitle={true} className="items-center" />
      </div>

      {/* Returning User Fast Access Banner (2nd visit direct access) */}
      {rememberedUser && (
        <div className="my-3 p-3 bg-white/90 border border-teal-500/30 rounded-2xl shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-50 text-[#006D60] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {rememberedUser.name ? rememberedUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                Welcome back, {rememberedUser.name || 'Patient'}!
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {rememberedUser.email || rememberedUser.mobile}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDirectAccess}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#006D60] hover:bg-[#005248] text-white text-xs font-bold rounded-xl flex-shrink-0 transition cursor-pointer shadow-2xs"
          >
            {isLoading ? 'Accessing...' : 'Direct Access →'}
          </button>
        </div>
      )}

      {/* Main Bottom Form Card (Matching Image 3) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {authMode === 'phone' ? (
          <form onSubmit={handleContinueWithPhone} className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Enter your</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Phone Number</h1>
            </div>

            {/* Input Pill: +91 ⌵ | 10 Digit phone no. */}
            <div className="flex items-center bg-[#EFF1F4] rounded-2xl p-1.5 border border-transparent focus-within:border-slate-400 focus-within:bg-white transition">
              <div className="flex items-center gap-1 px-3 py-2 text-slate-800 font-bold text-sm border-r border-slate-300">
                <span>{countryCode}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10 Digit phone no."
                maxLength={10}
                className="w-full px-3 py-2 bg-transparent text-slate-900 font-medium text-sm focus:outline-none placeholder:text-slate-400"
                autoFocus
              />
            </div>

            {/* Terms & Privacy Note with Icons (Matching Image 3) */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 px-1">
              <p className="leading-tight">
                By continuing you agree to our{' '}
                <span className="text-slate-800 font-semibold underline cursor-pointer">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-slate-800 font-semibold underline cursor-pointer">
                  Privacy Policy
                </span>
                .
              </p>
              <div className="flex items-center gap-2 text-slate-400 flex-shrink-0 ml-3">
                <Mail className="w-4 h-4" />
                <Globe className="w-4 h-4" />
              </div>
            </div>

            {/* Continue Button (Matching Image 3) */}
            <button
              type="submit"
              disabled={isLoading || phoneNumber.length < 10}
              className="w-full py-3.5 bg-[#52525B] hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Sending OTP...</span>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
        ) : (
          /* Alternative Email Mode */
          <form onSubmit={handleEmailSignIn} className="space-y-3.5">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 block">Sign in with</span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Email & Password</h1>
            </div>

            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3.5 py-2.5 bg-[#EFF1F4] rounded-2xl text-slate-900 font-medium text-sm focus:outline-none focus:bg-white focus:border focus:border-slate-400"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 bg-[#EFF1F4] rounded-2xl text-slate-900 font-medium text-sm focus:outline-none focus:bg-white focus:border focus:border-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#52525B] hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition shadow-md cursor-pointer"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Alternate Auth Options */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex-1 py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setAuthMode((prev) => (prev === 'phone' ? 'email' : 'phone'));
            }}
            className="py-2 px-3 text-slate-600 hover:text-slate-900 font-semibold transition cursor-pointer"
          >
            {authMode === 'phone' ? 'Use Email' : 'Use Phone'}
          </button>
        </div>
      </div>
    </div>
  );
};
