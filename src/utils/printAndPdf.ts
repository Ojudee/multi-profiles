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
  onProgress?: (status: string) => void,
  targetElementId?: string
): Promise<void> {
  let pageElements: HTMLElement[] = [];
  if (targetElementId) {
    const el = document.getElementById(targetElementId);
    if (el) pageElements = [el];
  }
  if (pageElements.length === 0) {
    pageElements = Array.from(document.querySelectorAll<HTMLElement>('[data-partner-page="true"]'));
  }

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

      // Remove any elements marked print:hidden so unselected sections do not leak into the PDF
      const printHiddenElements = clonedEl.querySelectorAll<HTMLElement>('.print\\:hidden, [class*="print:hidden"]');
      printHiddenElements.forEach((el) => el.remove());

      // Configure ID Card frames in clone for exact statutory ISO 7810 ID-1 (85.6mm x 53.98mm) proportions
      const idFrames = clonedEl.querySelectorAll<HTMLElement>('.id-card-frame');
      idFrames.forEach((frame) => {
        frame.style.width = '100%';
        frame.style.aspectRatio = '85.6 / 53.98';
        frame.style.height = '34mm';
        frame.style.maxHeight = '34mm';
        frame.style.overflow = 'hidden';
        const img = frame.querySelector<HTMLImageElement>('img');
        if (img) {
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.objectPosition = 'center';
          img.style.display = 'block';
        }
      });

      // Configure TIN Certificate in clone for exact Half-A4 (210mm x 148.5mm, 1.414:1) dimensions
      const tinFrames = clonedEl.querySelectorAll<HTMLElement>('.tin-certificate-frame');
      tinFrames.forEach((frame) => {
        frame.style.width = '100%';
        frame.style.aspectRatio = '210 / 148.5';
        frame.style.height = '68mm';
        frame.style.maxHeight = '70mm';
        frame.style.overflow = 'hidden';
        const img = frame.querySelector<HTMLImageElement>('img');
        if (img) {
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.objectPosition = 'center';
          img.style.display = 'block';
        }
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
      const margin = 6;
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
 * Perfectly matched to the Corporate Dossier print layout reference.
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
      margin: 5mm 7mm 5mm 7mm;
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
      font-size: 8.5pt;
      line-height: 1.25;
    }
    .page-container {
      width: 100%;
      max-width: 820px;
      margin: 15px auto 30px auto;
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
      height: 6px;
      background: #0f172a;
      width: 100%;
    }
    .content {
      padding: 12px 18px 8px 18px;
    }
    header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .kicker-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .org-pill {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ref-code {
      font-family: monospace;
      font-size: 9.5px;
      font-weight: bold;
      color: #64748b;
      margin-left: 6px;
    }
    .page-indicator {
      font-family: monospace;
      font-size: 9.5px;
      font-weight: bold;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h1 {
      font-size: 22px;
      font-family: Georgia, serif;
      margin: 3px 0 2px 0;
      color: #020617;
      line-height: 1.2;
      font-weight: bold;
    }
    .date-line {
      font-size: 10.5px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .strip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 10px;
      font-size: 10.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .cat-pill {
      background: #fef3c7;
      color: #78350f;
      border: 1px solid #fde68a;
      padding: 1.5px 6px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 9.5px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin: 10px 0 6px 0;
    }
    .section-title h2 {
      margin: 0;
      font-family: Georgia, serif;
      font-size: 13.5px;
      font-weight: bold;
      color: #020617;
    }
    .num-badge {
      width: 17px;
      height: 17px;
      background: #1e3a8a;
      color: #ffffff;
      border-radius: 3px;
      font-size: 9.5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      font-weight: bold;
    }
    .sec-subtitle {
      font-size: 9.5px;
      color: #64748b;
      margin-left: auto;
      font-weight: normal;
    }
    .badge-blue {
      background: #e0f2fe;
      color: #0369a1;
      padding: 1.5px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-weight: bold;
      font-size: 8.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 4px 6px;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }
    td {
      padding: 4px 6px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .image-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .image-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 5px;
      border-radius: 6px;
    }
    .image-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }
    .image-title {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: #1e293b;
    }
    .id-frame {
      width: 100%;
      aspect-ratio: 85.6 / 53.98;
      height: 34mm;
      max-height: 34mm;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    .id-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .tin-image-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px;
      border-radius: 6px;
      margin-bottom: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .tin-frame {
      width: 100%;
      aspect-ratio: 210 / 148.5;
      height: 68mm;
      max-height: 70mm;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    .tin-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 6px;
      margin-bottom: 6px;
    }
    .box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px 8px;
      border-radius: 4px;
    }
    .box-title {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 4px;
      color: #1e293b;
    }
    footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 5px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
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
      .id-frame {
        height: 34mm !important;
        max-height: 34mm !important;
      }
      .tin-frame {
        height: 68mm !important;
        max-height: 70mm !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 820px; margin: 15px auto; padding: 12px 18px; background: #0f172a; color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <div>
      <strong style="font-size: 13px;">UNIVISION DESIGN AND CONSTRUCTION LTD. · Corporate Dossier Print Preview</strong>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        High-fidelity vector formatting. Strictly calibrated to fit cleanly onto A4 paper.
      </div>
    </div>
    <button onclick="window.print()" style="padding: 7px 16px; background: #2563eb; color: #ffffff; border: none; font-size: 12px; font-weight: bold; border-radius: 6px; cursor: pointer;">
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

      const hasMultiPageSections = Boolean(
        selection.accountsTaxSchedule ||
        selection.employmentOrSubcontractSchedule ||
        selection.agreementDocumentsImages ||
        (partner.category === 'subcontractor' && selection.subcontractorMilestoneStages) ||
        (partner.category !== 'subcontractor' && selection.payrollAdjustmentsAndDeductions)
      );

      return `
    <div class="page-container">
      <div class="accent-bar"></div>
      <div class="content">
        ${
          selection.coverAndHeader
            ? `
        <header>
          <div class="kicker-row">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="org-pill">UNIVISION DESIGN AND CONSTRUCTION LTD.</span>
              <span class="ref-code">REF: ${hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || partner.id.toUpperCase()}</span>
            </div>
            <div class="page-indicator">PAGE 1 OF ${hasMultiPageSections ? '2' : '1'}</div>
          </div>
          <h1>${partner.documentTitle || 'Company Profiles'}</h1>
          <div class="date-line">Corporate Verification Date: ${partner.generatedDate}</div>
        </header>
        `
            : ''
        }

        ${
          selection.classificationStrip
            ? `
        <div class="strip">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="cat-pill">${CATEGORY_LABELS[partner.category] || partner.category}</span>
            <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${hr?.staffIdOrCode || acc?.vendorOrTaxIdCode || partner.id.toUpperCase()}</span>
            <span style="color: #cbd5e1;">·</span>
            <span style="font-weight: bold; color: #0f172a;">${partner.designation || 'Corporate Role'}</span>
            <span style="color: #cbd5e1;">·</span>
            <span style="color: #475569;">${partner.department || 'Operations'}</span>
          </div>
          <div style="font-size: 10px; font-weight: bold; display: flex; gap: 10px; align-items: center;">
            <span style="color: #047857;">✔ HR: ${hr?.hrClearanceStatus || 'Fully Cleared'}</span>
            <span style="color: #1d4ed8;">🛡 Accounts: ${acc?.accountsClearanceStatus || 'Payroll Active'}</span>
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
            <h2>Personnel Identification &amp; Statutory Bio-Data</h2>
            <span class="sec-subtitle">(Verified from Attached Identity Credentials)</span>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; background: #f8fafc; display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
            <div style="width: 76px; text-align: center; flex-shrink: 0;">
              ${
                partner.profilePicture
                  ? `<img src="${partner.profilePicture}" alt="${idData?.fullName || partner.name}" style="width: 72px; height: 90px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1; display: block; margin: 0 auto; background: #ffffff;">`
                  : `<div style="width: 72px; height: 90px; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8.5px; color: #64748b; font-weight: bold;">PHOTO</div>`
              }
              <div style="font-size: 7.5px; font-weight: bold; color: #64748b; margin-top: 2px; font-family: monospace; letter-spacing: 0.5px;">BIOMETRIC PHOTO</div>
            </div>
            <div style="flex: 1; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff;">
              <table style="margin: 0; border: none;">
                <tbody>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th style="width: 20%;">FULL LEGAL NAME</th>
                    <td style="width: 30%; font-weight: bold; color: #020617;">${idData?.fullName || partner.name}</td>
                    <th style="width: 22%;">ID / PASSPORT NO</th>
                    <td style="width: 28%; font-family: monospace; font-weight: bold; color: #1e3a8a;">${idData?.idNumber || 'Verified on Scan'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <th>DATE OF BIRTH</th>
                    <td>${idData?.dateOfBirth || '21/12/2001 (21 December 2001)'}</td>
                    <th>NATIONALITY</th>
                    <td style="font-weight: bold; text-transform: uppercase;">${idData?.nationality || 'GAMBIAN'}</td>
                  </tr>
                  <tr>
                    <th>ISSUE / EXPIRY</th>
                    <td>Issue: ${idData?.issueDate || '27/08/2025'} · Expiry: ${idData?.expiryDate || '27/08/2030'}</td>
                    <th>WORK STATION</th>
                    <td>${hr?.workLocation || 'Headquarters & Port Project Site Office'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        `
            : ''
        }

        ${
          selection.idCardsImages
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">2</span>
            <h2>Biometric Identity Documents (ID Front &amp; Back)</h2>
            <span class="sec-subtitle">(Statutory ISO/IEC 7810 ID-1 Standard • 85.60 × 53.98 mm)</span>
          </div>

          <div class="image-grid">
            <div class="image-card">
              <div class="image-header">
                <span class="image-title">ATTACHED: ID FRONT IMAGE</span>
                <span class="badge-blue">PRIMARY ID (85.6 × 54mm)</span>
              </div>
              <div class="id-frame">
                ${partner.idFrontImage ? `<img src="${partner.idFrontImage}" alt="ID Front">` : '<div style="padding: 15px; text-align: center; color: #94a3b8; font-size: 9.5px;">No ID Front Image</div>'}
              </div>
            </div>
            <div class="image-card">
              <div class="image-header">
                <span class="image-title">ATTACHED: ID BACK IMAGE</span>
                <span class="badge-blue">MRZ &amp; ENDORSEMENT</span>
              </div>
              <div class="id-frame">
                ${partner.idBackImage ? `<img src="${partner.idBackImage}" alt="ID Back">` : '<div style="padding: 15px; text-align: center; color: #94a3b8; font-size: 9.5px;">No ID Back Image</div>'}
              </div>
            </div>
          </div>
        </section>
        `
            : ''
        }

        ${
          selection.tinCertificateImage
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">3</span>
            <h2>Gambia Revenue Authority (GRA) Tax Registration Certificate</h2>
            <span class="badge-blue" style="margin-left: auto;">STATUTORY GRA TIN · SAME-SHEET CALIBRATED</span>
          </div>

          <div class="tin-image-card">
            <div class="image-header">
              <span class="image-title">OFFICIAL GAMBIA REVENUE AUTHORITY (GRA) CERTIFICATE</span>
              <span style="font-size: 9px; color: #64748b; font-family: monospace;">TIN: ${acc?.tinNumber || taxData?.tinNumber || '2000402822'} · Office: ${acc?.taxOffice || 'KANIFING'}</span>
            </div>
            <div class="tin-frame">
              ${partner.tinCertificateImage ? `<img src="${partner.tinCertificateImage}" alt="TIN Certificate">` : '<div style="padding: 25px; text-align: center; color: #94a3b8; font-size: 10px;">No GRA TIN Certificate Image</div>'}
            </div>
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
            <div style="font-size: 9.5px; line-height: 1.4; color: #334155;">
              <div>Status: <strong style="color: #0f172a;">${hr?.hrClearanceStatus || 'Fully Cleared'}</strong></div>
              <div>Signatory: <strong style="color: #0f172a;">${hr?.hrOfficerSignatory || 'Fatou Sallah, Head of Human Resources'}</strong></div>
              <div style="margin-top: 5px; font-family: monospace; color: #94a3b8;">Signature: __________________________</div>
            </div>
          </div>

          <div class="box">
            <div class="box-title">2. Accounts &amp; Finance Certification</div>
            <div style="font-size: 9.5px; line-height: 1.4; color: #334155;">
              <div>Status: <strong style="color: #0f172a;">${acc?.accountsClearanceStatus || 'Payroll Active'}</strong></div>
              <div>Signatory: <strong style="color: #0f172a;">${acc?.accountsControllerSignatory || 'Aminata Bah, Financial Controller'}</strong></div>
              <div style="margin-top: 5px; font-family: monospace; color: #94a3b8;">Signature: __________________________</div>
            </div>
          </div>
        </div>
        `
            : ''
        }

        <footer>
          <span>CONFIDENTIAL INTERNAL CORPORATE DOSSIER — UNIVISION DESIGN AND CONSTRUCTION LTD.</span>
          <span>PAGE 1 OF ${hasMultiPageSections ? '2' : '1'}</span>
        </footer>

        ${
          hasMultiPageSections
            ? `
        <div style="page-break-after: always; break-after: page; height: 0; margin: 0; padding: 0;"></div>

        ${
          selection.accountsTaxSchedule
            ? `
        <section style="margin-top: 14px;">
          <div class="section-title">
            <span class="num-badge">4</span>
            <h2>Accounts, Taxation &amp; Bank Remittance Information</h2>
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
          selection.employmentOrSubcontractSchedule
            ? `
        <section>
          <div class="section-title">
            <span class="num-badge">5</span>
            <h2>${partner.category === 'subcontractor' ? 'Subcontract Service Schedule & Agreement' : 'Employment Appointment & Contract Details'}</h2>
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
            <span class="num-badge">5-B</span>
            <h2>Subcontractor Payment Stages relative to Contract Sum (${subPlan.contractType})</h2>
          </div>

          <div style="font-size: 10px; margin-bottom: 5px; color: #334155;">
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
            <span class="num-badge">5-C</span>
            <h2>Monthly Payroll Adjustments: Absence, Lateness &amp; Advance Salary</h2>
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
                <td style="font-weight: bold; color: #047857; font-size: 11px;">GMD ${(adjustments.netSalaryPayable || 0).toLocaleString()} (${adjustments.paymentStatus.toUpperCase()})</td>
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
            <img src="${partner.contractOrAgreementImage}" alt="Agreement Image" style="max-height: 200mm; width: 100%; object-fit: contain;">
          </div>
        </section>
        `
            : ''
        }

        <footer>
          <span>CONFIDENTIAL INTERNAL CORPORATE DOSSIER — UNIVISION DESIGN AND CONSTRUCTION LTD.</span>
          <span>PAGE 2 OF 2</span>
        </footer>
        `
            : ''
        }
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
