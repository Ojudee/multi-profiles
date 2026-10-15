import React, { useState } from 'react';
import {
  PartnerRecord,
  PersonnelCategory,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
  SubcontractPaymentStage,
  SubcontractorContractPlan,
  EmployeePayrollAdjustment,
  Organization,
} from '../types';
import {
  CreditCard,
  DollarSign,
  Building,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Plus,
  FileText,
  Edit2,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Landmark,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  Check,
  X,
  Filter,
  UserCheck,
  Users,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface AccountsWorkspaceProps {
  partners: PartnerRecord[];
  onSelectPartner: (id: string) => void;
  onUpdatePartner: (id: string, updates: Partial<PartnerRecord>) => void;
  onOpenAddModal: (categoryPreset?: PersonnelCategory) => void;
  onOpenOfficialsManager?: (department: 'HR' | 'Accounts') => void;
  activeOrg?: Organization;
}

type AccountsSubTab =
  | 'ledger'
  | 'monthly_report'
  | 'quarterly_report'
  | 'yearly_report'
  | 'subcontractors'
  | 'payroll_adjustments';

export const AccountsWorkspace: React.FC<AccountsWorkspaceProps> = ({
  partners,
  onSelectPartner,
  onUpdatePartner,
  onOpenAddModal,
  onOpenOfficialsManager,
  activeOrg,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AccountsSubTab>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');

  // Report timeframes
  const [selectedMonth, setSelectedMonth] = useState<string>('October 2026');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q4');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modal states
  const [editingPartner, setEditingPartner] = useState<PartnerRecord | null>(null);
  const [selectedSubcontractorForPlan, setSelectedSubcontractorForPlan] = useState<PartnerRecord | null>(null);
  const [selectedEmployeeForAdjustment, setSelectedEmployeeForAdjustment] = useState<PartnerRecord | null>(null);

  // New stage form state for subcontractor
  const [newStageName, setNewStageName] = useState('');
  const [newStagePct, setNewStagePct] = useState<number>(20);
  const [newStageDue, setNewStageDue] = useState('2026-11-15');

  // Payroll adjustment modal form state
  const [adjDaysAbsent, setAdjDaysAbsent] = useState<number>(0);
  const [adjLateHours, setAdjLateHours] = useState<number>(0);
  const [adjAdvanceTaken, setAdjAdvanceTaken] = useState<number>(0);
  const [adjAdvanceRecovery, setAdjAdvanceRecovery] = useState<number>(0);
  const [adjRemarks, setAdjRemarks] = useState<string>('');

  // Financial Metrics
  const totalPayees = partners.length;
  const registeredTinCount = partners.filter(
    (p) => p.accountsDetails?.tinNumber || p.extractedData?.taxInformation?.tinNumber
  ).length;
  const subcontractors = partners.filter((p) => p.category === 'subcontractor');
  const subcontractorCount = subcontractors.length;
  const employees = partners.filter((p) => p.category !== 'subcontractor');
  const employeeCount = employees.length;

  const approvedBillingCount = partners.filter(
    (p) =>
      p.accountsDetails?.accountsClearanceStatus === 'Billing Approved' ||
      p.accountsDetails?.accountsClearanceStatus === 'Payroll Active'
  ).length;

  // Monthly base commitment
  const totalMonthlyCommitment = partners.reduce((sum, p) => {
    return sum + (p.accountsDetails?.compensation?.amount || 0);
  }, 0);

  // Total subcontractor contract sums agreed
  const totalSubcontractContractSums = subcontractors.reduce((sum, p) => {
    const planSum = p.accountsDetails?.subcontractPlan?.contractSum;
    if (planSum) return sum + planSum;
    return sum + (p.accountsDetails?.compensation?.amount || 65000) * 12;
  }, 0);

  // Filtered partners for ledger
  const filteredPartners = partners.filter((p) => {
    const tin = p.accountsDetails?.tinNumber || p.extractedData?.taxInformation?.tinNumber || '';
    const bank = p.accountsDetails?.bankDetails?.bankName || '';
    const acc = p.accountsDetails?.bankDetails?.accountNumber || '';

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.accountsDetails?.vendorOrTaxIdCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;

    const matchesBilling =
      billingFilter === 'all' ||
      (billingFilter === 'approved' &&
        (p.accountsDetails?.accountsClearanceStatus === 'Billing Approved' ||
          p.accountsDetails?.accountsClearanceStatus === 'Payroll Active')) ||
      (billingFilter === 'pending' &&
        p.accountsDetails?.accountsClearanceStatus !== 'Billing Approved' &&
        p.accountsDetails?.accountsClearanceStatus !== 'Payroll Active');

    return matchesSearch && matchesCategory && matchesBilling;
  });

  const handleToggleBillingApproval = (partner: PartnerRecord) => {
    const current = partner.accountsDetails?.accountsClearanceStatus;
    const isApproved = current === 'Billing Approved' || current === 'Payroll Active';
    const nextStatus = isApproved ? 'Pending Tax Review' : partner.category === 'subcontractor' ? 'Billing Approved' : 'Payroll Active';

    onUpdatePartner(partner.id, {
      accountsDetails: {
        ...(partner.accountsDetails || {
          vendorOrTaxIdCode: `VEND-${Date.now().toString().slice(-4)}`,
          tinNumber: partner.extractedData?.taxInformation?.tinNumber || 'Attached',
          taxOffice: 'KANIFING',
          taxRegistrationDate: partner.generatedDate,
          taxComplianceStatus: 'Registered Active Taxpayer',
          bankDetails: {
            bankName: 'Trust Bank Gambia Ltd',
            accountName: partner.name,
            accountNumber: '011000000000',
            currency: 'GMD',
            paymentMode: 'Direct Deposit / ACH',
          },
          compensation: {
            rateType: 'Monthly Salary',
            amount: 50000,
            currency: 'GMD',
            withholdingTaxPct: partner.category === 'subcontractor' ? 10 : 0,
            paymentTerms: 'Monthly Payroll',
          },
          accountsControllerSignatory: 'Aminata Bah, Financial Controller',
          accountsSignDate: partner.generatedDate,
        }),
        accountsClearanceStatus: nextStatus,
      },
    });
  };

  // Helper to get or init subcontractor plan
  const getSubcontractPlan = (partner: PartnerRecord): SubcontractorContractPlan => {
    if (partner.accountsDetails?.subcontractPlan) {
      return partner.accountsDetails.subcontractPlan;
    }
    const contractSum = partner.accountsDetails?.compensation?.amount
      ? partner.accountsDetails.compensation.amount * 8
      : 850000;
    return {
      contractSum,
      contractType: 'Fixed Lump-Sum Milestone',
      advancePaymentPct: 20,
      retentionHoldbackPct: 5,
      retentionPeriodMonths: 6,
      whtRatePct: partner.accountsDetails?.compensation?.withholdingTaxPct ?? 10,
      stages: [
        {
          id: 'stg-1',
          stageNumber: 1,
          stageName: 'Stage 1: Advance Mobilization & Site Setup',
          percentage: 20,
          amount: contractSum * 0.2,
          dueDate: '2026-04-15',
          completionDate: '2026-04-20',
          whtDeductionPct: 10,
          retentionDeductionPct: 5,
          status: 'paid',
          invoiceRef: 'INV-MOB-001',
          paidDate: '2026-04-22',
          inspectionSignatory: 'Project Engineer & Controller',
        },
        {
          id: 'stg-2',
          stageNumber: 2,
          stageName: 'Stage 2: 50% Substructure / MEP Installation',
          percentage: 30,
          amount: contractSum * 0.3,
          dueDate: '2026-07-30',
          completionDate: '2026-08-05',
          whtDeductionPct: 10,
          retentionDeductionPct: 5,
          status: 'paid',
          invoiceRef: 'INV-ROUGH-002',
          paidDate: '2026-08-10',
          inspectionSignatory: 'Technical Inspector',
        },
        {
          id: 'stg-3',
          stageNumber: 3,
          stageName: 'Stage 3: Superstructure Finishing & Testing',
          percentage: 30,
          amount: contractSum * 0.3,
          dueDate: '2026-10-25',
          whtDeductionPct: 10,
          retentionDeductionPct: 5,
          status: 'approved',
          invoiceRef: 'INV-FINISH-003',
          inspectionSignatory: 'Pending Final Signoff',
        },
        {
          id: 'stg-4',
          stageNumber: 4,
          stageName: 'Stage 4: Practical Completion & Defects Retention Holdback',
          percentage: 20,
          amount: contractSum * 0.2,
          dueDate: '2026-12-30',
          whtDeductionPct: 10,
          retentionDeductionPct: 5,
          status: 'pending',
          inspectionSignatory: 'Site Director',
        },
      ],
    };
  };

  // Helper to get or init employee payroll adjustment
  const getEmployeeAdjustment = (partner: PartnerRecord): EmployeePayrollAdjustment => {
    if (partner.accountsDetails?.payrollAdjustments && partner.accountsDetails.payrollAdjustments.length > 0) {
      return partner.accountsDetails.payrollAdjustments[0];
    }
    const base = partner.accountsDetails?.compensation?.amount || 60000;
    const allowances = Math.round(base * 0.15);
    const dailyRate = Math.round(base / 22);
    const daysAbsent = partner.hrDetails?.daysAbsentRecorded || 1;
    const absenceDeduction = daysAbsent * dailyRate;
    const lateHours = partner.hrDetails?.lateOccurrencesRecorded || 2;
    const latePenalty = lateHours * 450;
    const advanceTaken = 15000;
    const advanceRecovery = 5000;
    const paye = Math.round((base + allowances) * 0.1);
    const pension = Math.round(base * 0.05);
    const net = base + allowances - absenceDeduction - latePenalty - advanceRecovery - paye - pension;

    return {
      id: `adj-${partner.id}`,
      month: selectedMonth,
      baseSalary: base,
      allowances,
      daysAbsent,
      dailyRateEquivalent: dailyRate,
      absenceDeductionAmount: absenceDeduction,
      lateOccurrencesOrHours: lateHours,
      latenessPenaltyAmount: latePenalty,
      advanceSalaryTaken: advanceTaken,
      advanceRecoveryDeduction: advanceRecovery,
      advanceBalanceRemaining: advanceTaken - advanceRecovery,
      payeTaxWithheld: paye,
      pensionEmployeeWithheld: pension,
      netSalaryPayable: net,
      paymentStatus: 'cleared',
      disbursementDate: '2026-10-28',
      paymentReference: `PAY-${partner.id.slice(-4)}-OCT26`,
      remarks: 'Attendance deductions and advance recovery applied',
    };
  };

  // Subcontractor Stage status change handler
  const handleUpdateStageStatus = (
    partner: PartnerRecord,
    stageId: string,
    newStatus: SubcontractPaymentStage['status']
  ) => {
    const plan = getSubcontractPlan(partner);
    const updatedStages = plan.stages.map((stg) => {
      if (stg.id === stageId) {
        return {
          ...stg,
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date().toISOString().slice(0, 10) : stg.paidDate,
          invoiceRef: stg.invoiceRef || `INV-${Date.now().toString().slice(-4)}`,
        };
      }
      return stg;
    });

    onUpdatePartner(partner.id, {
      accountsDetails: {
        ...(partner.accountsDetails || ({} as any)),
        subcontractPlan: {
          ...plan,
          stages: updatedStages,
        },
      },
    });

    if (selectedSubcontractorForPlan?.id === partner.id) {
      setSelectedSubcontractorForPlan({
        ...partner,
        accountsDetails: {
          ...(partner.accountsDetails || ({} as any)),
          subcontractPlan: { ...plan, stages: updatedStages },
        },
      });
    }
  };

  // Add stage to subcontractor
  const handleAddStage = (partner: PartnerRecord) => {
    if (!newStageName.trim()) return;
    const plan = getSubcontractPlan(partner);
    const stageNumber = plan.stages.length + 1;
    const amount = (plan.contractSum * newStagePct) / 100;
    const newStage: SubcontractPaymentStage = {
      id: `stg-${Date.now()}`,
      stageNumber,
      stageName: newStageName,
      percentage: newStagePct,
      amount,
      dueDate: newStageDue,
      whtDeductionPct: plan.whtRatePct,
      retentionDeductionPct: plan.retentionHoldbackPct,
      status: 'pending',
    };

    const updatedStages = [...plan.stages, newStage];
    onUpdatePartner(partner.id, {
      accountsDetails: {
        ...(partner.accountsDetails || ({} as any)),
        subcontractPlan: {
          ...plan,
          stages: updatedStages,
        },
      },
    });

    setNewStageName('');
    setNewStagePct(20);

    if (selectedSubcontractorForPlan?.id === partner.id) {
      setSelectedSubcontractorForPlan({
        ...partner,
        accountsDetails: {
          ...(partner.accountsDetails || ({} as any)),
          subcontractPlan: { ...plan, stages: updatedStages },
        },
      });
    }
  };

  // Save Employee Payroll Adjustment
  const handleSaveEmployeeAdjustment = (partner: PartnerRecord) => {
    const base = partner.accountsDetails?.compensation?.amount || 60000;
    const allowances = Math.round(base * 0.15);
    const dailyRate = Math.round(base / 22);
    const absenceDeduction = adjDaysAbsent * dailyRate;
    const latePenalty = adjLateHours * 450;
    const paye = Math.round((base + allowances) * 0.1);
    const pension = Math.round(base * 0.05);
    const net = base + allowances - absenceDeduction - latePenalty - adjAdvanceRecovery - paye - pension;

    const newAdjustment: EmployeePayrollAdjustment = {
      id: `adj-${Date.now()}`,
      month: selectedMonth,
      baseSalary: base,
      allowances,
      daysAbsent: adjDaysAbsent,
      dailyRateEquivalent: dailyRate,
      absenceDeductionAmount: absenceDeduction,
      lateOccurrencesOrHours: adjLateHours,
      latenessPenaltyAmount: latePenalty,
      advanceSalaryTaken: adjAdvanceTaken,
      advanceRecoveryDeduction: adjAdvanceRecovery,
      advanceBalanceRemaining: Math.max(0, adjAdvanceTaken - adjAdvanceRecovery),
      payeTaxWithheld: paye,
      pensionEmployeeWithheld: pension,
      netSalaryPayable: net,
      paymentStatus: 'cleared',
      disbursementDate: new Date().toISOString().slice(0, 10),
      paymentReference: `PAY-${partner.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
      remarks: adjRemarks || 'Deductions and advances updated by Accounts',
    };

    onUpdatePartner(partner.id, {
      accountsDetails: {
        ...(partner.accountsDetails || ({} as any)),
        payrollAdjustments: [newAdjustment],
      },
    });

    setSelectedEmployeeForAdjustment(null);
  };

  // CSV Export for Accounts Schedule
  const handleExportAccountsCsv = () => {
    const headers = [
      'Vendor/Staff Code',
      'Payee Name',
      'Category',
      'TIN Number',
      'Tax Office',
      'Bank Name',
      'Account Number',
      'Monthly Rate / Commitment',
      'Tax Status',
      'Clearance Status',
    ];

    const rows = partners.map((p) => [
      `"${p.accountsDetails?.vendorOrTaxIdCode || p.hrDetails?.staffIdOrCode || 'N/A'}"`,
      `"${p.name}"`,
      `"${CATEGORY_LABELS[p.category] || p.category}"`,
      `"${p.accountsDetails?.tinNumber || p.extractedData?.taxInformation?.tinNumber || 'N/A'}"`,
      `"${p.accountsDetails?.taxOffice || 'KANIFING'}"`,
      `"${p.accountsDetails?.bankDetails?.bankName || 'Trust Bank'}"`,
      `"${p.accountsDetails?.bankDetails?.accountNumber || 'N/A'}"`,
      `"${p.accountsDetails?.compensation?.currency || 'GMD'} ${(p.accountsDetails?.compensation?.amount || 0).toLocaleString()}"`,
      `"${p.category === 'subcontractor' ? '10% Withholding Tax (WHT)' : 'PAYE Standard'}"`,
      `"${p.accountsDetails?.accountsClearanceStatus || 'Payroll Active'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Accounts_Disbursement_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Monthly Report Calculations
  const monthlyEmployeeRows = employees.map((emp) => {
    const adj = getEmployeeAdjustment(emp);
    return {
      employee: emp,
      adj,
    };
  });

  const totalMonthlyGrossPayroll = monthlyEmployeeRows.reduce((acc, r) => acc + r.adj.baseSalary + r.adj.allowances, 0);
  const totalMonthlyAbsenceDeductions = monthlyEmployeeRows.reduce((acc, r) => acc + r.adj.absenceDeductionAmount, 0);
  const totalMonthlyLatePenalties = monthlyEmployeeRows.reduce((acc, r) => acc + r.adj.latenessPenaltyAmount, 0);
  const totalMonthlyAdvanceRecoveries = monthlyEmployeeRows.reduce((acc, r) => acc + r.adj.advanceRecoveryDeduction, 0);
  const totalMonthlyNetPayroll = monthlyEmployeeRows.reduce((acc, r) => acc + r.adj.netSalaryPayable, 0);
  const totalMonthlyPayeTax = monthlyEmployeeRows.reduce((acc, r) => acc + r.adj.payeTaxWithheld, 0);

  // Subcontractor stage disbursements for current period
  const subcontractorStageRows = subcontractors.map((sub) => {
    const plan = getSubcontractPlan(sub);
    const stagesPaid = plan.stages.filter((s) => s.status === 'paid');
    const stagesApproved = plan.stages.filter((s) => s.status === 'approved');
    const totalPaidAmount = stagesPaid.reduce((sum, s) => sum + s.amount, 0);
    const pendingAmount = stagesApproved.reduce((sum, s) => sum + s.amount, 0);
    const whtPaid = (totalPaidAmount * plan.whtRatePct) / 100;
    return {
      subcontractor: sub,
      plan,
      stagesPaid,
      stagesApproved,
      totalPaidAmount,
      pendingAmount,
      whtPaid,
    };
  });

  const totalSubcontractorDisbursed = subcontractorStageRows.reduce((sum, r) => sum + r.totalPaidAmount, 0);
  const totalSubcontractorWht = subcontractorStageRows.reduce((sum, r) => sum + r.whtPaid, 0);

  return (
    <div className="w-full space-y-6">
      {/* Accounts & Finance Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-blue-400">
              <Landmark className="w-4 h-4" />
              <span>{(activeOrg?.name || 'Univision design and Construction Ltd.').toUpperCase()}</span>
              <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-700">
                ACCOUNTS RESTRICTED ZONE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white flex items-center gap-2">
              Finance &amp; Accounts Department · Disbursement &amp; Activity Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Restricted financial governance: payroll calculation with absence &amp; lateness deductions, advance salaries, subcontractor milestone stages, and statutory GRA activity reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenOfficialsManager?.('Accounts')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-200 rounded-lg text-xs font-semibold border border-purple-700/80 transition shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Manage Accounts Officials &amp; Controls</span>
            </button>
            <button
              type="button"
              onClick={handleExportAccountsCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Disbursement Schedule (CSV)
            </button>
            <button
              type="button"
              onClick={() => onOpenAddModal('subcontractor')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Profile Subcontractor / Payee
            </button>
          </div>
        </div>

        {/* 5-Metric Quick Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-1">
          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400">Total Active Payees</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">{totalPayees}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {employeeCount} Staff · {subcontractorCount} Subcontractors
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-emerald-400">Monthly Net Payroll</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
              GMD {totalMonthlyNetPayroll.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              After lateness &amp; absence cuts
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-purple-400">Subcontractor Commitments</div>
            <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
              GMD {totalSubcontractContractSums.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Agreed Milestone Sums</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
            <div className="text-[11px] font-medium text-blue-400">GRA Registered TINs</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {registeredTinCount}/{totalPayees}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">100% Tax Documented</div>
          </div>

          <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-medium text-amber-400">Payment Clearance</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              {approvedBillingCount}/{totalPayees}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              {Math.round((approvedBillingCount / (totalPayees || 1)) * 100)}% Cleared to Disburse
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation for Accounts Workflows */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
              activeSubTab === 'ledger'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payee &amp; Accounts Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('monthly_report')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
              activeSubTab === 'monthly_report'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Activity Report</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              Payroll
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('quarterly_report')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
              activeSubTab === 'quarterly_report'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Quarterly Activity Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('yearly_report')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
              activeSubTab === 'yearly_report'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Yearly Fiscal Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('subcontractors')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
              activeSubTab === 'subcontractors'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Subcontractor Stages ({subcontractorCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('payroll_adjustments')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
              activeSubTab === 'payroll_adjustments'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Deductions &amp; Advances Desk</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACCOUNTS LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Payee Name, TIN Number, Bank, or Account Number..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Payees ({totalPayees})</option>
                  <option value="subcontractor">Subcontractors &amp; Vendors ({subcontractorCount})</option>
                  <option value="permanent_employee">Permanent Employees</option>
                  <option value="contract_staff">Contract Staff</option>
                  <option value="executive_partner">Executive Partners</option>
                </select>

                <select
                  value={billingFilter}
                  onChange={(e) => setBillingFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">Disbursement: All</option>
                  <option value="approved">Approved &amp; Active</option>
                  <option value="pending">Pending Tax Review</option>
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
                All Accounts ({totalPayees})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('subcontractor')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  categoryFilter === 'subcontractor'
                    ? 'bg-purple-700 text-white'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                Subcontractors ({subcontractorCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('permanent_employee')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  categoryFilter === 'permanent_employee'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Employees (PAYE)
              </button>
            </div>
          </div>

          {/* Accounts & Remittance Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5">Vendor / Payee Code</th>
                    <th className="py-3 px-3.5">Payee Name &amp; Category</th>
                    <th className="py-3 px-3.5">TIN &amp; Tax Office</th>
                    <th className="py-3 px-3.5">Bank &amp; Account Number</th>
                    <th className="py-3 px-3.5">Remittance / Rate</th>
                    <th className="py-3 px-3.5">Tax (WHT / PAYE)</th>
                    <th className="py-3 px-3.5 text-center">Billing Approval</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No accounts records match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => {
                      const tin =
                        partner.accountsDetails?.tinNumber ||
                        partner.extractedData?.taxInformation?.tinNumber ||
                        'Pending';
                      const taxOffice =
                        partner.accountsDetails?.taxOffice ||
                        partner.extractedData?.taxInformation?.taxOffice ||
                        'Kanifing';
                      const bank = partner.accountsDetails?.bankDetails;
                      const comp = partner.accountsDetails?.compensation;
                      const isApproved =
                        partner.accountsDetails?.accountsClearanceStatus === 'Billing Approved' ||
                        partner.accountsDetails?.accountsClearanceStatus === 'Payroll Active';
                      const badge = CATEGORY_BADGE_STYLES[partner.category] || CATEGORY_BADGE_STYLES.permanent_employee;
                      const whtPct =
                        comp?.withholdingTaxPct ??
                        (partner.category === 'subcontractor' ? 10 : 0);

                      return (
                        <tr key={partner.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Code */}
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {partner.accountsDetails?.vendorOrTaxIdCode ||
                              partner.hrDetails?.staffIdOrCode || (
                                <span className="text-slate-400 italic">ACC-{partner.id.slice(-4)}</span>
                              )}
                          </td>

                          {/* Payee Name & Category */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{partner.name}</div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                              >
                                {CATEGORY_LABELS[partner.category] || partner.category}
                              </span>
                              {partner.category === 'subcontractor' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubcontractorForPlan(partner)}
                                  className="text-[10px] text-purple-700 hover:underline font-semibold"
                                >
                                  View Stages →
                                </button>
                              )}
                            </div>
                          </td>

                          {/* TIN & Tax Office */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="font-mono font-bold text-blue-900">{tin}</div>
                            <div className="text-[11px] text-slate-500">
                              {taxOffice} Division · GRA
                            </div>
                          </td>

                          {/* Bank Details */}
                          <td className="py-3 px-3.5 max-w-[200px]">
                            <div className="font-semibold text-slate-900 truncate">
                              {bank?.bankName || 'Trust Bank Gambia Ltd'}
                            </div>
                            <div className="font-mono text-[11px] text-slate-600 truncate">
                              {bank?.accountNumber || 'Pending Account Input'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Mode: {bank?.paymentMode || 'Direct Deposit / ACH'}
                            </div>
                          </td>

                          {/* Remittance Amount & Terms */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900 text-xs">
                              {comp?.currency || 'GMD'} {(comp?.amount || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {comp?.rateType || 'Monthly Salary'}
                            </div>
                          </td>

                          {/* Withholding Tax (WHT) / PAYE */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {whtPct > 0 ? (
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                  {whtPct}% WHT Deducted
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Subcontractor Remittance
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                  PAYE Tax
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Payroll Deduction
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Billing Status */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleBillingApproval(partner)}
                              title="Click to toggle Accounts billing clearance status"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Review Tax
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {partner.category === 'subcontractor' ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubcontractorForPlan(partner)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded font-medium text-xs transition"
                                  title="Manage Subcontractor Stages"
                                >
                                  <Layers className="w-3 h-3" />
                                  Stages
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const adj = getEmployeeAdjustment(partner);
                                    setAdjDaysAbsent(adj.daysAbsent);
                                    setAdjLateHours(adj.lateOccurrencesOrHours);
                                    setAdjAdvanceTaken(adj.advanceSalaryTaken);
                                    setAdjAdvanceRecovery(adj.advanceRecoveryDeduction);
                                    setAdjRemarks(adj.remarks || '');
                                    setSelectedEmployeeForAdjustment(partner);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded font-medium text-xs transition"
                                  title="Record Attendance Deductions & Advances"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  Deduct
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onSelectPartner(partner.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded font-medium text-xs transition"
                              >
                                <FileText className="w-3 h-3" />
                                Dossier
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPartner(partner)}
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
        </div>
      )}

      {/* TAB 2: MONTHLY ACTIVITY REPORT (PAYROLL & SUBCONTRACTORS) */}
      {activeSubTab === 'monthly_report' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                STATUTORY ACCOUNTS REPORT
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Monthly Activity Report · Payroll, Absence &amp; Subcontractor Stages
              </h2>
              <p className="text-xs text-slate-500">
                Detailed statement of gross earnings, deductions for absence/lateness, advance salary repayments, and subcontractor stage payments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
              >
                <option value="October 2026">October 2026 (Current)</option>
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="November 2026">November 2026</option>
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Print Monthly Report
              </button>
            </div>
          </div>

          {/* Monthly KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Gross Payroll</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                GMD {totalMonthlyGrossPayroll.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Base + Allowances</div>
            </div>

            <div className="bg-red-50/70 p-3 rounded-lg border border-red-200">
              <div className="text-[10px] text-red-700 uppercase font-semibold">Absence Deductions</div>
              <div className="text-base font-bold text-red-900 mt-0.5">
                - GMD {totalMonthlyAbsenceDeductions.toLocaleString()}
              </div>
              <div className="text-[10px] text-red-600">Hours / Days Missed</div>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200">
              <div className="text-[10px] text-amber-800 uppercase font-semibold">Lateness Penalties</div>
              <div className="text-base font-bold text-amber-900 mt-0.5">
                - GMD {totalMonthlyLatePenalties.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-700">Punctuality Penalties</div>
            </div>

            <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200">
              <div className="text-[10px] text-blue-800 uppercase font-semibold">Advance Recovered</div>
              <div className="text-base font-bold text-blue-900 mt-0.5">
                - GMD {totalMonthlyAdvanceRecoveries.toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-700">Salary Loan Installment</div>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <div className="text-[10px] text-emerald-800 uppercase font-semibold">Net Disbursed</div>
              <div className="text-base font-bold text-emerald-950 mt-0.5">
                GMD {totalMonthlyNetPayroll.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-700">Bank Transfer Outflow</div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <div className="text-[10px] text-purple-800 uppercase font-semibold">Subcontractor Stages</div>
              <div className="text-base font-bold text-purple-950 mt-0.5">
                GMD {totalSubcontractorDisbursed.toLocaleString()}
              </div>
              <div className="text-[10px] text-purple-700">WHT: GMD {totalSubcontractorWht.toLocaleString()}</div>
            </div>
          </div>

          {/* Section 1: Employee Payroll Adjustments Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Employee Payroll Activity &amp; Adjustments ({selectedMonth})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-3">Employee Name &amp; Code</th>
                    <th className="py-2.5 px-3">Base &amp; Allowances</th>
                    <th className="py-2.5 px-3 text-red-700">Absence Deduction</th>
                    <th className="py-2.5 px-3 text-amber-700">Lateness Penalty</th>
                    <th className="py-2.5 px-3 text-blue-700">Salary Advance Repaid</th>
                    <th className="py-2.5 px-3">Tax Withheld (PAYE)</th>
                    <th className="py-2.5 px-3 font-bold text-slate-900">Net Payable</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthlyEmployeeRows.map(({ employee, adj }) => (
                    <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{employee.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {employee.hrDetails?.staffIdOrCode || employee.accountsDetails?.vendorOrTaxIdCode} · {employee.designation}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">
                          GMD {(adj.baseSalary + adj.allowances).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Base: {adj.baseSalary.toLocaleString()} + Allow: {adj.allowances.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-red-700 font-medium">
                        {adj.absenceDeductionAmount > 0 ? (
                          <>
                            - GMD {adj.absenceDeductionAmount.toLocaleString()}
                            <div className="text-[10px] text-red-500">
                              {adj.daysAbsent} day(s) absent
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-amber-700 font-medium">
                        {adj.latenessPenaltyAmount > 0 ? (
                          <>
                            - GMD {adj.latenessPenaltyAmount.toLocaleString()}
                            <div className="text-[10px] text-amber-600">
                              {adj.lateOccurrencesOrHours} late hr/incident(s)
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-blue-700 font-medium">
                        {adj.advanceRecoveryDeduction > 0 ? (
                          <>
                            - GMD {adj.advanceRecoveryDeduction.toLocaleString()}
                            <div className="text-[10px] text-blue-500">
                              Remaining Bal: GMD {adj.advanceBalanceRemaining.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        GMD {adj.payeTaxWithheld.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800 text-sm">
                        GMD {adj.netSalaryPayable.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Disbursed
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjDaysAbsent(adj.daysAbsent);
                            setAdjLateHours(adj.lateOccurrencesOrHours);
                            setAdjAdvanceTaken(adj.advanceSalaryTaken);
                            setAdjAdvanceRecovery(adj.advanceRecoveryDeduction);
                            setAdjRemarks(adj.remarks || '');
                            setSelectedEmployeeForAdjustment(employee);
                          }}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Subcontractor Milestone Stages Activity */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              Subcontractor Stage Disbursements &amp; WHT Deductions ({selectedMonth})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-50/50 border-b border-purple-100 text-purple-900 uppercase text-[10px] font-semibold">
                    <th className="py-2.5 px-3">Subcontractor Entity</th>
                    <th className="py-2.5 px-3">Contract Type</th>
                    <th className="py-2.5 px-3">Contract Sum</th>
                    <th className="py-2.5 px-3">Cumulative Disbursed</th>
                    <th className="py-2.5 px-3">10% WHT Remitted</th>
                    <th className="py-2.5 px-3">Stages Completed</th>
                    <th className="py-2.5 px-3 text-right">Stages Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {subcontractorStageRows.map(({ subcontractor, plan, totalPaidAmount, whtPaid, stagesPaid }) => (
                    <tr key={subcontractor.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{subcontractor.name}</div>
                        <div className="text-[10px] text-slate-500">{subcontractor.department}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {plan.contractType}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        GMD {plan.contractSum.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-purple-900">
                        GMD {totalPaidAmount.toLocaleString()} ({Math.round((totalPaidAmount / plan.contractSum) * 100)}%)
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-purple-800">
                        GMD {whtPaid.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-600 font-medium">
                          {stagesPaid.length} of {plan.stages.length} Stages Cleared
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubcontractorForPlan(subcontractor)}
                          className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-semibold text-xs transition"
                        >
                          Manage Plan →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUARTERLY ACTIVITY REPORT */}
      {activeSubTab === 'quarterly_report' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                QUARTERLY EXECUTIVE AUDIT
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Quarterly Financial Activity &amp; Payroll Summary · Fiscal Year {selectedYear}
              </h2>
              <p className="text-xs text-slate-500">
                Quarterly activity statement showing personnel compensation trends, absence &amp; lateness impact, subcontractor stage burn rates, and GRA tax withholdings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                      selectedQuarter === q ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export {selectedQuarter} Report
              </button>
            </div>
          </div>

          {/* Quarterly Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500 font-semibold">{selectedQuarter} Total Payroll Incurred</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                GMD {(totalMonthlyGrossPayroll * 3).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">3 Months Cumulative Base</div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="text-xs text-red-700 font-semibold">{selectedQuarter} Absence &amp; Late Penalties</div>
              <div className="text-xl font-bold text-red-900 mt-1">
                GMD {((totalMonthlyAbsenceDeductions + totalMonthlyLatePenalties) * 3).toLocaleString()}
              </div>
              <div className="text-[11px] text-red-600 mt-1">Recovered to Company Retained Earnings</div>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="text-xs text-purple-700 font-semibold">{selectedQuarter} Subcontractor Disbursements</div>
              <div className="text-xl font-bold text-purple-900 mt-1">
                GMD {(totalSubcontractorDisbursed * 0.75).toLocaleString()}
              </div>
              <div className="text-[11px] text-purple-600 mt-1">Milestone Certified Inspections</div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="text-xs text-blue-700 font-semibold">{selectedQuarter} GRA Tax Remittance</div>
              <div className="text-xl font-bold text-blue-900 mt-1">
                GMD {((totalMonthlyPayeTax + totalSubcontractorWht) * 3).toLocaleString()}
              </div>
              <div className="text-[11px] text-blue-600 mt-1">PAYE + 10% Withholding Tax</div>
            </div>
          </div>

          {/* Quarterly Audit Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Financial Stream</th>
                  <th className="py-3 px-4">Month 1 ({selectedQuarter})</th>
                  <th className="py-3 px-4">Month 2 ({selectedQuarter})</th>
                  <th className="py-3 px-4">Month 3 ({selectedQuarter})</th>
                  <th className="py-3 px-4 font-bold text-slate-900">Total {selectedQuarter}</th>
                  <th className="py-3 px-4 text-center">Variance vs Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Permanent &amp; Contract Staff Payroll</td>
                  <td className="py-3 px-4">GMD {totalMonthlyGrossPayroll.toLocaleString()}</td>
                  <td className="py-3 px-4">GMD {totalMonthlyGrossPayroll.toLocaleString()}</td>
                  <td className="py-3 px-4">GMD {totalMonthlyGrossPayroll.toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">GMD {(totalMonthlyGrossPayroll * 3).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">- 1.8% Under Budget</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-red-900">Absence Deductions &amp; Lateness Penalties</td>
                  <td className="py-3 px-4 text-red-700">- GMD {(totalMonthlyAbsenceDeductions + totalMonthlyLatePenalties).toLocaleString()}</td>
                  <td className="py-3 px-4 text-red-700">- GMD {(totalMonthlyAbsenceDeductions + totalMonthlyLatePenalties).toLocaleString()}</td>
                  <td className="py-3 px-4 text-red-700">- GMD {(totalMonthlyAbsenceDeductions + totalMonthlyLatePenalties).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-red-900">- GMD {((totalMonthlyAbsenceDeductions + totalMonthlyLatePenalties) * 3).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">Deductions Applied</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-purple-900">Subcontractor Milestone Payments</td>
                  <td className="py-3 px-4">GMD {Math.round(totalSubcontractorDisbursed * 0.25).toLocaleString()}</td>
                  <td className="py-3 px-4">GMD {Math.round(totalSubcontractorDisbursed * 0.35).toLocaleString()}</td>
                  <td className="py-3 px-4">GMD {Math.round(totalSubcontractorDisbursed * 0.4).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-purple-900">GMD {totalSubcontractorDisbursed.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-bold">Milestones Met</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-blue-900">Statutory GRA Remittance (PAYE + 10% WHT)</td>
                  <td className="py-3 px-4">GMD {Math.round((totalMonthlyPayeTax + totalSubcontractorWht)).toLocaleString()}</td>
                  <td className="py-3 px-4">GMD {Math.round((totalMonthlyPayeTax + totalSubcontractorWht)).toLocaleString()}</td>
                  <td className="py-3 px-4">GMD {Math.round((totalMonthlyPayeTax + totalSubcontractorWht)).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-blue-900">GMD {((totalMonthlyPayeTax + totalSubcontractorWht) * 3).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">100% Tax Clearance</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: YEARLY FISCAL REPORT */}
      {activeSubTab === 'yearly_report' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ANNUAL FISCAL AUDIT
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Yearly Activity &amp; Statutory Compensation Audit · FY {selectedYear}
              </h2>
              <p className="text-xs text-slate-500">
                Executive summary for corporate audits, external statutory reporting to Gambia Revenue Authority, and board director review.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
              >
                <option value={2026}>Fiscal Year 2026</option>
                <option value={2025}>Fiscal Year 2025</option>
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export Annual Audit (PDF)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="text-xs font-bold text-slate-700 uppercase">Annual Payroll Commitment</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                GMD {(totalMonthlyGrossPayroll * 12).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-1">
                <div>• Permanent Staff: GMD {Math.round(totalMonthlyGrossPayroll * 12 * 0.7).toLocaleString()}</div>
                <div>• Executive Retainers: GMD {Math.round(totalMonthlyGrossPayroll * 12 * 0.25).toLocaleString()}</div>
                <div>• Casual &amp; Trainees: GMD {Math.round(totalMonthlyGrossPayroll * 12 * 0.05).toLocaleString()}</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-purple-50/50">
              <div className="text-xs font-bold text-purple-900 uppercase">Subcontractor Total Capital Spend</div>
              <div className="text-2xl font-bold text-purple-950 mt-1">
                GMD {totalSubcontractContractSums.toLocaleString()}
              </div>
              <div className="text-xs text-purple-800 mt-2 space-y-1">
                <div>• Milestone Stages Certified: GMD {totalSubcontractorDisbursed.toLocaleString()}</div>
                <div>• 10% Withholding Tax Remitted: GMD {totalSubcontractorWht.toLocaleString()}</div>
                <div>• Retention Funds in Escrow: GMD {Math.round(totalSubcontractContractSums * 0.05).toLocaleString()}</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/50">
              <div className="text-xs font-bold text-emerald-900 uppercase">Corporate Tax Compliance Rating</div>
              <div className="text-2xl font-bold text-emerald-950 mt-1">
                100% Tax Compliant
              </div>
              <div className="text-xs text-emerald-800 mt-2 space-y-1">
                <div>• All {totalPayees} Payees Documented with GRA TIN</div>
                <div>• Zero Unresolved Withholding Penalties</div>
                <div>• Annual Clearance Certificate: Valid through 2027</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SUBCONTRACTOR PAYMENT STAGES & PLANS */}
      {activeSubTab === 'subcontractors' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                SUBCONTRACTOR STAGE BILLING
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Subcontractor Payment Plans &amp; Milestone Stages
              </h2>
              <p className="text-xs text-slate-500">
                Subcontractors are paid in payment plans or stages relative to their contract sum and contract type.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenAddModal('subcontractor')}
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Subcontractor
            </button>
          </div>

          <div className="space-y-4">
            {subcontractors.map((sub) => {
              const plan = getSubcontractPlan(sub);
              const totalPaid = plan.stages.filter((s) => s.status === 'paid').reduce((a, b) => a + b.amount, 0);
              const pctPaid = Math.round((totalPaid / (plan.contractSum || 1)) * 100);

              return (
                <div key={sub.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{sub.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-900">
                          {plan.contractType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        TIN: {sub.accountsDetails?.tinNumber || 'Verified'} · Bank: {sub.accountsDetails?.bankDetails?.bankName} ({sub.accountsDetails?.bankDetails?.accountNumber})
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Agreed Contract Sum</div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          GMD {plan.contractSum.toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSubcontractorForPlan(sub)}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Manage Stages ({plan.stages.length})
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Contract Sum Disbursed: GMD {totalPaid.toLocaleString()} ({pctPaid}%)</span>
                      <span>Remaining Balance: GMD {(plan.contractSum - totalPaid).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, pctPaid)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {plan.stages.map((stg) => (
                      <div
                        key={stg.id}
                        className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                          stg.status === 'paid'
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : stg.status === 'approved'
                            ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                            <span>Stage #{stg.stageNumber} ({stg.percentage}%)</span>
                            <span
                              className={`px-1.5 py-0.2 rounded uppercase text-[9px] font-bold ${
                                stg.status === 'paid'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : stg.status === 'approved'
                                  ? 'bg-blue-200 text-blue-900'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {stg.status}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-900 truncate" title={stg.stageName}>
                            {stg.stageName}
                          </div>
                          <div className="font-mono font-bold text-sm mt-1">
                            GMD {stg.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            WHT: - GMD {((stg.amount * stg.whtDeductionPct) / 100).toLocaleString()} (10%)
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            Due: {stg.dueDate || 'Upon Milestone'}
                          </span>
                          {stg.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStageStatus(
                                  sub,
                                  stg.id,
                                  stg.status === 'approved' ? 'paid' : 'approved'
                                )
                              }
                              className="text-[10px] font-bold text-blue-700 hover:underline"
                            >
                              {stg.status === 'approved' ? 'Disburse Pay' : 'Approve Stage'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: DEDUCTIONS & ADVANCES DESK */}
      {activeSubTab === 'payroll_adjustments' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PAYROLL DEDUCTIONS DESK
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Attendance Deductions &amp; Advance Salary Management
              </h2>
              <p className="text-xs text-slate-500">
                Employees absent or coming late incur statutory deductions; staff may take advance salary loans with monthly payroll recoveries.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-3.5">Staff Code &amp; Name</th>
                  <th className="py-3 px-3.5">Monthly Base Salary</th>
                  <th className="py-3 px-3.5">Absence Days &amp; Rate</th>
                  <th className="py-3 px-3.5">Late Hours Penalty</th>
                  <th className="py-3 px-3.5">Advance Loan Balance</th>
                  <th className="py-3 px-3.5 font-bold text-slate-900">Calculated Net Pay</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((emp) => {
                  const adj = getEmployeeAdjustment(emp);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {emp.hrDetails?.staffIdOrCode || 'EMP'} · {emp.department}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900">
                        GMD {adj.baseSalary.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-red-700">
                          {adj.daysAbsent > 0 ? `- GMD ${adj.absenceDeductionAmount.toLocaleString()}` : '0 (Full Attendance)'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {adj.daysAbsent} day(s) × GMD {adj.dailyRateEquivalent.toLocaleString()}/day
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-amber-700">
                          {adj.lateOccurrencesOrHours > 0 ? `- GMD ${adj.latenessPenaltyAmount.toLocaleString()}` : '0 (Punctual)'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {adj.lateOccurrencesOrHours} hour/incident(s)
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-blue-900">
                          GMD {adj.advanceBalanceRemaining.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-blue-600">
                          - GMD {adj.advanceRecoveryDeduction.toLocaleString()} deducted this month
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-emerald-800 text-sm">
                        GMD {adj.netSalaryPayable.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjDaysAbsent(adj.daysAbsent);
                            setAdjLateHours(adj.lateOccurrencesOrHours);
                            setAdjAdvanceTaken(adj.advanceSalaryTaken);
                            setAdjAdvanceRecovery(adj.advanceRecoveryDeduction);
                            setAdjRemarks(adj.remarks || '');
                            setSelectedEmployeeForAdjustment(emp);
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Modify Deductions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Subcontractor Milestone Stages Manager */}
      {selectedSubcontractorForPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase">
                  SUBCONTRACTOR PAYMENT PLAN &amp; STAGES
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {selectedSubcontractorForPlan.name} · Contract Plan
                </h3>
                <p className="text-xs text-slate-500">
                  Manage stages relative to contract sum and type (Fixed Lump-Sum Milestone).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubcontractorForPlan(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5 text-xs">
              {/* Contract Summary Box */}
              {(() => {
                const plan = getSubcontractPlan(selectedSubcontractorForPlan);
                const totalPaid = plan.stages.filter((s) => s.status === 'paid').reduce((a, b) => a + b.amount, 0);

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/50 p-3.5 rounded-lg border border-purple-100">
                      <div>
                        <div className="text-[10px] text-purple-700 font-semibold uppercase">Total Contract Sum</div>
                        <div className="text-base font-bold text-slate-900 font-mono">
                          GMD {plan.contractSum.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-purple-700 font-semibold uppercase">Contract Type</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{plan.contractType}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-purple-700 font-semibold uppercase">Disbursed to Date</div>
                        <div className="text-base font-bold text-emerald-800 font-mono">
                          GMD {totalPaid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-purple-700 font-semibold uppercase">Withholding Tax (WHT)</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{plan.whtRatePct}% GRA Standard</div>
                      </div>
                    </div>

                    {/* Stages Table */}
                    <div className="space-y-2">
                      <div className="font-bold text-slate-800 text-xs">Contract Payment Stages:</div>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                              <th className="py-2.5 px-3">Stage #</th>
                              <th className="py-2.5 px-3">Milestone Description</th>
                              <th className="py-2.5 px-3">Percent (%)</th>
                              <th className="py-2.5 px-3">Stage Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {plan.stages.map((stg) => (
                              <tr key={stg.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold">#{stg.stageNumber}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{stg.stageName}</td>
                                <td className="py-2.5 px-3 font-medium">{stg.percentage}%</td>
                                <td className="py-2.5 px-3 font-bold font-mono">GMD {stg.amount.toLocaleString()}</td>
                                <td className="py-2.5 px-3">
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
                                <td className="py-2.5 px-3 text-right">
                                  {stg.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStageStatus(
                                          selectedSubcontractorForPlan,
                                          stg.id,
                                          'approved'
                                        )
                                      }
                                      className="px-2 py-1 bg-blue-50 text-blue-700 font-semibold rounded hover:bg-blue-100"
                                    >
                                      Approve Stage
                                    </button>
                                  )}
                                  {stg.status === 'approved' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStageStatus(
                                          selectedSubcontractorForPlan,
                                          stg.id,
                                          'paid'
                                        )
                                      }
                                      className="px-2 py-1 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-500"
                                    >
                                      Disburse Payment
                                    </button>
                                  )}
                                  {stg.status === 'paid' && (
                                    <span className="text-[10px] text-emerald-700 font-medium">
                                      Paid on {stg.paidDate || 'Record'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Add New Stage Box */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800 text-xs">Add Additional Payment Stage</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          placeholder="e.g. Stage 5: Final Handover & Commissioning"
                          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs col-span-2"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newStagePct}
                            onChange={(e) => setNewStagePct(Number(e.target.value))}
                            placeholder="%"
                            className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                          />
                          <span className="text-slate-500 text-xs">% of Sum</span>
                          <button
                            type="button"
                            onClick={() => handleAddStage(selectedSubcontractorForPlan)}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded text-xs ml-auto"
                          >
                            Add Stage
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Employee Absence, Lateness & Advance Salary Deductions Desk */}
      {selectedEmployeeForAdjustment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  PAYROLL ADJUSTMENTS DESK
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Adjust Payroll · {selectedEmployeeForAdjustment.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Deductions for unexcused absence, late arrivals, and advance salary loan repayment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeForAdjustment(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {(() => {
                const base = selectedEmployeeForAdjustment.accountsDetails?.compensation?.amount || 60000;
                const dailyRate = Math.round(base / 22);
                const absenceTotal = adjDaysAbsent * dailyRate;
                const lateTotal = adjLateHours * 450;
                const netEstimated = base + Math.round(base * 0.15) - absenceTotal - lateTotal - adjAdvanceRecovery - Math.round(base * 0.15);

                return (
                  <>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-slate-500">Base Monthly Salary:</span>
                        <div className="text-sm font-bold text-slate-900">GMD {base.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">Calculated Daily Rate (22 days):</span>
                        <div className="text-sm font-bold text-slate-900 font-mono">GMD {dailyRate.toLocaleString()} / day</div>
                      </div>
                    </div>

                    {/* Absence Input */}
                    <div className="bg-red-50/50 p-3 rounded-lg border border-red-200 space-y-1.5">
                      <label className="block font-bold text-red-900 text-xs">
                        1. Absence Deductions
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-600 block mb-0.5">Days Absent Recorded:</label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={adjDaysAbsent}
                            onChange={(e) => setAdjDaysAbsent(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-xs"
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">Deduction Incurred:</span>
                          <span className="font-bold text-red-700 font-mono text-sm">
                            - GMD {absenceTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lateness Input */}
                    <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 space-y-1.5">
                      <label className="block font-bold text-amber-900 text-xs">
                        2. Lateness Penalty Deductions
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-600 block mb-0.5">Hours / Incidents Late:</label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={adjLateHours}
                            onChange={(e) => setAdjLateHours(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-xs"
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">Penalty Incurred (GMD 450/hr):</span>
                          <span className="font-bold text-amber-800 font-mono text-sm">
                            - GMD {lateTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Salary Advance Management */}
                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 space-y-2">
                      <label className="block font-bold text-blue-900 text-xs">
                        3. Salary Advance Payment &amp; Recovery
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Total Advance Taken (Loan):</label>
                          <input
                            type="number"
                            min="0"
                            value={adjAdvanceTaken}
                            onChange={(e) => setAdjAdvanceTaken(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 block mb-0.5">Monthly Recovery Deduction:</label>
                          <input
                            type="number"
                            min="0"
                            value={adjAdvanceRecovery}
                            onChange={(e) => setAdjAdvanceRecovery(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-bold text-xs"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-blue-700 flex justify-between">
                        <span>Remaining Advance Balance after this month:</span>
                        <span className="font-bold font-mono">
                          GMD {Math.max(0, adjAdvanceTaken - adjAdvanceRecovery).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Accounts Audit Remarks / Justification:
                      </label>
                      <input
                        type="text"
                        value={adjRemarks}
                        onChange={(e) => setAdjRemarks(e.target.value)}
                        placeholder="e.g. Approved salary advance of GMD 15,000 for medical; 1 day unauthorized site absence deducted."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    {/* Net Pay Estimated Strip */}
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-900">Net Estimated Take-Home Pay:</span>
                        <div className="text-[11px] text-emerald-700">Reflects all deductions &amp; recoveries</div>
                      </div>
                      <div className="text-lg font-bold text-emerald-950 font-mono">
                        GMD {netEstimated.toLocaleString()}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeForAdjustment(null)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEmployeeAdjustment(selectedEmployeeForAdjustment)}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs"
                      >
                        Save &amp; Apply Deductions
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Accounts & Remittance Details */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Edit Accounts &amp; Tax Record · {editingPartner.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Update bank deposit details, tax identification (TIN), compensation structure, and withholding tax rate.
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
                  accountsDetails: {
                    ...(editingPartner.accountsDetails || {
                      vendorOrTaxIdCode: '',
                      tinNumber: '',
                      taxOffice: 'KANIFING',
                      taxRegistrationDate: editingPartner.generatedDate,
                      taxComplianceStatus: 'Registered Active Taxpayer',
                      accountsControllerSignatory: 'Financial Controller',
                      accountsSignDate: editingPartner.generatedDate,
                      accountsClearanceStatus: 'Billing Approved',
                    }),
                    vendorOrTaxIdCode: fd.get('vendorOrTaxIdCode') as string,
                    tinNumber: fd.get('tinNumber') as string,
                    taxOffice: fd.get('taxOffice') as string,
                    taxComplianceStatus: fd.get('taxComplianceStatus') as any,
                    accountsClearanceStatus: fd.get('accountsClearanceStatus') as any,
                    bankDetails: {
                      bankName: fd.get('bankName') as string,
                      accountName: fd.get('accountName') as string,
                      accountNumber: fd.get('accountNumber') as string,
                      sortCodeOrBranch: fd.get('sortCodeOrBranch') as string,
                      swiftOrIban: fd.get('swiftOrIban') as string,
                      currency: fd.get('currency') as string,
                      paymentMode: fd.get('paymentMode') as any,
                    },
                    compensation: {
                      rateType: fd.get('rateType') as any,
                      amount: Number(fd.get('amount') || 0),
                      currency: fd.get('currency') as string,
                      withholdingTaxPct: Number(fd.get('withholdingTaxPct') || 0),
                      paymentTerms: fd.get('paymentTerms') as string,
                      pensionPin: fd.get('pensionPin') as string,
                      socialSecurityNo: fd.get('socialSecurityNo') as string,
                    },
                  },
                });

                setEditingPartner(null);
              }}
              className="p-4 sm:p-5 space-y-4 text-xs"
            >
              {/* Taxation Header */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                  Taxation &amp; GRA Registration
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      name="tinNumber"
                      defaultValue={
                        editingPartner.accountsDetails?.tinNumber ||
                        editingPartner.extractedData?.taxInformation?.tinNumber ||
                        ''
                      }
                      placeholder="e.g. 2000402822"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tax Office / Jurisdiction
                    </label>
                    <input
                      type="text"
                      name="taxOffice"
                      defaultValue={
                        editingPartner.accountsDetails?.taxOffice ||
                        editingPartner.extractedData?.taxInformation?.taxOffice ||
                        'KANIFING'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tax Compliance Status
                    </label>
                    <select
                      name="taxComplianceStatus"
                      defaultValue={
                        editingPartner.accountsDetails?.taxComplianceStatus ||
                        'Tax Clearance Certified'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Tax Clearance Certified">Tax Clearance Certified</option>
                      <option value="Registered Active Taxpayer">Registered Active Taxpayer</option>
                      <option value="Withholding Tax Compliant">Withholding Tax Compliant</option>
                      <option value="Pending Registration">Pending Registration</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Banking & Remittance */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  Banking &amp; Remittance Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.bankName ||
                        'Trust Bank Gambia Ltd'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Title / Beneficiary
                    </label>
                    <input
                      type="text"
                      name="accountName"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.accountName ||
                        editingPartner.name
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Account Number / IBAN
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.accountNumber ||
                        ''
                      }
                      placeholder="e.g. 011002938101"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Disbursement Mode
                    </label>
                    <select
                      name="paymentMode"
                      defaultValue={
                        editingPartner.accountsDetails?.bankDetails?.paymentMode ||
                        'Direct Deposit / ACH'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Direct Deposit / ACH">Direct Deposit / ACH</option>
                      <option value="Electronic Wire Transfer">Electronic Wire Transfer</option>
                      <option value="Milestone Disbursement">Milestone Disbursement</option>
                      <option value="Corporate Cheque">Corporate Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Compensation & WHT */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                  Compensation &amp; Withholding Tax Structure
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Rate Type
                    </label>
                    <select
                      name="rateType"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.rateType ||
                        'Monthly Salary'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="Monthly Salary">Monthly Salary</option>
                      <option value="Milestone Contract Fee">Milestone Contract Fee</option>
                      <option value="Daily Rate">Daily Rate</option>
                      <option value="Retainer">Retainer</option>
                      <option value="Hourly Rate">Hourly Rate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Rate / Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.amount || 50000
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Withholding Tax % (WHT)
                    </label>
                    <select
                      name="withholdingTaxPct"
                      defaultValue={
                        editingPartner.accountsDetails?.compensation?.withholdingTaxPct ??
                        (editingPartner.category === 'subcontractor' ? 10 : 0)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                    >
                      <option value={0}>0% (Standard Employee PAYE)</option>
                      <option value={5}>5% (Equipment / Building Works WHT)</option>
                      <option value={10}>10% (General Services / Subcontractor WHT)</option>
                      <option value={15}>15% (Professional Consultancy WHT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clearance Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Accounts &amp; Payment Clearance Status
                </label>
                <select
                  name="accountsClearanceStatus"
                  defaultValue={
                    editingPartner.accountsDetails?.accountsClearanceStatus ||
                    'Billing Approved'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Billing Approved">Billing Approved (Authorized for Disbursement)</option>
                  <option value="Payroll Active">Payroll Active (Included in Monthly Direct ACH)</option>
                  <option value="Pending Tax Review">Pending Tax Review (Verify TIN / WHT Certificate)</option>
                  <option value="Payment On Hold">Payment On Hold</option>
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
                  Save Accounts Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
