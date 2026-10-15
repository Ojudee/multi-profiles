import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import {
  PartnerRecord,
  PrintSectionSelection,
  DEFAULT_PRINT_SELECTION,
  CATEGORY_LABELS,
} from '../types';

/**
 * Pre-convert SVG data URLs to high-res PNG/JPEG base64 in cloned elements
 * so that html-to-image / rasterizers never choke or drop vector graphics.
 */
async function rasterizeSvgDataUrl(dataUrl: string, width = 1200, height = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

/**
 * Direct PDF Download: Renders each partner profile with pixel-exact A4 fitting.
 * Uses a normalized clone so screen resolution, scroll, or responsive resizing never disturbs the output.
 */
export async function generateAndDownloadPdf(
  filename = 'Company-Profiles-Dossier.pdf',
  onProgress?: (status: string) => void
): Promise<void> {
  const pageElements = document.querySelectorAll<HTMLElement>('[data-partner-page="true"]');

  if (!pageElements || pageElements.length === 0) {
    throw new Error('No partner profile pages found to export.');
  }

  onProgress?.(`Preparing ${pageElements.length} partner dossier page(s)...`);

  // Standard A4 dimensions in mm
  const a4WidthMm = 210;
  const a4HeightMm = 297;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Create an off-screen staging container with exact A4 aspect ratio (800px x 1130px)
  const stagingContainer = document.createElement('div');
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.left = '-9999px';
  stagingContainer.style.top = '0';
  stagingContainer.style.width = '800px';
  stagingContainer.style.zIndex = '-1000';
  stagingContainer.style.background = '#ffffff';
  document.body.appendChild(stagingContainer);

  try {
    for (let i = 0; i < pageElements.length; i++) {
      const sourceEl = pageElements[i];
      onProgress?.(`Processing Page ${i + 1} of ${pageElements.length}...`);

      // Deep clone the page element
      const clonedEl = sourceEl.cloneNode(true) as HTMLElement;
      clonedEl.style.width = '800px';
      clonedEl.style.minHeight = '0';
      clonedEl.style.maxHeight = 'none';
      clonedEl.style.height = 'auto';
      clonedEl.style.margin = '0';
      clonedEl.style.padding = '0';
      clonedEl.style.boxShadow = 'none';
      clonedEl.style.border = 'none';
      clonedEl.style.borderRadius = '0';
      clonedEl.style.background = '#ffffff';
      clonedEl.style.overflow = 'visible';

      // Remove any interactive/no-print buttons from clone
      const noPrintElements = clonedEl.querySelectorAll<HTMLElement>('.no-print');
      noPrintElements.forEach((np) => np.remove());

      // Ensure TIN Certificate is scaled as half A4 box
      const tinBoxes = clonedEl.querySelectorAll<HTMLElement>('.tin-certificate-container');
      tinBoxes.forEach((box) => {
        box.style.overflow = 'visible';
        box.style.maxHeight = 'none';
        box.style.height = 'auto';
      });

      const allImages = clonedEl.querySelectorAll<HTMLImageElement>('img');
      allImages.forEach((img) => {
        img.style.objectFit = 'contain';
        img.style.display = 'block';
      });

      // Ensure all images are preloaded and SVGs converted to solid high-res bitmaps
      const imgElements = clonedEl.querySelectorAll<HTMLImageElement>('img');
      for (const img of Array.from(imgElements)) {
        if (img.src && img.src.startsWith('data:image/svg+xml')) {
          try {
            const rasterized = await rasterizeSvgDataUrl(img.src, 1200, 800);
            img.src = rasterized;
          } catch {
            // fallback to original src
          }
        }
      }

      stagingContainer.appendChild(clonedEl);

      // Render to image
      const imgData = await toJpeg(clonedEl, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      stagingContainer.removeChild(clonedEl);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const imgProps = pdf.getImageProperties(imgData);
      const margin = 8;
      const targetWidth = a4WidthMm - margin * 2;
      const targetHeight = a4HeightMm - margin * 2;

      const scaleX = targetWidth / imgProps.width;
      const scaleY = targetHeight / imgProps.height;
      const scale = Math.min(scaleX, scaleY);

      const finalWidth = imgProps.width * scale;
      const finalHeight = imgProps.height * scale;

      const xOffset = margin + (targetWidth - finalWidth) / 2;
      const yOffset = margin + (targetHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
    }

    onProgress?.('Generating PDF document...');
    pdf.save(filename);
  } finally {
    stagingContainer.remove();
  }
}

/**
 * Open a clean, isolated pop-out window with full vector printing styles and auto-triggers print dialog.
 * Bypasses web iframe restrictions effortlessly!
 */
export function openPrintDialogWindow(
  partners: PartnerRecord[],
  selection: PrintSectionSelection = DEFAULT_PRINT_SELECTION
): void {
  const printWindow = window.open('', '_blank', 'width=950,height=900,menubar=no,toolbar=no');
  if (!printWindow) {
    // If popups are blocked, download standalone HTML dossier as automatic fallback
    downloadStandaloneHtmlDossier(partners, 'Company-Profiles-Dossier.html', selection);
    return;
  }

  const htmlContent = buildStandaloneDossierHtml(partners, true, selection);
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Download Standalone HTML Dossier (.html):
 * 100% vector fidelity, works completely offline in Chrome/Edge/Safari with Ctrl+P.
 */
export function downloadStandaloneHtmlDossier(
  partners: PartnerRecord[],
  filename = 'Company-Profiles-Dossier.html',
  selection: PrintSectionSelection = DEFAULT_PRINT_SELECTION
): void {
  const htmlContent = buildStandaloneDossierHtml(partners, false, selection);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Shared HTML generator for standalone dossier & pop-out print window
 */
function buildStandaloneDossierHtml(
  partners: PartnerRecord[],
  autoPrint = false,
  selection: PrintSectionSelection = DEFAULT_PRINT_SELECTION
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Univision design and Construction Ltd. - Official Corporate Dossier</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
    }
    .page-container {
      width: 100%;
      max-width: 840px;
      margin: 20px auto 40px auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: hidden;
    }
    .page-container:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }
    .accent-bar {
      height: 8px;
      background: #1e3a8a;
      width: 100%;
    }
    .content {
      padding: 24px 32px 18px 32px;
    }
    header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: bold;
      background: #0f172a;
      color: #ffffff;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 26px;
      font-family: Georgia, serif;
      margin: 6px 0 4px 0;
      color: #0f172a;
      line-height: 1.2;
    }
    .date-line {
      font-size: 11px;
      color: #475569;
    }
    .strip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: Georgia, serif;
      font-size: 14px;
      font-weight: bold;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 14px 0 8px 0;
    }
    .num-badge {
      width: 18px;
      height: 18px;
      background: #1e3a8a;
      color: #ffffff;
      border-radius: 4px;
      font-size: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 11px;
      border: 1px solid #cbd5e1;
    }
    th {
      width: 30%;
      background: #f8fafc;
      text-align: left;
      padding: 5px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .image-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .image-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px;
      border-radius: 4px;
    }
    .image-title {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: #334155;
      margin-bottom: 4px;
    }
    .image-card img {
      width: 100%;
      height: 180px;
      max-height: 180px;
      object-fit: contain;
      object-position: center;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 4px;
      display: block;
    }

    /* Half-A4 TIN Certificate Styling: exactly half the size of A4 paper */
    .tin-image-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
      margin-bottom: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
      overflow: visible;
    }
    .tin-image-card img {
      width: 100%;
      height: 135mm; /* Half of A4 (297mm) */
      max-height: 140mm;
      object-fit: contain;
      object-position: center;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 4px;
      display: block;
    }
    @media screen {
      .tin-image-card img {
        height: auto;
        min-height: 380px;
        max-height: 500px;
      }
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .box-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 6px;
    }
    footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .page-container {
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        max-width: 100% !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 840px; margin: 15px auto; padding: 12px 18px; background: #0f172a; color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <div>
      <strong style="font-size: 14px;">APEX INFRASTRUCTURE · Corporate Dossier Print Preview</strong>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        High-fidelity vector formatting. All selected sections will print cleanly to A4 paper.
      </div>
    </div>
    <button onclick="window.print()" style="padding: 8px 18px; background: #2563eb; color: #ffffff; border: none; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer;">
      Print Now (Ctrl+P)
    </button>
  </div>

  ${partners
    .map((partner, idx) => {
      const ext = partner.extractedData;
      const idData = ext?.partnerIdentification;
      const taxData = ext?.taxInformation;
      const hr = partner.hrDetails;
      const acc = partner.accountsDetails;
      const subPlan = acc?.subcontractPlan;
      const adjustments = acc?.payrollAdjustments?.[0];
      const pageNum = idx + 1;
      const totalPages = partners.length;

      return `
    <div class="page-container">
      <div class="accent-bar"></div>
      <div class="content">
        ${
          selection.coverAndHeader
            ? `
        <header>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span class="badge">OFFICIAL CORPORATE DOSSIER</span>
              <h1>${partner.documentTitle || 'Company Profiles'}</h1>
              <div class="date-line">Verified Date: ${partner.generatedDate}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: #64748b; font-weight: bold;">PAGE ${pageNum} OF ${totalPages}</div>
              <div style="font-size: 13px; font-weight: bold; color: #1e3a8a; margin-top: 3px;">${idData?.fullName || partner.name}</div>
              <div style="font-size: 10px; color: #475569; font-weight: 600;">${hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || 'ID: ON RECORD'}</div>
            </div>
          </div>
        </header>
        `
            : ''
        }

        ${
          selection.classificationStrip
            ? `
        <div class="strip">
          <div>
            <strong>Classification:</strong> ${CATEGORY_LABELS[partner.category] || partner.category} ·
            <strong>Role:</strong> ${partner.designation || 'Staff'} ·
            <strong>Dept:</strong> ${partner.department || 'Operations'}
          </div>
          <div style="font-size: 10px; font-weight: bold; color: #047857;">
            HR: ${hr?.hrClearanceStatus || 'Fully Cleared'} · Accounts: ${acc?.accountsClearanceStatus || 'Billing Approved'}
          </div>
        </div>
        `
            : ''
        }

        ${
          selection.identificationBioData
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">1</span>
            <span>Personnel Identification &amp; Statutory Bio-Data</span>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Full Legal Name</th>
                <td style="font-weight: bold;">${idData?.fullName || partner.name}</td>
                <th>ID / Passport No</th>
                <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${idData?.idNumber || 'Verified on Scan'}</td>
              </tr>
              <tr>
                <th>Date of Birth</th>
                <td>${idData?.dateOfBirth || 'On File'}</td>
                <th>Nationality</th>
                <td>${idData?.nationality || 'GAMBIAN'}</td>
              </tr>
              <tr>
                <th>Issue / Expiry Date</th>
                <td>${idData?.issueDate || '—'} / ${idData?.expiryDate || '—'}</td>
                <th>Work Location</th>
                <td>${hr?.workLocation || 'Central HQ & Project Sites'}</td>
              </tr>
            </tbody>
          </table>
        </section>
        `
            : ''
        }

        ${
          selection.idCardsImages
            ? `
        <section>
          <div class="image-grid">
            <div class="image-card">
              <div class="image-title">Attached: ID Front Image</div>
              ${partner.idFrontImage ? `<img src="${partner.idFrontImage}" alt="ID Front">` : '<div>No Image</div>'}
            </div>
            <div class="image-card">
              <div class="image-title">Attached: ID Back Image</div>
              ${partner.idBackImage ? `<img src="${partner.idBackImage}" alt="ID Back">` : '<div>No Image</div>'}
            </div>
          </div>
        </section>
        `
            : ''
        }

        ${
          selection.accountsTaxSchedule
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">2</span>
            <span>Accounts, Taxation &amp; Bank Remittance Information</span>
          </div>

          <table>
            <tbody>
              <tr>
                <th>GRA TIN Number</th>
                <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${acc?.tinNumber || taxData?.tinNumber || '—'}</td>
                <th>Tax Office</th>
                <td>${acc?.taxOffice || taxData?.taxOffice || 'KANIFING'} Division · GRA</td>
              </tr>
              <tr>
                <th>Bank Depository</th>
                <td style="font-weight: bold;">${acc?.bankDetails?.bankName || 'Trust Bank Gambia Ltd'}</td>
                <th>Account Number</th>
                <td style="font-family: monospace; font-weight: bold; color: #1e3a8a;">${acc?.bankDetails?.accountNumber || '—'}</td>
              </tr>
              <tr>
                <th>Disbursement Rate</th>
                <td style="font-weight: bold;">${acc?.compensation?.currency || 'GMD'} ${(acc?.compensation?.amount || 0).toLocaleString()} (${acc?.compensation?.rateType || 'Monthly Salary'})</td>
                <th>Tax Treatment</th>
                <td>${partner.category === 'subcontractor' ? `${acc?.compensation?.withholdingTaxPct ?? 10}% Withholding Tax (WHT Deducted)` : 'Statutory PAYE Remitted to Revenue Authority'}</td>
              </tr>
            </tbody>
          </table>
        </section>
        `
            : ''
        }

        ${
          selection.tinCertificateImage
            ? `
        <section>
          <div class="tin-image-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="image-title">Attached: GRA TIN Certificate (Half A4 Paper Scale)</span>
              <span style="font-size: 9px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 3px; font-weight: bold;">
                TAX CLEARANCE &amp; REGISTRATION
              </span>
            </div>
            ${partner.tinCertificateImage ? `<img src="${partner.tinCertificateImage}" alt="TIN Certificate">` : '<div>No TIN Certificate Image</div>'}
          </div>
        </section>
        `
            : ''
        }

        ${
          selection.employmentOrSubcontractSchedule
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">3</span>
            <span>${partner.category === 'subcontractor' ? 'Subcontract Service Schedule & Agreement' : 'Employment Appointment & Contract Details'}</span>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Engagement Date</th>
                <td>${hr?.dateOfEngagement || partner.generatedDate}</td>
                <th>Contract Expiry / Term</th>
                <td>${hr?.contractEndDate || (partner.category === 'subcontractor' ? 'Milestone Contract Term' : 'Permanent Indefinite')}</td>
              </tr>
              <tr>
                <th>Reporting Authority</th>
                <td>${hr?.reportingSupervisor || 'Managing Partner / Board'}</td>
                <th>Emergency Contact</th>
                <td>${hr?.emergencyContact?.fullName || 'Contact on File'} (${hr?.emergencyContact?.relationship || 'Family'}) · ${hr?.emergencyContact?.phoneNumber || '—'}</td>
              </tr>
            </tbody>
          </table>
        </section>
        `
            : ''
        }

        ${
          selection.subcontractorMilestoneStages && partner.category === 'subcontractor' && subPlan
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">3-B</span>
            <span>Subcontractor Payment Stages relative to Contract Sum (${subPlan.contractType})</span>
          </div>

          <div style="font-size: 11px; margin-bottom: 6px; color: #334155;">
            <strong>Agreed Contract Sum:</strong> GMD ${(subPlan.contractSum || 0).toLocaleString()} ·
            <strong>Advance Payment:</strong> ${subPlan.advancePaymentPct}% ·
            <strong>Retention Holdback:</strong> ${subPlan.retentionHoldbackPct}% (${subPlan.retentionPeriodMonths} months)
          </div>

          <table>
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="width: 10%;">Stage</th>
                <th style="width: 35%;">Milestone Scope</th>
                <th style="width: 15%;">Percent (%)</th>
                <th style="width: 20%;">Stage Amount</th>
                <th style="width: 20%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${(subPlan.stages || [])
                .map(
                  (stg) => `
              <tr>
                <td style="font-weight: bold; text-align: center;">#${stg.stageNumber}</td>
                <td>${stg.stageName}</td>
                <td>${stg.percentage}%</td>
                <td style="font-family: monospace; font-weight: bold;">GMD ${(stg.amount || 0).toLocaleString()}</td>
                <td style="text-transform: uppercase; font-weight: bold; color: ${stg.status === 'paid' ? '#047857' : stg.status === 'approved' ? '#0284c7' : '#d97706'};">${stg.status}</td>
              </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </section>
        `
            : ''
        }

        ${
          selection.payrollAdjustmentsAndDeductions &&
          partner.category !== 'subcontractor' &&
          adjustments
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">3-C</span>
            <span>Monthly Payroll Adjustments: Absence, Lateness &amp; Advance Salary</span>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Base Monthly Gross</th>
                <td style="font-weight: bold;">GMD ${(adjustments.baseSalary || 0).toLocaleString()}</td>
                <th>Allowances</th>
                <td>GMD ${(adjustments.allowances || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <th>Absence Deductions</th>
                <td style="color: #b91c1c; font-weight: bold;">- GMD ${(adjustments.absenceDeductionAmount || 0).toLocaleString()} (${adjustments.daysAbsent} days absent)</td>
                <th>Lateness Penalties</th>
                <td style="color: #b91c1c; font-weight: bold;">- GMD ${(adjustments.latenessPenaltyAmount || 0).toLocaleString()} (${adjustments.lateOccurrencesOrHours} incidents)</td>
              </tr>
              <tr>
                <th>Salary Advance Recovery</th>
                <td style="color: #b91c1c; font-weight: bold;">- GMD ${(adjustments.advanceRecoveryDeduction || 0).toLocaleString()} (Remaining Bal: GMD ${(adjustments.advanceBalanceRemaining || 0).toLocaleString()})</td>
                <th>Net Payable Salary</th>
                <td style="font-weight: bold; color: #047857; font-size: 13px;">GMD ${(adjustments.netSalaryPayable || 0).toLocaleString()} (${adjustments.paymentStatus.toUpperCase()})</td>
              </tr>
            </tbody>
          </table>
        </section>
        `
            : ''
        }

        ${
          selection.agreementDocumentsImages && partner.contractOrAgreementImage
            ? `
        <section>
          <div class="tin-image-card">
            <div class="image-title">Attached: Formal Service / Employment Agreement</div>
            <img src="${partner.contractOrAgreementImage}" alt="Agreement Image" style="max-height: 240mm;">
          </div>
        </section>
        `
            : ''
        }

        ${
          selection.departmentSignatures
            ? `
        <div class="two-col">
          <div class="box">
            <div class="box-title">1. Human Resources Certification</div>
            <div style="font-size: 10px; line-height: 1.5; margin-top: 4px;">
              <div><strong>Status:</strong> ${hr?.hrClearanceStatus || 'Fully Cleared'}</div>
              <div><strong>Signatory:</strong> ${hr?.hrOfficerSignatory || 'Head of HR'}</div>
              <div style="margin-top: 8px; font-weight: bold;">Signature: __________________________</div>
              <div style="margin-top: 4px;">Date: ${hr?.hrSignDate || partner.generatedDate}</div>
            </div>
          </div>

          <div class="box">
            <div class="box-title">2. Accounts &amp; Finance Certification</div>
            <div style="font-size: 10px; line-height: 1.5; margin-top: 4px;">
              <div><strong>Status:</strong> ${acc?.accountsClearanceStatus || 'Billing Approved'}</div>
              <div><strong>Signatory:</strong> ${acc?.accountsControllerSignatory || 'Financial Controller'}</div>
              <div style="margin-top: 8px; font-weight: bold;">Signature: __________________________</div>
              <div style="margin-top: 4px;">Date: ${acc?.accountsSignDate || partner.generatedDate}</div>
            </div>
          </div>
        </div>
        `
            : ''
        }

        <footer>
          <span>Confidential Corporate Dossier – Univision design and Construction Ltd.</span>
          <span>Page ${pageNum} of ${totalPages}</span>
        </footer>
      </div>
    </div>
    `;
    })
    .join('')}

  ${
    autoPrint
      ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    });
  </script>
  `
      : ''
  }
</body>
</html>`;
}
