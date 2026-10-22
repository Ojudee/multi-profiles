import React, { useState } from 'react';
import { AuditLogEntry, CorporateOfficial } from '../types';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Users,
  CreditCard,
  Calendar,
  CheckCircle2,
  FileText,
  UserCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AuditTrailViewerProps {
  auditLogs: AuditLogEntry[];
  officials: CorporateOfficial[];
  activeOfficial: CorporateOfficial | null;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  auditLogs,
  officials,
  activeOfficial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'Administrator' | 'HR' | 'Accounts'>('all');
  const [officialFilter, setOfficialFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');

  const adminActionsCount = auditLogs.filter((l) => l.department === 'Administrator').length;
  const hrActionsCount = auditLogs.filter((l) => l.department === 'HR').length;
  const accountsActionsCount = auditLogs.filter((l) => l.department === 'Accounts').length;

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.officialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetPersonnelName && log.targetPersonnelName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.actionType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'all' || log.department === departmentFilter;
    const matchesOfficial = officialFilter === 'all' || log.officialId === officialFilter;
    const matchesAction = actionTypeFilter === 'all' || log.actionType === actionTypeFilter;

    return matchesSearch && matchesDept && matchesOfficial && matchesAction;
  });

  const handleExportCsv = () => {
    const headers = [
      'Timestamp',
      'Operator Official',
      'Department',
      'Role Title',
      'Action Type',
      'Target Personnel',
      'Description',
    ];

    const rows = auditLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.officialName}"`,
      `"${l.department}"`,
      `"${l.officialRole}"`,
      `"${l.actionType}"`,
      `"${l.targetPersonnelName || 'System / Corporate'}"`,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Corporate_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('PAYROLL') || actionType.includes('ADVANCE') || actionType.includes('ABSENCE')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (actionType.includes('DISBURSE') || actionType.includes('BILLING') || actionType.includes('STAGE')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (actionType.includes('CREDENTIAL') || actionType.includes('CLEARANCE') || actionType.includes('PROFILE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold">Total Audit Log Entries</div>
            <div className="text-2xl font-bold mt-1 text-white">{auditLogs.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Chronologically sealed records</div>
          </div>
          <History className="w-8 h-8 text-blue-400 opacity-80" />
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">HR People Operations</div>
            <div className="text-2xl font-bold mt-1 text-emerald-950">{hrActionsCount}</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Profiles &amp; credentials authenticated</div>
          </div>
          <Users className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Accounts &amp; Disbursements</div>
            <div className="text-2xl font-bold mt-1 text-purple-950">{accountsActionsCount}</div>
            <div className="text-[10px] text-purple-600 font-medium mt-0.5">Payroll deductions &amp; milestones</div>
          </div>
          <CreditCard className="w-8 h-8 text-purple-500 opacity-80" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search who did what, target staff member, or action details..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Departments</option>
              <option value="Administrator">Administrator / General Manager</option>
              <option value="HR">HR Department Actions</option>
              <option value="Accounts">Accounts &amp; Finance Actions</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Authorized Officer
            </label>
            <select
              value={officialFilter}
              onChange={(e) => setOfficialFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Operators / Officials ({officials.length})</option>
              {officials.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.roleTitle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Action Category
            </label>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="all">All Action Types</option>
              <option value="CREATE_PROFILE">Create Personnel Profile</option>
              <option value="UPDATE_PROFILE">Update Personnel Profile</option>
              <option value="ADJUST_PAYROLL">Adjust Payroll / Deductions</option>
              <option value="APPROVE_SUBCONTRACT_STAGE">Approve Subcontract Stage</option>
              <option value="DISBURSE_SUBCONTRACT_PAYMENT">Disburse Subcontract Payment</option>
              <option value="ATTACH_CREDENTIAL">Attach Staff Credential</option>
              <option value="VERIFY_CLEARANCE">Verify HR Clearance</option>
              <option value="APPROVE_BILLING">Approve Tax &amp; Billing</option>
              <option value="UPDATE_ORG_SETTINGS">Update Organization Branding</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Activity Audit Trail · Who Did What
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Immutable digital record tracking all profile modifications, deductions, disbursements, and credential attachments.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Showing {filteredLogs.length} of {auditLogs.length} activities
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No matching activities recorded</p>
            <p className="text-xs text-slate-400 mt-1">Actions performed by signed-in officials will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Operator / Official</th>
                  <th className="py-3 px-4">Department &amp; Role</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Target Personnel</th>
                  <th className="py-3 px-4">Activity Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => {
                  const isHR = log.department === 'HR';
                  const badgeClass = getActionBadge(log.actionType);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.timestamp}
                      </td>

                      {/* Official Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.officialName}</span>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mr-1.5 ${
                            isHR
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {log.department}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {log.officialRole}
                        </span>
                      </td>

                      {/* Action Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Target Personnel */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {log.targetPersonnelName || 'Corporate Entity'}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-600 max-w-md">
                        {log.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
