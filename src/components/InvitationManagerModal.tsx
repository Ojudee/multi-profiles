import React, { useState } from 'react';
import {
  WorkspaceInvitation,
  CorporateOfficial,
  Organization,
  OfficialPermissions,
  DEFAULT_HR_PERMISSIONS,
  DEFAULT_ACCOUNTS_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from '../types';
import {
  UserPlus,
  Link,
  Copy,
  Check,
  X,
  ShieldCheck,
  Users,
  CreditCard,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Crown,
} from 'lucide-react';

interface InvitationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrg: Organization;
  activeOfficial: CorporateOfficial | null;
  invitations: WorkspaceInvitation[];
  officials: CorporateOfficial[];
  onGenerateInvitation: (invitation: WorkspaceInvitation) => void;
  onRevokeInvitation: (id: string) => void;
  onUpdateOfficialPermissions: (officialId: string, permissions: OfficialPermissions) => void;
}

export const InvitationManagerModal: React.FC<InvitationManagerModalProps> = ({
  isOpen,
  onClose,
  activeOrg,
  activeOfficial,
  invitations,
  officials,
  onGenerateInvitation,
  onRevokeInvitation,
  onUpdateOfficialPermissions,
}) => {
  const [activeTab, setActiveTab] = useState<'create_invite' | 'manage_officials' | 'invitations_list'>(
    'create_invite'
  );

  // Existing single Administrator check
  const existingAdmin = officials.find((o) => o.department === 'Administrator');

  // Invite Generator Form State
  const departmentAllowed =
    activeOfficial?.permissions?.canManageHROfficials && activeOfficial?.permissions?.canManageAccountsOfficials
      ? 'both'
      : activeOfficial?.department || 'both';

  const [inviteDept, setInviteDept] = useState<'Administrator' | 'HR' | 'Accounts'>(() => {
    if (departmentAllowed === 'Accounts') return 'Accounts';
    if (!existingAdmin) return 'Administrator';
    return 'HR';
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [designatedRole, setDesignatedRole] = useState(
    inviteDept === 'Administrator'
      ? 'Corporate General Manager'
      : inviteDept === 'HR'
      ? 'Assistant HR Compliance Officer'
      : 'Staff Payroll Accountant'
  );

  // Permissions state for the new invite
  const [permissions, setPermissions] = useState<OfficialPermissions>(
    inviteDept === 'Administrator'
      ? { ...FULL_ADMIN_PERMISSIONS }
      : inviteDept === 'HR'
      ? { ...DEFAULT_HR_PERMISSIONS }
      : { ...DEFAULT_ACCOUNTS_PERMISSIONS }
  );

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatedInviteSuccess, setGeneratedInviteSuccess] = useState<WorkspaceInvitation | null>(null);

  // Editing existing official permissions
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [editingPerms, setEditingPerms] = useState<OfficialPermissions | null>(null);

  if (!isOpen) return null;

  // Filter officials by active department (HR manages HR, Accounts manages Accounts, unless Executive)
  const managedOfficials = officials.filter((o) => {
    if (departmentAllowed === 'both' || activeOfficial?.department === 'Administrator') return true;
    return o.department === activeOfficial?.department;
  });

  const handleDeptChange = (dept: 'Administrator' | 'HR' | 'Accounts') => {
    setInviteDept(dept);
    if (dept === 'Administrator') {
      setDesignatedRole('Corporate General Manager');
      setPermissions({ ...FULL_ADMIN_PERMISSIONS });
    } else if (dept === 'HR') {
      setDesignatedRole('Assistant HR Compliance Officer');
      setPermissions({ ...DEFAULT_HR_PERMISSIONS });
    } else {
      setDesignatedRole('Staff Payroll Accountant');
      setPermissions({ ...DEFAULT_ACCOUNTS_PERMISSIONS });
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteDept === 'Administrator' && existingAdmin) {
      alert(`Only one Administrator (General Manager) account is permitted. ${existingAdmin.name} currently holds this role.`);
      return;
    }

    const code = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newInvite: WorkspaceInvitation = {
      id: `inv-${Date.now()}`,
      orgId: activeOrg.id,
      orgName: activeOrg.name,
      inviteEmail: inviteEmail.trim(),
      invitedByOfficialId: activeOfficial?.id || 'admin',
      invitedByOfficialName: activeOfficial?.name || 'Administrator',
      department: inviteDept,
      designatedRole,
      permissions,
      inviteCode: code,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    };

    onGenerateInvitation(newInvite);
    setGeneratedInviteSuccess(newInvite);
    setInviteEmail('');
  };

  const handleCopyLink = (code: string) => {
    const url = `${window.location.origin}${window.location.pathname}?invite=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSaveOfficialPermissions = (officialId: string) => {
    if (!editingPerms) return;
    onUpdateOfficialPermissions(officialId, editingPerms);
    setEditingOfficialId(null);
    setEditingPerms(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                OFFICIAL ACCESS &amp; INVITATIONS GOVERNANCE
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Workspace Invitations &amp; Permissions Manager
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('create_invite')}
            className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'create_invite'
                ? 'border-blue-600 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Generate Workspace Invitation Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage_officials')}
            className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'manage_officials'
                ? 'border-blue-600 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Designated Officials &amp; Control Rights ({managedOfficials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invitations_list')}
            className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'invitations_list'
                ? 'border-blue-600 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Invite Links ({invitations.length})</span>
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {/* TAB 1: GENERATE INVITATION LINK */}
          {activeTab === 'create_invite' && (
            <div className="space-y-4">
              {generatedInviteSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Workspace Invitation Link Created Successfully!</span>
                  </div>
                  <div className="text-slate-600">
                    Share this link with <strong className="text-slate-900">{generatedInviteSuccess.inviteEmail || 'the invited officer'}</strong> so they can register with their email and password:
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between gap-2 font-mono text-[11px] text-slate-800 break-all">
                    <span>
                      {window.location.origin}{window.location.pathname}?invite={generatedInviteSuccess.inviteCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(generatedInviteSuccess.inviteCode)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans font-bold text-xs shrink-0 flex items-center gap-1 transition"
                    >
                      {copiedCode === generatedInviteSuccess.inviteCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Grant Personnel Access via Invitation Link
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Invited personnel will be directed to signup with their corporate email, create a secure password, and undergo 2FA phone OTP verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Target Department Authority *
                      </label>
                      {existingAdmin && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 font-semibold flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" />
                          <span>1 GM Max</span>
                        </span>
                      )}
                    </div>
                    <select
                      value={inviteDept}
                      onChange={(e) => handleDeptChange(e.target.value as 'Administrator' | 'HR' | 'Accounts')}
                      disabled={departmentAllowed !== 'both'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option
                        value="Administrator"
                        disabled={Boolean(existingAdmin)}
                      >
                        {existingAdmin
                          ? `Administrator (GM — Claimed by ${existingAdmin.name} [Max 1])`
                          : 'Administrator (General Manager — Oversees All Departments)'}
                      </option>
                      {(departmentAllowed === 'both' || departmentAllowed === 'HR') && (
                        <option value="HR">HR Department (People, Profiles &amp; Vetting)</option>
                      )}
                      {(departmentAllowed === 'both' || departmentAllowed === 'Accounts') && (
                        <option value="Accounts">Accounts &amp; Finance (Disbursements &amp; Payroll)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Designated Role Title *
                    </label>
                    <input
                      type="text"
                      value={designatedRole}
                      onChange={(e) => setDesignatedRole(e.target.value)}
                      placeholder="e.g. Senior Payroll Accountant"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Invitee Corporate Email (Optional Restriction)
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. newofficer@univision.gm (or leave empty to allow any corporate recipient)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Granular Permission Designated Controls */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Designate &amp; Control What This Personnel Can Do:</span>
                    <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono font-bold">
                      {inviteDept} Access Controls
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canViewDossiers}
                        onChange={(e) => setPermissions({ ...permissions, canViewDossiers: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Can View Corporate Dossiers</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canExportData}
                        onChange={(e) => setPermissions({ ...permissions, canExportData: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Can Export CSV &amp; PDF Dossiers</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canGenerateInvites}
                        onChange={(e) => setPermissions({ ...permissions, canGenerateInvites: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Can Grant Workspace Invites</span>
                    </label>

                    <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.canViewAuditLogs}
                        onChange={(e) => setPermissions({ ...permissions, canViewAuditLogs: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <span>Can View Audit Trails</span>
                    </label>

                    {inviteDept === 'HR' && (
                      <>
                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canCreateProfiles}
                            onChange={(e) => setPermissions({ ...permissions, canCreateProfiles: e.target.checked })}
                            className="rounded text-emerald-600"
                          />
                          <span className="font-semibold text-emerald-950">Can Create New Profiles</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canEditProfiles}
                            onChange={(e) => setPermissions({ ...permissions, canEditProfiles: e.target.checked })}
                            className="rounded text-emerald-600"
                          />
                          <span className="font-semibold text-emerald-950">Can Edit Bio-Data &amp; Contracts</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canVerifyClearance}
                            onChange={(e) => setPermissions({ ...permissions, canVerifyClearance: e.target.checked })}
                            className="rounded text-emerald-600"
                          />
                          <span className="font-semibold text-emerald-950">Can Verify HR Clearance</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canManageCredentials}
                            onChange={(e) => setPermissions({ ...permissions, canManageCredentials: e.target.checked })}
                            className="rounded text-emerald-600"
                          />
                          <span className="font-semibold text-emerald-950">Can Authenticate Credentials</span>
                        </label>
                      </>
                    )}

                    {inviteDept === 'Accounts' && (
                      <>
                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canViewFinancials}
                            onChange={(e) => setPermissions({ ...permissions, canViewFinancials: e.target.checked })}
                            className="rounded text-purple-600"
                          />
                          <span className="font-semibold text-purple-950">Can Access Bank Details &amp; Rates</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canAdjustPayroll}
                            onChange={(e) => setPermissions({ ...permissions, canAdjustPayroll: e.target.checked })}
                            className="rounded text-purple-600"
                          />
                          <span className="font-semibold text-purple-950">Can Apply Lateness/Absence Deductions</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canApproveMilestones}
                            onChange={(e) => setPermissions({ ...permissions, canApproveMilestones: e.target.checked })}
                            className="rounded text-purple-600"
                          />
                          <span className="font-semibold text-purple-950">Can Approve Subcontract Stages</span>
                        </label>

                        <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={permissions.canDisbursePayments}
                            onChange={(e) => setPermissions({ ...permissions, canDisbursePayments: e.target.checked })}
                            className="rounded text-purple-600"
                          />
                          <span className="font-semibold text-purple-950">Can Authorize Disbursements</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5"
                  >
                    <Link className="w-4 h-4" />
                    <span>Generate Shareable Invite Link</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: MANAGE EXISTING OFFICIALS & PERMISSIONS */}
          {activeTab === 'manage_officials' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Manage {activeOfficial?.department || 'Corporate'} Officials &amp; Control Rights
                </h3>
                <p className="text-[11px] text-slate-500">
                  HR and Accounts leadership independently govern their personnel, designation titles, and operative privileges.
                </p>
              </div>

              <div className="space-y-3">
                {managedOfficials.map((off) => {
                  const isEditing = editingOfficialId === off.id;
                  const perms = isEditing && editingPerms ? editingPerms : off.permissions || (off.department === 'HR' ? DEFAULT_HR_PERMISSIONS : DEFAULT_ACCOUNTS_PERMISSIONS);

                  return (
                    <div
                      key={off.id}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{off.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                off.department === 'HR'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-purple-100 text-purple-900'
                              }`}
                            >
                              {off.department}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              {off.badgeNumber || 'OFF-ID'}
                            </span>
                          </div>
                          <div className="text-slate-600 text-xs mt-0.5">{off.roleTitle} · {off.email}</div>
                        </div>

                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOfficialId(off.id);
                              setEditingPerms({ ...perms });
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100 self-start sm:self-auto"
                          >
                            Configure Controls
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingOfficialId(null)}
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveOfficialPermissions(off.id)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold"
                            >
                              Save Controls
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Display or Edit Permissions */}
                      {isEditing && editingPerms ? (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingPerms.canViewDossiers}
                              onChange={(e) => setEditingPerms({ ...editingPerms, canViewDossiers: e.target.checked })}
                            />
                            <span>View Dossiers</span>
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editingPerms.canExportData}
                              onChange={(e) => setEditingPerms({ ...editingPerms, canExportData: e.target.checked })}
                            />
                            <span>Export PDF / CSV</span>
                          </label>

                          {off.department === 'HR' && (
                            <>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canCreateProfiles}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canCreateProfiles: e.target.checked })}
                                />
                                <span>Create Profiles</span>
                              </label>

                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canEditProfiles}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canEditProfiles: e.target.checked })}
                                />
                                <span>Edit Personnel Records</span>
                              </label>

                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canVerifyClearance}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canVerifyClearance: e.target.checked })}
                                />
                                <span>Verify HR Clearance</span>
                              </label>

                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canManageCredentials}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canManageCredentials: e.target.checked })}
                                />
                                <span>Manage Staff Credentials Vault</span>
                              </label>
                            </>
                          )}

                          {off.department === 'Accounts' && (
                            <>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canViewFinancials}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canViewFinancials: e.target.checked })}
                                />
                                <span>Access Bank &amp; Compensation</span>
                              </label>

                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canAdjustPayroll}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canAdjustPayroll: e.target.checked })}
                                />
                                <span>Apply Payroll Deductions</span>
                              </label>

                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canApproveMilestones}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canApproveMilestones: e.target.checked })}
                                />
                                <span>Approve Subcontract Stages</span>
                              </label>

                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={editingPerms.canDisbursePayments}
                                  onChange={(e) => setEditingPerms({ ...editingPerms, canDisbursePayments: e.target.checked })}
                                />
                                <span>Disburse Milestone Payments</span>
                              </label>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {perms.canCreateProfiles && (
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-medium">Create Profiles</span>
                          )}
                          {perms.canEditProfiles && (
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-medium">Edit Records</span>
                          )}
                          {perms.canVerifyClearance && (
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-medium">Verify Clearance</span>
                          )}
                          {perms.canManageCredentials && (
                            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-medium">Manage Credentials</span>
                          )}
                          {perms.canViewFinancials && (
                            <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-medium">View Financials</span>
                          )}
                          {perms.canAdjustPayroll && (
                            <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-medium">Adjust Payroll</span>
                          )}
                          {perms.canApproveMilestones && (
                            <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-medium">Approve Milestones</span>
                          )}
                          {perms.canDisbursePayments && (
                            <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-medium">Disburse Payments</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE INVITATIONS LIST */}
          {activeTab === 'invitations_list' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Active Workspace Invitation Links ({invitations.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track pending invitation tokens, copy direct links, or revoke unauthorized invitations.
                </p>
              </div>

              {invitations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Link className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No active invitation links generated yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                            {inv.inviteCode}
                          </span>
                          <span className="font-bold text-slate-900">{inv.designatedRole}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                              inv.department === 'HR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {inv.department}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-1">
                          Invited by {inv.invitedByOfficialName} · Recipient: {inv.inviteEmail || 'Open Link'} · Expires: {inv.expiresAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(inv.inviteCode)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold flex items-center gap-1"
                        >
                          {copiedCode === inv.inviteCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === inv.inviteCode ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRevokeInvitation(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Revoke Invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
