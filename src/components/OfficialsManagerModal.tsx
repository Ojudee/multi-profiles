import React, { useState } from 'react';
import {
  CorporateOfficial,
  AuditLogEntry,
  OfficialPermissions,
  DEFAULT_HR_PERMISSIONS,
  DEFAULT_ACCOUNTS_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from '../types';
import { AuditTrailViewer } from './AuditTrailViewer';
import {
  Users,
  CreditCard,
  UserCheck,
  Plus,
  ShieldCheck,
  Mail,
  Award,
  Check,
  X,
  UserPlus,
  Edit2,
  Trash2,
  History,
  Sliders,
  Shield,
  Briefcase,
  Phone,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Crown,
} from 'lucide-react';

interface OfficialsManagerModalProps {
  isOpen: boolean;
  officials: CorporateOfficial[];
  activeOfficial: CorporateOfficial | null;
  auditLogs?: AuditLogEntry[];
  initialDepartment?: 'HR' | 'Accounts' | 'Administrator' | 'All';
  onSelectActiveOfficial: (official: CorporateOfficial) => void;
  onCreateOfficial: (newOfficial: CorporateOfficial) => void;
  onUpdateOfficial: (id: string, updates: Partial<CorporateOfficial>) => void;
  onDeleteOfficial: (id: string) => void;
  onClose: () => void;
}

export const OfficialsManagerModal: React.FC<OfficialsManagerModalProps> = ({
  isOpen,
  officials,
  activeOfficial,
  auditLogs = [],
  initialDepartment = 'All',
  onSelectActiveOfficial,
  onCreateOfficial,
  onUpdateOfficial,
  onDeleteOfficial,
  onClose,
}) => {
  const [modalTab, setModalTab] = useState<'officials' | 'audit_trail'>('officials');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<'All' | 'Administrator' | 'HR' | 'Accounts'>(
    initialDepartment
  );

  // Existing single Administrator check
  const existingAdmin = officials.find((o) => o.department === 'Administrator');

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+220 ');
  const [department, setDepartment] = useState<'Administrator' | 'HR' | 'Accounts'>(() => {
    return existingAdmin ? 'HR' : 'Administrator';
  });
  const [roleTitle, setRoleTitle] = useState('Director of Human Resources');
  const [badgeNumber, setBadgeNumber] = useState('');

  // Editing Permissions State
  const [editingPermissionsOfficialId, setEditingPermissionsOfficialId] = useState<string | null>(null);
  const [tempPermissions, setTempPermissions] = useState<OfficialPermissions | null>(null);
  const [tempRoleTitle, setTempRoleTitle] = useState('');

  if (!isOpen) return null;

  const handleStartEditingPermissions = (official: CorporateOfficial) => {
    setEditingPermissionsOfficialId(official.id);
    setTempPermissions(
      official.permissions ||
        (official.department === 'Administrator'
          ? FULL_ADMIN_PERMISSIONS
          : official.department === 'HR'
          ? DEFAULT_HR_PERMISSIONS
          : DEFAULT_ACCOUNTS_PERMISSIONS)
    );
    setTempRoleTitle(official.roleTitle);
  };

  const handleSavePermissions = (officialId: string) => {
    if (!tempPermissions) return;
    onUpdateOfficial(officialId, {
      permissions: tempPermissions,
      roleTitle: tempRoleTitle,
    });
    setEditingPermissionsOfficialId(null);
    setTempPermissions(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (department === 'Administrator' && existingAdmin) {
      alert(
        `Only one Administrator (General Manager) login is permitted to oversee all departments. ${existingAdmin.name} is currently the designated General Manager.`
      );
      return;
    }

    const defaultPerms =
      department === 'Administrator'
        ? { ...FULL_ADMIN_PERMISSIONS }
        : department === 'HR'
        ? { ...DEFAULT_HR_PERMISSIONS }
        : { ...DEFAULT_ACCOUNTS_PERMISSIONS };

    const newOff: CorporateOfficial = {
      id: `off-${Date.now()}`,
      orgId: activeOfficial?.orgId || 'org-univision',
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@univision.gm`,
      phone: phone.trim() || '+220 701 4492',
      department,
      roleTitle: roleTitle.trim() || (department === 'Administrator' ? 'Corporate General Manager' : 'Authorized Officer'),
      badgeNumber: badgeNumber.trim() || `${department === 'Administrator' ? 'EXEC-GM' : department.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      isActive: true,
      isVerified: true,
      permissions: defaultPerms,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onCreateOfficial(newOff);
    setName('');
    setEmail('');
    setPhone('+220 ');
    setBadgeNumber('');
    setIsCreating(false);
  };

  const filteredOfficials = officials.filter((o) => {
    if (selectedDeptFilter === 'All') return true;
    return o.department === selectedDeptFilter;
  });

  const adminOfficialsCount = officials.filter((o) => o.department === 'Administrator').length;
  const hrOfficialsCount = officials.filter((o) => o.department === 'HR').length;
  const accountsOfficialsCount = officials.filter((o) => o.department === 'Accounts').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                DEPARTMENT PERSONNEL PROFILING &amp; GOVERNANCE
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                HR &amp; Accounts Officials Manager · Designated Role Controls
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

        {/* Top Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalTab('officials')}
              className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
                modalTab === 'officials'
                  ? 'border-blue-600 text-blue-950 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Officials Directory ({officials.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setModalTab('audit_trail')}
              className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
                modalTab === 'audit_trail'
                  ? 'border-blue-600 text-blue-950 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Identify Who Did What · Audit Trail ({auditLogs.length})</span>
            </button>
          </div>

          {modalTab === 'officials' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedDeptFilter('All')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  selectedDeptFilter === 'All'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({officials.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDeptFilter('Administrator')}
                className={`px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1 ${
                  selectedDeptFilter === 'Administrator'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>Admin/GM ({adminOfficialsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDeptFilter('HR')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  selectedDeptFilter === 'HR'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HR ({hrOfficialsCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDeptFilter('Accounts')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  selectedDeptFilter === 'Accounts'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Accounts ({accountsOfficialsCount})
              </button>
            </div>
          )}
        </div>

        {/* Current Signed-In Official Bar */}
        <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Active Signed-In Operator:</span>
            <span className="font-bold text-blue-950 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              {activeOfficial?.name || 'Univision Directorate'} ({activeOfficial?.roleTitle})
            </span>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono font-bold">
            All Current Actions &amp; Audits Attributed to This Officer
          </span>
        </div>

        <div className="p-5 space-y-5 text-xs flex-1">
          {modalTab === 'officials' && (
            <>
              {/* Header Info & Create Official Trigger */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>
                      {selectedDeptFilter === 'All'
                        ? 'Authorized Department Officials'
                        : `${selectedDeptFilter} Department Officials & Governance`}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-700">
                      {filteredOfficials.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    HR and Accounts manage their personnel individually: designate role titles, and control exactly what each official is permitted to do.
                  </p>
                </div>

                {!isCreating && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDeptFilter === 'Accounts') {
                        setDepartment('Accounts');
                        setRoleTitle('Chief Financial Controller');
                      } else if (selectedDeptFilter === 'Administrator') {
                        if (existingAdmin) {
                          alert(`Only one Administrator (General Manager) account is permitted. ${existingAdmin.name} currently holds this role.`);
                          return;
                        }
                        setDepartment('Administrator');
                        setRoleTitle('Corporate General Manager');
                      } else {
                        setDepartment('HR');
                        setRoleTitle('Director of Human Resources');
                      }
                      setIsCreating(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      Register New {selectedDeptFilter === 'All' ? 'Department' : selectedDeptFilter} Official
                    </span>
                  </button>
                )}
              </div>

              {/* Mobile Filter buttons */}
              <div className="flex sm:hidden flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter('All')}
                  className={`flex-1 py-1 px-2 rounded text-center font-medium ${
                    selectedDeptFilter === 'All' ? 'bg-white font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All ({officials.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter('Administrator')}
                  className={`flex-1 py-1 px-2 rounded text-center font-medium flex items-center justify-center gap-1 ${
                    selectedDeptFilter === 'Administrator' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  <Crown className="w-3 h-3" />
                  <span>GM ({adminOfficialsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter('HR')}
                  className={`flex-1 py-1 px-2 rounded text-center font-medium ${
                    selectedDeptFilter === 'HR' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  HR ({hrOfficialsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter('Accounts')}
                  className={`flex-1 py-1 px-2 rounded text-center font-medium ${
                    selectedDeptFilter === 'Accounts' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  Accounts ({accountsOfficialsCount})
                </button>
              </div>

              {/* Create Official Form */}
              {isCreating && (
                <form
                  onSubmit={handleCreate}
                  className="bg-slate-50 p-4 rounded-xl border-2 border-blue-200 space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span>Register Official Profile for {department} Department</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Mariama Touray"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="m.touray@univision.gm"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Department Directorate *
                        </label>
                        {existingAdmin && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 font-semibold flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>1 GM Max</span>
                          </span>
                        )}
                      </div>
                      <select
                        value={department}
                        onChange={(e) => {
                          const dep = e.target.value as 'Administrator' | 'HR' | 'Accounts';
                          setDepartment(dep);
                          if (dep === 'Administrator') {
                            setRoleTitle('Corporate General Manager');
                          } else if (dep === 'HR') {
                            setRoleTitle('Director of Human Resources');
                          } else {
                            setRoleTitle('Chief Financial Controller');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option
                          value="Administrator"
                          disabled={Boolean(existingAdmin)}
                        >
                          {existingAdmin
                            ? `Administrator (GM — Claimed by ${existingAdmin.name} [Max 1])`
                            : 'Administrator (General Manager — Oversees All Departments)'}
                        </option>
                        <option value="HR">HR Department (Human Resources &amp; Credentials)</option>
                        <option value="Accounts">Accounts &amp; Finance (Payroll, Invoicing &amp; Taxes)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Designated Role Title *
                      </label>
                      <input
                        type="text"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="e.g. Senior Payroll Accountant"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mobile Contact Phone
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+220 701 4492"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Officer Badge / ID Number
                      </label>
                      <input
                        type="text"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value)}
                        placeholder="e.g. ACC-2026-004"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs"
                    >
                      Create Official Profile &amp; Designate Role
                    </button>
                  </div>
                </form>
              )}

              {/* Officials Cards Grid with Granular Permissions Controls */}
              {filteredOfficials.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 space-y-2">
                  <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Officials Registered</p>
                  <p className="text-xs text-slate-500">
                    {selectedDeptFilter === 'All'
                      ? 'No corporate officials have been registered yet. Click "Register New Official" above to add department officers.'
                      : `No officials registered for the ${selectedDeptFilter} department yet.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredOfficials.map((off) => {
                  const isSelected = activeOfficial?.id === off.id;
                  const isHR = off.department === 'HR';
                  const isAdmin = off.department === 'Administrator';
                  const isEditingPermissions = editingPermissionsOfficialId === off.id;
                  const perms =
                    off.permissions ||
                    (isAdmin
                      ? FULL_ADMIN_PERMISSIONS
                      : isHR
                      ? DEFAULT_HR_PERMISSIONS
                      : DEFAULT_ACCOUNTS_PERMISSIONS);

                  return (
                    <div
                      key={off.id}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                          : isAdmin
                          ? 'border-amber-300/80 bg-amber-50/20 hover:border-amber-400'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Top Bar of Official Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${
                              isAdmin
                                ? 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-xs'
                                : isHR
                                ? 'bg-emerald-600'
                                : 'bg-purple-600'
                            }`}
                          >
                            {isAdmin ? <Crown className="w-5 h-5 text-white" /> : off.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{off.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                                  isAdmin
                                    ? 'bg-amber-100 text-amber-950 border border-amber-300 font-extrabold'
                                    : isHR
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : 'bg-purple-100 text-purple-900 border border-purple-200'
                                }`}
                              >
                                {isAdmin && <Crown className="w-3 h-3 text-amber-600" />}
                                {isAdmin
                                  ? 'Administrator (General Manager)'
                                  : `${off.department} Department`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-semibold">{off.roleTitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto text-[11px]">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
                            {off.badgeNumber || 'OFF-ID'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              off.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {off.isActive ? 'Active Official' : 'Suspended'}
                          </span>
                        </div>
                      </div>

                      {/* Official Details & Contact */}
                      <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{off.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{off.phone || '+220 701 4492'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Corporate Security Credentials Verified</span>
                        </div>
                      </div>

                      {/* Designated Permissions Summary Badge List */}
                      {!isEditingPermissions && (
                        <div className="py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mr-1">
                            Controlled Authority:
                          </span>
                          {perms.canCreateProfiles && (
                            <span className="bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded font-medium">
                              ✓ Create Profiles
                            </span>
                          )}
                          {perms.canEditProfiles && (
                            <span className="bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded font-medium">
                              ✓ Edit Records
                            </span>
                          )}
                          {perms.canVerifyClearance && (
                            <span className="bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded font-medium">
                              ✓ Verify Clearance
                            </span>
                          )}
                          {perms.canManageCredentials && (
                            <span className="bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded font-medium">
                              ✓ Credentials Vault
                            </span>
                          )}
                          {perms.canViewFinancials && (
                            <span className="bg-purple-100/70 text-purple-800 px-2 py-0.5 rounded font-medium">
                              ✓ View Financials
                            </span>
                          )}
                          {perms.canAdjustPayroll && (
                            <span className="bg-purple-100/70 text-purple-800 px-2 py-0.5 rounded font-medium">
                              ✓ Payroll Adjustments
                            </span>
                          )}
                          {perms.canApproveMilestones && (
                            <span className="bg-purple-100/70 text-purple-800 px-2 py-0.5 rounded font-medium">
                              ✓ Milestone Approvals
                            </span>
                          )}
                          {perms.canDisbursePayments && (
                            <span className="bg-purple-100/70 text-purple-800 px-2 py-0.5 rounded font-medium">
                              ✓ Disburse Payments
                            </span>
                          )}
                          {perms.canGenerateInvites && (
                            <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-medium">
                              ✓ Issue Invites
                            </span>
                          )}
                        </div>
                      )}

                      {/* INLINE PERMISSIONS & ROLE GOVERNANCE EDITOR */}
                      {isEditingPermissions && tempPermissions && (
                        <div className="mt-3 p-4 bg-slate-50 rounded-xl border-2 border-blue-300 space-y-4 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                              <Sliders className="w-4 h-4 text-blue-600" />
                              <span>Designate &amp; Control What {off.name} Can Do</span>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setTempPermissions(
                                    isHR ? { ...DEFAULT_HR_PERMISSIONS } : { ...DEFAULT_ACCOUNTS_PERMISSIONS }
                                  )
                                }
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded font-semibold text-slate-700"
                              >
                                Default {off.department}
                              </button>
                              <button
                                type="button"
                                onClick={() => setTempPermissions({ ...FULL_ADMIN_PERMISSIONS })}
                                className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-semibold"
                              >
                                Full Admin
                              </button>
                            </div>
                          </div>

                          {/* Editable Role Title */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Designated Role Title
                            </label>
                            <input
                              type="text"
                              value={tempRoleTitle}
                              onChange={(e) => setTempRoleTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                            />
                          </div>

                          {/* Granular Checkboxes Grid */}
                          <div className="space-y-3">
                            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                              {isHR ? 'Human Resources Directorate Controls:' : 'Accounts & Financial Controls:'}
                            </div>

                            {isHR ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canCreateProfiles}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canCreateProfiles: e.target.checked })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Create Personnel Profiles</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canEditProfiles}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canEditProfiles: e.target.checked })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Edit Bio-Data &amp; Particulars</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canVerifyClearance}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canVerifyClearance: e.target.checked })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Issue HR Clearance Endorsements</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canManageCredentials}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canManageCredentials: e.target.checked })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Manage Staff Credentials Vault</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canManageHROfficials}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canManageHROfficials: e.target.checked })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Manage &amp; Designate HR Officials</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canDeleteProfiles}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canDeleteProfiles: e.target.checked })
                                    }
                                    className="rounded text-red-600 w-4 h-4"
                                  />
                                  <span className="text-red-700 font-semibold">Can Delete Personnel Records</span>
                                </label>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canViewFinancials}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canViewFinancials: e.target.checked })
                                    }
                                    className="rounded text-purple-600 w-4 h-4"
                                  />
                                  <span>Can View Bank Details &amp; Salaries</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canAdjustPayroll}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canAdjustPayroll: e.target.checked })
                                    }
                                    className="rounded text-purple-600 w-4 h-4"
                                  />
                                  <span>Can Adjust Payroll &amp; Advances</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canApproveMilestones}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canApproveMilestones: e.target.checked })
                                    }
                                    className="rounded text-purple-600 w-4 h-4"
                                  />
                                  <span>Can Approve Subcontract Milestones</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canDisbursePayments}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canDisbursePayments: e.target.checked })
                                    }
                                    className="rounded text-purple-600 w-4 h-4"
                                  />
                                  <span>Can Disburse Direct Milestone Payments</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canManageAccountsOfficials}
                                    onChange={(e) =>
                                      setTempPermissions({
                                        ...tempPermissions,
                                        canManageAccountsOfficials: e.target.checked,
                                      })
                                    }
                                    className="rounded text-purple-600 w-4 h-4"
                                  />
                                  <span>Can Manage Accounts Personnel</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canExportData}
                                    onChange={(e) =>
                                      setTempPermissions({ ...tempPermissions, canExportData: e.target.checked })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Export Financial Audit Reports</span>
                                </label>
                              </div>
                            )}

                            {/* Shared Authority */}
                            <div className="pt-2 border-t border-slate-200">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                Shared Portal Authority:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canGenerateInvites}
                                    onChange={(e) =>
                                      setTempPermissions({
                                        ...tempPermissions,
                                        canGenerateInvites: e.target.checked,
                                      })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Grant Workspace Access via Invites</span>
                                </label>

                                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={tempPermissions.canViewAuditLogs}
                                    onChange={(e) =>
                                      setTempPermissions({
                                        ...tempPermissions,
                                        canViewAuditLogs: e.target.checked,
                                      })
                                    }
                                    className="rounded text-blue-600 w-4 h-4"
                                  />
                                  <span>Can Inspect Activity Audit Trail</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for Permissions Editor */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPermissionsOfficialId(null);
                                setTempPermissions(null);
                              }}
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSavePermissions(off.id)}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Save Designated Controls</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Card Bottom Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingPermissions) {
                                setEditingPermissionsOfficialId(null);
                                setTempPermissions(null);
                              } else {
                                handleStartEditingPermissions(off);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              isEditingPermissions
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>
                              {isEditingPermissions ? 'Close Controls' : 'Designate & Control Permissions'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateOfficial(off.id, { isActive: !off.isActive })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                              off.isActive
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {off.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <span className="text-xs font-bold text-blue-700 flex items-center gap-1 bg-blue-100/60 px-2 py-1 rounded-md">
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                              Active Operator
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onSelectActiveOfficial(off)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                            >
                              Sign In as Operator
                            </button>
                          )}

                          {officials.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteOfficial(off.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition"
                              title="Delete Officer Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </>
          )}

          {modalTab === 'audit_trail' && (
            <AuditTrailViewer
              auditLogs={auditLogs}
              officials={officials}
              activeOfficial={activeOfficial}
            />
          )}
        </div>
      </div>
    </div>
  );
};

