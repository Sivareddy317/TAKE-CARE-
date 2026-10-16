import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  KeyRound,
  FileText,
  Activity,
  Pill,
  HeartHandshake,
  AlertTriangle,
  Calendar,
  Phone,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Info,
  Check,
  UserCheck,
  Share2,
  Copy,
} from 'lucide-react';
import {
  FamilyMember,
  FamilyRelationship,
  FamilyPermissionLevel,
  UserProfile,
  ProcessedDocument,
  FamilyAccessAuditLog,
} from '../../types/clinical';
import { ApiService } from '../../services/api';

interface FamilyDashboardProps {
  currentUserProfile?: UserProfile | null;
  onNavigateBack: () => void;
  onSelectDocument?: (doc: ProcessedDocument) => void;
}

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  currentUserProfile,
  onNavigateBack,
  onSelectDocument,
}) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [sharedProfiles, setSharedProfiles] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<FamilyAccessAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageAccessModal, setShowManageAccessModal] = useState(false);
  const [showAcceptInviteModal, setShowAcceptInviteModal] = useState(false);
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Selected Profile View (Separate Medical Records)
  const [activeViewingProfileId, setActiveViewingProfileId] = useState<string | null>(null);
  const [viewingProfileData, setViewingProfileData] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Add Member Form State
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState<FamilyRelationship>('Parent');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState(currentUserProfile?.fullName || '');
  const [guardianConsentGiven, setGuardianConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Access State
  const [targetPermissionLevel, setTargetPermissionLevel] = useState<FamilyPermissionLevel>('complete');
  const [accessDuration, setAccessDuration] = useState<'30d' | '90d' | '1y' | 'permanent'>('permanent');

  // Accept Invite Code
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Active Invite / WhatsApp sharing transient state
  const [lastCreatedInvite, setLastCreatedInvite] = useState<{ code: string; name: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const shareViaWhatsApp = (code: string, name: string) => {
    const text = encodeURIComponent(
      `🏥 *Take Care - Family Health Profile Invitation*\n\n` +
      `Hi ${name}! I have invited you to connect your health profile securely on Take Care.\n\n` +
      `🔑 *Your Invitation Code:* ${code}\n\n` +
      `📲 *How to accept on your phone:*\n` +
      `1. Open the Take Care app\n` +
      `2. Tap top-right menu ➔ *Family*\n` +
      `3. Tap *'Enter Invite Code'* and enter: *${code}*\n\n` +
      `Once verified, our health profiles will be securely connected!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {}
  };

  const loadData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.getFamilyMembers();
      if (res && res.success) {
        setMembers(res.members || []);
        setSharedProfiles(res.sharedProfiles || []);
      }
      const auditRes = await ApiService.getFamilyAuditLogs();
      if (auditRes && auditRes.success) {
        setAuditLogs(auditRes.logs || []);
      }
    } catch (err: any) {
      if (showLoading) setErrorMsg('Failed to load family health profiles.');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Real-time synchronization: Polls every 3.5 seconds so 2 phones update automatically
  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 3500);

    // Check for invite query param in URL
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('invite') || params.get('code');
      if (code) {
        setInviteCodeInput(code.toUpperCase());
        setShowAcceptInviteModal(true);
      }
    } catch {}

    return () => clearInterval(interval);
  }, []);

  // When relationship changes to Child, automatically enable minor handling
  useEffect(() => {
    if (relationship === 'Child') {
      setIsMinor(true);
    }
  }, [relationship]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter the full name.');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (isMinor && !guardianConsentGiven) {
      setErrorMsg('Legal guardian consent is required to register a minor profile.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiService.inviteFamilyMember({
        fullName: fullName.trim(),
        relationship,
        mobile: cleanMobile,
        dob: dob || undefined,
        isMinor,
        guardianName: isMinor ? (guardianName.trim() || currentUserProfile?.fullName || 'Legal Guardian') : undefined,
        guardianConsentGiven: isMinor ? guardianConsentGiven : undefined,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Family member invited successfully!');
        if (res.invitationCode) {
          setLastCreatedInvite({ code: res.invitationCode, name: fullName.trim() });
        }
        setShowAddModal(false);
        // Reset form
        setFullName('');
        setMobile('');
        setDob('');
        setIsMinor(false);
        setGuardianConsentGiven(false);
        await loadData(false);
      } else {
        setErrorMsg(res.error || 'Could not add family member.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenManageAccess = (member: FamilyMember) => {
    setSelectedMember(member);
    setTargetPermissionLevel(member.permissionLevel === 'none' ? 'complete' : member.permissionLevel);
    setShowManageAccessModal(true);
  };

  const handleGrantAccess = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.grantFamilyAccess(
        selectedMember.id,
        targetPermissionLevel,
        accessDuration === 'permanent' ? undefined : accessDuration
      );
      if (res.success) {
        setSuccessMsg(res.message || 'Access permissions updated successfully.');
        setShowManageAccessModal(false);
        await loadData();
      } else {
        setErrorMsg(res.error || 'Failed to update permissions.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error updating permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to revoke health record access for this family member?')) {
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.revokeFamilyAccess(memberId);
      if (res.success) {
        setSuccessMsg('Access has been immediately revoked on the server.');
        setShowManageAccessModal(false);
        await loadData();
        if (activeViewingProfileId === memberId) {
          setActiveViewingProfileId(null);
          setViewingProfileData(null);
        }
      } else {
        setErrorMsg(res.error || 'Failed to revoke access.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error revoking access.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Remove this family member from your list?')) return;
    try {
      const res = await ApiService.deleteFamilyMember(memberId);
      if (res.success) {
        setSuccessMsg('Family member removed.');
        await loadData();
      }
    } catch {}
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await ApiService.acceptFamilyInvite(inviteCodeInput.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'Family invite accepted with verified consent!');
        setShowAcceptInviteModal(false);
        setInviteCodeInput('');
        await loadData();
      } else {
        setErrorMsg(res.error || 'Invalid or expired invitation code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error accepting invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open dedicated health summary for a specific profile (Owner or Authorized family member)
  const handleViewProfileRecords = async (memberId: string) => {
    setIsLoadingProfile(true);
    setActiveViewingProfileId(memberId);
    setViewingProfileData(null);
    setErrorMsg(null);

    try {
      const data = await ApiService.getFamilyProfileSummary(memberId);
      if (data.success) {
        setViewingProfileData(data);
      } else {
        setErrorMsg(data.error || 'Access Denied: You do not have permission to view this profile.');
        setActiveViewingProfileId(null);
      }
    } catch (err: any) {
      setErrorMsg('Failed to securely fetch profile medical records.');
      setActiveViewingProfileId(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // ==========================================
  // RENDER: SPECIFIC PROFILE RECORDS VIEW
  // ==========================================
  if (activeViewingProfileId && viewingProfileData) {
    const isEmergency = viewingProfileData.isEmergencyOnly;
    const profile = viewingProfileData.profile;
    const documents: ProcessedDocument[] = viewingProfileData.documents || [];
    const summary = viewingProfileData.summary;

    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
        {/* Navigation & Context Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => {
              setActiveViewingProfileId(null);
              setViewingProfileData(null);
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-[#006D60] bg-teal-50 hover:bg-teal-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Family Profiles</span>
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isEmergency
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isEmergency ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{isEmergency ? 'Emergency Summary View' : 'Complete Health Summary'}</span>
            </span>
          </div>
        </div>

        {/* Profile Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#006D60] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {(profile?.fullName || 'F').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{profile?.fullName || 'Family Member'}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {activeViewingProfileId === 'self' ? 'Primary Owner' : 'Family Record'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                {profile?.mobile && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    +91 {profile.mobile}
                  </span>
                )}
                {profile?.dob && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    DOB: {profile.dob}
                  </span>
                )}
                {profile?.bloodGroup && (
                  <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    Blood Group: {profile.bloodGroup}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Permission Scope</p>
            <p className="text-xs font-bold text-slate-800">
              {isEmergency ? 'Emergency Restricted' : 'Full Permitted Summary'}
            </p>
            {viewingProfileData.expiresAt && (
              <p className="text-[11px] text-amber-700 mt-0.5">
                Expires: {new Date(viewingProfileData.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Emergency Access Restriction Notice */}
        {isEmergency && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authorized Emergency View Only</p>
              <p className="text-amber-800 mt-0.5">
                In accordance with the profile owner's consent settings, sensitive lab documents and detailed clinical notes
                are protected. This view includes only verified life-safety essentials: confirmed allergies, active medications,
                major conditions, and emergency contacts.
              </p>
            </div>
          </div>
        )}

        {/* Emergency Summary Data Display */}
        {isEmergency && summary && (
          <div className="space-y-4">
            {/* Allergies Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Documented Allergies</h3>
                <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                  {summary.allergies?.length || 0}
                </span>
              </div>
              {summary.allergies && summary.allergies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {summary.allergies.map((allergy: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs">
                      <p className="font-bold text-rose-900">{allergy.name}</p>
                      {allergy.details && <p className="text-rose-700 mt-0.5">{allergy.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No adverse allergies documented in verified records.</p>
              )}
            </div>

            {/* Active Medications Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-[#006D60]" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Confirmed Current Medications</h3>
                <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                  {summary.medications?.length || 0}
                </span>
              </div>
              {summary.medications && summary.medications.length > 0 ? (
                <div className="space-y-2">
                  {summary.medications.map((med: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{med.name}</p>
                        <p className="text-slate-600 mt-0.5">{med.details || 'Dosage as prescribed'}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-teal-100 text-[#006D60] font-semibold text-[10px]">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No confirmed active medications documented.</p>
              )}
            </div>

            {/* Major Medical Conditions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Major Documented Conditions</h3>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  {summary.conditions?.length || 0}
                </span>
              </div>
              {summary.conditions && summary.conditions.length > 0 ? (
                <div className="space-y-2">
                  {summary.conditions.map((cond: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
                      <p className="font-bold text-slate-900">{cond.name}</p>
                      {cond.details && <p className="text-slate-600 mt-0.5">{cond.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No chronic or major conditions documented.</p>
              )}
            </div>

            {/* Emergency Contact */}
            {summary.emergencyContact && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Designated Emergency Contact</h3>
                </div>
                <p className="text-sm font-semibold text-slate-800">{summary.emergencyContact}</p>
              </div>
            )}
          </div>
        )}

        {/* Complete Health Summary View */}
        {!isEmergency && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Permitted Medical Records</h3>
                  <p className="text-xs text-slate-500">
                    Showing all {documents.length} verified documents belonging exclusively to this profile.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-[#006D60] border border-teal-200">
                  {documents.length} Records
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No medical records uploaded for this profile yet.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    When health records or lab reports are scanned and confirmed, they will appear here securely.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => onSelectDocument && onSelectDocument(doc)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-[#006D60] hover:shadow-xs transition bg-slate-50/50 hover:bg-white flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-[#006D60] flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{doc.filename}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>{doc.category || 'Clinical Document'}</span>
                            <span>•</span>
                            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{doc.status}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN FAMILY DASHBOARD
  // ==========================================
  const primaryOwnerName = currentUserProfile?.fullName || 'My Profile';
  const primaryOwnerMobile = currentUserProfile?.mobile || '';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-100/70 text-[#006D60] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Family Health Profiles</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage your family's health information securely, with permission.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadData(true);
            }}
            title="Refresh real-time family status"
            className="px-3 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Live Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditLogsModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAcceptInviteModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Enter Invite Code</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#006D60] hover:bg-[#005a50] shadow-xs active:scale-[0.98] transition cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Family Member</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Invite Ready Banner */}
      {lastCreatedInvite && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-slate-800 text-xs shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <p className="font-bold text-emerald-950 text-sm">
                Invitation Ready for {lastCreatedInvite.name}
              </p>
            </div>
            <p className="text-slate-600">
              Share the code with them so they can accept on their mobile phone in real time.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 font-bold text-sm tracking-wider text-emerald-900">
                {lastCreatedInvite.code}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(lastCreatedInvite.code)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCode === lastCreatedInvite.code ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => shareViaWhatsApp(lastCreatedInvite.code, lastCreatedInvite.name)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs active:scale-[0.98] transition cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setLastCreatedInvite(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* My Profile Card */}
      <div className="bg-gradient-to-r from-teal-900 to-[#006D60] text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center font-black text-xl">
            {primaryOwnerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{primaryOwnerName}</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 border border-teal-400/30">
                My Profile (Owner)
              </span>
            </div>
            <p className="text-xs text-teal-100 mt-0.5">
              Primary Account Holder {primaryOwnerMobile && `• +91 ${primaryOwnerMobile}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleViewProfileRecords('self')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#006D60] bg-white hover:bg-teal-50 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>View My Records</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Family Members Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Family Members</h2>
            <p className="text-xs text-slate-500">Profiles linked to your Take Care health network.</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {members.length} {members.length === 1 ? 'Member' : 'Members'}
          </span>
        </div>

        {/* Empty State for New Users */}
        {members.length === 0 && sharedProfiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#006D60] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-900">No family members added yet.</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Add your parents, children, or spouse to securely organize and share health profiles.
                Medical record access is never granted automatically and requires explicit owner authorization.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#006D60] hover:bg-[#005a50] shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Your First Family Member</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => {
              const hasAccess = member.permissionLevel !== 'none' && member.status === 'active';
              const isChild = member.isMinor || member.relationship === 'Child';

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 p-4 shadow-xs transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{member.fullName}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {member.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          +91 {member.mobile} {member.dob && `• DOB: ${member.dob}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member.id)}
                      title="Remove member"
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Badges & Info */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      {member.status === 'pending_consent' ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Consent</span>
                            {member.invitationCode && (
                              <span className="font-mono text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
                                Code: {member.invitationCode}
                              </span>
                            )}
                          </div>
                          {member.invitationCode && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => shareViaWhatsApp(member.invitationCode!, member.fullName)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-[0.98] cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share on WhatsApp</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(member.invitationCode!)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedCode === member.invitationCode ? 'Copied!' : 'Copy Code'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : member.status === 'revoked' ? (
                        <span className="flex items-center gap-1 text-rose-700 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Access Revoked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {member.permissionLevel === 'complete'
                            ? 'Complete Summary Access'
                            : member.permissionLevel === 'emergency'
                            ? 'Emergency Access Only'
                            : 'Access Not Configured'}
                        </span>
                      )}
                    </div>

                    {isChild && (
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        Guardian Authorized
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenManageAccess(member)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Manage Access</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleViewProfileRecords(member.id)}
                      disabled={!hasAccess}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        hasAccess
                          ? 'bg-[#006D60] hover:bg-[#005a50] text-white cursor-pointer active:scale-[0.98]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>View Records</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shared Profiles (Profiles shared with the current user by family members) */}
      {sharedProfiles.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Profiles Shared With You</h2>
            <p className="text-xs text-slate-500">
              Family members who have granted you permission to view their health records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedProfiles.map((shared) => (
              <div
                key={shared.id}
                className="bg-white rounded-2xl border border-teal-200 p-4 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-100 text-[#006D60] flex items-center justify-center font-bold">
                    {(shared.ownerName || 'F').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{shared.ownerName}</h4>
                    <p className="text-xs text-slate-500">
                      Scope: <span className="font-semibold text-teal-800 uppercase">{shared.permissionLevel}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleViewProfileRecords(shared.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#006D60] hover:bg-[#005a50] transition cursor-pointer flex items-center gap-1"
                >
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD FAMILY MEMBER
      ========================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#006D60]" />
                <h3 className="font-black text-slate-900 text-base">Add Family Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#006D60] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Relationship *</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as FamilyRelationship)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#006D60] font-medium bg-white"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#006D60] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#006D60] font-medium bg-white"
                />
              </div>

              {/* Minor / Guardian Consent Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    className="w-4 h-4 rounded text-[#006D60] focus:ring-teal-500"
                  />
                  <span>This person is a minor or dependent child</span>
                </label>

                {isMinor && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Legal Guardian Name</label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="Guardian full name"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer text-slate-700 pt-1">
                      <input
                        type="checkbox"
                        required
                        checked={guardianConsentGiven}
                        onChange={(e) => setGuardianConsentGiven(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-[#006D60] focus:ring-teal-500"
                      />
                      <span className="leading-tight">
                        I certify that I am the legal guardian authorized to manage health records on behalf of this minor.
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-[11px] leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Consent Policy
                </p>
                For adult family members, medical records are not accessible until the recipient accepts the invitation
                and provides identity verification.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#006D60] hover:bg-[#005a50] shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: MANAGE ACCESS / PERMISSIONS
      ========================================== */}
      {showManageAccessModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#006D60]" />
                <h3 className="font-black text-slate-900 text-base">
                  Manage Access: {selectedMember.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManageAccessModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Choose the scope of health records authorized for{' '}
                <strong className="text-slate-900">{selectedMember.fullName}</strong>. You can change or revoke access at any time.
              </p>

              {/* Permission Level Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Access Level</label>

                {/* Option 1: Complete Health Summary */}
                <div
                  onClick={() => setTargetPermissionLevel('complete')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    targetPermissionLevel === 'complete'
                      ? 'border-[#006D60] bg-teal-50/60 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                      targetPermissionLevel === 'complete'
                        ? 'border-[#006D60] bg-[#006D60] text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {targetPermissionLevel === 'complete' && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Complete Health Summary</p>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                      Authorizes access to all permitted sections: conditions, allergies, medications, lab results,
                      imaging reports, procedures, medical history, and clinical documents.
                    </p>
                  </div>
                </div>

                {/* Option 2: Emergency Summary */}
                <div
                  onClick={() => setTargetPermissionLevel('emergency')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    targetPermissionLevel === 'emergency'
                      ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
                      targetPermissionLevel === 'emergency'
                        ? 'border-amber-600 bg-amber-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {targetPermissionLevel === 'emergency' && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Emergency Summary Only</p>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                      Restricted to essential life-safety data: documented allergies, confirmed active medications,
                      major conditions, and emergency contacts. Clinical documents and lab files remain confidential.
                    </p>
                  </div>
                </div>
              </div>

              {/* Expiry / Duration Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Access Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['30d', '90d', '1y', 'permanent'] as const).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setAccessDuration(dur)}
                      className={`py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                        accessDuration === dur
                          ? 'border-[#006D60] bg-teal-50 text-[#006D60]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {dur === '30d' ? '30 Days' : dur === '90d' ? '90 Days' : dur === '1y' ? '1 Year' : 'Permanent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleRevokeAccess(selectedMember.id)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Revoke Access</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManageAccessModal(false)}
                    className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGrantAccess}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl font-bold text-white bg-[#006D60] hover:bg-[#005a50] shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ACCEPT INVITATION CODE
      ========================================== */}
      {showAcceptInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#006D60]" />
                <h3 className="font-black text-slate-900 text-base">Enter Invitation Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAcceptInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAcceptInvite} className="space-y-3.5 text-xs">
              <p className="text-slate-600">
                Enter the 6-character code provided by your family member to connect profiles and approve consent.
              </p>

              <div>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAM-849201"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#006D60] font-mono text-center text-sm font-bold tracking-widest uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAcceptInviteModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#006D60] hover:bg-[#005a50] shadow-xs cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: AUDIT TRAIL LOGS
      ========================================== */}
      {showAuditLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#006D60]" />
                <h3 className="font-black text-slate-900 text-base">Security &amp; Access Audit Trail</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditLogsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Every viewing event, permission grant, consent verification, and revocation is recorded for compliance.
            </p>

            <div className="space-y-2.5">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No audit records logged yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 capitalize">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                      <span>Actor: {log.actorName}</span>
                      <span>•</span>
                      <span>Target: {log.targetProfileName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowAuditLogsModal(false)}
                className="px-4 py-2 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
