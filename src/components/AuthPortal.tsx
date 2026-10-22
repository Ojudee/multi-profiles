import React, { useState, useEffect, useMemo } from 'react';
import {
  Organization,
  CorporateOfficial,
  WorkspaceInvitation,
  AuthSession,
  DEFAULT_HR_PERMISSIONS,
  DEFAULT_ACCOUNTS_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from '../types';
import {
  Building,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  KeyRound,
  RefreshCw,
  UserCheck,
  HelpCircle,
  ShieldAlert,
  Crown,
  Smartphone,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { verifyPassword, sha256Hex } from '../utils/security';

interface AuthPortalProps {
  organizations: Organization[];
  officials: CorporateOfficial[];
  invitations: WorkspaceInvitation[];
  activeOrg: Organization;
  onLoginSuccess: (session: AuthSession, official: CorporateOfficial, org: Organization) => void;
  onRegisterOrganization: (newOrg: Organization, adminOfficial: CorporateOfficial) => void;
  onAcceptInvitation: (invite: WorkspaceInvitation, official: CorporateOfficial) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  organizations,
  officials,
  invitations,
  activeOrg,
  onLoginSuccess,
  onRegisterOrganization,
  onAcceptInvitation,
}) => {
  // Existing single Administrator check: Only ONE administrator login permitted for the organization
  const existingAdministrator = useMemo(() => {
    return officials.find((o) => o.department === 'Administrator' && o.isActive);
  }, [officials]);

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'invite'>(() => {
    if (officials.length === 0) return 'signup';
    return 'login';
  });
  const [selectedOrgId, setSelectedOrgId] = useState<string>(activeOrg.id || 'org-univision');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign-Up Form State (New Organization / Official)
  const [signupOrgName, setSignupOrgName] = useState('');
  const [signupAdminName, setSignupAdminName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('+220 ');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupDepartment, setSignupDepartment] = useState<'Administrator' | 'HR' | 'Accounts'>(() => {
    const hasAdmin = officials.some((o) => o.department === 'Administrator' && o.isActive);
    return hasAdmin ? 'HR' : 'Administrator';
  });

  // Invitation Code Form State
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [foundInvitation, setFoundInvitation] = useState<WorkspaceInvitation | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Failed Attempts and 1-Hour Lockout State
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('univision_failed_attempts') || '0');
    } catch {
      return 0;
    }
  });
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('univision_lockout_until');
      if (stored) {
        const time = Number(stored);
        if (time > Date.now()) return time;
      }
    } catch {}
    return null;
  });
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  // Check URL params for ?invite=code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam) {
      setInviteCodeInput(inviteParam);
      setAuthMode('invite');
      const matched = invitations.find(
        (inv) => inv.inviteCode.toLowerCase() === inviteParam.trim().toLowerCase()
      );
      if (matched && matched.status === 'pending') {
        setFoundInvitation(matched);
      }
    }
  }, [invitations]);

  // Lockout Countdown Timer
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((lockoutUntil - Date.now()) / 1000));
      setLockoutRemainingSeconds(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        localStorage.removeItem('univision_lockout_until');
        localStorage.setItem('univision_failed_attempts', '0');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Password Policy Checks (simplified, min 4 chars)
  const passwordChecks = {
    length: signupPassword.length >= 4,
    hasUpper: /[A-Z]/.test(signupPassword),
    hasLower: /[a-z]/.test(signupPassword),
    hasDigit: /[0-9]/.test(signupPassword),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(signupPassword),
  };
  const isPasswordValid = signupPassword.length >= 4;

  // Direct 1-Click Access as Corporate Administrator (No complex login required)
  const handleInstantAdminAccess = () => {
    const org = organizations.find((o) => o.id === selectedOrgId) || activeOrg;
    const existingAdmin = officials.find(
      (o) => o.department === 'Administrator' && o.isActive
    );
    const adminOfficial: CorporateOfficial = existingAdmin || {
      id: 'off-admin-default',
      orgId: org.id,
      name: 'Corporate General Manager',
      email: 'admin@univision.gm',
      phone: '+220 701 4492',
      department: 'Administrator',
      roleTitle: 'Corporate General Manager',
      badgeNumber: 'EXEC-GM-001',
      isActive: true,
      isVerified: true,
      permissions: FULL_ADMIN_PERMISSIONS,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const session: AuthSession = {
      officialId: adminOfficial.id,
      orgId: org.id,
      email: adminOfficial.email,
      name: adminOfficial.name,
      department: adminOfficial.department,
      roleTitle: adminOfficial.roleTitle,
      loginTime: new Date().toISOString(),
    };

    onLoginSuccess(session, adminOfficial, org);
  };

  // Handle Standard Login with Cryptographic Verification (Email & Password)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    const emailClean = loginEmail.trim().toLowerCase();
    const passwordClean = loginPassword.trim();

    // Match official strictly by authorized email
    const matchedOfficial = officials.find(
      (o) => o.email.toLowerCase() === emailClean
    );

    let isCredentialsValid = false;
    if (matchedOfficial) {
      isCredentialsValid = await verifyPassword(
        passwordClean,
        matchedOfficial.passwordHash,
        matchedOfficial.password
      );
    }

    if (isCredentialsValid && matchedOfficial) {
      // Valid Credentials: Reset failed attempts
      setFailedAttempts(0);
      localStorage.setItem('univision_failed_attempts', '0');
      setLoginError(null);

      const org =
        organizations.find((o) => o.id === matchedOfficial.orgId) ||
        organizations.find((o) => o.id === selectedOrgId) ||
        activeOrg;

      const session: AuthSession = {
        officialId: matchedOfficial.id,
        orgId: org.id,
        email: matchedOfficial.email,
        name: matchedOfficial.name,
        department: matchedOfficial.department,
        roleTitle: matchedOfficial.roleTitle,
        loginTime: new Date().toISOString(),
      };

      onLoginSuccess(session, matchedOfficial, org);
    } else {
      // Failed login attempt
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      localStorage.setItem('univision_failed_attempts', String(nextFailed));

      if (nextFailed >= 3) {
        // Lock for 1 hour (3600 seconds)
        const lockTime = Date.now() + 3600 * 1000;
        setLockoutUntil(lockTime);
        localStorage.setItem('univision_lockout_until', String(lockTime));
        setLoginError(
          'Maximum 3 failed login attempts reached. Your account is temporarily locked for 1 hour to prevent unauthorized access.'
        );
      } else {
        setLoginError(
          `Invalid email or password. Attempt ${nextFailed} of 3 before a 1-hour security lockout.`
        );
      }
    }
  };

  // Sign-Up: Direct Organization & Administrator Registration via Email and Password
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    // Enforce: Only ONE administrator login who oversees all departments
    if (signupDepartment === 'Administrator' && existingAdministrator) {
      setLoginError(
        `Only one Administrator (General Manager) account is permitted to oversee all departments in this organization. ${existingAdministrator.name} is currently registered as the Administrator. Please sign in or register under HR or Accounts.`
      );
      return;
    }

    const newOrgId = `org-${Date.now()}`;
    const newOrg: Organization = {
      id: newOrgId,
      name: signupOrgName || 'New Corporate Enterprise Ltd.',
      slug: (signupOrgName || 'enterprise').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoUrl: null,
      headerConfig: {
        companyName: signupOrgName || 'New Corporate Enterprise Ltd.',
        documentTitle: 'Company Profiles',
        subheading: 'Human Resources & Financial Accounts Portal',
        registrationNumber: `CR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        taxJurisdiction: 'Kanifing Division · GRA',
        address: 'Main Commercial Avenue',
        accentColor: '#0f172a',
      },
      footerConfig: {
        confidentialityNotice: `Confidential Internal Corporate Dossier — ${signupOrgName || 'Enterprise'}.`,
        complianceNotice: 'Issued pursuant to statutory labor laws and statutory taxation acts.',
        contactEmail: signupEmail.trim(),
        contactPhone: signupPhone.trim(),
      },
      createdAt: new Date().toISOString().slice(0, 10),
    };

    let roleTitle = 'Corporate General Manager';
    let badgeNumber = 'EXEC-GM-001';
    if (signupDepartment === 'HR') {
      roleTitle = 'Director of Human Resources';
      badgeNumber = 'HR-DIR-001';
    } else if (signupDepartment === 'Accounts') {
      roleTitle = 'Chief Financial Controller';
      badgeNumber = 'ACC-DIR-001';
    }

    const passwordHash = await sha256Hex(signupPassword.trim());
    const newAdminOfficial: CorporateOfficial = {
      id: `off-${Date.now()}`,
      orgId: newOrgId,
      name: signupAdminName.trim() || (signupDepartment === 'Administrator' ? 'General Manager' : 'Authorized Official'),
      email: signupEmail.trim().toLowerCase(),
      passwordHash,
      phone: signupPhone.trim(),
      department: signupDepartment,
      roleTitle,
      badgeNumber,
      isActive: true,
      isVerified: true,
      permissions: FULL_ADMIN_PERMISSIONS,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onRegisterOrganization(newOrg, newAdminOfficial);

    const session: AuthSession = {
      officialId: newAdminOfficial.id,
      orgId: newOrgId,
      email: newAdminOfficial.email,
      name: newAdminOfficial.name,
      department: newAdminOfficial.department,
      roleTitle: newAdminOfficial.roleTitle,
      loginTime: new Date().toISOString(),
    };

    onLoginSuccess(session, newAdminOfficial, newOrg);
  };

  // Lookup and accept workspace invitation
  const handleCheckInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCodeInput.trim();
    const matched = invitations.find(
      (inv) => inv.inviteCode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matched && matched.status === 'pending') {
      setFoundInvitation(matched);
      setInviteError(null);
    } else {
      setInviteError('Invalid or expired workspace invitation link / code. Please verify with your HR or Accounts official.');
    }
  };

  // Complete Signup for Invited Official
  const handleCompleteInvitedSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundInvitation || !isPasswordValid) return;

    const passwordHash = await sha256Hex(signupPassword.trim());
    const newOfficial: CorporateOfficial = {
      id: `off-${Date.now()}`,
      orgId: foundInvitation.orgId,
      name: signupAdminName.trim() || 'Invited Officer',
      email: (foundInvitation.inviteEmail || signupEmail).trim().toLowerCase(),
      passwordHash,
      phone: signupPhone.trim(),
      department: foundInvitation.department,
      roleTitle: foundInvitation.designatedRole,
      badgeNumber: `${foundInvitation.department.toUpperCase()}-OFF-${Math.floor(100 + Math.random() * 900)}`,
      isActive: true,
      isVerified: true,
      permissions: foundInvitation.permissions,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAcceptInvitation(foundInvitation, newOfficial);

    const org = organizations.find((o) => o.id === foundInvitation.orgId) || activeOrg;
    const session: AuthSession = {
      officialId: newOfficial.id,
      orgId: org.id,
      email: newOfficial.email,
      name: newOfficial.name,
      department: newOfficial.department,
      roleTitle: newOfficial.roleTitle,
      loginTime: new Date().toISOString(),
    };

    onLoginSuccess(session, newOfficial, org);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800 antialiased font-sans">
      {/* Main Container Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header Banner: Multi-Organizational Secure Gateway */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 text-center relative">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl mb-3 border border-blue-400/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <div className="text-[10px] font-bold tracking-widest uppercase text-blue-400">
            MULTI-ORGANIZATIONAL SECURE ACCESS GATEWAY
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
            Human Resources &amp; Corporate Financial Accounts Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-Enterprise Workforce Profiling &amp; Statutory Accounts Gateway
          </p>
        </div>

        {/* 1-Hour Lockout Banner if active */}
        {lockoutUntil && lockoutRemainingSeconds > 0 && (
          <div className="bg-red-50 border-b border-red-200 p-4 text-xs text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span>Security Lockout Active (3 Failed Attempts)</span>
            </div>
            <p className="text-red-700">
              Account access is locked for 1 hour to prevent unauthorized brute-force attempts.
            </p>
            <div className="flex items-center justify-between bg-red-100/80 px-3 py-2 rounded-lg font-mono font-bold text-red-950">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-700" />
                Remaining Lockout:
              </span>
              <span>
                {Math.floor(lockoutRemainingSeconds / 60)}m {lockoutRemainingSeconds % 60}s
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {loginError && !lockoutUntil && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">{loginError}</div>
            <button
              type="button"
              onClick={() => setLoginError(null)}
              className="text-amber-500 hover:text-amber-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Mode Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setLoginError(null);
            }}
            className={`py-3.5 border-b-2 transition flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Portal Sign-In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setLoginError(null);
            }}
            className={`py-3.5 border-b-2 transition flex items-center justify-center gap-1.5 ${
              authMode === 'signup'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Register Org</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('invite');
              setLoginError(null);
            }}
            className={`py-3.5 border-b-2 transition flex items-center justify-center gap-1.5 ${
              authMode === 'invite'
                ? 'border-blue-600 text-blue-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Accept Invite</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 flex-1">
          {/* VIEW 1: PORTAL SIGN-IN */}
          {authMode === 'login' && (
            <div className="space-y-5">
              {officials.length === 0 ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 text-center space-y-3">
                  <div className="w-11 h-11 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto border border-blue-200 shadow-2xs">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Corporate Portal Initialized</h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      Welcome to the corporate workspace. Register your founding Organization Administrator profile to configure security and access the portal.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleInstantAdminAccess}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <span>Direct Access as Corporate General Manager</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-xs transition"
                    >
                      Or Register Custom Organization Profile
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  {/* Organization Portal Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Select Corporate Organization Portal *
                    </label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      disabled={Boolean(lockoutUntil && lockoutRemainingSeconds > 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.headerConfig.registrationNumber || 'CR-ACTIVE'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Corporate Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. director@organization.gm"
                        disabled={Boolean(lockoutUntil && lockoutRemainingSeconds > 0)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Secure Password *
                      </label>
                      <span className="text-[10px] text-slate-400">Policy: Min 8 chars, Uppercase, Lowercase, Number &amp; Symbol</span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={Boolean(lockoutUntil && lockoutRemainingSeconds > 0)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Login Security Policy & Attempt Status */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Security Guard: 3 attempts max before 1-hr lockout</span>
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                        failedAttempts >= 2
                          ? 'bg-red-100 text-red-800'
                          : failedAttempts === 1
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Attempts: {failedAttempts}/3
                    </span>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={Boolean(lockoutUntil && lockoutRemainingSeconds > 0)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-1"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Corporate Workspace</span>
                  </button>

                  <div className="relative my-2 text-center">
                    <span className="bg-white px-2 text-[10px] text-slate-400 font-medium">OR DIRECT ACCESS</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleInstantAdminAccess}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <span>Instant Access as Corporate General Manager</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIEW 2: ORGANIZATION SIGN-UP WITH STRICT PASSWORD POLICY */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Register New Organization &amp; Create Administrator Profile
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sets up isolated company portal, enforces multi-character secure passwords and enterprise role-based access.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Legal Organization Name *
                </label>
                <input
                  type="text"
                  value={signupOrgName}
                  onChange={(e) => setSignupOrgName(e.target.value)}
                  placeholder="e.g. Skyline Civil Infrastructure Ltd."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Administrator Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={signupAdminName}
                    onChange={(e) => setSignupAdminName(e.target.value)}
                    placeholder="e.g. Lamin Sanneh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Department Authority *
                    </label>
                    {existingAdministrator && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" />
                        <span>1 Admin Max</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value as 'Administrator' | 'HR' | 'Accounts')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                  >
                    <option
                      value="Administrator"
                      disabled={Boolean(existingAdministrator)}
                    >
                      {existingAdministrator
                        ? `Administrator (General Manager — Claimed by ${existingAdministrator.name})`
                        : 'Administrator (General Manager — Overseeing All Departments)'}
                    </option>
                    <option value="HR">HR Directorate (Human Resources &amp; Staff Dossiers)</option>
                    <option value="Accounts">Finance &amp; Accounts Directorate (Payroll &amp; Taxes)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {signupDepartment === 'Administrator'
                      ? 'Single Administrator role: Acts as Corporate General Manager, overseeing both HR and Accounts with master oversight.'
                      : signupDepartment === 'HR'
                      ? 'Authorized for workforce dossiers, statutory credential compliance, and HR vetting.'
                      : 'Authorized for financial accounts, bank remittance, compensation, and statutory tax records.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Corporate Email Address *
                  </label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="admin@enterprise.gm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Official Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+220 701 4492"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Secure Password Field with Multi-character Rule Checklist */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Create Secure Password *
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="e.g. SecurePass100%!"
                    className="w-full px-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Policy Checklist */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                    Statutory Password Complexity Policy:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <span className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {passwordChecks.length ? '✓' : '○'} At least 8 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordChecks.hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {passwordChecks.hasUpper ? '✓' : '○'} Uppercase letter [A-Z]
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordChecks.hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {passwordChecks.hasLower ? '✓' : '○'} Lowercase letter [a-z]
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordChecks.hasDigit ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {passwordChecks.hasDigit ? '✓' : '○'} Number / digit [0-9]
                    </span>
                    <span className={`flex items-center gap-1.5 sm:col-span-2 ${passwordChecks.hasSymbol ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {passwordChecks.hasSymbol ? '✓' : '○'} Special character / symbol (!, @, #, $, %, etc.)
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isPasswordValid}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Register &amp; Enter Corporate Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* VIEW 3: ACCEPT WORKSPACE INVITATION LINK */}
          {authMode === 'invite' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Accept Corporate Workspace Invitation
                </h3>
                <p className="text-[11px] text-slate-500">
                  Authorized officials can grant access via invitation links. Enter your invitation code or follow a shareable link.
                </p>
              </div>

              {!foundInvitation ? (
                <form onSubmit={handleCheckInviteCode} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Enter Workspace Invitation Code / Link Token *
                    </label>
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      placeholder="e.g. INV-99214A or paste full invite URL"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      required
                    />
                  </div>

                  {inviteError && (
                    <div className="text-red-600 text-[11px] font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                      {inviteError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-sm transition"
                  >
                    Validate Invitation
                  </button>
                </form>
              ) : (
                /* Invitation Validated: Complete Invited Signup */
                <form onSubmit={handleCompleteInvitedSignup} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Workspace Invitation Validated!</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Organization: <strong className="text-slate-900">{foundInvitation.orgName}</strong>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Designated Role: <strong className="text-emerald-800">{foundInvitation.designatedRole}</strong> ({foundInvitation.department} Department)
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      Authorized by: {foundInvitation.invitedByOfficialName}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Your Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={signupAdminName}
                      onChange={(e) => setSignupAdminName(e.target.value)}
                      placeholder="e.g. Modou Ceesay"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Corporate Email *
                      </label>
                      <input
                        type="email"
                        value={foundInvitation.inviteEmail || signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Official Contact Phone Number *
                      </label>
                      <input
                        type="text"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+220 701 4492"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Create Secure Password *
                    </label>
                    <span className="text-[10px] text-slate-400">Min 8 chars, Uppercase, Lowercase, Number &amp; Symbol</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="e.g. SecurePass100%!"
                      className="w-full px-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Policy Checklist for Invited Signup */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1 text-[11px]">
                    <div className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider">
                      Password Requirements:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10.5px]">
                      <span className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {passwordChecks.length ? '✓' : '○'} At least 8 characters
                      </span>
                      <span className={`flex items-center gap-1.5 ${passwordChecks.hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {passwordChecks.hasUpper ? '✓' : '○'} Uppercase letter [A-Z]
                      </span>
                      <span className={`flex items-center gap-1.5 ${passwordChecks.hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {passwordChecks.hasLower ? '✓' : '○'} Lowercase letter [a-z]
                      </span>
                      <span className={`flex items-center gap-1.5 ${passwordChecks.hasDigit ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {passwordChecks.hasDigit ? '✓' : '○'} Number / digit [0-9]
                      </span>
                      <span className={`flex items-center gap-1.5 sm:col-span-2 ${passwordChecks.hasSymbol ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {passwordChecks.hasSymbol ? '✓' : '○'} Special character / symbol (!, @, #, $, %, etc.)
                      </span>
                    </div>
                  </div>
                </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setFoundInvitation(null)}
                      className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isPasswordValid}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md transition"
                    >
                      Complete Registration &amp; Enter Workspace
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          Multi-Organizational Corporate Gateway • Confidential HR &amp; Accounts Portal
        </div>
      </div>
    </div>
  );
};
