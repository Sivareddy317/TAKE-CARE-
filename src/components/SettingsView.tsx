import React, { useState, useEffect } from 'react';
import { UserProfile, AppPermissionsStatus } from '../types/clinical';
import { ApiService } from '../services/api';
import { checkFirestoreConnection } from '../services/firebase';

interface SettingsViewProps {
  profile: UserProfile;
  isDemoMode: boolean;
  onNavigateToProfile: () => void;
  onNavigateToProfileEdit: () => void;
  onToggleDemoMode: () => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  isDemoMode,
  onNavigateToProfile,
  onNavigateToProfileEdit,
  onToggleDemoMode,
  onLogout,
  onAccountDeleted,
}) => {
  const [permissions, setPermissions] = useState<AppPermissionsStatus & { microphone?: string }>({
    camera: 'prompt',
    notifications: 'default',
    microphone: 'prompt',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check actual browser permissions on mount
  useEffect(() => {
    async function checkBrowserPermissions() {
      // 1. Camera permission check using standard browser Navigator Permissions API
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cameraStatus = await navigator.permissions.query({ name: 'camera' as any });
          setPermissions((prev) => ({ ...prev, camera: cameraStatus.state as any }));
          cameraStatus.onchange = () => {
            setPermissions((prev) => ({ ...prev, camera: cameraStatus.state as any }));
          };
        } catch {
          setPermissions((prev) => ({ ...prev, camera: 'prompt' }));
        }

        // 2. Microphone permission check
        try {
          const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
          setPermissions((prev) => ({ ...prev, microphone: micStatus.state as any }));
          micStatus.onchange = () => {
            setPermissions((prev) => ({ ...prev, microphone: micStatus.state as any }));
          };
        } catch {
          setPermissions((prev) => ({ ...prev, microphone: 'prompt' }));
        }

        // 3. Notifications permission check
        try {
          if ('Notification' in window) {
            setPermissions((prev) => ({
              ...prev,
              notifications: Notification.permission as any,
            }));
            setNotificationsEnabled(Notification.permission === 'granted');
          }
        } catch {}
      }

      // Verify actual Firestore connectivity
      try {
        const isLive = await checkFirestoreConnection();
        setFirestoreStatus(isLive ? 'connected' : 'offline');
      } catch {
        setFirestoreStatus('offline');
      }
    }

    checkBrowserPermissions();
  }, []);

  // Request notifications permission strictly on user toggle (Principle of least privilege)
  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(!notificationsEnabled);
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissions((prev) => ({ ...prev, notifications: result as any }));
      setNotificationsEnabled(result === 'granted');
    } catch {
      // User dismissed prompt
    }
  };

  // Test Camera Permission on demand
  const handleTestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop stream immediately
      stream.getTracks().forEach((track) => track.stop());
      setPermissions((prev) => ({ ...prev, camera: 'granted' }));
      alert('Camera access verified and granted.');
    } catch {
      setPermissions((prev) => ({ ...prev, camera: 'denied' }));
      alert('Camera access was denied or no camera device is connected.');
    }
  };

  // Test Microphone Permission on demand
  const handleTestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissions((prev) => ({ ...prev, microphone: 'granted' }));
      alert('Microphone access verified and granted.');
    } catch {
      setPermissions((prev) => ({ ...prev, microphone: 'denied' }));
      alert('Microphone access was denied or no microphone device is connected.');
    }
  };

  // Account deletion handler (Permanent backend wipe)
  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      setErrorMessage('Please type DELETE to confirm permanent account deletion.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await ApiService.deleteAccount();
      setShowDeleteModal(false);
      onAccountDeleted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-36 space-y-4 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings &amp; Privacy</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your account, data controls, and device permissions.</p>
      </div>

      {/* Profile Card Summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-teal-50 border-2 border-teal-200 text-teal-800 flex items-center justify-center font-bold text-base flex-shrink-0">
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {profile.fullName || 'Take Care Patient'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">+91 {profile.mobile}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToProfileEdit}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Permissions & Privacy Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[20px]">security</span>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Permissions &amp; Privacy
            </h2>
          </div>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            Least Privilege Enforced
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Take Care accesses device features strictly when requested by you for medical document management and health assistance.
        </p>

        {/* Permissions Table / Items */}
        <div className="space-y-2 pt-1 text-xs">
          {/* Documents Permission */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-teal-600 text-[18px]">folder_open</span>
              <div>
                <strong className="block text-slate-800">Medical Documents (Files)</strong>
                <span className="text-[10px] text-slate-400">Scoped system file picker (PDF, JPG, PNG only)</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active / Scoped
            </span>
          </div>

          {/* Camera Permission */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-teal-600 text-[18px]">photo_camera</span>
              <div>
                <strong className="block text-slate-800">Camera Access</strong>
                <span className="text-[10px] text-slate-400">Used only when you tap "Take Photo" to scan reports or visible injuries</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  permissions.camera === 'granted'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : permissions.camera === 'denied'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}
              >
                {permissions.camera === 'granted' ? 'Granted' : permissions.camera === 'denied' ? 'Denied' : 'On-Demand'}
              </span>
              <button
                type="button"
                onClick={handleTestCamera}
                className="text-[10px] text-teal-700 hover:underline font-bold cursor-pointer"
              >
                Test
              </button>
            </div>
          </div>

          {/* Microphone Permission */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-teal-600 text-[18px]">mic</span>
              <div>
                <strong className="block text-slate-800">Microphone Access</strong>
                <span className="text-[10px] text-slate-400">Used only when you speak questions to Ask Care assistant</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  permissions.microphone === 'granted'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : permissions.microphone === 'denied'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}
              >
                {permissions.microphone === 'granted' ? 'Granted' : permissions.microphone === 'denied' ? 'Denied' : 'On-Demand'}
              </span>
              <button
                type="button"
                onClick={handleTestMicrophone}
                className="text-[10px] text-teal-700 hover:underline font-bold cursor-pointer"
              >
                Test
              </button>
            </div>
          </div>

          {/* Notifications Permission */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-teal-600 text-[18px]">notifications</span>
              <div>
                <strong className="block text-slate-800">Reminders &amp; Expiry Alerts</strong>
                <span className="text-[10px] text-slate-400">Notifies when doctor access code is about to expire</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                notificationsEnabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Explicit Unrequested Permissions as required */}
          <div className="p-2.5 rounded-xl bg-slate-50/60 border border-slate-200/60 flex items-center justify-between opacity-85">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">location_off</span>
              <div>
                <strong className="block text-slate-700">Location, Contacts, Phone Calls &amp; SMS</strong>
                <span className="text-[10px] text-slate-400">Strictly never requested or accessed by Take Care</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Not Requested
            </span>
          </div>
        </div>
      </div>

      {/* Cloud Sync & Firebase Database Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[20px]">cloud_done</span>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Storage &amp; Sync Engine
            </h2>
          </div>
          {firestoreStatus === 'connected' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Firestore Verified
            </span>
          ) : firestoreStatus === 'checking' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
              Checking status...
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              Encrypted Local Storage (Active)
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {firestoreStatus === 'connected'
            ? 'Your profile, health records, and sharing codes are synchronized with Cloud Firestore and secured by user-isolated rules.'
            : 'Your data is securely stored on this device in encrypted local storage. Cloud sync connects automatically when network conditions allow.'}
        </p>
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Database ID:</span>
            <span className="font-mono font-medium text-slate-700">ai-studio-takecareclinical</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Cloud Status:</span>
            <span className={`font-medium ${firestoreStatus === 'connected' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {firestoreStatus === 'connected' ? 'Verified Online' : 'Local Standalone Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Mode Sandbox Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[20px]">science</span>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Opt-in Demo Mode
            </h2>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDemoMode
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isDemoMode ? 'Demo Active' : 'Off'}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Demo Mode loads fictional patient records (prescriptions, discharge summaries, and lab reports) in an isolated sandbox for testing without uploading personal PHI.
        </p>

        <button
          type="button"
          onClick={onToggleDemoMode}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            isDemoMode
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isDemoMode ? 'toggle_on' : 'toggle_off'}
          </span>
          <span>{isDemoMode ? 'Exit Demo Mode (Return to Empty Account)' : 'Switch to Fictional Demo Mode'}</span>
        </button>
      </div>

      {/* Network & Standalone Status Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#006D60]">cloud_sync</span>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Network &amp; Sync Mode
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Standalone + Wi-Fi Sync
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Take Care operates <strong>100% standalone on-device</strong>. Document parsing, verification, single-page PDF generation, and clinical assistant run directly in this APK without needing a laptop server in the background. If your laptop is running on local Wi-Fi, it seamlessly synchronizes.
        </p>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Active Server Host:</span>
          <span className="font-mono font-bold text-[#006D60]">{ApiService.getBaseUrl() || 'On-Device Standalone'}</span>
        </div>
      </div>

      {/* Account Actions: Logout & Permanent Deletion */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Actions</h2>

        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            type="button"
            onClick={onLogout}
            className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Log Out of Account</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
            <span>Delete Account &amp; All Data</span>
          </button>
        </div>
      </div>

      {/* Prominent Footer Quotation & Badge (Part A Rule) */}
      <div className="pt-4 pb-12 flex flex-col items-center justify-center text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-[#006D60] text-xs font-bold tracking-widest uppercase shadow-2xs">
          <span className="material-symbols-outlined text-[16px] text-[#006D60]">favorite</span>
          <span>DESIGNED FOR HEALTH</span>
        </div>
        <p className="text-xs text-slate-600 italic font-medium max-w-xs px-4">
          “Take care of your body. It's the only place you have to live.”
        </p>
        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
          Take Care Digital Health • v2.4.0 Secure
        </span>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will immediately and permanently erase your account, uploaded documents, extracted medical facts, and consultation sharing tokens from the database. This action cannot be undone.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center focus:outline-none focus:border-rose-600 transition"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting || deleteConfirmationInput !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
              >
                {isDeleting ? 'Deleting All Records...' : 'Permanently Delete Everything'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                  setErrorMessage(null);
                }}
                className="w-full h-10 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
