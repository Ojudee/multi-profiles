import React, { useState, useEffect } from 'react';
import {
  PartnerRecord,
  PersonnelCategory,
  CATEGORY_LABELS,
  DepartmentRole,
  PrintSectionSelection,
  DEFAULT_PRINT_SELECTION,
  HR_ONLY_PRINT_SELECTION,
  ACCOUNTS_ONLY_PRINT_SELECTION,
  STATUTORY_ID_PRINT_SELECTION,
  Organization,
  CorporateOfficial,
  AuditLogEntry,
  StaffCredentialItem,
  AuditActionType,
  AuthSession,
  WorkspaceInvitation,
  OfficialPermissions,
  DEFAULT_HR_PERMISSIONS,
  DEFAULT_ACCOUNTS_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from './types';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_OFFICIALS,
  INITIAL_STAFF_CREDENTIALS,
  INITIAL_AUDIT_LOG,
} from './data/organizationData';
import { DocumentViewer } from './components/DocumentViewer';
import { PartnerManager } from './components/PartnerManager';
import { HRWorkspace } from './components/HRWorkspace';
import { AccountsWorkspace } from './components/AccountsWorkspace';
import { NewProfileModal } from './components/NewProfileModal';
import { OrganizationPortalModal } from './components/OrganizationPortalModal';
import { OfficialsManagerModal } from './components/OfficialsManagerModal';
import { InvitationManagerModal } from './components/InvitationManagerModal';
import { AuthPortal } from './components/AuthPortal';
import { SCANNED_PARTNERS } from './data/partnersData';
import { generateProfileAvatar } from './utils/documentGraphics';
import {
  loadPartnersFromStorage,
  savePartnersToStorage,
  clearPartnersFromStorage,
} from './utils/storage';
import {
  generateAndDownloadPdf,
  downloadStandaloneHtmlDossier,
  openPrintDialogWindow,
} from './utils/printAndPdf';
import {
  FileText,
  Printer,
  Upload,
  Plus,
  Building,
  Shield,
  Users,
  CheckCircle2,
  Download,
  AlertTriangle,
  FileCode,
  Loader2,
  X,
  CreditCard,
  Briefcase,
  Layers,
  ChevronDown,
  SlidersHorizontal,
  Lock,
  Unlock,
  Settings,
  UserCheck,
  History,
  Image,
  LogOut,
  UserPlus,
  Key,
  Crown,
} from 'lucide-react';

type TabType = 'document' | 'hr' | 'accounts' | 'registry';

const INITIAL_INVITATIONS: WorkspaceInvitation[] = [];

export default function App() {
  const [partners, setPartners] = useState<PartnerRecord[]>(SCANNED_PARTNERS);
  const [activePartnerId, setActivePartnerId] = useState<string>(SCANNED_PARTNERS[0].id);
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Authentication Session State (Gating the application on load - starts with login portal first)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  // Multi-Organizational State
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const raw = localStorage.getItem('univision_organizations_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.filter((o) => o && o.id !== 'org-apex');
          if (sanitized.length > 0) return sanitized;
        }
      }
    } catch {}
    return INITIAL_ORGANIZATIONS;
  });
  const [activeOrgId, setActiveOrgId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('univision_active_org_id');
      if (saved && saved !== 'org-apex') return saved;
    } catch {}
    return INITIAL_ORGANIZATIONS[0].id;
  });

  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];

  // HR & Accounts Officials & Roles (Starts clean with no demo accounts)
  const [officials, setOfficials] = useState<CorporateOfficial[]>(() => {
    try {
      const raw = localStorage.getItem('univision_officials_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Remove legacy demo accounts
          const sanitized = parsed.filter(
            (o) =>
              o &&
              !o.id.startsWith('off-univision-admin') &&
              !o.id.startsWith('off-fatou-sallah') &&
              !o.id.startsWith('off-pa-jallow') &&
              !o.id.startsWith('off-aminata-bah') &&
              !o.id.startsWith('off-ebrima-sonko')
          );
          return sanitized;
        }
      }
    } catch {}
    return INITIAL_OFFICIALS;
  });
  const [activeOfficialId, setActiveOfficialId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('univision_active_official_id');
      if (
        saved &&
        !saved.startsWith('off-univision-admin') &&
        !saved.startsWith('off-fatou') &&
        !saved.startsWith('off-pa') &&
        !saved.startsWith('off-aminata') &&
        !saved.startsWith('off-ebrima')
      ) {
        return saved;
      }
    } catch {}
    return '';
  });

  const activeOfficial: CorporateOfficial | null =
    officials.find((o) => o.id === activeOfficialId) ||
    officials[0] ||
    (authSession
      ? {
          id: authSession.officialId,
          orgId: authSession.orgId,
          name: authSession.name,
          email: authSession.email,
          phone: '',
          department: authSession.department,
          roleTitle: authSession.roleTitle,
          badgeNumber: `${authSession.department.toUpperCase()}-DIR-001`,
          isActive: true,
          isVerified: true,
          permissions: FULL_ADMIN_PERMISSIONS,
          createdAt: new Date().toISOString().slice(0, 10),
        }
      : null);

  // Workspace Invitations State (Starts clean with no demo invitations)
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>(() => {
    try {
      const raw = localStorage.getItem('univision_workspace_invitations_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter(
            (inv) => inv && !inv.id.startsWith('inv-init-')
          );
          return sanitized;
        }
      }
    } catch {}
    return INITIAL_INVITATIONS;
  });

  // Activity Audit Log
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const raw = localStorage.getItem('univision_audit_logs_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter(
            (log) => log && !log.id.startsWith('log-00')
          );
          return sanitized;
        }
      }
    } catch {}
    return INITIAL_AUDIT_LOG;
  });

  // Staff Credentials Inventory
  const [credentials, setCredentials] = useState<StaffCredentialItem[]>(() => {
    try {
      const raw = localStorage.getItem('univision_staff_credentials_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_STAFF_CREDENTIALS;
  });

  // Tab & View Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('document');
  const [docViewMode, setDocViewMode] = useState<'all' | 'single'>('all');

  // Active Department Role (Restricts financial details in HR vs Accounts)
  const [currentRole, setCurrentRole] = useState<DepartmentRole>('accounts');

  // Print Section Selection (User can choose which sections to include/exclude)
  const [printSelection, setPrintSelection] = useState<PrintSectionSelection>(DEFAULT_PRINT_SELECTION);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isOfficialsModalOpen, setIsOfficialsModalOpen] = useState(false);
  const [officialsModalDepartment, setOfficialsModalDepartment] = useState<'All' | 'HR' | 'Accounts'>('All');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newProfileCategoryPreset, setNewProfileCategoryPreset] = useState<PersonnelCategory>('permanent_employee');

  const handleOpenOfficialsModal = (dept: 'All' | 'HR' | 'Accounts' = 'All') => {
    setOfficialsModalDepartment(dept);
    setIsOfficialsModalOpen(true);
  };

  // PDF Export loading
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);

  // Persist Auth Session
  useEffect(() => {
    try {
      if (authSession) {
        localStorage.setItem('univision_auth_session_v1', JSON.stringify(authSession));
      } else {
        localStorage.removeItem('univision_auth_session_v1');
      }
    } catch {}
  }, [authSession]);

  // Persist Multi-Org and Governance state
  useEffect(() => {
    try {
      localStorage.setItem('univision_organizations_v1', JSON.stringify(organizations));
      localStorage.setItem('univision_active_org_id', activeOrgId);
    } catch {}
  }, [organizations, activeOrgId]);

  useEffect(() => {
    try {
      localStorage.setItem('univision_officials_v1', JSON.stringify(officials));
      localStorage.setItem('univision_active_official_id', activeOfficialId);
    } catch {}
  }, [officials, activeOfficialId]);

  useEffect(() => {
    try {
      localStorage.setItem('univision_workspace_invitations_v1', JSON.stringify(invitations));
    } catch {}
  }, [invitations]);

  useEffect(() => {
    try {
      localStorage.setItem('univision_audit_logs_v1', JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('univision_staff_credentials_v1', JSON.stringify(credentials));
    } catch {}
  }, [credentials]);

  // Audit Logger Helper: records who did what with timestamp and operator details
  const addAuditLog = (
    actionType: AuditActionType,
    description: string,
    targetPersonnelId?: string,
    targetPersonnelName?: string
  ) => {
    const operator = activeOfficial || officials[0];
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orgId: activeOrgId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      officialId: operator?.id || 'admin',
      officialName: operator?.name || 'Administrator',
      officialRole: operator?.roleTitle || 'Portal Administrator',
      department: operator?.department || 'HR',
      actionType,
      targetPersonnelId,
      targetPersonnelName,
      description,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Load from storage on initial mount with automatic schema enrichment
  useEffect(() => {
    let mounted = true;
    loadPartnersFromStorage()
      .then((saved) => {
        if (mounted) {
          if (saved && Array.isArray(saved) && saved.length > 0) {
            const enriched: PartnerRecord[] = saved.map((p, idx): PartnerRecord => {
              const matchedScanned = SCANNED_PARTNERS.find((sp) => sp.id === p.id);
              return {
                ...p,
                category: p.category || matchedScanned?.category || 'permanent_employee',
                department: p.department || matchedScanned?.department || 'Operations',
                designation: p.designation || matchedScanned?.designation || 'Corporate Personnel',
                documentTitle: p.documentTitle || 'Company Profiles',
                profilePicture:
                  p.profilePicture ||
                  matchedScanned?.profilePicture ||
                  generateProfileAvatar({ name: p.name, roleTitle: p.designation }),
                contractOrAgreementImage:
                  p.contractOrAgreementImage || matchedScanned?.contractOrAgreementImage || null,
                bankVerificationImage:
                  p.bankVerificationImage || matchedScanned?.bankVerificationImage || null,
                hrDetails: p.hrDetails || matchedScanned?.hrDetails || {
                  staffIdOrCode: `EMP-2026-00${idx + 1}`,
                  dateOfEngagement: p.generatedDate || 'October 6, 2026',
                  reportingSupervisor: 'Project Director',
                  workLocation: 'Central Headquarters & Project Sites',
                  emergencyContact: {
                    fullName: 'Contact on File',
                    relationship: 'Family',
                    phoneNumber: '+220 700 0000',
                  },
                  hrClearanceStatus: 'Fully Cleared',
                  backgroundCheckVerified: true,
                  signedAgreementOnRecord: true,
                  hrOfficerSignatory: 'Fatou Sallah, Head of Human Resources',
                  hrSignDate: p.generatedDate || 'October 6, 2026',
                },
                accountsDetails: {
                  ...(matchedScanned?.accountsDetails || {}),
                  ...(p.accountsDetails || {}),
                  vendorOrTaxIdCode:
                    p.accountsDetails?.vendorOrTaxIdCode ||
                    matchedScanned?.accountsDetails?.vendorOrTaxIdCode ||
                    `ACC-2026-00${idx + 1}`,
                  tinNumber:
                    p.accountsDetails?.tinNumber ||
                    p.extractedData?.taxInformation?.tinNumber ||
                    matchedScanned?.accountsDetails?.tinNumber ||
                    '2000402822',
                  taxOffice:
                    p.accountsDetails?.taxOffice ||
                    p.extractedData?.taxInformation?.taxOffice ||
                    matchedScanned?.accountsDetails?.taxOffice ||
                    'KANIFING',
                  taxRegistrationDate: p.generatedDate || 'October 6, 2026',
                  taxComplianceStatus:
                    p.accountsDetails?.taxComplianceStatus ||
                    matchedScanned?.accountsDetails?.taxComplianceStatus ||
                    'Tax Clearance Certified',
                  bankDetails:
                    p.accountsDetails?.bankDetails ||
                    matchedScanned?.accountsDetails?.bankDetails || {
                      bankName: 'Trust Bank Gambia Ltd',
                      accountName: p.name,
                      accountNumber: '011002938101',
                      currency: 'GMD',
                      paymentMode: 'Direct Deposit / ACH',
                    },
                  compensation:
                    p.accountsDetails?.compensation ||
                    matchedScanned?.accountsDetails?.compensation || {
                      rateType: 'Monthly Salary',
                      amount: 65000,
                      currency: 'GMD',
                      withholdingTaxPct: p.category === 'subcontractor' ? 10 : 0,
                      paymentTerms: 'End of Month Payroll',
                    },
                  subcontractPlan:
                    p.accountsDetails?.subcontractPlan ||
                    matchedScanned?.accountsDetails?.subcontractPlan,
                  payrollAdjustments:
                    p.accountsDetails?.payrollAdjustments ||
                    matchedScanned?.accountsDetails?.payrollAdjustments,
                  accountsControllerSignatory: 'Aminata Bah, Financial Controller',
                  accountsSignDate: p.generatedDate || 'October 6, 2026',
                  accountsClearanceStatus:
                    p.accountsDetails?.accountsClearanceStatus ||
                    matchedScanned?.accountsDetails?.accountsClearanceStatus ||
                    'Payroll Active',
                },
              };
            });

            // Merge in missing enterprise defaults (subcontractors & staff) if user only had initial records
            const hasSubcontractor = enriched.some((p) => p.category === 'subcontractor');
            if (!hasSubcontractor) {
              const missingNewProfiles = SCANNED_PARTNERS.filter(
                (sp) => !enriched.some((p) => p.id === sp.id)
              );
              enriched.push(...missingNewProfiles);
            }

            setPartners(enriched);
            setActivePartnerId(enriched[0]?.id || SCANNED_PARTNERS[0].id);
          } else {
            setPartners(SCANNED_PARTNERS);
            setActivePartnerId(SCANNED_PARTNERS[0].id);
          }
          setIsStorageReady(true);
        }
      })
      .catch((err) => {
        console.warn('Initial storage load error:', err);
        if (mounted) {
          setPartners(SCANNED_PARTNERS);
          setIsStorageReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Save to storage on every change
  useEffect(() => {
    if (!isStorageReady) return;
    savePartnersToStorage(partners).catch((err) => {
      console.warn('Auto-save error:', err);
    });
  }, [partners, isStorageReady]);

  // Authentication Handlers
  const handleLoginSuccess = (session: AuthSession, official: CorporateOfficial, org: Organization) => {
    setAuthSession(session);
    setActiveOfficialId(official.id);
    setActiveOrgId(org.id);
    if (official.department === 'Administrator') {
      setCurrentRole('administrator');
      setCurrentTab('document');
    } else if (official.department === 'Accounts') {
      setCurrentRole('accounts');
      setCurrentTab('accounts');
    } else {
      setCurrentRole('hr');
      setCurrentTab('document');
    }
    addAuditLog(
      'AUTH_LOGIN',
      `Official ${official.name} (${official.roleTitle}) successfully authenticated via corporate email and password.`
    );
  };

  const handleLogout = () => {
    if (activeOfficial) {
      addAuditLog('AUTH_LOGOUT', `Official ${activeOfficial.name} logged out of portal.`);
    }
    setAuthSession(null);
    localStorage.removeItem('univision_auth_session_v1');
  };

  const handleRegisterOrganization = (newOrg: Organization, adminOfficial: CorporateOfficial) => {
    setOrganizations((prev) => [...prev, newOrg]);
    setOfficials((prev) => [...prev, adminOfficial]);
    setActiveOrgId(newOrg.id);
    setActiveOfficialId(adminOfficial.id);
  };

  const handleGenerateInvitation = (invitation: WorkspaceInvitation) => {
    setInvitations((prev) => [invitation, ...prev]);
    addAuditLog(
      'GENERATE_INVITE',
      `Issued workspace invitation link (${invitation.inviteCode}) for ${invitation.designatedRole} in ${invitation.department} Department.`
    );
  };

  const handleRevokeInvitation = (id: string) => {
    const target = invitations.find((i) => i.id === id);
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    if (target) {
      addAuditLog(
        'GENERATE_INVITE',
        `Revoked workspace invitation token (${target.inviteCode}) for ${target.designatedRole}.`
      );
    }
  };

  const handleAcceptInvitation = (invite: WorkspaceInvitation, official: CorporateOfficial) => {
    setInvitations((prev) =>
      prev.map((i) => (i.id === invite.id ? { ...i, status: 'accepted' } : i))
    );
    setOfficials((prev) => [...prev, official]);
    addAuditLog(
      'ACCEPT_INVITE',
      `Invited personnel ${official.name} accepted workspace invitation (${invite.inviteCode}) and registered as ${official.roleTitle}.`
    );
  };

  const handleUpdateOfficialPermissions = (officialId: string, perms: OfficialPermissions) => {
    setOfficials((prev) =>
      prev.map((o) => (o.id === officialId ? { ...o, permissions: perms } : o))
    );
    const target = officials.find((o) => o.id === officialId);
    if (target) {
      addAuditLog(
        'UPDATE_PERMISSIONS',
        `Updated operational permissions for ${target.name} (${target.department} Department).`
      );
    }
  };

  // Personnel Handlers
  const handleOpenAddModal = (preset?: PersonnelCategory) => {
    setNewProfileCategoryPreset(preset || 'permanent_employee');
    setIsNewProfileModalOpen(true);
  };

  const handleAddNewProfile = (newProfile: PartnerRecord) => {
    setPartners((prev) => [...prev, newProfile]);
    setActivePartnerId(newProfile.id);
    setDocViewMode('single');
    setCurrentTab('document');
    addAuditLog(
      'CREATE_PROFILE',
      `Registered official profile for ${newProfile.name} (${CATEGORY_LABELS[newProfile.category] || newProfile.category}).`,
      newProfile.id,
      newProfile.name
    );
  };

  const handleDeletePartner = (id: string) => {
    if (partners.length <= 1) return;
    const target = partners.find((p) => p.id === id);
    const updated = partners.filter((p) => p.id !== id);
    setPartners(updated);
    if (activePartnerId === id) {
      setActivePartnerId(updated[0].id);
    }
    if (target) {
      addAuditLog(
        'DELETE_PROFILE',
        `De-registered personnel record for ${target.name}.`,
        id,
        target.name
      );
    }
  };

  const handleUpdatePartner = (id: string, updates: Partial<PartnerRecord>) => {
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    const target = partners.find((p) => p.id === id);
    if (target) {
      addAuditLog(
        'UPDATE_PROFILE',
        `Updated personnel profile & statutory details for ${target.name}.`,
        id,
        target.name
      );
    }
  };

  const handleResetToScannedPartners = async () => {
    if (
      window.confirm(
        'Reset all personnel and subcontractor profiles back to the verified default enterprise templates?'
      )
    ) {
      await clearPartnersFromStorage();
      setPartners(SCANNED_PARTNERS);
      setActivePartnerId(SCANNED_PARTNERS[0].id);
      setCurrentTab('document');
      addAuditLog(
        'UPDATE_PROFILE',
        'Reset enterprise profiles back to verified default corporate state.'
      );
    }
  };

  const handleSelectPartnerFromWorkspace = (id: string) => {
    setActivePartnerId(id);
    setDocViewMode('single');
    setCurrentTab('document');
  };

  // Multi-Organization Handlers
  const handleSelectOrganization = (orgId: string) => {
    setActiveOrgId(orgId);
    const selected = organizations.find((o) => o.id === orgId);
    if (selected) {
      addAuditLog(
        'UPDATE_ORG_SETTINGS',
        `Switched active login portal to ${selected.name}.`
      );
    }
  };

  const handleCreateOrganization = (newOrg: Organization) => {
    setOrganizations((prev) => [...prev, newOrg]);
    setActiveOrgId(newOrg.id);
    addAuditLog(
      'UPDATE_ORG_SETTINGS',
      `Registered new independent organization portal: ${newOrg.name}.`
    );
  };

  const handleUpdateOrganization = (orgId: string, updates: Partial<Organization>) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, ...updates } : o))
    );
    addAuditLog(
      'UPDATE_ORG_SETTINGS',
      updates.logoUrl
        ? `Uploaded new corporate company logo for ${activeOrg.name}.`
        : `Updated corporate branding & customizable header/footer configuration.`
    );
  };

  // Officials Handlers
  const handleCreateOfficial = (newOfficial: CorporateOfficial) => {
    setOfficials((prev) => [...prev, newOfficial]);
    addAuditLog(
      'CREATE_OFFICIAL',
      `Authorized new ${newOfficial.department} official: ${newOfficial.name} (${newOfficial.roleTitle}).`
    );
  };

  const handleUpdateOfficial = (id: string, updates: Partial<CorporateOfficial>) => {
    setOfficials((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const handleDeleteOfficial = (id: string) => {
    const target = officials.find((o) => o.id === id);
    setOfficials((prev) => prev.filter((o) => o.id !== id));
    if (target) {
      addAuditLog(
        'CREATE_OFFICIAL',
        `De-authorized official: ${target.name} (${target.roleTitle}).`
      );
    }
  };

  const handleSelectActiveOfficial = (official: CorporateOfficial) => {
    setActiveOfficialId(official.id);
    addAuditLog(
      'CREATE_OFFICIAL',
      `Operator identity changed: Signed in as ${official.name} (${official.roleTitle}).`
    );
  };

  // Credentials Handlers
  const handleAddCredential = (cred: StaffCredentialItem) => {
    setCredentials((prev) => [cred, ...prev]);
    addAuditLog(
      'ATTACH_CREDENTIAL',
      `Attached credential "${cred.title}" issued by ${cred.issuingAuthority} for ${cred.staffName}.`,
      cred.staffId,
      cred.staffName
    );
  };

  const handleUpdateCredential = (id: string, updates: Partial<StaffCredentialItem>) => {
    setCredentials((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    const target = credentials.find((c) => c.id === id);
    if (target && updates.status === 'verified') {
      addAuditLog(
        'ATTACH_CREDENTIAL',
        `Verified credential "${target.title}" for ${target.staffName}.`,
        target.staffId,
        target.staffName
      );
    }
  };

  const handleDeleteCredential = (id: string) => {
    const target = credentials.find((c) => c.id === id);
    setCredentials((prev) => prev.filter((c) => c.id !== id));
    if (target) {
      addAuditLog(
        'ATTACH_CREDENTIAL',
        `Removed archived credential "${target.title}" for ${target.staffName}.`,
        target.staffId,
        target.staffName
      );
    }
  };

  // 1. Browser Native / Vector Print with Section Selection
  const handleNativePrint = () => {
    const listToPrint =
      docViewMode === 'single'
        ? partners.filter((p) => p.id === activePartnerId)
        : partners;

    try {
      openPrintDialogWindow(listToPrint, printSelection);
      setIsExportModalOpen(false);
    } catch (err) {
      console.warn('Pop-out window error:', err);
      try {
        window.focus();
        window.print();
      } catch {
        setIsExportModalOpen(true);
      }
    }
  };

  // 2. Direct PDF export (.pdf)
  const handleDownloadPdf = async () => {
    setExportLoading(true);
    try {
      const activeObj = partners.find((p) => p.id === activePartnerId);
      const filename =
        docViewMode === 'single'
          ? `Company-Profile-${(activeObj?.name || 'Personnel').replace(/\s+/g, '-')}.pdf`
          : `Enterprise-Profiles-All-${partners.length}.pdf`;

      await generateAndDownloadPdf(filename, (status) => {
        setExportProgressText(status);
      });
      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(`Could not generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setExportLoading(false);
      setExportProgressText(null);
    }
  };

  // 3. Standalone HTML Dossier (.html) with Section Selection
  const handleDownloadHtml = () => {
    const listToExport =
      docViewMode === 'single'
        ? partners.filter((p) => p.id === activePartnerId)
        : partners;

    downloadStandaloneHtmlDossier(
      listToExport,
      docViewMode === 'single'
        ? `Company-Profile-${(partners.find((p) => p.id === activePartnerId)?.name || 'Personnel').replace(/\s+/g, '-')}.html`
        : `Company-Profiles-All-${partners.length}.html`,
      printSelection
    );
    setIsExportModalOpen(false);
  };

  // =========================================================================
  // GATING: IF NOT LOGGED IN, RENDER AUTHENTICATION PORTAL FIRST
  // =========================================================================
  if (!authSession) {
    return (
      <AuthPortal
        organizations={organizations}
        officials={officials}
        invitations={invitations}
        activeOrg={activeOrg}
        onLoginSuccess={handleLoginSuccess}
        onRegisterOrganization={handleRegisterOrganization}
        onAcceptInvitation={handleAcceptInvitation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Corporate Navigation Header (Hidden in Print) */}
      <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Main Top Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3">
            {/* Corporate Brand Identity with Uploaded Logo Support */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activeOrg.logoUrl ? (
                  <div className="h-9 w-auto max-w-[140px] rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-700 shadow-xs overflow-hidden">
                    <img
                      src={activeOrg.logoUrl}
                      alt={activeOrg.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                    {activeOrg.headerConfig?.companyName || 'Univision design and Construction Ltd.'}
                  </h1>
                  <p className="text-[11px] text-slate-400 font-medium truncate max-w-[260px] sm:max-w-none">
                    {activeOrg.headerConfig?.subheading || 'Human Resources & Corporate Financial Accounts Portal'}
                  </p>
                </div>
              </div>

              {/* Mobile Quick Action Buttons */}
              <div className="flex lg:hidden items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-bold"
                  title="Generate Invite Link"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(true)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                  title="Organization Portal & Branding"
                >
                  <Building className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 rounded-lg text-xs font-bold"
                  title="Sign Out / Lock Portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Department Navigation Tabs & Desktop Action Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
              {/* Tab Selector */}
              <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentTab('document')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'document'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Corporate Dossiers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('hr');
                    setCurrentRole('hr');
                  }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'hr'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>HR Department</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('accounts');
                    setCurrentRole('accounts');
                  }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'accounts'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Accounts &amp; Reports</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('registry')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap ${
                    currentTab === 'registry'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Scanner &amp; Upload</span>
                </button>
              </div>

              {/* Invite Personnel Link Button */}
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                title="Grant Access via Invitation Links"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Personnel</span>
              </button>

              {/* Active Officer Identity Pill */}
              <button
                type="button"
                onClick={() => setIsOfficialsModalOpen(true)}
                className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  authSession.department === 'Administrator'
                    ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border-amber-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Manage Officials & View Who Did What Audit Trail"
              >
                {authSession.department === 'Administrator' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="truncate max-w-[130px]">{authSession.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    authSession.department === 'Administrator'
                      ? 'text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40'
                      : 'text-emerald-400'
                  }`}
                >
                  ({authSession.department === 'Administrator' ? 'GM · Administrator' : authSession.department})
                </span>
              </button>

              {/* Role Indicator & Switcher Pill */}
              {authSession.department === 'Administrator' ? (
                <div className="hidden lg:flex items-center bg-slate-800 rounded-lg p-0.5 border border-amber-500/40 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCurrentRole('administrator')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                      currentRole === 'administrator'
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold shadow-xs'
                        : 'text-amber-400 hover:text-white'
                    }`}
                    title="Corporate General Manager: Sovereign Oversight Across All Departments"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>General Manager (All Depts)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('hr');
                      setCurrentTab('document');
                    }}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 transition ${
                      currentRole === 'hr'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Inspect & Work in HR Department"
                  >
                    <Users className="w-3 h-3" />
                    <span>HR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('accounts');
                      setCurrentTab('accounts');
                    }}
                    className={`px-2 py-1 rounded-md flex items-center gap-1 transition ${
                      currentRole === 'accounts'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Inspect & Work in Accounts Department"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Accounts</span>
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCurrentRole('accounts')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      currentRole === 'accounts'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Full Financial and Payroll Access"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Accounts Role</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentRole('hr')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                      currentRole === 'hr'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Non-Financial Personnel Operations Only"
                  >
                    <Users className="w-3 h-3" />
                    <span>HR Role</span>
                  </button>
                </div>
              )}

              {/* Desktop Print & Action Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Print Dossier Modal / Options */}
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / Export</span>
                </button>

                {/* Direct Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95"
                  title="Download complete PDF document"
                >
                  {exportLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>

                {/* Log Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-white border border-slate-700 hover:border-red-700 rounded-lg text-xs font-semibold transition"
                  title="Log out and return to secure Authentication Portal"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        {currentTab === 'document' && (
          <div className="space-y-4">
            {/* Dossier Filter & Mode Bar (No-Print) */}
            <div className="no-print bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">View Scope:</span>
                <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDocViewMode('all')}
                    className={`px-3 py-1 rounded-md transition ${
                      docViewMode === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Dossiers ({partners.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocViewMode('single')}
                    className={`px-3 py-1 rounded-md transition ${
                      docViewMode === 'single'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Single Focus
                  </button>
                </div>

                {/* Single Profile Selector */}
                {docViewMode === 'single' && (
                  <select
                    value={activePartnerId}
                    onChange={(e) => setActivePartnerId(e.target.value)}
                    className="px-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {CATEGORY_LABELS[p.category] || p.category}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Right: Quick Onboarding & Reset */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('permanent_employee')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Onboard Personnel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-semibold transition flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(true)}
                  className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition flex items-center gap-1"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Logo &amp; Header</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToScannedPartners}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                  title="Reset to default templates"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Document Viewer Engine */}
            <DocumentViewer
              partners={partners}
              activePartnerId={activePartnerId}
              viewMode={docViewMode}
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
              printSelection={printSelection}
              onPrintSelectionChange={setPrintSelection}
              onUpdatePartner={handleUpdatePartner}
              onAddPartner={() => handleOpenAddModal('permanent_employee')}
              activeOrg={activeOrg}
            />
          </div>
        )}

        {currentTab === 'hr' && (
          <HRWorkspace
            partners={partners}
            onSelectPartner={handleSelectPartnerFromWorkspace}
            onUpdatePartner={handleUpdatePartner}
            onOpenAddModal={handleOpenAddModal}
            onOpenOfficialsManager={handleOpenOfficialsModal}
            activeOrg={activeOrg}
            officials={officials}
            activeOfficial={activeOfficial}
            onSelectActiveOfficial={handleSelectActiveOfficial}
            onCreateOfficial={handleCreateOfficial}
            onUpdateOfficial={handleUpdateOfficial}
            onDeleteOfficial={handleDeleteOfficial}
            auditLogs={auditLogs}
            credentials={credentials}
            onAddCredential={handleAddCredential}
            onUpdateCredential={handleUpdateCredential}
            onDeleteCredential={handleDeleteCredential}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsWorkspace
            partners={partners}
            onSelectPartner={handleSelectPartnerFromWorkspace}
            onUpdatePartner={handleUpdatePartner}
            onOpenAddModal={handleOpenAddModal}
            onOpenOfficialsManager={handleOpenOfficialsModal}
            activeOrg={activeOrg}
          />
        )}

        {currentTab === 'registry' && (
          <PartnerManager
            partners={partners}
            activePartnerId={activePartnerId}
            onSelectPartner={setActivePartnerId}
            onAddPartner={() => handleOpenAddModal('permanent_employee')}
            onDeletePartner={handleDeletePartner}
            onUpdatePartner={handleUpdatePartner}
            onSwitchToView={() => setCurrentTab('document')}
          />
        )}
      </main>

      {/* Workspace Invitations & Permissions Modal */}
      <InvitationManagerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        activeOrg={activeOrg}
        activeOfficial={activeOfficial}
        invitations={invitations}
        officials={officials}
        onGenerateInvitation={handleGenerateInvitation}
        onRevokeInvitation={handleRevokeInvitation}
        onUpdateOfficialPermissions={handleUpdateOfficialPermissions}
      />

      {/* Organization Portal & Branding Modal */}
      <OrganizationPortalModal
        isOpen={isOrgModalOpen}
        organizations={organizations}
        activeOrg={activeOrg}
        onSelectOrganization={handleSelectOrganization}
        onCreateOrganization={handleCreateOrganization}
        onUpdateOrganization={handleUpdateOrganization}
        onClose={() => setIsOrgModalOpen(false)}
      />

      {/* HR & Accounts Officials & Audit Trail Modal */}
      <OfficialsManagerModal
        isOpen={isOfficialsModalOpen}
        officials={officials}
        activeOfficial={activeOfficial}
        auditLogs={auditLogs}
        initialDepartment={officialsModalDepartment}
        onSelectActiveOfficial={handleSelectActiveOfficial}
        onCreateOfficial={handleCreateOfficial}
        onUpdateOfficial={handleUpdateOfficial}
        onDeleteOfficial={handleDeleteOfficial}
        onClose={() => setIsOfficialsModalOpen(false)}
      />

      {/* New Profile Wizard / Modal */}
      <NewProfileModal
        isOpen={isNewProfileModalOpen}
        initialCategory={newProfileCategoryPreset}
        onClose={() => setIsNewProfileModalOpen(false)}
        onAddProfile={handleAddNewProfile}
      />

      {/* Print / Export Options Modal with Section Selector */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Print &amp; Export Corporate Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Presets */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Choose Sections to Include / Exclude in Final Print-Out:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPrintSelection(DEFAULT_PRINT_SELECTION)}
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    All Sections (Full Dossier)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintSelection(HR_ONLY_PRINT_SELECTION)}
                    className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 rounded text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    HR Dossier Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintSelection(ACCOUNTS_ONLY_PRINT_SELECTION)}
                    className="px-2 py-0.5 bg-purple-50 border border-purple-300 rounded text-[11px] font-semibold text-purple-800 hover:bg-purple-100"
                  >
                    Accounts &amp; Payroll Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintSelection(STATUTORY_ID_PRINT_SELECTION)}
                    className="px-2 py-0.5 bg-blue-50 border border-blue-300 rounded text-[11px] font-semibold text-blue-800 hover:bg-blue-100"
                  >
                    Statutory ID &amp; TIN Only
                  </button>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-white">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.coverAndHeader}
                    onChange={(e) =>
                      setPrintSelection({ ...printSelection, coverAndHeader: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>1. Corporate Header, Branding Emblem &amp; Title</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.classificationStrip}
                    onChange={(e) =>
                      setPrintSelection({ ...printSelection, classificationStrip: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>2. Personnel Classification &amp; Clearance Strip</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.identificationBioData}
                    onChange={(e) =>
                      setPrintSelection({ ...printSelection, identificationBioData: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>3. Statutory Bio-Data &amp; Particulars Table</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.idCardsImages}
                    onChange={(e) =>
                      setPrintSelection({ ...printSelection, idCardsImages: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>4. Biometric ID Cards Scans (Front &amp; Back)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.accountsTaxSchedule}
                    onChange={(e) =>
                      setPrintSelection({ ...printSelection, accountsTaxSchedule: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>5. Bank Remittance &amp; Tax Compliance Schedule</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.tinCertificateImage}
                    onChange={(e) =>
                      setPrintSelection({ ...printSelection, tinCertificateImage: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>6. GRA TIN Certificate Image (Half A4 Paper Size)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.employmentOrSubcontractSchedule}
                    onChange={(e) =>
                      setPrintSelection({
                        ...printSelection,
                        employmentOrSubcontractSchedule: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>7. Employment &amp; Emergency Contacts Schedule</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.subcontractorMilestoneStages}
                    onChange={(e) =>
                      setPrintSelection({
                        ...printSelection,
                        subcontractorMilestoneStages: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>8. Subcontractor Milestone Stages &amp; WHT Schedule</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.payrollAdjustmentsAndDeductions}
                    onChange={(e) =>
                      setPrintSelection({
                        ...printSelection,
                        payrollAdjustmentsAndDeductions: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>9. Monthly Payroll Deductions &amp; Advances Desk</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.agreementDocumentsImages}
                    onChange={(e) =>
                      setPrintSelection({
                        ...printSelection,
                        agreementDocumentsImages: e.target.checked,
                      })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>10. Contract Agreement Documents Scans</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printSelection.departmentSignatures}
                    onChange={(e) =>
                      setPrintSelection({ ...printSelection, departmentSignatures: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>11. Department Verification Signatures &amp; Endorsement</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Standalone .HTML</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={exportLoading}
                    className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    {exportLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Direct PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativePrint}
                    className="flex-1 sm:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Window</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Web Footer (Hidden in Print) */}
      <footer className="no-print bg-slate-900 text-slate-400 border-t border-slate-800 py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">
              {activeOrg.headerConfig?.companyName || activeOrg.name}
            </span>
            <span className="text-slate-600">|</span>
            <span>{activeOrg.headerConfig?.subheading || 'Corporate HR & Accounts Profiling System'}</span>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            {activeOrg.footerConfig?.confidentialityNotice || 'Confidential Enterprise Registry • Internal Corporate Use Only'}
          </div>
        </div>
      </footer>
    </div>
  );
}
