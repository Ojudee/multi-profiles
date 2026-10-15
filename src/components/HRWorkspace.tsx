import React, { useState } from 'react';
import {
  PartnerRecord,
  PersonnelCategory,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
  Organization,
  CorporateOfficial,
  AuditLogEntry,
  StaffCredentialItem,
} from '../types';
import { StaffCredentialsInventory } from './StaffCredentialsInventory';
import { AuditTrailViewer } from './AuditTrailViewer';
import {
  Users,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Edit2,
  FileText,
  Phone,
  User,
  Building,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Award,
  History,
  ShieldCheck,
} from 'lucide-react';

interface HRWorkspaceProps {
  partners: PartnerRecord[];
  onSelectPartner: (id: string) => void;
  onUpdatePartner: (id: string, updates: Partial<PartnerRecord>) => void;
  onOpenAddModal: (categoryPreset?: PersonnelCategory) => void;
  onOpenOfficialsManager?: (department: 'HR' | 'Accounts') => void;
  activeOrg?: Organization;
  officials?: CorporateOfficial[];
  activeOfficial?: CorporateOfficial | null;
  onSelectActiveOfficial?: (official: CorporateOfficial) => void;
  onCreateOfficial?: (newOfficial: CorporateOfficial) => void;
  onUpdateOfficial?: (id: string, updates: Partial<CorporateOfficial>) => void;
  onDeleteOfficial?: (id: string) => void;
  auditLogs?: AuditLogEntry[];
  credentials?: StaffCredentialItem[];
  onAddCredential?: (credential: StaffCredentialItem) => void;
  onUpdateCredential?: (id: string, updates: Partial<StaffCredentialItem>) => void;
  onDeleteCredential?: (id: string) => void;
}

export const HRWorkspace: React.FC<HRWorkspaceProps> = ({
  partners,
  onSelectPartner,
  onUpdatePartner,
  onOpenAddModal,
  onOpenOfficialsManager,
  activeOrg,
  officials = [],
  activeOfficial = null,
  onSelectActiveOfficial,
  onCreateOfficial,
  onUpdateOfficial,
  onDeleteOfficial,
  auditLogs = [],
  credentials = [],
  onAddCredential,
  onUpdateCredential,
  onDeleteCredential,
}) => {
  const [hrSubTab, setHrSubTab] = useState<'roster' | 'credentials' | 'audit_trail'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clearanceFilter, setClearanceFilter] = useState<string>('all');
  const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);

  // Metrics
  const totalCount = partners.length;
  const permanentCount = partners.filter((p) => p.category === 'permanent_employee').length;
  const contractCount = partners.filter((p) => p.category === 'contract_staff').length;
  const subcontractorCount = partners.filter((p) => p.category === 'subcontractor').length;
  const execCount = partners.filter((p) => p.category === 'executive_partner').length;
  const clearedCount = partners.filter(
    (p) => p.hrDetails?.hrClearanceStatus === 'Fully Cleared' || p.status === 'extracted'
  ).length;

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hrDetails?.staffIdOrCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;

    const matchesClearance =
      clearanceFilter === 'all' ||
      (clearanceFilter === 'cleared' && p.hrDetails?.hrClearanceStatus === 'Fully Cleared') ||
      (clearanceFilter === 'pending' && p.hrDetails?.hrClearanceStatus !== 'Fully Cleared');

    return matchesSearch && matchesCategory && matchesClearance;
  });

  const handleToggleClearance = (partner: PartnerRecord) => {
    const current = partner.hrDetails?.hrClearanceStatus;
    const nextStatus = current === 'Fully Cleared' ? 'Pending Documents' : 'Fully Cleared';
    onUpdatePartner(partner.id, {
      hrDetails: {
        ...(partner.hrDetails || {
          staffIdOrCode: `EMP-${Date.now().toString().slice(-4)}`,
          dateOfEngagement: partner.generatedDate,
          reportingSupervisor: 'Executive Board',
          workLocation: 'Main Office',
          emergencyContact: { fullName: '', relationship: '', phoneNumber: '' },
          backgroundCheckVerified: true,
          signedAgreementOnRecord: true,
          hrOfficerSignatory: 'Head of Human Resources',
          hrSignDate: partner.generatedDate,
        }),
        hrClearanceStatus: nextStatus,
      },
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'Staff/Vendor ID',
      'Full Name',
      'Category',
      'Department',
      'Designation',
      'Engagement Date',
      'Contract Expiry',
      'Emergency Contact',
      'Phone',
      'HR Clearance Status',
    ];

    const rows = partners.map((p) => [
      `"${p.hrDetails?.staffIdOrCode || 'N/A'}"`,
      `"${p.name}"`,
      `"${CATEGORY_LABELS[p.category] || p.category}"`,
      `"${p.department || 'N/A'}"`,
      `"${p.designation || 'N/A'}"`,
      `"${p.hrDetails?.dateOfEngagement || p.generatedDate}"`,
      `"${p.hrDetails?.contractEndDate || 'Permanent'}"`,
      `"${p.hrDetails?.emergencyContact?.fullName || 'N/A'} (${p.hrDetails?.emergencyContact?.relationship || ''})"`,
      `"${p.hrDetails?.emergencyContact?.phoneNumber || 'N/A'}"`,
      `"${p.hrDetails?.hrClearanceStatus || 'Under Review'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HR_Personnel_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Department Banner & Overview Cards */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-400">
              <Building className="w-4 h-4" />
              <span>{(activeOrg?.name || 'Univision design and Construction Ltd.').toUpperCase()}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white">
              Human Resources Directorate · Personnel &amp; Credentials
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Workforce profiling, staff credentials repository, and personnel governance across all organizational divisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenOfficialsManager?.('HR')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-lg text-xs font-semibold border border-emerald-700/80 transition shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manage HR Officials &amp; Controls</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Roster (CSV)
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal('permanent_employee')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Personnel Profile
            </button>
          </div>
        </div>

        {/* HR Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pt-3 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setHrSubTab('roster')}
            className={`pb-2.5 pt-1.5 px-3.5 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              hrSubTab === 'roster'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Personnel Roster ({partners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setHrSubTab('credentials')}
            className={`pb-2.5 pt-1.5 px-3.5 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              hrSubTab === 'credentials'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-blue-400" />
            <span>Document Inventory for Staff Credentials ({credentials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setHrSubTab('audit_trail')}
            className={`pb-2.5 pt-1.5 px-3.5 font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              hrSubTab === 'audit_trail'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Personnel Profiling &amp; Audit Trail · Who Did What ({auditLogs.length})</span>
          </button>
        </div>

        {/* 5-Metric Quick Tiles (Shown on Roster tab) */}
        {hrSubTab === 'roster' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-1">
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <div className="text-[11px] font-medium text-slate-400">Total Workforce</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Active profiled members</div>
            </div>

            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <div className="text-[11px] font-medium text-emerald-400">Permanent Staff</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{permanentCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Full-time payroll</div>
            </div>

            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <div className="text-[11px] font-medium text-blue-400">Contract Staff</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{contractCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Project fixed-term</div>
            </div>

            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
              <div className="text-[11px] font-medium text-purple-400">Subcontractors</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{subcontractorCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Trade &amp; site vendors</div>
            </div>

            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-medium text-amber-400">HR Cleared</div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {clearedCount}/{totalCount}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {Math.round((clearedCount / (totalCount || 1)) * 100)}% Verified
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUB-TAB 2: CREDENTIALS INVENTORY & DOCUMENT VAULT */}
      {hrSubTab === 'credentials' && (
        <StaffCredentialsInventory
          credentials={credentials}
          partners={partners}
          activeOfficial={activeOfficial}
          onAddCredential={onAddCredential || (() => {})}
          onUpdateCredential={onUpdateCredential || (() => {})}
          onDeleteCredential={onDeleteCredential || (() => {})}
        />
      )}

      {/* SUB-TAB 3: GOVERNANCE, OFFICIALS & ACTIVITY AUDIT TRAIL */}
      {hrSubTab === 'audit_trail' && (
        <div className="space-y-6">
          <AuditTrailViewer
            auditLogs={auditLogs}
            officials={officials}
            activeOfficial={activeOfficial}
          />
        </div>
      )}

      {/* SUB-TAB 1: PERSONNEL ROSTER TABLE */}
      {hrSubTab === 'roster' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, staff ID, role, or department..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>

              {/* Category Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Categories ({totalCount})</option>
                  <option value="executive_partner">Executive &amp; Partners ({execCount})</option>
                  <option value="permanent_employee">Permanent Employees ({permanentCount})</option>
                  <option value="contract_staff">Contract Staff ({contractCount})</option>
                  <option value="subcontractor">Subcontractors ({subcontractorCount})</option>
                </select>

                <select
                  value={clearanceFilter}
                  onChange={(e) => setClearanceFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">Clearance: All</option>
                  <option value="cleared">Fully Cleared</option>
                  <option value="pending">Pending Documents</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Pill Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap mr-1">Quick view:</span>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('permanent_employee')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  categoryFilter === 'permanent_employee'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Permanent ({permanentCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('contract_staff')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  categoryFilter === 'contract_staff'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Contract ({contractCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('subcontractor')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  categoryFilter === 'subcontractor'
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Subcontractors ({subcontractorCount})
              </button>
            </div>
          </div>

          {/* Personnel Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Staff Member &amp; ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Department &amp; Designation</th>
                    <th className="py-3 px-4">Engagement &amp; Term</th>
                    <th className="py-3 px-4">Emergency Contact</th>
                    <th className="py-3 px-4">Clearance Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No personnel found matching the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => {
                      const badge =
                        CATEGORY_BADGE_STYLES[partner.category] || CATEGORY_BADGE_STYLES.permanent_employee;
                      const hr = partner.hrDetails;
                      const isCleared = hr?.hrClearanceStatus === 'Fully Cleared';

                      return (
                        <tr
                          key={partner.id}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                          onClick={() => onSelectPartner(partner.id)}
                        >
                          {/* Name & ID */}
                          <td className="py-3.5 px-4 font-medium">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {partner.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {hr?.staffIdOrCode || partner.id}
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {CATEGORY_LABELS[partner.category] || partner.category}
                            </span>
                          </td>

                          {/* Department & Role */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{partner.designation}</div>
                            <div className="text-slate-400 text-[11px]">{partner.department}</div>
                          </td>

                          {/* Engagement & Term */}
                          <td className="py-3.5 px-4">
                            <div>{hr?.dateOfEngagement || partner.generatedDate}</div>
                            <div className="text-slate-400 text-[10px]">
                              {hr?.contractEndDate ? `Expires: ${hr.contractEndDate}` : 'Permanent Contract'}
                            </div>
                          </td>

                          {/* Emergency Contact */}
                          <td className="py-3.5 px-4">
                            {hr?.emergencyContact?.fullName ? (
                              <div>
                                <div className="font-medium text-slate-800">
                                  {hr.emergencyContact.fullName}
                                  {hr.emergencyContact.relationship && (
                                    <span className="text-slate-400 text-[10px] ml-1">
                                      ({hr.emergencyContact.relationship})
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-[10px]">
                                  {hr.emergencyContact.phoneNumber}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic">No contact on file</span>
                            )}
                          </td>

                          {/* Clearance Status */}
                          <td
                            className="py-3.5 px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleClearance(partner);
                            }}
                          >
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                isCleared
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                              title="Click to toggle HR clearance status"
                            >
                              {isCleared ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{hr?.hrClearanceStatus || 'Under Review'}</span>
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectPartner(partner.id)}
                                title="View Corporate Dossier"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs transition"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Dossier</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingPartner(partner)}
                                title="Edit HR Personnel Record"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit HR Record Modal */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit HR Record · {editingPartner.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Update official employee/subcontractor classification, contacts, and clearance status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);

                onUpdatePartner(editingPartner.id, {
                  category: fd.get('category') as PersonnelCategory,
                  department: fd.get('department') as string,
                  designation: fd.get('designation') as string,
                  hrDetails: {
                    ...(editingPartner.hrDetails || {
                      staffIdOrCode: '',
                      dateOfEngagement: editingPartner.generatedDate,
                      reportingSupervisor: '',
                      workLocation: '',
                      emergencyContact: { fullName: '', relationship: '', phoneNumber: '' },
                      backgroundCheckVerified: true,
                      signedAgreementOnRecord: true,
                      hrOfficerSignatory: 'Head of HR',
                      hrSignDate: editingPartner.generatedDate,
                    }),
                    staffIdOrCode: fd.get('staffIdOrCode') as string,
                    dateOfEngagement: fd.get('dateOfEngagement') as string,
                    contractEndDate: fd.get('contractEndDate') as string,
                    reportingSupervisor: fd.get('reportingSupervisor') as string,
                    workLocation: fd.get('workLocation') as string,
                    hrClearanceStatus: fd.get('hrClearanceStatus') as any,
                    emergencyContact: {
                      fullName: fd.get('emergencyContactName') as string,
                      relationship: fd.get('emergencyContactRel') as string,
                      phoneNumber: fd.get('emergencyContactPhone') as string,
                      address: fd.get('emergencyContactAddr') as string,
                    },
                  },
                });

                setEditingPartner(null);
              }}
              className="p-4 sm:p-5 space-y-4 text-xs"
            >
              {/* Category & IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Personnel Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingPartner.category}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="permanent_employee">Permanent Employee (Full-Time)</option>
                    <option value="subcontractor">Subcontractor / Trade Vendor</option>
                    <option value="contract_staff">Contract Staff (Fixed Term)</option>
                    <option value="executive_partner">Executive &amp; Partner</option>
                    <option value="casual_intern">Casual / Intern / Apprentice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff ID / Subcontractor Code
                  </label>
                  <input
                    type="text"
                    name="staffIdOrCode"
                    defaultValue={editingPartner.hrDetails?.staffIdOrCode || ''}
                    placeholder="e.g. EMP-2026-004 or SUB-ELEC-4401"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department / Division
                  </label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={editingPartner.department || ''}
                    placeholder="e.g. Civil Engineering / Operations"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Designation / Role Title
                  </label>
                  <input
                    type="text"
                    name="designation"
                    defaultValue={editingPartner.designation || ''}
                    placeholder="e.g. Senior Project Architect"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Engagement Date & Contract End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date of Engagement
                  </label>
                  <input
                    type="text"
                    name="dateOfEngagement"
                    defaultValue={editingPartner.hrDetails?.dateOfEngagement || editingPartner.generatedDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contract Expiry Date (Empty for Permanent)
                  </label>
                  <input
                    type="text"
                    name="contractEndDate"
                    defaultValue={editingPartner.hrDetails?.contractEndDate || ''}
                    placeholder="e.g. December 31, 2027 or leave empty"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Supervisor & Work Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reporting Supervisor
                  </label>
                  <input
                    type="text"
                    name="reportingSupervisor"
                    defaultValue={editingPartner.hrDetails?.reportingSupervisor || ''}
                    placeholder="e.g. Chief Executive Officer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Work Location / Site Duty
                  </label>
                  <input
                    type="text"
                    name="workLocation"
                    defaultValue={editingPartner.hrDetails?.workLocation || 'Headquarters & Sites'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Next of Kin / Emergency Contact Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      defaultValue={editingPartner.hrDetails?.emergencyContact?.fullName || ''}
                      placeholder="Full Name"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Relationship</label>
                    <input
                      type="text"
                      name="emergencyContactRel"
                      defaultValue={editingPartner.hrDetails?.emergencyContact?.relationship || ''}
                      placeholder="e.g. Spouse / Sibling"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Phone Number</label>
                    <input
                      type="text"
                      name="emergencyContactPhone"
                      defaultValue={editingPartner.hrDetails?.emergencyContact?.phoneNumber || ''}
                      placeholder="+220 ..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Physical Residential Address</label>
                  <input
                    type="text"
                    name="emergencyContactAddr"
                    defaultValue={editingPartner.hrDetails?.emergencyContact?.address || ''}
                    placeholder="e.g. Brusubi Phase 2, WCR"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Clearance Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HR Clearance &amp; Vetting Status
                </label>
                <select
                  name="hrClearanceStatus"
                  defaultValue={editingPartner.hrDetails?.hrClearanceStatus || 'Fully Cleared'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Fully Cleared">Fully Cleared (Background &amp; Documents Verified)</option>
                  <option value="Pending Documents">Pending Documents (Awaiting ID / Certs)</option>
                  <option value="Under Review">Under Review (HR Audit in progress)</option>
                </select>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Save HR Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
