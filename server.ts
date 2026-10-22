import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DATA_STORE_FILE = path.resolve(__dirname, 'partners-data-store.json');
let inMemoryPartners: any = null;

try {
  if (fs.existsSync(DATA_STORE_FILE)) {
    const raw = fs.readFileSync(DATA_STORE_FILE, 'utf-8');
    inMemoryPartners = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Could not read existing partners-data-store.json:', e);
}

// Endpoints for persistent partners list across reloads
app.get('/api/partners', (_req, res) => {
  if (inMemoryPartners && Array.isArray(inMemoryPartners) && inMemoryPartners.length > 0) {
    res.json({ success: true, partners: inMemoryPartners });
  } else {
    res.json({ success: true, partners: null });
  }
});

app.post('/api/partners', async (req, res) => {
  try {
    const { partners } = req.body;
    if (partners === null) {
      inMemoryPartners = null;
      try {
        if (fs.existsSync(DATA_STORE_FILE)) {
          fs.unlinkSync(DATA_STORE_FILE);
        }
      } catch {}
      res.json({ success: true, message: 'Cleared' });
      return;
    }

    if (Array.isArray(partners)) {
      inMemoryPartners = partners;
      try {
        await fs.promises.writeFile(DATA_STORE_FILE, JSON.stringify(partners), 'utf-8');
      } catch (fErr) {
        console.warn('Could not persist partners to disk:', fErr);
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Expected partners array or null' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save partners' });
  }
});

import nodemailer from 'nodemailer';

// Helper to create SMTP transporter if configured
function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE; // e.g. 'gmail'

  if (service && user && pass) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

// Endpoint to check auth delivery gateway status
app.get('/api/auth-delivery-status', (_req, res) => {
  const hasSmtp = Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.SMTP_SERVICE && process.env.SMTP_USER && process.env.SMTP_PASS)
  );
  const hasSms = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  res.json({
    smtpConfigured: hasSmtp,
    smsConfigured: hasSms,
  });
});

// Endpoint to dispatch corporate email verification code
app.post('/api/send-email-code', async (req, res) => {
  try {
    const { toEmail, code, subject, purpose, organizationName, recipientName } = req.body;
    const orgName = organizationName || 'Univision Holdings Limited';
    const officerName = recipientName || 'Authorized Officer';
    const emailSubject = subject || `${orgName} - Verification Code: ${code}`;

    const transporter = getEmailTransporter();

    if (transporter) {
      const fromAddress = process.env.SMTP_FROM || `"Univision Security Gateway" <${process.env.SMTP_USER}>`;
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #93c5fd; font-weight: 700; margin-bottom: 6px;">
              ${orgName} · SECURE GATEWAY
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
              Corporate Identity Verification
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">
              Human Resources & Corporate Financial Accounts
            </p>
          </div>
          <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="margin-top: 0; font-size: 14px; color: #334155; line-height: 1.6;">
              Dear <strong>${officerName}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              A request was initiated to verify your corporate email address for ${purpose || 'enterprise portal access'}. Use the single-use authorization code below to complete authentication:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <div style="display: inline-block; background: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 18px 36px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a;">
                  ${code}
                </span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
                ⏱ Code expires in <strong>10 minutes</strong>. Single-use only.
              </p>
            </div>
            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; color: #1e40af; line-height: 1.5;">
                <strong>Security Notice:</strong> Univision executive officials and administrators will never request this verification code via phone, chat, or external email. Never share this code.
              </p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
              If you did not initiate this request, please report it immediately to your Corporate General Manager or IT Security Officer.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            © ${new Date().getFullYear()} ${orgName}. All rights reserved. Confidential Corporate Transmission.
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: emailSubject,
        text: `Your ${orgName} verification code is: ${code}. It expires in 10 minutes.`,
        html: htmlContent,
      });

      console.log(`[AUTH EMAIL DELIVERED] Successfully sent verification email to ${toEmail}`);
      res.json({
        success: true,
        delivered: true,
        message: `Verification code sent directly to ${toEmail}. Please check your inbox.`,
      });
    } else {
      console.log(`[AUTH EMAIL DISPATCH (SIMULATED)] Code ${code} dispatched to ${toEmail} for ${purpose || 'verification'} (${officerName})`);
      res.json({
        success: true,
        delivered: false,
        simulated: true,
        code,
        message: `Verification code dispatched to ${toEmail}. (Live SMTP not configured; configure SMTP_HOST & SMTP_USER in .env to deliver directly to external mailboxes)`,
      });
    }
  } catch (err: any) {
    console.error('Email dispatch error:', err);
    res.status(500).json({ error: err.message || 'Email dispatch failed' });
  }
});

// Helper to parse base64 data url
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  if (dataUrl.startsWith('data:')) {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return { mimeType: matches[1], data: matches[2] };
    }
  }
  // fallback assuming jpeg
  return { mimeType: 'image/jpeg', data: dataUrl };
}

// Endpoint to extract partner profile from ID Front, ID Back, and/or TIN Certificate
app.post('/api/extract-partner-profile', async (req, res) => {
  try {
    const { idFront, idBack, tinCertificate } = req.body;

    if (!idFront && !idBack && !tinCertificate) {
      res.status(400).json({
        error: 'At least one document image (ID Front, ID Back, or TIN Certificate) is required.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [
      {
        text: `You are an executive data extraction system strictly extracting information for a "Company Partner Profile" document.
CRITICAL INSTRUCTIONS:
1. Use ONLY the attached images provided:
   ${idFront ? '- Attached ID Front Image' : '- (ID Front Image was not attached)'}
   ${idBack ? '- Attached ID Back Image' : '- (ID Back Image was not attached)'}
   ${tinCertificate ? '- Attached TIN Certificate Image' : '- (TIN Certificate Image was not attached)'}
2. Do NOT hallucinate, infer, or assume ANY missing details.
3. Do NOT include placeholder fields like "[To be completed]".
4. Base the entire profile strictly on legible information extracted from the attached images.
5. If any information cannot be read or was not attached, set the value to null or empty string, and note: "Information could not be extracted from the image."
6. Fields to extract for Partner Identification (from ID Front and ID Back):
   - Full Name
   - ID Number
   - Date of Birth
   - Issue Date
   - Expiry Date
   - Nationality
   - Other visible details (e.g., Sex/Gender, Address, Place of Birth, Issuing Authority)
7. Fields to extract for Tax Information (from TIN Certificate):
   - TIN Number
   - Taxpayer Name
   - Tax Office
   - Registration Date
   - Other visible details (e.g., Tax Type, Status, Registered Address)
8. Provide all extracted values with 100% fidelity to what is legible in the images.`,
      },
    ];

    if (idFront) {
      const parsedFront = parseDataUrl(idFront);
      parts.push({
        inlineData: {
          mimeType: parsedFront.mimeType,
          data: parsedFront.data,
        },
      });
    }

    if (idBack) {
      const parsedBack = parseDataUrl(idBack);
      parts.push({
        inlineData: {
          mimeType: parsedBack.mimeType,
          data: parsedBack.data,
        },
      });
    }

    if (tinCertificate) {
      const parsedTin = parseDataUrl(tinCertificate);
      parts.push({
        inlineData: {
          mimeType: parsedTin.mimeType,
          data: parsedTin.data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts as any,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partnerIdentification: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING, description: 'Full name on ID, or null if not readable' },
                idNumber: { type: Type.STRING, description: 'Identification number, or null if not readable' },
                dateOfBirth: { type: Type.STRING, description: 'Date of birth, or null if not readable' },
                issueDate: { type: Type.STRING, description: 'Issue date, or null if not readable' },
                expiryDate: { type: Type.STRING, description: 'Expiry date, or null if not readable' },
                nationality: { type: Type.STRING, description: 'Nationality, or null if not readable' },
                otherDetails: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ['label', 'value'],
                  },
                  description: 'Any other visible details on ID Front or Back',
                },
                idExtractable: { type: Type.BOOLEAN, description: 'True if details were extracted, false if unreadable' },
                idExtractionNote: {
                  type: Type.STRING,
                  description: 'Write "Information could not be extracted from the image." if unreadable or failed, otherwise null',
                },
              },
              required: [
                'fullName',
                'idNumber',
                'dateOfBirth',
                'issueDate',
                'expiryDate',
                'nationality',
                'otherDetails',
                'idExtractable',
              ],
            },
            taxInformation: {
              type: Type.OBJECT,
              properties: {
                tinNumber: { type: Type.STRING, description: 'TIN number, or null if not readable' },
                taxpayerName: { type: Type.STRING, description: 'Taxpayer name, or null if not readable' },
                taxOffice: { type: Type.STRING, description: 'Tax office, or null if not readable' },
                registrationDate: { type: Type.STRING, description: 'Registration date, or null if not readable' },
                otherDetails: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ['label', 'value'],
                  },
                  description: 'Any other visible details on TIN Certificate',
                },
                tinExtractable: { type: Type.BOOLEAN, description: 'True if details were extracted, false if unreadable' },
                tinExtractionNote: {
                  type: Type.STRING,
                  description: 'Write "Information could not be extracted from the image." if unreadable or failed, otherwise null',
                },
              },
              required: [
                'tinNumber',
                'taxpayerName',
                'taxOffice',
                'registrationDate',
                'otherDetails',
                'tinExtractable',
              ],
            },
          },
          required: ['partnerIdentification', 'taxInformation'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error extracting partner profile:', err);
    res.status(500).json({
      error: err?.message || 'Failed to extract profile from images.',
    });
  }
});

// Single Document AI Scanner & Formatting Inspector Endpoint
app.post('/api/scan-document', async (req, res) => {
  try {
    const { image, documentType } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image data is required for document scan.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parsedImage = parseDataUrl(image);

    const docTypeHint =
      documentType === 'tinCertificate'
        ? 'TIN Certificate document'
        : documentType === 'idBack'
        ? 'ID Card Back document'
        : documentType === 'idFront'
        ? 'ID Card Front or Passport Bio-Page'
        : 'Identity or Tax registration document';

    const promptText = `You are a high-precision document scanner, OCR system, and document layout formatting expert.
Analyze this attached image (${docTypeHint}).

TASK:
1. Accurately identify the exact document type and title (e.g., ECOWAS National Biometric ID Card, US Passport Bio-Page, The Gambia Revenue Authority TIN Certificate).
2. Read and extract all visible text and fields strictly from the document with zero hallucination.
3. Inspect document orientation and formatting:
   - Check if the text is upright or sideways/upside-down (suggested rotation in degrees: 0, 90, 180, or 270).
   - Determine the standard aspect ratio preset:
     * 'id': Standard ID-1 identity card (85.6mm x 53.98mm, ratio ~1.58:1)
     * 'passport': Passport Bio-page ID-3 (ratio ~1.42:1)
     * 'cert': Landscape certificate format (e.g. GRA TIN Certificate, ratio ~1.47:1)
     * 'certPortrait': Portrait certificate / A4 letter format (ratio ~0.71:1 / 1:1.41)
     * 'free': Non-standard formatting
4. Evaluate visual quality (score 1-100, legibility, lighting, sharpness).
5. Extract key fields:
   - Full Name, ID / Passport Number, Dates (Birth, Issue, Expiry), Nationality, Sex, Authority.
   - TIN Number, Taxpayer Name, Tax Office, Registration Date, Status.
   - Any other visible labels and values into otherDetails.`;

    const contents = [
      { text: promptText },
      {
        inlineData: {
          mimeType: parsedImage.mimeType,
          data: parsedImage.data,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentClass: {
              type: Type.STRING,
              description: 'Class of document, e.g. national_id_front, national_id_back, passport_bio, tin_certificate, other',
            },
            documentTitle: {
              type: Type.STRING,
              description: 'Official descriptive title of document, e.g. ECOWAS Identity Card (Front), GRA Tax Identification Number Certificate',
            },
            suggestedRotation: {
              type: Type.INTEGER,
              description: 'Suggested clockwise degrees to make upright: 0, 90, 180, or 270',
            },
            recommendedAspectPreset: {
              type: Type.STRING,
              description: "Recommended format preset: 'id', 'passport', 'cert', 'certPortrait', or 'free'",
            },
            qualityAssessment: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER, description: 'Overall quality score from 1 to 100' },
                legibility: { type: Type.STRING, description: 'Legibility: Excellent, Good, Fair, or Poor' },
                lighting: { type: Type.STRING, description: 'Lighting: Even, Low light, Glare, or Balanced' },
                sharpness: { type: Type.STRING, description: 'Sharpness: Crisp/Sharp, Moderate, or Blurry' },
                notes: { type: Type.STRING, description: 'Brief observation on image quality' },
              },
              required: ['score', 'legibility', 'lighting', 'sharpness', 'notes'],
            },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING, description: 'Full Name on document, or null' },
                idNumber: { type: Type.STRING, description: 'Card or ID or Passport Number, or null' },
                dateOfBirth: { type: Type.STRING, description: 'Date of Birth, or null' },
                issueDate: { type: Type.STRING, description: 'Issue Date, or null' },
                expiryDate: { type: Type.STRING, description: 'Expiry Date, or null' },
                nationality: { type: Type.STRING, description: 'Nationality or Country, or null' },
                sex: { type: Type.STRING, description: 'Sex / Gender, or null' },
                tinNumber: { type: Type.STRING, description: 'Tax Identification Number, or null' },
                taxpayerName: { type: Type.STRING, description: 'Taxpayer / Entity Name, or null' },
                taxOffice: { type: Type.STRING, description: 'Tax Office, or null' },
                registrationDate: { type: Type.STRING, description: 'Registration Date, or null' },
                address: { type: Type.STRING, description: 'Address if visible, or null' },
                otherDetails: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ['label', 'value'],
                  },
                  description: 'Other visible fields and labels',
                },
              },
              required: ['otherDetails'],
            },
            summary: { type: Type.STRING, description: 'Brief summary of scanned findings' },
          },
          required: [
            'documentClass',
            'documentTitle',
            'suggestedRotation',
            'recommendedAspectPreset',
            'qualityAssessment',
            'extractedData',
            'summary',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error scanning document:', err);
    res.status(500).json({
      error: err?.message || 'Failed to scan document with AI.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
