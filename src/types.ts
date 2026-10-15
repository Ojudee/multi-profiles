export interface VisibleDetail {
  label: string;
  value: string;
}

/**
 * Multi-Organizational Architecture
 */
export interface OrganizationHeaderConfig {
  companyName: string;
  documentTitle: string;
  subheading: string;
  registrationNumber?: string;
  taxJurisdiction?: string;
  address?: string;
  accentColor?: string; // hex or tailwind theme
}

export interface OrganizationFooterConfig {
  confidentialityNotice: string;
  complianceNotice: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  logoUrl: string | null;
  headerConfig: OrganizationHeaderConfig;
  footerConfig: OrganizationFooterConfig;
  createdAt: string;
}

export const DEFAULT_ORGANIZATION: Organization = {
  id: 'org-univision',
  name: 'Univision design and Construction Ltd.',
  slug: 'univision-construction',
  tagline: 'Architectural Design, Civil Infrastructure & General Construction',
  logoUrl: null, // Will use high-fidelity vector emblem by default if null
  headerConfig: {
    companyName: 'Univision design and Construction Ltd.',
    documentTitle: 'Company Profiles',
    subheading: 'Human Resources & Corporate Financial Accounts Portal',
    registrationNumber: 'CR-2024-UNIV-9921',
    taxJurisdiction: 'Kanifing Division · Gambia Revenue Authority (GRA)',
    address: 'Kairaba Avenue, PMB 4410, Banjul / KMC',
    accentColor: '#0f172a',
  },
  footerConfig: {
    confidentialityNotice: 'Confidential Internal Corporate Dossier — Univision design and Construction Ltd.',
    complianceNotice: 'Issued pursuant to statutory labor laws and statutory taxation requirements.',
    contactEmail: 'univision0111@gmail.com',
    contactPhone: '+220 701 4492 / +220 334 9100',
  },
  createdAt: '2024-01-15',
};

/**
 * HR and Accounts Corporate Officials & Roles
 */
export interface OfficialPermissions {
  // General & Shared Access
  canViewDossiers: boolean;
  canExportData: boolean;
  canGenerateInvites: boolean;
  canViewAuditLogs: boolean;

  // HR Department Specific Controls
  canCreateProfiles: boolean;
  canEditProfiles: boolean;
  canDeleteProfiles: boolean;
  canVerifyClearance: boolean;
  canManageCredentials: boolean;
  canManageHROfficials: boolean;

  // Accounts Department Specific Controls
  canViewFinancials: boolean;
  canAdjustPayroll: boolean;
  canApproveMilestones: boolean;
  canDisbursePayments: boolean;
  canManageAccountsOfficials: boolean;
}

export const DEFAULT_HR_PERMISSIONS: OfficialPermissions = {
  canViewDossiers: true,
  canExportData: true,
  canGenerateInvites: true,
  canViewAuditLogs: true,
  canCreateProfiles: true,
  canEditProfiles: true,
  canDeleteProfiles: true,
  canVerifyClearance: true,
  canManageCredentials: true,
  canManageHROfficials: true,
  canViewFinancials: false, // Restricted
  canAdjustPayroll: false, // Restricted
  canApproveMilestones: false, // Restricted
  canDisbursePayments: false, // Restricted
  canManageAccountsOfficials: false,
};

export const DEFAULT_ACCOUNTS_PERMISSIONS: OfficialPermissions = {
  canViewDossiers: true,
  canExportData: true,
  canGenerateInvites: true,
  canViewAuditLogs: true,
  canCreateProfiles: false,
  canEditProfiles: false,
  canDeleteProfiles: false,
  canVerifyClearance: false,
  canManageCredentials: false,
  canManageHROfficials: false,
  canViewFinancials: true,
  canAdjustPayroll: true,
  canApproveMilestones: true,
  canDisbursePayments: true,
  canManageAccountsOfficials: true,
};

export const FULL_ADMIN_PERMISSIONS: OfficialPermissions = {
  canViewDossiers: true,
  canExportData: true,
  canGenerateInvites: true,
  canViewAuditLogs: true,
  canCreateProfiles: true,
  canEditProfiles: true,
  canDeleteProfiles: true,
  canVerifyClearance: true,
  canManageCredentials: true,
  canManageHROfficials: true,
  canViewFinancials: true,
  canAdjustPayroll: true,
  canApproveMilestones: true,
  canDisbursePayments: true,
  canManageAccountsOfficials: true,
};

export interface CorporateOfficial {
  id: string;
  orgId: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  phone?: string;
  department: 'Administrator' | 'HR' | 'Accounts';
  roleTitle: string; // e.g. "General Manager", "Head of Human Resources", "Senior Financial Controller", "Compliance Officer"
  badgeNumber?: string;
  signatureImage?: string | null;
  isActive: boolean;
  createdAt: string;
  isVerified?: boolean;
  twoFactorEnabled?: boolean;
  permissions?: OfficialPermissions;
}

export interface WorkspaceInvitation {
  id: string;
  orgId: string;
  orgName: string;
  inviteEmail: string;
  invitedByOfficialId: string;
  invitedByOfficialName: string;
  department: 'Administrator' | 'HR' | 'Accounts';
  designatedRole: string;
  permissions: OfficialPermissions;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
  expiresAt: string;
}

export interface AuthSession {
  officialId: string;
  orgId: string;
  email: string;
  name: string;
  department: 'Administrator' | 'HR' | 'Accounts';
  roleTitle: string;
  loginTime: string;
  twoFactorVerified: boolean;
}

/**
 * Activity Audit Log ("Who did what")
 */
export type AuditActionType =
  | 'CREATE_PROFILE'
  | 'UPDATE_PROFILE'
  | 'DELETE_PROFILE'
  | 'ADJUST_PAYROLL'
  | 'RECORD_ABSENCE'
  | 'RECORD_ADVANCE'
  | 'APPROVE_SUBCONTRACT_STAGE'
  | 'DISBURSE_SUBCONTRACT_PAYMENT'
  | 'APPROVE_BILLING'
  | 'ATTACH_CREDENTIAL'
  | 'UPDATE_ORG_SETTINGS'
  | 'UPLOAD_LOGO'
  | 'VERIFY_CLEARANCE'
  | 'CREATE_OFFICIAL'
  | 'UPDATE_PERMISSIONS'
  | 'GENERATE_INVITE'
  | 'ACCEPT_INVITE'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'LOCKOUT_TRIGGERED';

export interface AuditLogEntry {
  id: string;
  orgId: string;
  timestamp: string;
  officialId: string;
  officialName: string;
  officialRole: string;
  department: 'Administrator' | 'HR' | 'Accounts' | 'System';
  actionType: AuditActionType;
  targetPersonnelId?: string;
  targetPersonnelName?: string;
  description: string;
  details?: Record<string, any>;
}

/**
 * Staff Credentials Vault & Document Inventory
 */
export type CredentialType =
  | 'academic_degree'
  | 'professional_license'
  | 'national_id_passport'
  | 'tax_tin_certificate'
  | 'employment_contract'
  | 'medical_fitness'
  | 'police_clearance'
  | 'trade_license_hse'
  | 'reference_letter';

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  academic_degree: 'Academic Degree / Diploma',
  professional_license: 'Engineering / Architecture Practicing License',
  national_id_passport: 'National ECOWAS ID / International Passport',
  tax_tin_certificate: 'GRA Taxpayer Identification (TIN) Certificate',
  employment_contract: 'Executed Employment Contract / Agreement',
  medical_fitness: 'Occupational Health & Medical Fitness',
  police_clearance: 'Criminal Background & Police Clearance',
  trade_license_hse: 'Health, Safety & Environmental (HSE) Card',
  reference_letter: 'Statutory Character Reference / Verification',
};

export interface StaffCredentialItem {
  id: string;
  orgId: string;
  staffId: string;
  staffName: string;
  department: string;
  category: PersonnelCategory;
  credentialType: CredentialType;
  title: string; // e.g. "B.Eng Civil & Structural Engineering (Hons)"
  issuingAuthority: string; // e.g. "Gambia Council of Registered Engineers"
  documentNumber?: string;
  issueDate: string;
  expiryDate?: string; // empty if non-expiring
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing' | 'verified';
  documentImageUrl?: string | null;
  verifiedBy?: string;
  verificationDate?: string;
  notes?: string;
}

export type PersonnelCategory =
  | 'executive_partner'
  | 'permanent_employee'
  | 'contract_staff'
  | 'subcontractor'
  | 'casual_intern';

export type EmploymentStatus =
  | 'active'
  | 'onboarding'
  | 'probation'
  | 'pending_clearance'
  | 'verified';

export interface BankRemittanceInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCodeOrBranch?: string;
  swiftOrIban?: string;
  currency: string;
  paymentMode: 'Direct Deposit / ACH' | 'Electronic Wire Transfer' | 'Corporate Cheque' | 'Milestone Disbursement';
}

export interface CompensationStructure {
  rateType: 'Monthly Salary' | 'Daily Rate' | 'Hourly Rate' | 'Milestone Contract Fee' | 'Retainer';
  amount: number;
  currency: string;
  withholdingTaxPct: number; // e.g. 0% for employee PAYE, 5% or 10% for subcontractor WHT
  paymentTerms: string; // e.g. "Monthly (28th of every month)", "Net 15 Days after Invoice", "Milestone Completion"
  pensionPin?: string;
  socialSecurityNo?: string;
}

/**
 * Subcontractor Payment Stages & Milestone Plan
 * Subcontractors are paid in stages relative to their contract sum & type
 */
export interface SubcontractPaymentStage {
  id: string;
  stageNumber: number;
  stageName: string; // e.g. "Stage 1: Advance Mobilization", "Stage 2: 50% Structural Rough-in"
  percentage: number; // e.g. 20, 30, 25, 20, 5
  amount: number; // calculated from contract sum * percentage / 100
  dueDate?: string;
  completionDate?: string;
  whtDeductionPct: number; // e.g. 10%
  retentionDeductionPct: number; // e.g. 5%
  status: 'pending' | 'invoiced' | 'approved' | 'paid';
  invoiceRef?: string;
  paidDate?: string;
  inspectionSignatory?: string;
  notes?: string;
}

export interface SubcontractorContractPlan {
  contractSum: number; // Total agreed contract value in GMD/USD
  contractType: 'Fixed Lump-Sum Milestone' | 'Unit Rate Schedule' | 'Time & Materials' | 'Cost-Plus Fee';
  advancePaymentPct: number; // e.g. 20%
  retentionHoldbackPct: number; // e.g. 5%
  retentionPeriodMonths: number; // e.g. 6 or 12 months
  whtRatePct: number; // e.g. 5% or 10%
  stages: SubcontractPaymentStage[];
}

/**
 * Employee Monthly Payroll Adjustments:
 * Deductions for absence or coming late, and advance salary payment recoveries
 */
export interface EmployeePayrollAdjustment {
  id: string;
  month: string; // e.g. "October 2026"
  baseSalary: number; // Gross monthly base
  allowances: number; // Transport, housing, site allowances
  
  // Absence deductions
  daysAbsent: number;
  dailyRateEquivalent: number;
  absenceDeductionAmount: number;
  
  // Lateness penalties
  lateOccurrencesOrHours: number;
  latenessPenaltyAmount: number;
  
  // Advance Salary
  advanceSalaryTaken: number;
  advanceRecoveryDeduction: number;
  advanceBalanceRemaining: number;
  
  // Statutory withholdings
  payeTaxWithheld: number;
  pensionEmployeeWithheld: number;
  
  // Final Net
  netSalaryPayable: number;
  paymentStatus: 'pending' | 'cleared' | 'disbursed';
  disbursementDate?: string;
  paymentReference?: string;
  remarks?: string;
}

export interface HRComplianceRecord {
  staffIdOrCode: string;
  dateOfEngagement: string;
  contractEndDate?: string; // empty/indefinite for permanent
  reportingSupervisor: string;
  workLocation: string;
  emergencyContact: {
    fullName: string;
    relationship: string;
    phoneNumber: string;
    address?: string;
  };
  hrClearanceStatus: 'Fully Cleared' | 'Pending Documents' | 'Under Review';
  backgroundCheckVerified: boolean;
  signedAgreementOnRecord: boolean;
  medicalFitnessVerified?: boolean;
  hrOfficerSignatory: string;
  hrSignDate: string;

  // HR attendance record (strictly non-financial in HR view)
  daysAbsentRecorded?: number;
  lateOccurrencesRecorded?: number;
  annualLeaveDaysEntitled?: number;
  annualLeaveDaysUsed?: number;
  sickLeaveDaysUsed?: number;
}

export interface AccountsComplianceRecord {
  vendorOrTaxIdCode: string;
  tinNumber: string;
  taxOffice: string;
  taxRegistrationDate: string;
  taxComplianceStatus:
    | 'Registered Active Taxpayer'
    | 'Tax Clearance Certified'
    | 'Withholding Tax Compliant'
    | 'Pending Registration';
  withholdingTaxCertificateNo?: string;
  bankDetails: BankRemittanceInfo;
  compensation: CompensationStructure;
  accountsControllerSignatory: string;
  accountsSignDate: string;
  accountsClearanceStatus: 'Billing Approved' | 'Payroll Active' | 'Pending Tax Review' | 'Payment On Hold';

  // Subcontractor Stages Plan (when category === 'subcontractor')
  subcontractPlan?: SubcontractorContractPlan;

  // Employee Payroll Adjustments & Advance Records (when category === 'permanent_employee' | 'contract_staff')
  payrollAdjustments?: EmployeePayrollAdjustment[];
}

export interface PartnerIdentificationData {
  fullName: string | null;
  idNumber: string | null;
  dateOfBirth: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  nationality: string | null;
  otherDetails: VisibleDetail[];
  idExtractable: boolean;
  idExtractionNote?: string | null;
}

export interface TaxInformationData {
  tinNumber: string | null;
  taxpayerName: string | null;
  taxOffice: string | null;
  registrationDate: string | null;
  otherDetails: VisibleDetail[];
  tinExtractable: boolean;
  tinExtractionNote?: string | null;
}

export interface ExtractedProfileData {
  partnerIdentification: PartnerIdentificationData;
  taxInformation: TaxInformationData;
}

export interface PartnerRecord {
  id: string;
  orgId?: string;
  name: string;
  category: PersonnelCategory;
  department: string;
  designation: string;
  documentTitle?: string; // Custom editable title e.g. "Company Profiles"
  
  // Attached Document Scans
  idFrontImage: string | null;
  idBackImage: string | null;
  tinCertificateImage: string | null;
  contractOrAgreementImage?: string | null;
  bankVerificationImage?: string | null;

  status: 'empty' | 'ready_to_extract' | 'extracting' | 'extracted' | 'error';
  errorMessage?: string;
  extractedData?: ExtractedProfileData;
  generatedDate: string;

  // HR Specific Dossier Data (Strictly non-financial)
  hrDetails?: HRComplianceRecord;

  // Accounts & Payroll Specific Dossier Data (All financial records restricted here)
  accountsDetails?: AccountsComplianceRecord;

  // Verification & Signatures
  verificationSignatory?: string;
  verificationDate?: string;
}

export type DepartmentRole = 'accounts' | 'hr' | 'executive' | 'administrator';

export type ReportTimeframe = 'monthly' | 'quarterly' | 'yearly';

export interface PrintSectionSelection {
  coverAndHeader: boolean;
  classificationStrip: boolean;
  identificationBioData: boolean;
  idCardsImages: boolean;
  accountsTaxSchedule: boolean;
  tinCertificateImage: boolean; // Half-A4 Certificate view
  employmentOrSubcontractSchedule: boolean;
  subcontractorMilestoneStages: boolean;
  payrollAdjustmentsAndDeductions: boolean;
  agreementDocumentsImages: boolean;
  departmentSignatures: boolean;
}

export const DEFAULT_PRINT_SELECTION: PrintSectionSelection = {
  coverAndHeader: true,
  classificationStrip: true,
  identificationBioData: true,
  idCardsImages: true,
  accountsTaxSchedule: true,
  tinCertificateImage: true,
  employmentOrSubcontractSchedule: true,
  subcontractorMilestoneStages: true,
  payrollAdjustmentsAndDeductions: true,
  agreementDocumentsImages: true,
  departmentSignatures: true,
};

export const HR_ONLY_PRINT_SELECTION: PrintSectionSelection = {
  coverAndHeader: true,
  classificationStrip: true,
  identificationBioData: true,
  idCardsImages: true,
  accountsTaxSchedule: false, // Restricted financial section
  tinCertificateImage: false, // Tax document restricted
  employmentOrSubcontractSchedule: true,
  subcontractorMilestoneStages: false, // Financial stages restricted
  payrollAdjustmentsAndDeductions: false, // Financial payroll restricted
  agreementDocumentsImages: true,
  departmentSignatures: true,
};

export const ACCOUNTS_ONLY_PRINT_SELECTION: PrintSectionSelection = {
  coverAndHeader: true,
  classificationStrip: true,
  identificationBioData: true,
  idCardsImages: false,
  accountsTaxSchedule: true,
  tinCertificateImage: true,
  employmentOrSubcontractSchedule: true,
  subcontractorMilestoneStages: true,
  payrollAdjustmentsAndDeductions: true,
  agreementDocumentsImages: true,
  departmentSignatures: true,
};

export const STATUTORY_ID_PRINT_SELECTION: PrintSectionSelection = {
  coverAndHeader: true,
  classificationStrip: true,
  identificationBioData: true,
  idCardsImages: true,
  accountsTaxSchedule: false,
  tinCertificateImage: true,
  employmentOrSubcontractSchedule: false,
  subcontractorMilestoneStages: false,
  payrollAdjustmentsAndDeductions: false,
  agreementDocumentsImages: false,
  departmentSignatures: true,
};

export const CATEGORY_LABELS: Record<PersonnelCategory, string> = {
  executive_partner: 'Executive & Partner',
  permanent_employee: 'Permanent Employee',
  contract_staff: 'Contract Staff',
  subcontractor: 'Subcontractor / Trade Vendor',
  casual_intern: 'Casual / Trainee / Intern',
};

export const CATEGORY_BADGE_STYLES: Record<PersonnelCategory, { bg: string; text: string; border: string }> = {
  executive_partner: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  permanent_employee: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  contract_staff: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  subcontractor: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  casual_intern: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' },
};
