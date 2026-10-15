import React, { useState } from 'react';
import {
  PartnerRecord,
  VisibleDetail,
  PersonnelCategory,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
  DepartmentRole,
  PrintSectionSelection,
  DEFAULT_PRINT_SELECTION,
  HR_ONLY_PRINT_SELECTION,
  ACCOUNTS_ONLY_PRINT_SELECTION,
  STATUTORY_ID_PRINT_SELECTION,
  Organization,
} from '../types';
import { ImageCropModal } from './ImageCropModal';
import { DocumentScannerModal } from './DocumentScannerModal';
import { scanAndAutoResizeDocument } from '../utils/imageScanner';
import { openPrintDialogWindow, downloadStandaloneHtmlDossier } from '../utils/printAndPdf';
import {
  Calendar,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  X,
  Copy,
  Check,
  Edit3,
  Save,
  Plus,
  Trash2,
  Upload,
  Crop,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  Sparkles,
  Maximize2,
  RotateCw,
  Download,
  Loader2,
  ShieldCheck,
  Building,
  Briefcase,
  CreditCard,
  Receipt,
  Phone,
  Landmark,
  UserCheck,
  Users,
  Printer,
  SlidersHorizontal,
  Lock,
  Unlock,
  Shield,
  Layers,
  DollarSign,
  AlertCircle,
  FileText,
  Crown,
  Scan,
  Scaling,
} from 'lucide-react';

interface DocumentViewerProps {
  partners: PartnerRecord[];
  activePartnerId?: string;
  viewMode: 'all' | 'single';
  currentRole?: DepartmentRole;
  onRoleChange?: (role: DepartmentRole) => void;
  printSelection?: PrintSectionSelection;
  onPrintSelectionChange?: (selection: PrintSectionSelection) => void;
  onUpdatePartner?: (id: string, updates: Partial<PartnerRecord>) => void;
  onAddPartner?: () => void;
  activeOrg?: Organization;
}

interface EditFormData {
  partnerName: string;
  documentTitle: string;
  generatedDate: string;
  category: PersonnelCategory;
  department: string;
  designation: string;
  staffIdOrCode: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  nationality: string;
  otherDetails: VisibleDetail[];
  tinNumber: string;
  taxpayerName: string;
  taxOffice: string;
  registrationDate: string;
  otherTaxDetails: VisibleDetail[];
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCodeOrBranch: string;
  paymentMode: string;
  currency: string;
  rateType: string;
  compensationAmount: number;
  withholdingTaxPct: number;
  paymentTerms: string;
  emergencyContactName: string;
  emergencyContactRel: string;
  emergencyContactPhone: string;
  hrClearanceStatus: string;
  accountsClearanceStatus: string;
  hrOfficerSignatory: string;
  accountsControllerSignatory: string;
  verificationSignatory?: string;
  verificationDate?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  partners,
  activePartnerId,
  viewMode,
  currentRole = 'accounts',
  onRoleChange,
  printSelection: externalPrintSelection,
  onPrintSelectionChange,
  onUpdatePartner,
  onAddPartner,
  activeOrg,
}) => {
  // Department Role (Accounts vs HR)
  const [internalRole, setInternalRole] = useState<DepartmentRole>(currentRole);
  const activeRole = onRoleChange ? currentRole : internalRole;

  const handleRoleToggle = (newRole: DepartmentRole) => {
    if (onRoleChange) {
      onRoleChange(newRole);
    } else {
      setInternalRole(newRole);
    }
  };

  // Print Section Selection state
  const [internalPrintSelection, setInternalPrintSelection] = useState<PrintSectionSelection>(
    externalPrintSelection || DEFAULT_PRINT_SELECTION
  );
  const printSelection = externalPrintSelection || internalPrintSelection;
  const updatePrintSelection = (newSelection: PrintSectionSelection) => {
    if (onPrintSelectionChange) {
      onPrintSelectionChange(newSelection);
    } else {
      setInternalPrintSelection(newSelection);
    }
  };

  const [isPrintCustomizerOpen, setIsPrintCustomizerOpen] = useState(false);

  // Lightbox Modal state
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    title: string;
    slot?: 'idFront' | 'idBack' | 'tinCertificate' | 'contractOrAgreement' | 'bankVerification';
    partnerId?: string;
  } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxFitMode, setLightboxFitMode] = useState<'fit' | 'fill' | 'original'>('fit');

  const [copiedPartnerId, setCopiedPartnerId] = useState<string | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  // Quick auto-resizing in-flight tracker
  const [isQuickAutoResizing, setIsQuickAutoResizing] = useState<string | null>(null);

  // Statutory ID Card & TIN Certificate fitting modes ('cover' = Edge-to-Edge Statutory Fit, 'contain' = Full Margin Scan)
  const [idFitMode, setIdFitMode] = useState<'cover' | 'contain'>('cover');
  const [tinFitMode, setTinFitMode] = useState<'cover' | 'contain'>('contain');

  // AI Document Scanner Modal state
  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    partner: PartnerRecord;
    targetSlot: 'idFront' | 'idBack' | 'tinCertificate';
    initialImageSrc: string;
  } | null>(null);

  // Interactive Crop & Adjustment Modal state
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    partnerId: string;
    attachmentKey:
      | 'idFrontImage'
      | 'idBackImage'
      | 'tinCertificateImage'
      | 'contractOrAgreementImage'
      | 'bankVerificationImage';
    title: string;
    imageSrc: string;
    currentAttachmentSrc?: string | null;
    attachmentType: 'idFront' | 'idBack' | 'tinCertificate';
  } | null>(null);

  // Full Edit form state
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);

  const displayedPartners =
    viewMode === 'single' && activePartnerId
      ? partners.filter((p) => p.id === activePartnerId)
      : partners;

  const totalPages = displayedPartners.length;

  const startEditing = (partner: PartnerRecord) => {
    const ext = partner.extractedData;
    const idData = ext?.partnerIdentification;
    const taxData = ext?.taxInformation;
    const hr = partner.hrDetails;
    const acc = partner.accountsDetails;

    setEditFormData({
      partnerName: partner.name,
      documentTitle: partner.documentTitle || 'Company Profiles',
      generatedDate: partner.generatedDate,
      category: partner.category,
      department: partner.department,
      designation: partner.designation,
      staffIdOrCode: hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || '',
      fullName: idData?.fullName || partner.name,
      idNumber: idData?.idNumber || '',
      dateOfBirth: idData?.dateOfBirth || '',
      issueDate: idData?.issueDate || '',
      expiryDate: idData?.expiryDate || '',
      nationality: idData?.nationality || 'GAMBIAN',
      otherDetails: idData?.otherDetails || [],
      tinNumber: acc?.tinNumber || taxData?.tinNumber || '',
      taxpayerName: taxData?.taxpayerName || partner.name,
      taxOffice: acc?.taxOffice || taxData?.taxOffice || 'KANIFING',
      registrationDate: taxData?.registrationDate || partner.generatedDate,
      otherTaxDetails: taxData?.otherDetails || [],
      bankName: acc?.bankDetails?.bankName || 'Trust Bank Gambia Ltd',
      accountName: acc?.bankDetails?.accountName || partner.name,
      accountNumber: acc?.bankDetails?.accountNumber || '',
      sortCodeOrBranch: acc?.bankDetails?.sortCodeOrBranch || 'Banjul Main',
      paymentMode: acc?.bankDetails?.paymentMode || 'Direct Deposit / ACH',
      currency: acc?.compensation?.currency || 'GMD',
      rateType: acc?.compensation?.rateType || 'Monthly Salary',
      compensationAmount: acc?.compensation?.amount || 50000,
      withholdingTaxPct: acc?.compensation?.withholdingTaxPct ?? (partner.category === 'subcontractor' ? 10 : 0),
      paymentTerms: acc?.compensation?.paymentTerms || 'Standard Terms',
      emergencyContactName: hr?.emergencyContact?.fullName || '',
      emergencyContactRel: hr?.emergencyContact?.relationship || '',
      emergencyContactPhone: hr?.emergencyContact?.phoneNumber || '',
      hrClearanceStatus: hr?.hrClearanceStatus || 'Fully Cleared',
      accountsClearanceStatus: acc?.accountsClearanceStatus || 'Billing Approved',
      hrOfficerSignatory: hr?.hrOfficerSignatory || 'Head of Human Resources',
      accountsControllerSignatory: acc?.accountsControllerSignatory || 'Financial Controller',
      verificationSignatory: partner.verificationSignatory || 'Executive Board Signatory',
      verificationDate: partner.verificationDate || partner.generatedDate,
    });
    setEditingPartnerId(partner.id);
  };

  const saveEditing = (partnerId: string) => {
    if (!editFormData || !onUpdatePartner) return;
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return;

    onUpdatePartner(partnerId, {
      name: editFormData.fullName || editFormData.partnerName,
      documentTitle: editFormData.documentTitle,
      category: editFormData.category,
      department: editFormData.department,
      designation: editFormData.designation,
      generatedDate: editFormData.generatedDate,
      extractedData: {
        partnerIdentification: {
          fullName: editFormData.fullName,
          idNumber: editFormData.idNumber,
          dateOfBirth: editFormData.dateOfBirth,
          issueDate: editFormData.issueDate,
          expiryDate: editFormData.expiryDate,
          nationality: editFormData.nationality,
          otherDetails: editFormData.otherDetails,
          idExtractable: true,
          idExtractionNote: null,
        },
        taxInformation: {
          tinNumber: editFormData.tinNumber,
          taxpayerName: editFormData.taxpayerName,
          taxOffice: editFormData.taxOffice,
          registrationDate: editFormData.registrationDate,
          otherDetails: editFormData.otherTaxDetails,
          tinExtractable: true,
          tinExtractionNote: null,
        },
      },
      hrDetails: {
        ...(partner.hrDetails || ({} as any)),
        staffIdOrCode: editFormData.staffIdOrCode,
        reportingSupervisor: partner.hrDetails?.reportingSupervisor || 'Project Director',
        workLocation: partner.hrDetails?.workLocation || 'Corporate HQ',
        dateOfEngagement: partner.hrDetails?.dateOfEngagement || editFormData.generatedDate,
        emergencyContact: {
          fullName: editFormData.emergencyContactName,
          relationship: editFormData.emergencyContactRel,
          phoneNumber: editFormData.emergencyContactPhone,
        },
        hrClearanceStatus: editFormData.hrClearanceStatus as any,
        hrOfficerSignatory: editFormData.hrOfficerSignatory,
        hrSignDate: editFormData.generatedDate,
      },
      accountsDetails: {
        ...(partner.accountsDetails || ({} as any)),
        vendorOrTaxIdCode: editFormData.staffIdOrCode,
        tinNumber: editFormData.tinNumber,
        taxOffice: editFormData.taxOffice,
        taxRegistrationDate: editFormData.registrationDate,
        taxComplianceStatus: partner.accountsDetails?.taxComplianceStatus || 'Tax Clearance Certified',
        bankDetails: {
          bankName: editFormData.bankName,
          accountName: editFormData.accountName,
          accountNumber: editFormData.accountNumber,
          sortCodeOrBranch: editFormData.sortCodeOrBranch,
          currency: editFormData.currency,
          paymentMode: editFormData.paymentMode as any,
        },
        compensation: {
          rateType: editFormData.rateType as any,
          amount: editFormData.compensationAmount,
          currency: editFormData.currency,
          withholdingTaxPct: editFormData.withholdingTaxPct,
          paymentTerms: editFormData.paymentTerms,
        },
        accountsControllerSignatory: editFormData.accountsControllerSignatory,
        accountsSignDate: editFormData.generatedDate,
        accountsClearanceStatus: editFormData.accountsClearanceStatus as any,
      },
      verificationSignatory: editFormData.verificationSignatory,
      verificationDate: editFormData.verificationDate,
    });

    setEditingPartnerId(null);
    setEditFormData(null);
  };

  const handleCopyProfile = (partner: PartnerRecord) => {
    const ext = partner.extractedData;
    const idData = ext?.partnerIdentification;
    const taxData = ext?.taxInformation;
    const hr = partner.hrDetails;
    const acc = partner.accountsDetails;

    const summary = `
APEX INFRASTRUCTURE ENTERPRISE DOSSIER
===========================================
Document Title: ${partner.documentTitle || 'Company Profiles'}
Personnel Name: ${idData?.fullName || partner.name}
Role / Designation: ${partner.designation} (${partner.department})
Classification: ${CATEGORY_LABELS[partner.category]}
Code: ${hr?.staffIdOrCode || acc?.vendorOrTaxIdCode}

IDENTIFICATION BIO-DATA:
- ID / Passport Number: ${idData?.idNumber || 'Verified'}
- Date of Birth: ${idData?.dateOfBirth || 'On File'}
- Nationality: ${idData?.nationality || 'GAMBIAN'}

TAXATION & ACCOUNTS:
- GRA TIN Number: ${acc?.tinNumber || taxData?.tinNumber || 'Attached'}
- Tax Office: ${acc?.taxOffice || 'KANIFING'}
- Bank: ${acc?.bankDetails?.bankName} (Acc: ${acc?.bankDetails?.accountNumber})
- Remittance Rate: ${acc?.compensation?.currency} ${(acc?.compensation?.amount || 0).toLocaleString()} (${acc?.compensation?.rateType})
- Withholding Tax: ${acc?.compensation?.withholdingTaxPct ?? 10}%

COMPLIANCE & CLEARANCES:
- HR Clearance: ${hr?.hrClearanceStatus || 'Verified'} (${hr?.hrOfficerSignatory})
- Accounts Clearance: ${acc?.accountsClearanceStatus || 'Billing Approved'} (${acc?.accountsControllerSignatory})
Generated: ${partner.generatedDate}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopiedPartnerId(partner.id);
    setTimeout(() => setCopiedPartnerId(null), 2500);
  };

  const handleSelectFileToCropAndReplace = (
    partner: PartnerRecord,
    attachmentKey:
      | 'idFrontImage'
      | 'idBackImage'
      | 'tinCertificateImage'
      | 'contractOrAgreementImage'
      | 'bankVerificationImage',
    title: string,
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const attachmentType =
        attachmentKey === 'tinCertificateImage'
          ? 'tinCertificate'
          : attachmentKey === 'idBackImage'
          ? 'idBack'
          : 'idFront';
      setCropModal({
        isOpen: true,
        partnerId: partner.id,
        attachmentKey,
        title,
        imageSrc: src,
        currentAttachmentSrc: partner[attachmentKey] || null,
        attachmentType,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCropForCurrent = (
    partner: PartnerRecord,
    attachmentKey:
      | 'idFrontImage'
      | 'idBackImage'
      | 'tinCertificateImage'
      | 'contractOrAgreementImage'
      | 'bankVerificationImage',
    title: string
  ) => {
    const src = partner[attachmentKey];
    if (!src) return;
    const attachmentType =
      attachmentKey === 'tinCertificateImage'
        ? 'tinCertificate'
        : attachmentKey === 'idBackImage'
        ? 'idBack'
        : 'idFront';
    setCropModal({
      isOpen: true,
      partnerId: partner.id,
      attachmentKey,
      title,
      imageSrc: src,
      currentAttachmentSrc: src,
      attachmentType,
    });
  };

  const handleQuickAutoResize = async (
    partner: PartnerRecord,
    slot: 'idFront' | 'idBack' | 'tinCertificate'
  ) => {
    const currentSrc =
      slot === 'tinCertificate'
        ? partner.tinCertificateImage
        : slot === 'idBack'
        ? partner.idBackImage
        : partner.idFrontImage;
    if (!currentSrc || !onUpdatePartner) return;

    setIsQuickAutoResizing(`${partner.id}-${slot}`);
    try {
      const res = await scanAndAutoResizeDocument(currentSrc, slot, { fillMode: 'fill' });
      const updateKey =
        slot === 'tinCertificate'
          ? 'tinCertificateImage'
          : slot === 'idBack'
          ? 'idBackImage'
          : 'idFrontImage';
      onUpdatePartner(partner.id, { [updateKey]: res.dataUrl });
    } catch (err) {
      console.error('Quick auto-resize error:', err);
    } finally {
      setIsQuickAutoResizing(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6 print:space-y-0">
      {/* Top Floating Control Toolbar (No-Print) */}
      <div className="no-print w-full max-w-[840px] bg-slate-900 text-white rounded-xl p-3 sm:p-4 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky top-2 z-30">
        <div className="flex items-center gap-3">
          {/* Department Role Badge & Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => handleRoleToggle('administrator')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                activeRole === 'administrator'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="General Manager (Overseeing All Departments)"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>General Manager (All)</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle('accounts')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                activeRole === 'accounts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Accounts</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle('hr')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                activeRole === 'hr'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>HR</span>
            </button>
          </div>
        </div>

        {/* Print & Export Controls */}
        <div className="flex items-center gap-2">
          {/* Customize Print Sections Button */}
          <button
            type="button"
            onClick={() => setIsPrintCustomizerOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            title="Choose which sections of the page to include or exclude from print-out"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Print Sections</span>
          </button>

          {/* Quick Print Button */}
          <button
            type="button"
            onClick={() => openPrintDialogWindow(displayedPartners, printSelection)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>

          {/* Offline HTML Download */}
          <button
            type="button"
            onClick={() => downloadStandaloneHtmlDossier(displayedPartners, 'Company-Profiles-Dossier.html', printSelection)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
            title="Download Standalone Offline HTML File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Print Sections Customizer Modal */}
      {isPrintCustomizerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  PRINT CUSTOMIZATION
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Choose Sections to Include in Final Print-Out
                </h3>
                <p className="text-xs text-slate-500">
                  Selectively include or exclude any section of the dossier before printing or exporting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintCustomizerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Presets */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">Quick 1-Click Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => updatePrintSelection(DEFAULT_PRINT_SELECTION)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-800 transition"
                  >
                    All Sections (Full Dossier)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePrintSelection(HR_ONLY_PRINT_SELECTION)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded text-xs font-semibold text-emerald-900 transition"
                  >
                    HR Print Only (No Financials)
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePrintSelection(ACCOUNTS_ONLY_PRINT_SELECTION)}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded text-xs font-semibold text-blue-900 transition"
                  >
                    Accounts &amp; Payroll Print
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePrintSelection(STATUTORY_ID_PRINT_SELECTION)}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded text-xs font-semibold text-purple-900 transition"
                  >
                    Statutory IDs + TIN Only
                  </button>
                </div>
              </div>

              {/* Individual Section Checkboxes */}
              <div className="space-y-2 border border-slate-200 rounded-lg p-3">
                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.coverAndHeader}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, coverAndHeader: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">1. Corporate Header &amp; Document Title</span>
                    <span className="text-[11px] text-slate-500">Corporate branding logo, header &amp; staff code</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.classificationStrip}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, classificationStrip: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">2. Classification &amp; Department Strip</span>
                    <span className="text-[11px] text-slate-500">Personnel category badge, designation, department</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.identificationBioData}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, identificationBioData: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">3. Statutory Bio-Data &amp; Personal Particulars</span>
                    <span className="text-[11px] text-slate-500">Legal name, ID/passport number, date of birth, nationality</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.idCardsImages}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, idCardsImages: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">4. Biometric Identity Cards (ID Front &amp; Back)</span>
                    <span className="text-[11px] text-slate-500">National ECOWAS ID / US Passport scans with MRZ</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.accountsTaxSchedule}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, accountsTaxSchedule: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">5. Accounts, Taxation &amp; Bank Remittance Schedule</span>
                    <span className="text-[11px] text-slate-500">Bank depository, account number, disbursement rate, WHT/PAYE</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.tinCertificateImage}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, tinCertificateImage: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      6. GRA TIN Certificate Image (Half A4 Paper Size)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standardized half-A4 certificate display with tax registration seals
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.employmentOrSubcontractSchedule}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, employmentOrSubcontractSchedule: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">7. Employment / Subcontract Engagement Schedule</span>
                    <span className="text-[11px] text-slate-500">Engagement date, contract term, supervisor, emergency contacts</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.subcontractorMilestoneStages}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, subcontractorMilestoneStages: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">8. Subcontractor Milestone Stages &amp; Contract Sum</span>
                    <span className="text-[11px] text-slate-500">Milestone schedule relative to contract sum and type</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.payrollAdjustmentsAndDeductions}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, payrollAdjustmentsAndDeductions: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">9. Monthly Attendance Deductions &amp; Advance Salary</span>
                    <span className="text-[11px] text-slate-500">Absence deductions, lateness penalties, advance repayments</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={printSelection.departmentSignatures}
                    onChange={(e) =>
                      updatePrintSelection({ ...printSelection, departmentSignatures: e.target.checked })
                    }
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">10. Official Dual Certifications &amp; Signatures</span>
                    <span className="text-[11px] text-slate-500">HR clearance stamp &amp; Accounts controller signoff</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPrintCustomizerOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
                >
                  Done Customizing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPrintCustomizerOpen(false);
                    openPrintDialogWindow(displayedPartners, printSelection);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print with Selected Sections
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render Document Pages */}
      {displayedPartners.map((partner, index) => {
        const pageNumber = index + 1;
        const ext = partner.extractedData;
        const idData = ext?.partnerIdentification;
        const taxData = ext?.taxInformation;
        const hr = partner.hrDetails;
        const acc = partner.accountsDetails;
        const subPlan = acc?.subcontractPlan;
        const adjustments = acc?.payrollAdjustments?.[0];
        const isEditing = editingPartnerId === partner.id;

        const badge = CATEGORY_BADGE_STYLES[partner.category] || CATEGORY_BADGE_STYLES.permanent_employee;

        return (
          <article
            key={partner.id}
            id={`partner-page-${partner.id}`}
            data-partner-page="true"
            className={`w-full max-w-[840px] bg-white text-slate-900 shadow-xl rounded-sm border border-slate-300 overflow-hidden flex flex-col justify-between sm:min-h-[1120px] print:border-none print:shadow-none print:max-w-none print:rounded-none print:p-0 print:m-0 print:min-h-0 print:max-h-none ${
              pageNumber < totalPages ? 'page-break-after' : ''
            }`}
          >
            {/* Top Corporate Accent Bar */}
            <div className="h-2.5 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 w-full print:bg-slate-900 shrink-0" />

            {/* Inner Content with standard A4 margins */}
            <div className="p-3.5 sm:p-7 md:p-9 print:p-4 print:py-3 flex-1 flex flex-col justify-between">
              <div>
                {/* 1. Cover / Corporate Header */}
                <header
                  className={`border-b-2 border-slate-900 pb-3 mb-3.5 ${
                    !printSelection.coverAndHeader ? 'print:hidden' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {/* Organization Top Kicker */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {activeOrg?.logoUrl && (
                          <img
                            src={activeOrg.logoUrl}
                            alt={activeOrg.name}
                            className="h-7 w-auto max-w-[140px] object-contain mr-1 print:max-h-8"
                          />
                        )}
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-slate-900 text-white rounded">
                          {(activeOrg?.headerConfig?.companyName || activeOrg?.name || 'Univision design and Construction Ltd.').toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                          REF: {hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || partner.id.toUpperCase()}
                        </span>
                      </div>

                      {/* Document Title (Editable) */}
                      {isEditing && editFormData ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editFormData.documentTitle}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, documentTitle: e.target.value })
                            }
                            className="text-lg sm:text-2xl font-serif font-bold text-slate-900 border-b-2 border-blue-600 bg-blue-50/40 px-2 py-0.5 rounded focus:outline-none w-full"
                          />
                        </div>
                      ) : (
                        <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-slate-950 mt-1">
                          {partner.documentTitle || 'Company Profiles'}
                        </h1>
                      )}

                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-sans">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Corporate Verification Date: {partner.generatedDate}</span>
                      </div>
                    </div>

                    {/* Right side: Action tools and Page indicator */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="text-[10px] text-slate-400 font-mono tracking-widest font-semibold uppercase">
                        PAGE {pageNumber} OF {totalPages}
                      </div>

                      {/* Interactive Buttons (no-print) */}
                      <div className="no-print flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditing(partner.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPartnerId(null);
                                setEditFormData(null);
                              }}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(partner)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium flex items-center gap-1 transition"
                              title="Edit all textual bio-data and classification"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyProfile(partner)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium flex items-center gap-1 transition"
                              title="Copy text summary to clipboard"
                            >
                              {copiedPartnerId === partner.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-medium">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Classification & Department Strip */}
                  <div
                    className={`mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded flex flex-wrap items-center justify-between gap-2 text-xs ${
                      !printSelection.classificationStrip ? 'print:hidden' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {CATEGORY_LABELS[partner.category] || partner.category}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || 'CODE: PENDING'}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-bold text-slate-900">{partner.designation || 'Corporate Role'}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{partner.department || 'Operations'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        HR: {hr?.hrClearanceStatus || 'Verified'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-900 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Accounts: {acc?.accountsClearanceStatus || 'Billing Approved'}
                      </span>
                    </div>
                  </div>
                </header>

                {/* Section 1: Personnel Identification & Statutory Bio-Data */}
                <section
                  className={`mb-3.5 ${!printSelection.identificationBioData ? 'print:hidden' : ''}`}
                >
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      1
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      Personnel Identification &amp; Statutory Bio-Data
                    </h2>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans ml-auto">
                      (Verified from Attached Identity Credentials)
                    </span>
                  </div>

                  {/* Identification Details Table */}
                  <div className="overflow-x-auto border border-slate-300 rounded-sm mb-2.5">
                    <table className="w-full min-w-[460px] sm:min-w-0 text-left text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <th className="w-28 sm:w-36 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Full Legal Name
                          </th>
                          <td className="px-3 py-1.5 font-bold text-slate-950 text-sm">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.fullName}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, fullName: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded font-bold text-sm"
                              />
                            ) : (
                              idData?.fullName || partner.name
                            )}
                          </td>
                          <th className="w-24 sm:w-32 bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            ID / Passport No
                          </th>
                          <td className="px-3 py-1.5 font-mono font-bold text-blue-950 text-xs">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.idNumber}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, idNumber: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded font-mono font-bold text-xs"
                              />
                            ) : (
                              idData?.idNumber || 'Verified on Scan'
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Date of Birth
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.dateOfBirth}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, dateOfBirth: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs"
                              />
                            ) : (
                              idData?.dateOfBirth || 'Document Archived'
                            )}
                          </td>
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Nationality
                          </th>
                          <td className="px-3 py-1.5 text-slate-800 font-medium">
                            {isEditing && editFormData ? (
                              <input
                                type="text"
                                value={editFormData.nationality}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, nationality: e.target.value })
                                }
                                className="w-full px-2 py-0.5 border border-blue-400 bg-blue-50/30 rounded text-xs"
                              />
                            ) : (
                              idData?.nationality || 'GAMBIAN'
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Validity Term
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            Issue: {idData?.issueDate || '—'} · Expiry: {idData?.expiryDate || '—'}
                          </td>
                          <th className="bg-slate-100/90 px-3 py-1.5 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                            Work Station
                          </th>
                          <td className="px-3 py-1.5 text-slate-800">
                            {hr?.workLocation || 'Central Headquarters & Project Sites'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 2: Attached Biometric Identity Cards */}
                <section
                  className={`mb-3.5 ${!printSelection.idCardsImages ? 'print:hidden' : ''}`}
                >
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      2
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      Biometric Identity Documents (ID Front &amp; Back)
                    </h2>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans ml-auto hidden sm:inline">
                      (Statutory ISO/IEC 7810 ID-1 Standard • 85.60 × 53.98 mm)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIdFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
                      className="no-print ml-auto sm:ml-2 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold inline-flex items-center gap-1 shadow-2xs transition text-[10px]"
                      title="Toggle between Edge-to-Edge Statutory Fit and Margin Contain"
                    >
                      <Scan className="w-3 h-3 text-blue-700" />
                      <span>Fit: {idFitMode === 'cover' ? 'Statutory Fill (Edge-to-Edge)' : 'Contain Margin'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
                    {/* ID Front */}
                    <div className="image-attachment-card avoid-break border border-slate-300 rounded-lg p-2 bg-slate-50/70 flex flex-col justify-between print:p-1.5 print:break-inside-avoid">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: ID Front Image
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            PRIMARY ID (85.6 × 54mm)
                          </span>
                        </div>
                        {partner.idFrontImage ? (
                          <div
                            onClick={() =>
                              setLightboxImage({
                                src: partner.idFrontImage!,
                                title: `${partner.name} - ID Front Image`,
                                slot: 'idFront',
                                partnerId: partner.id,
                              })
                            }
                            className="id-card-frame group relative cursor-pointer rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center w-full aspect-[85.6/53.98] print:h-[56.75mm] print:max-h-[57mm] overflow-hidden transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.idFrontImage}
                              alt="ID Front Image"
                              className={`w-full h-full ${idFitMode === 'cover' ? 'object-cover' : 'object-contain'} object-center transition-all duration-200`}
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              View Full
                            </div>
                          </div>
                        ) : (
                          <label className="h-28 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach ID Front Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleSelectFileToCropAndReplace(
                                    partner,
                                    'idFrontImage',
                                    'ID Front Image',
                                    e.target.files[0]
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {partner.idFrontImage && (
                        <div className="no-print mt-1.5 flex items-center justify-between gap-1 pt-1 border-t border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleQuickAutoResize(partner, 'idFront')}
                            disabled={isQuickAutoResizing === `${partner.id}-idFront`}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                            title="Auto-scales to crisp standard 85.6 x 53.98 mm format"
                          >
                            <Maximize2 className="w-3 h-3 text-blue-600" />
                            Auto-Fit (85.6×54mm)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCropForCurrent(partner, 'idFrontImage', 'ID Front')}
                            className="px-1.5 py-0.5 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Crop className="w-3 h-3 text-blue-600" />
                            Crop
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ID Back */}
                    <div className="image-attachment-card avoid-break border border-slate-300 rounded-lg p-2 bg-slate-50/70 flex flex-col justify-between print:p-1.5 print:break-inside-avoid">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                            Attached: ID Back Image
                          </span>
                          <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            MRZ &amp; ENDORSEMENT
                          </span>
                        </div>
                        {partner.idBackImage ? (
                          <div
                            onClick={() =>
                              setLightboxImage({
                                src: partner.idBackImage!,
                                title: `${partner.name} - ID Back Image`,
                                slot: 'idBack',
                                partnerId: partner.id,
                              })
                            }
                            className="id-card-frame group relative cursor-pointer rounded-lg border border-slate-300 bg-slate-100 flex items-center justify-center w-full aspect-[85.6/53.98] print:h-[56.75mm] print:max-h-[57mm] overflow-hidden transition hover:border-blue-500 shadow-2xs"
                          >
                            <img
                              src={partner.idBackImage}
                              alt="ID Back Image"
                              className={`w-full h-full ${idFitMode === 'cover' ? 'object-cover' : 'object-contain'} object-center transition-all duration-200`}
                            />
                            <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <ZoomIn className="w-3.5 h-3.5" />
                              View Full
                            </div>
                          </div>
                        ) : (
                          <label className="h-28 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-[11px] cursor-pointer hover:border-blue-500 hover:bg-white transition p-2 text-center">
                            <Upload className="w-4 h-4 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700">Attach ID Back Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleSelectFileToCropAndReplace(
                                    partner,
                                    'idBackImage',
                                    'ID Back Image',
                                    e.target.files[0]
                                  );
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {partner.idBackImage && (
                        <div className="no-print mt-1.5 flex items-center justify-between gap-1 pt-1 border-t border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleQuickAutoResize(partner, 'idBack')}
                            disabled={isQuickAutoResizing === `${partner.id}-idBack`}
                            className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                            title="Auto-scales to crisp standard 85.6 x 53.98 mm format"
                          >
                            <Maximize2 className="w-3 h-3 text-blue-600" />
                            Auto-Fit (85.6×54mm)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCropForCurrent(partner, 'idBackImage', 'ID Back')}
                            className="px-1.5 py-0.5 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Crop className="w-3 h-3 text-blue-600" />
                            Crop
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 3: Accounts, Taxation & Bank Remittance Information */}
                <section
                  className={`mb-3.5 ${!printSelection.accountsTaxSchedule ? 'print:hidden' : ''}`}
                >
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      3
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      Accounts, Taxation &amp; Bank Remittance Information
                    </h2>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans ml-auto">
                      (Restricted to Finance &amp; Accounts Department)
                    </span>
                  </div>

                  {/* Financial Restriction Check: If viewed in HR Role, shield figures */}
                  {activeRole === 'hr' ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center space-y-1.5 my-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 mb-1">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                        Financial Remittance Restricted to Accounts Department
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                        In accordance with enterprise segregation of duties, banking details, compensation amounts, and tax withholding figures are shielded in HR view.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRoleToggle('accounts')}
                        className="no-print mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5 transition"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Authorize / Switch to Accounts Role</span>
                      </button>
                    </div>
                  ) : (
                    /* Accounts Full Financial Access Table */
                    <div className="border border-slate-300 rounded overflow-hidden mb-2.5">
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <th className="w-32 bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              GRA TIN Number
                            </th>
                            <td className="px-2.5 py-1.5 font-mono font-bold text-blue-950 text-xs">
                              {acc?.tinNumber || taxData?.tinNumber || '2000402822'}
                            </td>
                            <th className="w-32 bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Tax Jurisdiction
                            </th>
                            <td className="px-2.5 py-1.5 text-slate-800">
                              {acc?.taxOffice || taxData?.taxOffice || 'KANIFING'} Division · GRA
                            </td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Bank Depository
                            </th>
                            <td className="px-2.5 py-1.5 font-bold text-slate-900">
                              {acc?.bankDetails?.bankName || 'Trust Bank Gambia Ltd'}
                            </td>
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Account Number
                            </th>
                            <td className="px-2.5 py-1.5 font-mono font-bold text-blue-900 text-xs">
                              {acc?.bankDetails?.accountNumber || '011002938101'}
                            </td>
                          </tr>
                          <tr>
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Disbursement Rate
                            </th>
                            <td className="px-2.5 py-1.5 font-bold text-slate-900">
                              {acc?.compensation?.currency || 'GMD'} {(acc?.compensation?.amount || 65000).toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({acc?.compensation?.rateType || 'Monthly Salary'})
                              </span>
                            </td>
                            <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Tax Treatment
                            </th>
                            <td className="px-2.5 py-1.5 text-slate-800 font-semibold">
                              {partner.category === 'subcontractor' ? (
                                <span className="text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[10px]">
                                  {acc?.compensation?.withholdingTaxPct ?? 10}% Withholding Tax (WHT Deducted)
                                </span>
                              ) : (
                                <span className="text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                  Statutory PAYE Remitted to Revenue Authority
                                </span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Section 3-B: Attached GRA TIN Certificate Scan (HALF A4 PAPER SCALE) */}
                <section
                  className={`tin-certificate-container avoid-break mb-3.5 print:break-inside-avoid ${
                    !printSelection.tinCertificateImage ? 'print:hidden' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      3B
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      Attached GRA Taxpayer Identification Number (TIN) Certificate
                    </h2>
                    <span className="text-[9px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono font-bold ml-auto hidden sm:inline">
                      EXACT HALF A4 SCALE (210 × 148.5 mm • 135mm Print Height)
                    </span>
                    <button
                      type="button"
                      onClick={() => setTinFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
                      className="no-print ml-auto sm:ml-2 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold inline-flex items-center gap-1 shadow-2xs transition text-[10px]"
                      title="Toggle between Scale Contain and Edge-to-Edge Fill"
                    >
                      <Scaling className="w-3 h-3 text-blue-700" />
                      <span>Fit: {tinFitMode === 'cover' ? 'Fill Frame (Cover)' : 'Full Certificate (Contain)'}</span>
                    </button>
                  </div>

                  {/* PROMINENT HALF-A4 DOCUMENT CARD (Exactly Half Size of A4 Paper) */}
                  <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-800" />
                        <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                          Official Gambia Revenue Authority (GRA) Certificate
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        TIN: {acc?.tinNumber || taxData?.tinNumber || '2000402822'} · Office: {acc?.taxOffice || 'KANIFING'}
                      </div>
                    </div>

                    {partner.tinCertificateImage ? (
                      /* Half-A4 Display Box: aspect ratio ~1.414:1, exact 135mm print height */
                      <div
                        onClick={() =>
                          setLightboxImage({
                            src: partner.tinCertificateImage!,
                            title: `${partner.name} - GRA TIN Certificate (Half A4 Paper Scale)`,
                            slot: 'tinCertificate',
                            partnerId: partner.id,
                          })
                        }
                        className="tin-certificate-frame group relative cursor-pointer rounded-lg border border-slate-300 bg-white flex items-center justify-center w-full aspect-[210/148.5] print:h-[135mm] print:max-h-[135mm] print:w-full overflow-hidden transition hover:border-blue-500 shadow-sm"
                      >
                        <img
                          src={partner.tinCertificateImage}
                          alt="TIN Certificate Image"
                          className={`w-full h-full ${tinFitMode === 'cover' ? 'object-cover' : 'object-contain'} object-center transition-all duration-200`}
                        />
                        <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                          <ZoomIn className="w-4 h-4" />
                          <span>View Fullscreen Half-A4 Certificate</span>
                        </div>
                      </div>
                    ) : (
                      <label className="h-56 sm:h-64 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-500 text-xs cursor-pointer hover:border-blue-500 hover:bg-white transition p-4 text-center">
                        <Upload className="w-4 h-4 text-blue-600 mb-2" />
                        <span className="font-bold text-slate-800 text-sm">Attach GRA TIN Certificate (Half A4)</span>
                        <span className="text-[11px] text-slate-400 mt-1">Upload scanned GRA tax registration document</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSelectFileToCropAndReplace(
                                partner,
                                'tinCertificateImage',
                                'TIN Certificate',
                                e.target.files[0]
                              );
                            }
                          }}
                        />
                      </label>
                    )}

                    {partner.tinCertificateImage && (
                      <div className="no-print mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200 text-xs">
                        <span className="text-[11px] text-slate-500 font-sans">
                          Half A4 paper scale verified (135mm height on A4). Prints crisp and legible on A4 sheet.
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAutoResize(partner, 'tinCertificate')}
                            disabled={isQuickAutoResizing === `${partner.id}-tinCertificate`}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                            Auto-Fit Vector
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenCropForCurrent(partner, 'tinCertificateImage', 'TIN Certificate')}
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1 shadow-2xs transition"
                          >
                            <Crop className="w-3.5 h-3.5 text-blue-600" />
                            Crop &amp; Frame
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Section 4: Employment Schedule / Subcontract Service Schedule */}
                <section
                  className={`mb-3.5 ${!printSelection.employmentOrSubcontractSchedule ? 'print:hidden' : ''}`}
                >
                  <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                      4
                    </div>
                    <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                      {partner.category === 'subcontractor'
                        ? 'Subcontract Service Schedule & Agreement'
                        : 'Employment Appointment & Contract Details'}
                    </h2>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-sans ml-auto">
                      (Human Resources Department Record)
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 rounded mb-2.5">
                    <table className="w-full text-left text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <th className="w-32 bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                            Date of Engagement
                          </th>
                          <td className="px-2.5 py-1.5 font-bold text-slate-900">
                            {hr?.dateOfEngagement || partner.generatedDate}
                          </td>
                          <th className="w-32 bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                            Contract Term
                          </th>
                          <td className="px-2.5 py-1.5 text-slate-800">
                            {hr?.contractEndDate ||
                              (partner.category === 'subcontractor'
                                ? 'Milestone Contract Term (Renewable)'
                                : 'Permanent Indefinite Full-Time')}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                            Supervisor / Authority
                          </th>
                          <td className="px-2.5 py-1.5 text-slate-800 font-medium">
                            {hr?.reportingSupervisor || 'Managing Partner / Project Director'}
                          </td>
                          <th className="bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                            Emergency Contact
                          </th>
                          <td className="px-2.5 py-1.5 text-slate-800">
                            {hr?.emergencyContact?.fullName || 'Contact on Record'} (
                            {hr?.emergencyContact?.relationship || 'Family'}) ·{' '}
                            {hr?.emergencyContact?.phoneNumber || '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 4-B: Subcontractor Milestone Stages (Only for Subcontractors) */}
                {partner.category === 'subcontractor' && subPlan && (
                  <section
                    className={`mb-3.5 ${!printSelection.subcontractorMilestoneStages ? 'print:hidden' : ''}`}
                  >
                    <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                      <div className="w-5 h-5 rounded bg-purple-900 text-white flex items-center justify-center text-[10px] font-bold">
                        4B
                      </div>
                      <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                        Subcontractor Payment Stages &amp; Milestone Plan ({subPlan.contractType})
                      </h2>
                      <span className="text-[10px] sm:text-[11px] text-purple-700 font-mono font-bold ml-auto">
                        TOTAL SUM: GMD {subPlan.contractSum.toLocaleString()}
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-purple-200 rounded mb-2.5">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-purple-50/70 border-b border-purple-200 text-purple-950 font-semibold uppercase text-[10px]">
                            <th className="py-2 px-3">Stage #</th>
                            <th className="py-2 px-3">Milestone Scope</th>
                            <th className="py-2 px-3">Percent (%)</th>
                            <th className="py-2 px-3">Stage Amount</th>
                            <th className="py-2 px-3">10% WHT</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100">
                          {subPlan.stages.map((stg) => (
                            <tr key={stg.id} className="hover:bg-purple-50/30">
                              <td className="py-2 px-3 font-bold">Stage #{stg.stageNumber}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{stg.stageName}</td>
                              <td className="py-2 px-3">{stg.percentage}%</td>
                              <td className="py-2 px-3 font-bold font-mono">GMD {stg.amount.toLocaleString()}</td>
                              <td className="py-2 px-3 text-purple-800">
                                - GMD {((stg.amount * stg.whtDeductionPct) / 100).toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    stg.status === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : stg.status === 'approved'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {stg.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Section 5: Monthly Payroll Adjustments: Absence, Lateness & Advance Salary (For Employees) */}
                {partner.category !== 'subcontractor' && adjustments && (
                  <section
                    className={`mb-3.5 ${!printSelection.payrollAdjustmentsAndDeductions ? 'print:hidden' : ''}`}
                  >
                    <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                      <div className="w-5 h-5 rounded bg-emerald-900 text-white flex items-center justify-center text-[10px] font-bold">
                        5
                      </div>
                      <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                        Monthly Payroll Adjustments: Absence, Lateness &amp; Advance Salary
                      </h2>
                      <span className="text-[10px] sm:text-[11px] text-emerald-800 font-mono font-bold ml-auto">
                        MONTH: {adjustments.month}
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-emerald-200 rounded mb-2.5">
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          <tr className="border-b border-slate-200">
                            <th className="w-36 bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Gross Base &amp; Allowances
                            </th>
                            <td className="px-3 py-1.5 font-bold text-slate-900">
                              GMD {(adjustments.baseSalary + adjustments.allowances).toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">
                                (Base: {adjustments.baseSalary.toLocaleString()} + Allow: {adjustments.allowances.toLocaleString()})
                              </span>
                            </td>
                            <th className="w-36 bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 text-[10px] uppercase">
                              Advance Loan Balance
                            </th>
                            <td className="px-3 py-1.5 font-bold text-blue-900 font-mono">
                              GMD {adjustments.advanceBalanceRemaining.toLocaleString()}{' '}
                              <span className="text-[10px] text-blue-600 font-normal">
                                (-{adjustments.advanceRecoveryDeduction.toLocaleString()} deducted)
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <th className="bg-red-50/80 px-3 py-1.5 font-semibold text-red-900 text-[10px] uppercase">
                              Absence &amp; Late Deductions
                            </th>
                            <td className="px-3 py-1.5 text-red-700 font-bold">
                              - GMD {(adjustments.absenceDeductionAmount + adjustments.latenessPenaltyAmount).toLocaleString()}{' '}
                              <span className="text-[10px] text-red-500 font-normal">
                                ({adjustments.daysAbsent}d absent, {adjustments.lateOccurrencesOrHours}h late)
                              </span>
                            </td>
                            <th className="bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-900 text-[10px] uppercase">
                              Net Disbursable Salary
                            </th>
                            <td className="px-3 py-1.5 font-bold text-emerald-900 font-mono text-sm">
                              GMD {adjustments.netSalaryPayable.toLocaleString()}{' '}
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                                {adjustments.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Section 6: Attached Formal Contract / Agreement Preview */}
                {partner.contractOrAgreementImage && (
                  <section
                    className={`tin-certificate-container avoid-break mb-3.5 print:break-inside-avoid ${
                      !printSelection.agreementDocumentsImages ? 'print:hidden' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2">
                      <div className="w-5 h-5 rounded bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                        6
                      </div>
                      <h2 className="text-sm sm:text-base font-serif font-bold text-slate-950">
                        Attached Engagement Agreement / Subcontract Service Schedule
                      </h2>
                    </div>

                    <div
                      onClick={() =>
                        setLightboxImage({
                          src: partner.contractOrAgreementImage!,
                          title: `${partner.name} - Contract / Subcontract Agreement`,
                          slot: 'contractOrAgreement',
                          partnerId: partner.id,
                        })
                      }
                      className="group relative cursor-pointer rounded border border-slate-300 bg-white flex items-center justify-center w-full min-h-[300px] max-h-[460px] aspect-[1.414/1] overflow-hidden transition hover:border-blue-500 shadow-sm"
                    >
                      <img
                        src={partner.contractOrAgreementImage}
                        alt="Contract / Agreement Image"
                        className="w-full h-full object-contain object-center"
                      />
                      <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <ZoomIn className="w-4 h-4" />
                        <span>View Full Contract Preview</span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Section 7: Dual Certifications & Certified Signatures */}
                <section
                  className={`border-t-2 border-slate-900 pt-2.5 mt-3 ${
                    !printSelection.departmentSignatures ? 'print:hidden' : ''
                  }`}
                >
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="border border-slate-200 rounded p-2 bg-slate-50">
                      <div className="font-bold text-[10px] text-slate-800 uppercase mb-1">
                        1. Human Resources Certification
                      </div>
                      <div className="space-y-0.5 text-[11px] text-slate-600">
                        <div>
                          Status: <strong className="text-slate-900">{hr?.hrClearanceStatus || 'Fully Cleared'}</strong>
                        </div>
                        <div>
                          Signatory: <strong className="text-slate-900">{hr?.hrOfficerSignatory || 'Head of HR'}</strong>
                        </div>
                        <div className="pt-2 font-mono text-[10px] text-slate-400">
                          Signature: __________________________
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded p-2 bg-slate-50">
                      <div className="font-bold text-[10px] text-slate-800 uppercase mb-1">
                        2. Accounts &amp; Finance Certification
                      </div>
                      <div className="space-y-0.5 text-[11px] text-slate-600">
                        <div>
                          Status: <strong className="text-slate-900">{acc?.accountsClearanceStatus || 'Billing Approved'}</strong>
                        </div>
                        <div>
                          Signatory: <strong className="text-slate-900">{acc?.accountsControllerSignatory || 'Financial Controller'}</strong>
                        </div>
                        <div className="pt-2 font-mono text-[10px] text-slate-400">
                          Signature: __________________________
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Dossier Footer */}
              <footer className="border-t border-slate-300 pt-2 mt-3 flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                <span>
                  {(activeOrg?.footerConfig?.confidentialityNotice || 'Univision design and Construction Ltd. · CONFIDENTIAL INTERNAL DOSSIER').toUpperCase()}
                </span>
                <span>PAGE {pageNumber} OF {totalPages}</span>
              </footer>
            </div>
          </article>
        );
      })}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col justify-between p-3 sm:p-5">
          <div className="flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <div className="font-bold text-sm truncate">{lightboxImage.title}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-white"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 bg-red-600 hover:bg-red-500 rounded text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              style={{
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: 'transform 0.15s ease-out',
                maxWidth: '90vw',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
              className="rounded shadow-2xl bg-white"
            />
          </div>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            Click outside or press X to close.
          </div>
        </div>
      )}

      {/* Interactive Crop Modal */}
      {cropModal && (
        <ImageCropModal
          isOpen={cropModal.isOpen}
          title={cropModal.title}
          imageSrc={cropModal.imageSrc}
          currentAttachmentSrc={cropModal.currentAttachmentSrc}
          attachmentType={cropModal.attachmentType}
          onCancel={() => setCropModal(null)}
          onConfirm={(croppedDataUrl) => {
            if (onUpdatePartner) {
              onUpdatePartner(cropModal.partnerId, {
                [cropModal.attachmentKey]: croppedDataUrl,
              });
            }
            setCropModal(null);
          }}
        />
      )}

      {/* Document Scanner Modal */}
      {scannerModal && (
        <DocumentScannerModal
          isOpen={scannerModal.isOpen}
          partner={scannerModal.partner}
          initialImageSrc={scannerModal.initialImageSrc}
          targetSlot={scannerModal.targetSlot}
          onClose={() => setScannerModal(null)}
          onApply={({ slot, resizedDataUrl }) => {
            if (onUpdatePartner) {
              const updateKey =
                slot === 'tinCertificate'
                  ? 'tinCertificateImage'
                  : slot === 'idBack'
                  ? 'idBackImage'
                  : 'idFrontImage';
              onUpdatePartner(scannerModal.partner.id, {
                [updateKey]: resizedDataUrl,
              });
            }
            setScannerModal(null);
          }}
        />
      )}
    </div>
  );
};
