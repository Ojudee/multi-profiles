import React, { useState } from 'react';
import {
  Organization,
  OrganizationHeaderConfig,
  OrganizationFooterConfig,
} from '../types';
import {
  Building,
  Upload,
  Image,
  Save,
  Check,
  X,
  Plus,
  Palette,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowRight,
  LogOut,
  Settings,
  Mail,
  Phone,
  MapPin,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface OrganizationPortalModalProps {
  isOpen: boolean;
  organizations: Organization[];
  activeOrg: Organization;
  onSelectOrganization: (orgId: string) => void;
  onCreateOrganization: (newOrg: Organization) => void;
  onUpdateOrganization: (orgId: string, updates: Partial<Organization>) => void;
  onClose: () => void;
}

export const OrganizationPortalModal: React.FC<OrganizationPortalModalProps> = ({
  isOpen,
  organizations,
  activeOrg,
  onSelectOrganization,
  onCreateOrganization,
  onUpdateOrganization,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'switch_portal' | 'branding_settings' | 'create_org'>(
    'branding_settings'
  );

  // Form states for active org customization
  const [companyName, setCompanyName] = useState(activeOrg.headerConfig.companyName);
  const [tagline, setTagline] = useState(activeOrg.tagline || '');
  const [documentTitle, setDocumentTitle] = useState(activeOrg.headerConfig.documentTitle);
  const [subheading, setSubheading] = useState(activeOrg.headerConfig.subheading);
  const [registrationNumber, setRegistrationNumber] = useState(
    activeOrg.headerConfig.registrationNumber || ''
  );
  const [taxJurisdiction, setTaxJurisdiction] = useState(
    activeOrg.headerConfig.taxJurisdiction || ''
  );
  const [address, setAddress] = useState(activeOrg.headerConfig.address || '');
  const [accentColor, setAccentColor] = useState(activeOrg.headerConfig.accentColor || '#0f172a');

  const [confidentialityNotice, setConfidentialityNotice] = useState(
    activeOrg.footerConfig.confidentialityNotice
  );
  const [complianceNotice, setComplianceNotice] = useState(
    activeOrg.footerConfig.complianceNotice
  );
  const [contactEmail, setContactEmail] = useState(activeOrg.footerConfig.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(activeOrg.footerConfig.contactPhone || '');

  const [logoPreview, setLogoPreview] = useState<string | null>(activeOrg.logoUrl);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // New Organization form state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgTagline, setNewOrgTagline] = useState('');
  const [newOrgRegNo, setNewOrgRegNo] = useState('');

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        onUpdateOrganization(activeOrg.id, { logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedHeader: OrganizationHeaderConfig = {
      companyName,
      documentTitle,
      subheading,
      registrationNumber,
      taxJurisdiction,
      address,
      accentColor,
    };

    const updatedFooter: OrganizationFooterConfig = {
      confidentialityNotice,
      complianceNotice,
      contactEmail,
      contactPhone,
    };

    onUpdateOrganization(activeOrg.id, {
      name: companyName,
      tagline,
      logoUrl: logoPreview,
      headerConfig: updatedHeader,
      footerConfig: updatedFooter,
    });

    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleCreateNewOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const newSlug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: newOrgName,
      slug: newSlug,
      tagline: newOrgTagline || 'Corporate Enterprise & Infrastructure Services',
      logoUrl: null,
      headerConfig: {
        companyName: newOrgName,
        documentTitle: 'Company Profiles',
        subheading: 'Human Resources & Financial Accounts Portal',
        registrationNumber: newOrgRegNo || `CR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        taxJurisdiction: 'Kanifing Commercial Center · GRA',
        address: 'Banjul / KMC Office',
        accentColor: '#1e3a8a',
      },
      footerConfig: {
        confidentialityNotice: `Confidential Internal Corporate Dossier — ${newOrgName}.`,
        complianceNotice: 'Issued in accordance with statutory labor & revenue provisions.',
        contactEmail: 'info@' + (newSlug.slice(0, 12) || 'corporate') + '.gm',
        contactPhone: '+220 700 0000',
      },
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onCreateOrganization(newOrg);
    onSelectOrganization(newOrg.id);
    setActiveTab('branding_settings');
    setNewOrgName('');
    setNewOrgTagline('');
    setNewOrgRegNo('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                MULTI-ORGANIZATIONAL PLATFORM
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Organization Portal &amp; Branding Manager
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

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('branding_settings')}
            className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'branding_settings'
                ? 'border-blue-600 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Company Logo &amp; Header / Footer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('switch_portal')}
            className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'switch_portal'
                ? 'border-blue-600 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Switch Organization Portal ({organizations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create_org')}
            className={`pb-2.5 pt-1 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'create_org'
                ? 'border-blue-600 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Organization</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 text-xs">
          {/* TAB 1: BRANDING, LOGO & CUSTOMIZABLE HEADER / FOOTER */}
          {activeTab === 'branding_settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Active Organization Alert */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-blue-950">
                    Active Organization: {activeOrg.name}
                  </span>
                </div>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-mono font-bold">
                  {activeOrg.headerConfig.registrationNumber || 'REGISTERED'}
                </span>
              </div>

              {/* 1. Company Logo Upload Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Image className="w-4 h-4 text-blue-700" />
                      Company Logo Upload
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload your corporate emblem (PNG, JPG, SVG). Automatically appears on headers, dossiers, and printed documents.
                    </p>
                  </div>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        onUpdateOrganization(activeOrg.id, { logoUrl: null });
                      }}
                      className="text-[10px] text-red-600 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to Vector
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Logo Preview Container */}
                  <div className="w-48 h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2 overflow-hidden shadow-2xs">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Company Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-[11px] text-slate-400">
                        <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                        <span>No Custom Logo Uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Logo File...</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Recommended: Transparent PNG or SVG, minimum 300x80px for high-dpi print sharpness.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Customizable Headers */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  Customizable Header Configuration
                </h3>
                <p className="text-[11px] text-slate-500">
                  Defines the company name, top heading, corporate code, and stationery metadata rendered on all dossiers and print-outs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Legal Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Univision design and Construction Ltd."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tagline / Scope
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Architectural Design, Civil Infrastructure & General Construction"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Dossier Header Title
                    </label>
                    <input
                      type="text"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="Company Profiles"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Header Subtitle
                    </label>
                    <input
                      type="text"
                      value={subheading}
                      onChange={(e) => setSubheading(e.target.value)}
                      placeholder="Human Resources & Corporate Financial Accounts Portal"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Registration / Trade Certificate No.
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="CR-2024-UNIV-9921"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tax Jurisdiction / Office
                    </label>
                    <input
                      type="text"
                      value={taxJurisdiction}
                      onChange={(e) => setTaxJurisdiction(e.target.value)}
                      placeholder="Kanifing Division · Gambia Revenue Authority (GRA)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Physical Registered Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Kairaba Avenue, PMB 4410, Banjul / KMC"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Customizable Footers */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Customizable Footer Configuration
                </h3>
                <p className="text-[11px] text-slate-500">
                  Appears at the bottom of official dossier pages, audit reports, and printed statutory forms.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Confidentiality Disclaimer
                    </label>
                    <input
                      type="text"
                      value={confidentialityNotice}
                      onChange={(e) => setConfidentialityNotice(e.target.value)}
                      placeholder="Confidential Internal Corporate Dossier — Univision design and Construction Ltd."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Statutory Compliance Notice
                    </label>
                    <input
                      type="text"
                      value={complianceNotice}
                      onChange={(e) => setComplianceNotice(e.target.value)}
                      placeholder="Issued pursuant to statutory labor laws and statutory taxation requirements."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Corporate Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="univision0111@gmail.com"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Corporate Phone / Switchboard
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+220 701 4492 / +220 334 9100"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Save & Feedback */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                {isSavedFeedback ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Branding &amp; Header/Footer Saved Successfully!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    Live updates apply to all dossiers and print windows instantly.
                  </span>
                )}

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Branding Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SWITCH PORTAL (INDEPENDENT LOGIN PORTALS) */}
          {activeTab === 'switch_portal' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Select Independent Organization Portal
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Each organization maintains independent personnel profiles, accounts ledgers, custom branding, and staff credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {organizations.map((org) => {
                  const isActive = org.id === activeOrg.id;
                  return (
                    <div
                      key={org.id}
                      className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                          {org.logoUrl ? (
                            <img
                              src={org.logoUrl}
                              alt={org.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Building className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{org.name}</h4>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded font-bold uppercase">
                                Active Portal
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {org.tagline || 'General Building, Civil Engineering & Project Management'}
                          </p>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            Reg: {org.headerConfig.registrationNumber || 'CR-001'} · Tax: {org.headerConfig.taxJurisdiction}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isActive ? (
                          <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                            <Check className="w-4 h-4 text-blue-600" />
                            Logged In
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectOrganization(org.id);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition flex items-center gap-1"
                          >
                            <span>Enter Portal</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW INDEPENDENT ORGANIZATION */}
          {activeTab === 'create_org' && (
            <form onSubmit={handleCreateNewOrgSubmit} className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Register New Independent Organization
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Provisions an isolated company workspace with independent portal login, branding, personnel inventory, and accounts ledgers.
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Company / Organization Name *
                  </label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Skyline Structural Engineering Ltd."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Industry Tagline / Sub-heading
                  </label>
                  <input
                    type="text"
                    value={newOrgTagline}
                    onChange={(e) => setNewOrgTagline(e.target.value)}
                    placeholder="e.g. Civil Infrastructure & Commercial Real Estate"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Corporate Registration Number
                  </label>
                  <input
                    type="text"
                    value={newOrgRegNo}
                    onChange={(e) => setNewOrgRegNo(e.target.value)}
                    placeholder="e.g. CR-2026-ENG-4402"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch_portal')}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Organization Portal</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
