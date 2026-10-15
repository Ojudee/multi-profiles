import React, { useState } from 'react';
import {
  StaffCredentialItem,
  CredentialType,
  CREDENTIAL_TYPE_LABELS,
  PartnerRecord,
  CorporateOfficial,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
} from '../types';
import {
  FileText,
  ShieldCheck,
  Award,
  Calendar,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Trash2,
  X,
  Upload,
  UserCheck,
  FileCheck,
  Building,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

interface StaffCredentialsInventoryProps {
  credentials: StaffCredentialItem[];
  partners: PartnerRecord[];
  activeOfficial: CorporateOfficial | null;
  onAddCredential: (credential: StaffCredentialItem) => void;
  onUpdateCredential: (id: string, updates: Partial<StaffCredentialItem>) => void;
  onDeleteCredential: (id: string) => void;
}

export const StaffCredentialsInventory: React.FC<StaffCredentialsInventoryProps> = ({
  credentials,
  partners,
  activeOfficial,
  onAddCredential,
  onUpdateCredential,
  onDeleteCredential,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewCredential, setPreviewCredential] = useState<StaffCredentialItem | null>(null);

  // New Credential Form State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(partners[0]?.id || '');
  const [credentialType, setCredentialType] = useState<CredentialType>('academic_degree');
  const [title, setTitle] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [documentImagePreview, setDocumentImagePreview] = useState<string | null>(null);

  // Metrics
  const totalCount = credentials.length;
  const verifiedCount = credentials.filter((c) => c.status === 'verified').length;
  const validCount = credentials.filter((c) => c.status === 'valid' || c.status === 'verified').length;
  const expiringCount = credentials.filter((c) => c.status === 'expiring_soon').length;
  const degreesCount = credentials.filter((c) => c.credentialType === 'academic_degree').length;
  const licensesCount = credentials.filter((c) => c.credentialType === 'professional_license' || c.credentialType === 'trade_license_hse').length;

  // Filtered List
  const filteredCredentials = credentials.filter((c) => {
    const matchesSearch =
      c.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.documentNumber && c.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || c.credentialType === typeFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesStaff = staffFilter === 'all' || c.staffId === staffFilter;

    return matchesSearch && matchesType && matchesStatus && matchesStaff;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setDocumentImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCredential = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = partners.find((p) => p.id === selectedStaffId);
    if (!partner || !title.trim() || !issuingAuthority.trim()) return;

    const newCred: StaffCredentialItem = {
      id: `cred-${Date.now()}`,
      orgId: partner.orgId || 'org-univision',
      staffId: partner.id,
      staffName: partner.name,
      department: partner.department || 'Operations',
      category: partner.category,
      credentialType,
      title,
      issuingAuthority,
      documentNumber: documentNumber || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      expiryDate: expiryDate || undefined,
      status: 'verified',
      verifiedBy: activeOfficial ? `${activeOfficial.name} (${activeOfficial.roleTitle})` : 'Fatou Binta Sallah (HR Director)',
      verificationDate: new Date().toISOString().slice(0, 10),
      documentImageUrl: documentImagePreview,
      notes,
    };

    onAddCredential(newCred);
    setIsAddModalOpen(false);
    // Reset Form
    setTitle('');
    setIssuingAuthority('');
    setDocumentNumber('');
    setExpiryDate('');
    setNotes('');
    setDocumentImagePreview(null);
  };

  const handleToggleVerify = (cred: StaffCredentialItem) => {
    if (cred.status === 'verified') {
      onUpdateCredential(cred.id, {
        status: 'valid',
        verifiedBy: undefined,
        verificationDate: undefined,
      });
    } else {
      onUpdateCredential(cred.id, {
        status: 'verified',
        verifiedBy: activeOfficial ? `${activeOfficial.name} (${activeOfficial.roleTitle})` : 'Head of Human Resources',
        verificationDate: new Date().toISOString().slice(0, 10),
      });
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Staff Name',
      'Category',
      'Department',
      'Credential Type',
      'Document Title',
      'Issuing Authority',
      'Document / License Number',
      'Issue Date',
      'Expiry Date',
      'Status',
      'Verified By',
      'Verification Date',
      'Notes',
    ];

    const rows = credentials.map((c) => [
      `"${c.staffName}"`,
      `"${CATEGORY_LABELS[c.category] || c.category}"`,
      `"${c.department}"`,
      `"${CREDENTIAL_TYPE_LABELS[c.credentialType] || c.credentialType}"`,
      `"${c.title}"`,
      `"${c.issuingAuthority}"`,
      `"${c.documentNumber || 'N/A'}"`,
      `"${c.issueDate}"`,
      `"${c.expiryDate || 'Non-expiring / Permanent'}"`,
      `"${c.status.toUpperCase()}"`,
      `"${c.verifiedBy || 'Pending'}"`,
      `"${c.verificationDate || 'N/A'}"`,
      `"${c.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Staff_Credentials_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Credentials</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-1 text-white">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Archived in HR vault</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Verified Documents</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold mt-1 text-emerald-950">{verifiedCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            {Math.round((verifiedCount / (totalCount || 1)) * 100)}% Officer authenticated
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Degrees &amp; Diplomas</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">{degreesCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tertiary degree records</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Engineering &amp; Licenses</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold mt-1 text-purple-950">{licensesCount}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-0.5">Practicing &amp; HSE cards</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Expiring &amp; Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold mt-1 text-amber-900">{expiringCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Scheduled for renewal</div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and Add Button */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by staff name, credential title, document number, or institution..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              title="Export Credentials to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Attach Credential</span>
            </button>
          </div>
        </div>

        {/* Granular Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Filter by Staff Member
            </label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Personnel ({partners.length})</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({CATEGORY_LABELS[p.category] || p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Filter by Credential Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Credential Types</option>
              {Object.entries(CREDENTIAL_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Filter by Verification Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">Verified by Officer</option>
              <option value="valid">Valid (Unverified)</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="missing">Missing Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Credentials Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Staff Credentials Inventory &amp; Qualifications Vault
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Statutory academic diplomas, engineering licenses, national passports, contracts, and safety certifications.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Showing {filteredCredentials.length} of {credentials.length} credentials
          </span>
        </div>

        {filteredCredentials.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No matching credentials found in inventory</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or attach a new staff qualification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Staff Member &amp; Category</th>
                  <th className="py-3 px-4">Credential Title &amp; Authority</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Document / License No.</th>
                  <th className="py-3 px-4">Validity &amp; Expiry</th>
                  <th className="py-3 px-4">Status &amp; Verification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCredentials.map((cred) => {
                  const badge = CATEGORY_BADGE_STYLES[cred.category] || CATEGORY_BADGE_STYLES.permanent_employee;
                  const isVerified = cred.status === 'verified';

                  return (
                    <tr key={cred.id} className="hover:bg-slate-50/80 transition">
                      {/* Staff Details */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-bold text-slate-900 text-xs">{cred.staffName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {CATEGORY_LABELS[cred.category] || cred.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{cred.department}</span>
                        </div>
                      </td>

                      {/* Title & Authority */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">{cred.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cred.issuingAuthority}</span>
                        </div>
                      </td>

                      {/* Credential Type */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {CREDENTIAL_TYPE_LABELS[cred.credentialType] || cred.credentialType}
                        </span>
                      </td>

                      {/* Document Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-blue-900 text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {cred.documentNumber || 'ON FILE'}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div>Issued: {cred.issueDate}</div>
                        <div className="text-slate-500 mt-0.5">
                          {cred.expiryDate ? (
                            <span className="text-amber-800 font-semibold">Expires: {cred.expiryDate}</span>
                          ) : (
                            <span className="text-slate-400">Non-expiring</span>
                          )}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified
                            </span>
                            {cred.verifiedBy && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                By {cred.verifiedBy}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Valid Record
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {cred.documentImageUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewCredential(cred)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Document Scan / Certificate"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleVerify(cred)}
                            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                              isVerified
                                ? 'text-emerald-700 hover:bg-emerald-50'
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                            title={isVerified ? 'Revoke Verification' : 'Authenticate as Verified'}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteCredential(cred.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Remove Credential"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / ATTACH NEW STAFF CREDENTIAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    HR CREDENTIALS VAULT
                  </div>
                  <h3 className="text-base font-bold text-white">Attach New Staff Credential</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="p-5 space-y-4 text-xs">
              {/* Select Staff Member */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Staff Member / Subcontractor *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  required
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.department} ({CATEGORY_LABELS[p.category] || p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Credential Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Credential Classification *
                  </label>
                  <select
                    value={credentialType}
                    onChange={(e) => setCredentialType(e.target.value as CredentialType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {Object.entries(CREDENTIAL_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Document Title / Degree Name *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. B.Sc. Civil Engineering (Hons)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Issuing Authority & Doc Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Issuing Authority / Institution *
                  </label>
                  <input
                    type="text"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    placeholder="e.g. Kwame Nkrumah University / GCRE"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Document / License Number
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="e.g. GCRE-REG-2024-881"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Issue Date & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date of Issue *
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank for permanent / non-expiring credentials</span>
                </div>
              </div>

              {/* Document Image / Certificate Upload */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Attach Scanned Certificate / Document Image
                  </span>
                  {documentImagePreview && (
                    <button
                      type="button"
                      onClick={() => setDocumentImagePreview(null)}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {documentImagePreview ? (
                    <div className="w-24 h-16 bg-white border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center p-1">
                      <img
                        src={documentImagePreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload Document Image...</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Verification Notes / Transcript Remarks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Certified true copy authenticated by registrar; mandatory statutory practicing license."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs transition"
                >
                  Save &amp; Verify Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DOCUMENT PREVIEW LIGHTBOX */}
      {previewCredential && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  DOCUMENT SCAN PREVIEW
                </div>
                <h4 className="text-sm font-bold text-white">{previewCredential.title}</h4>
                <div className="text-[11px] text-slate-400">
                  {previewCredential.staffName} · {previewCredential.issuingAuthority}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCredential(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 bg-slate-100 overflow-auto flex items-center justify-center min-h-[360px]">
              {previewCredential.documentImageUrl ? (
                <img
                  src={previewCredential.documentImageUrl}
                  alt={previewCredential.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md border border-slate-300 bg-white"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">Physical Document on Corporate File</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Document Ref: {previewCredential.documentNumber || 'ARCHIVED'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">Verified by:</span>{' '}
                {previewCredential.verifiedBy || 'Head of Human Resources'} on{' '}
                {previewCredential.verificationDate || previewCredential.issueDate}
              </div>
              <button
                type="button"
                onClick={() => setPreviewCredential(null)}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold"
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
