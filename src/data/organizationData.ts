import {
  Organization,
  CorporateOfficial,
  AuditLogEntry,
  StaffCredentialItem,
  DEFAULT_ORGANIZATION,
  DEFAULT_HR_PERMISSIONS,
  DEFAULT_ACCOUNTS_PERMISSIONS,
  FULL_ADMIN_PERMISSIONS,
} from '../types';

/**
 * High-fidelity default vector logo for Univision design and Construction Ltd.
 */
export function generateUnivisionLogoSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 80" width="360" height="80">
    <defs>
      <linearGradient id="unigrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e3a8a"/>
        <stop offset="50%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#0f766e"/>
      </linearGradient>
      <linearGradient id="accentgold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
    </defs>
    <!-- Geometric Architectural Emblem -->
    <g transform="translate(10, 8)">
      <rect x="0" y="0" width="64" height="64" rx="14" fill="#0f172a"/>
      <!-- Stylized Architectural 'U' with Compass / Tower elements -->
      <path d="M16 16 L16 38 C16 48 24 52 32 52 C40 52 48 48 48 38 L48 16" fill="none" stroke="url(#unigrad)" stroke-width="7" stroke-linecap="round"/>
      <polygon points="32,20 40,36 24,36" fill="url(#accentgold)"/>
      <circle cx="32" cy="18" r="3.5" fill="#ffffff"/>
      <line x1="8" y1="58" x2="56" y2="58" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
    </g>
    <!-- Company Name Typography -->
    <g transform="translate(86, 22)">
      <text x="0" y="16" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20" letter-spacing="0.5">UNIVISION</text>
      <text x="0" y="34" fill="#0284c7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11.5" letter-spacing="1.2">DESIGN &amp; CONSTRUCTION LTD.</text>
      <text x="0" y="47" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="8.5" letter-spacing="0.6">ENGINEERING · ARCHITECTURE · INFRASTRUCTURE</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    ...DEFAULT_ORGANIZATION,
    logoUrl: generateUnivisionLogoSvg(),
  },
];

export const INITIAL_OFFICIALS: CorporateOfficial[] = [
  {
    id: 'off-univision-director',
    orgId: 'org-univision',
    name: 'Corporate General Manager',
    email: 'admin@univision.gm',
    phone: '+220 701 4492',
    department: 'Administrator',
    roleTitle: 'Corporate General Manager',
    badgeNumber: 'EXEC-GM-001',
    isActive: true,
    isVerified: true,
    permissions: FULL_ADMIN_PERMISSIONS,
    createdAt: '2024-01-01',
  },
];

export const INITIAL_STAFF_CREDENTIALS: StaffCredentialItem[] = [
  {
    id: 'cred-ndow-degree',
    orgId: 'org-univision',
    staffId: 'partner-ndow',
    staffName: 'NDOW LAMIN MUHAMMED',
    department: 'Executive Management & Civil Engineering',
    category: 'executive_partner',
    credentialType: 'academic_degree',
    title: 'B.Sc. Civil & Structural Engineering (First Class Honours)',
    issuingAuthority: 'Kwame Nkrumah University of Science and Technology (KNUST)',
    documentNumber: 'KNUST-ENG-2018-0912',
    issueDate: '2018-07-15',
    status: 'verified',
    verifiedBy: 'Fatou Binta Sallah (HR Director)',
    verificationDate: '2024-01-20',
    notes: 'Certified true copy of degree certificate authenticated by registrar.',
  },
  {
    id: 'cred-ndow-license',
    orgId: 'org-univision',
    staffId: 'partner-ndow',
    staffName: 'NDOW LAMIN MUHAMMED',
    department: 'Executive Management & Civil Engineering',
    category: 'executive_partner',
    credentialType: 'professional_license',
    title: 'Registered Professional Engineer Practicing Certificate',
    issuingAuthority: 'The Gambia Council of Registered Engineers (GCRE)',
    documentNumber: 'GCRE-REG-CIV-0442',
    issueDate: '2023-01-10',
    expiryDate: '2027-12-31',
    status: 'valid',
    verifiedBy: 'Pa Modou Jallow (Compliance Officer)',
    verificationDate: '2024-02-05',
    notes: 'Mandatory statutory license for signing municipal building permits.',
  },
  {
    id: 'cred-ndow-id',
    orgId: 'org-univision',
    staffId: 'partner-ndow',
    staffName: 'NDOW LAMIN MUHAMMED',
    department: 'Executive Management & Civil Engineering',
    category: 'executive_partner',
    credentialType: 'national_id_passport',
    title: 'ECOWAS National Biometric Identity Card',
    issuingAuthority: 'Department of Immigration, Republic of The Gambia',
    documentNumber: 'AA927522 (ID: 211201-010-013)',
    issueDate: '2025-08-27',
    expiryDate: '2030-08-27',
    status: 'valid',
    verifiedBy: 'Fatou Binta Sallah (HR Director)',
    verificationDate: '2025-08-28',
  },
  {
    id: 'cred-fatou-degree',
    orgId: 'org-univision',
    staffId: 'emp-fatou-sallah',
    staffName: 'FATOU BINTA SALLAH',
    department: 'Human Resources & Corporate Governance',
    category: 'permanent_employee',
    credentialType: 'academic_degree',
    title: 'M.Sc. Human Resource Management & Organizational Psychology',
    issuingAuthority: 'University of Westminster, London',
    documentNumber: 'UOW-HRM-2015-8841',
    issueDate: '2015-11-20',
    status: 'verified',
    verifiedBy: 'Managing Director',
    verificationDate: '2024-01-18',
  },
  {
    id: 'cred-fatou-contract',
    orgId: 'org-univision',
    staffId: 'emp-fatou-sallah',
    staffName: 'FATOU BINTA SALLAH',
    department: 'Human Resources & Corporate Governance',
    category: 'permanent_employee',
    credentialType: 'employment_contract',
    title: 'Executive Employment Agreement (Head of HR)',
    issuingAuthority: 'Univision design and Construction Ltd.',
    documentNumber: 'CONT-EXEC-HR-004',
    issueDate: '2022-04-01',
    status: 'valid',
    verifiedBy: 'Board of Directors',
    verificationDate: '2022-04-01',
  },
  {
    id: 'cred-bah-acca',
    orgId: 'org-univision',
    staffId: 'emp-bah-accounts',
    staffName: 'BAH AMINATA',
    department: 'Finance & Accounts Department',
    category: 'permanent_employee',
    credentialType: 'professional_license',
    title: 'ACCA Chartered Certified Accountant Practicing Certificate',
    issuingAuthority: 'Association of Chartered Certified Accountants (UK / Gambia)',
    documentNumber: 'ACCA-MEM-300918',
    issueDate: '2019-09-15',
    expiryDate: '2027-12-31',
    status: 'valid',
    verifiedBy: 'Fatou Binta Sallah (HR Director)',
    verificationDate: '2024-01-22',
  },
  {
    id: 'cred-bah-tin',
    orgId: 'org-univision',
    staffId: 'emp-bah-accounts',
    staffName: 'BAH AMINATA',
    department: 'Finance & Accounts Department',
    category: 'permanent_employee',
    credentialType: 'tax_tin_certificate',
    title: 'GRA Taxpayer Identification & Clearance Certificate',
    issuingAuthority: 'Gambia Revenue Authority (GRA)',
    documentNumber: 'TIN-2200914420',
    issueDate: '2024-02-20',
    status: 'verified',
    verifiedBy: 'Ebrima Sonko (Accounts)',
    verificationDate: '2024-02-22',
  },
  {
    id: 'cred-toure-trade',
    orgId: 'org-univision',
    staffId: 'subcontractor-toure',
    staffName: 'TOURE IBRAHIM (MEP CONTRACTING)',
    department: 'Electrical & Mechanical (MEP) Contracting',
    category: 'subcontractor',
    credentialType: 'trade_license_hse',
    title: 'High-Voltage Electrical Contractor Class-A Trade License',
    issuingAuthority: 'PURA / Ministry of Petroleum & Energy',
    documentNumber: 'TL-2023-MEP-882',
    issueDate: '2023-03-12',
    expiryDate: '2027-03-12',
    status: 'valid',
    verifiedBy: 'Aminata Bah (Financial Controller)',
    verificationDate: '2024-03-15',
  },
  {
    id: 'cred-darboe-hse',
    orgId: 'org-univision',
    staffId: 'subcontractor-darboe',
    staffName: 'DARBOE ALIEU (EARTHWORKS CONTRACTOR)',
    department: 'Site Operations & Heavy Logistics',
    category: 'subcontractor',
    credentialType: 'trade_license_hse',
    title: 'Heavy Plant Operator & Earthmoving Safety Compliance Card',
    issuingAuthority: 'National Occupational Safety Board',
    documentNumber: 'HSE-PLANT-2023-410',
    issueDate: '2023-01-05',
    expiryDate: '2028-01-05',
    status: 'valid',
    verifiedBy: 'Pa Modou Jallow (Compliance Officer)',
    verificationDate: '2024-01-10',
  },
];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [];
