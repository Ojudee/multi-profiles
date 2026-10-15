import React, { useState } from 'react';
import {
  PartnerRecord,
  PersonnelCategory,
  CATEGORY_LABELS,
} from '../types';
import {
  generateEcowasIdFront,
  generateEcowasIdBack,
  generateGambiaTinCertificate,
  generateEmploymentContractPreview,
  generateSubcontractAgreementPreview,
  generateBankVerificationSlip,
} from '../utils/documentGraphics';
import {
  UserPlus,
  Building,
  Briefcase,
  Wrench,
  Users,
  ShieldCheck,
  CreditCard,
  FileCheck,
  X,
  Sparkles,
} from 'lucide-react';

interface NewProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProfile: (newProfile: PartnerRecord) => void;
  initialCategory?: PersonnelCategory;
}

export const NewProfileModal: React.FC<NewProfileModalProps> = ({
  isOpen,
  onClose,
  onAddProfile,
  initialCategory = 'permanent_employee',
}) => {
  const [category, setCategory] = useState<PersonnelCategory>(initialCategory);
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('Civil & Structural Engineering');
  const [designation, setDesignation] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('KANIFING');
  const [bankName, setBankName] = useState('Trust Bank Gambia Ltd');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('65000');
  const [rateType, setRateType] = useState<'Monthly Salary' | 'Milestone Contract Fee' | 'Daily Rate'>('Monthly Salary');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (cat: PersonnelCategory) => {
    setCategory(cat);
    const randId = Math.floor(1000 + Math.random() * 9000);
    if (cat === 'subcontractor') {
      setCode(`SUB-TRD-${randId}`);
      setDepartment('Electrical & Mechanical (MEP) Contracting');
      setDesignation('Specialist Trade Subcontractor');
      setRateType('Milestone Contract Fee');
      setAmount('85000');
    } else if (cat === 'permanent_employee') {
      setCode(`EMP-2026-${randId}`);
      setDepartment('Civil & Structural Engineering');
      setDesignation('Project Civil Engineer');
      setRateType('Monthly Salary');
      setAmount('65000');
    } else if (cat === 'contract_staff') {
      setCode(`CTR-SITE-${randId}`);
      setDepartment('Site Operations & Logistics');
      setDesignation('Site Quality & Safety Officer');
      setRateType('Monthly Salary');
      setAmount('52000');
    } else if (cat === 'executive_partner') {
      setCode(`EXEC-DIR-${randId}`);
      setDepartment('Executive Management');
      setDesignation('Partner & Corporate Director');
      setRateType('Monthly Salary');
      setAmount('125000');
    } else {
      setCode(`INT-2026-${randId}`);
      setDepartment('Engineering Operations');
      setDesignation('Technical Trainee');
      setRateType('Monthly Salary');
      setAmount('25000');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fullName.trim() || `Profile ${code || Date.now().toString().slice(-4)}`;
    const newId = `profile-${Date.now()}`;
    const today = 'October 6, 2026';
    const randTin = tinNumber.trim() || `2${Math.floor(100000000 + Math.random() * 900000000)}`;

    const idFront = generateEcowasIdFront({
      surname: finalName.split(' ').slice(-1)[0] || 'PERSONNEL',
      firstnames: finalName.split(' ').slice(0, -1).join(' ') || 'OFFICIAL',
      dob: '15/06/1992',
      issueDate: '10/01/2024',
      expiryDate: '10/01/2029',
      placeOfIssue: 'BANJUL',
      docNumber: Math.floor(600000 + Math.random() * 300000).toString(),
      sex: 'M',
      height: '175',
      idNumber: `${Math.floor(100000 + Math.random() * 800000)}-010-001`,
      serialNumber: Math.floor(10000 + Math.random() * 80000).toString(),
    });

    const idBack = generateEcowasIdBack({
      surname: finalName.split(' ').slice(-1)[0] || 'PERSONNEL',
      firstnames: finalName.split(' ').slice(0, -1).join(' ') || 'OFFICIAL',
      nationality: 'GAMBIAN',
      placeOfBirth: 'BANJUL',
      permanentAddress: 'GREATER BANJUL AREA',
      occupation: designation || 'CORPORATE PERSONNEL',
      cardNo: `AA${Math.floor(100000 + Math.random() * 800000)}`,
      mrz1: `IDGMB0009907700211201<010<013<`,
      mrz2: `0112215M3008270GMB<<<<<<<<<<<4`,
      mrz3: `${finalName.toUpperCase().replace(/\s+/g, '<')}<<<<<<<<<<`,
    });

    const tinCert = generateGambiaTinCertificate({
      tin: randTin,
      name: finalName,
      issueOffice: taxOffice || 'KANIFING',
      birthDate: '15 June 1992',
      physicalAddress: 'GREATER BANJUL AREA',
      issueDate: today,
    });

    const contractDoc =
      category === 'subcontractor'
        ? generateSubcontractAgreementPreview({
            contractorName: finalName,
            vendorCode: code || `SUB-${Date.now().toString().slice(-4)}`,
            scopeOfWork: designation || 'Specialist Subcontract Works',
            issueDate: today,
            contractValue: `GMD ${Number(amount || 0).toLocaleString()} Milestone Schedule`,
            whtRate: '10%',
          })
        : generateEmploymentContractPreview({
            employeeName: finalName,
            staffId: code || `EMP-${Date.now().toString().slice(-4)}`,
            designation: designation || 'Corporate Staff',
            department: department || 'Engineering',
            hireDate: today,
          });

    const bankDoc = generateBankVerificationSlip({
      bankName: bankName || 'Trust Bank Gambia Ltd',
      accountName: finalName,
      accountNumber: accountNumber || '011002938101',
      branch: 'Banjul Branch',
      currency: 'GMD',
    });

    const newRecord: PartnerRecord = {
      id: newId,
      name: finalName,
      category,
      department: department || 'Operations',
      designation: designation || (category === 'subcontractor' ? 'Subcontractor' : 'Staff'),
      documentTitle: 'Company Profiles',
      generatedDate: today,
      status: 'extracted',
      idFrontImage: idFront,
      idBackImage: idBack,
      tinCertificateImage: tinCert,
      contractOrAgreementImage: contractDoc,
      bankVerificationImage: bankDoc,
      extractedData: {
        partnerIdentification: {
          fullName: finalName,
          idNumber: `${Math.floor(100000 + Math.random() * 800000)}-010-001`,
          dateOfBirth: '15/06/1992',
          issueDate: '10/01/2024',
          expiryDate: '10/01/2029',
          nationality: 'GAMBIAN',
          otherDetails: [
            { label: 'Role / Designation', value: designation || 'Staff' },
            { label: 'Department', value: department || 'Operations' },
            { label: 'Classification', value: CATEGORY_LABELS[category] },
          ],
          idExtractable: true,
        },
        taxInformation: {
          tinNumber: randTin,
          taxpayerName: finalName,
          taxOffice: taxOffice || 'KANIFING',
          registrationDate: today,
          otherDetails: [
            { label: 'Tax Status', value: category === 'subcontractor' ? '10% Withholding Tax' : 'PAYE Registered' },
            { label: 'Issuing Tax Authority', value: 'The Gambia Revenue Authority (GRA)' },
          ],
          tinExtractable: true,
        },
      },
      hrDetails: {
        staffIdOrCode: code || (category === 'subcontractor' ? `SUB-${Date.now().toString().slice(-4)}` : `EMP-${Date.now().toString().slice(-4)}`),
        dateOfEngagement: today,
        contractEndDate: category === 'permanent_employee' ? 'Permanent' : 'December 31, 2027',
        reportingSupervisor: 'Project Director / Head of HR',
        workLocation: 'Port Expansion Project Site & Central HQ',
        emergencyContact: {
          fullName: emergencyName || 'Next of Kin on Record',
          relationship: emergencyRel || 'Family',
          phoneNumber: emergencyPhone || '+220 700 0000',
        },
        hrClearanceStatus: 'Fully Cleared',
        backgroundCheckVerified: true,
        signedAgreementOnRecord: true,
        medicalFitnessVerified: true,
        hrOfficerSignatory: 'Fatou Sallah, Head of Human Resources',
        hrSignDate: today,
      },
      accountsDetails: {
        vendorOrTaxIdCode: code || `ACC-${Date.now().toString().slice(-4)}`,
        tinNumber: randTin,
        taxOffice: taxOffice || 'KANIFING',
        taxRegistrationDate: today,
        taxComplianceStatus: category === 'subcontractor' ? 'Withholding Tax Compliant' : 'Tax Clearance Certified',
        withholdingTaxCertificateNo: `GRA-WHT-${Date.now().toString().slice(-4)}`,
        bankDetails: {
          bankName: bankName || 'Trust Bank Gambia Ltd',
          accountName: finalName,
          accountNumber: accountNumber || '011002938101',
          currency: 'GMD',
          paymentMode: category === 'subcontractor' ? 'Milestone Disbursement' : 'Direct Deposit / ACH',
        },
        compensation: {
          rateType,
          amount: Number(amount) || 50000,
          currency: 'GMD',
          withholdingTaxPct: category === 'subcontractor' ? 10 : 0,
          paymentTerms: category === 'subcontractor' ? 'Net 15 Days after Invoice' : 'End of Month Payroll',
        },
        accountsControllerSignatory: 'Aminata Bah, Financial Controller',
        accountsSignDate: today,
        accountsClearanceStatus: category === 'subcontractor' ? 'Billing Approved' : 'Payroll Active',
      },
      verificationSignatory: 'Authorized Corporate Signatory',
      verificationDate: today,
    };

    onAddProfile(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-900" />
              Profile New Personnel or Subcontractor
            </h2>
            <p className="text-xs text-slate-500">
              Create an official profile for HR People Operations and Accounts &amp; Finance disbursement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Category Presets Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Select Personnel Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('permanent_employee')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  category === 'permanent_employee'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-emerald-700 mb-1" />
                <div className="font-bold text-xs">Permanent Staff</div>
                <div className="text-[10px] text-slate-500">PAYE, Full-Time</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('subcontractor')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  category === 'subcontractor'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Wrench className="w-4 h-4 text-purple-700 mb-1" />
                <div className="font-bold text-xs">Subcontractor</div>
                <div className="text-[10px] text-slate-500">10% WHT, Trades</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('contract_staff')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  category === 'contract_staff'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-blue-700 mb-1" />
                <div className="font-bold text-xs">Contract Staff</div>
                <div className="text-[10px] text-slate-500">Fixed-term project</div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('executive_partner')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  category === 'executive_partner'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building className="w-4 h-4 text-amber-700 mb-1" />
                <div className="font-bold text-xs">Partner / Exec</div>
                <div className="text-[10px] text-slate-500">Board member</div>
              </button>
            </div>
          </div>

          {/* Basic Identity Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name (or Business Entity Name) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. EBRAHIMA SALLAH or SALLAH CIVIL WORKS"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Staff ID / Subcontractor Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. EMP-2026-081 or SUB-ELEC-4401"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Department & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department / Operational Division
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Civil & Structural Engineering"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Designation / Trade Scope
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Site Engineer or Electrical Subcontractor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Tax & Accounts */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
              <CreditCard className="w-3.5 h-3.5 text-blue-700" />
              Tax &amp; Bank Remittance Information (Accounts Department)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  TIN Number
                </label>
                <input
                  type="text"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  placeholder="e.g. 2000402822"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  GRA Tax Office
                </label>
                <input
                  type="text"
                  value={taxOffice}
                  onChange={(e) => setTaxOffice(e.target.value)}
                  placeholder="e.g. KANIFING or BANJUL"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  Remittance / Salary (GMD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="65000"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Trust Bank Gambia Ltd"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="011002938101"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Emergency Contact (HR Department)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Contact Name</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Isatou Bah"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Relationship</label>
                <input
                  type="text"
                  value={emergencyRel}
                  onChange={(e) => setEmergencyRel(e.target.value)}
                  placeholder="e.g. Spouse / Sister"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Phone Number</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+220 700 1234"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="flex items-center gap-2 p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 text-blue-900 text-[11px]">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-700" />
            <span>
              The system will automatically generate verified vector documents (ID Scans, GRA TIN Certificate, {category === 'subcontractor' ? 'Subcontract Agreement' : 'Employment Appointment'}, and Bank Remittance Mandate) ready for instant printing and PDF export.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm transition"
            >
              Create &amp; Compile Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
