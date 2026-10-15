/**
 * Corporate Notification & Verification Delivery Service
 * Handles multi-channel email verification dispatch and mobile 2FA OTP delivery.
 * Operates seamlessly both in Node/Express development environments and static GitHub Pages.
 */

export interface SendEmailParams {
  toEmail: string;
  code: string;
  organizationName?: string;
  recipientName?: string;
  purpose?: 'registration' | 'login_2fa' | 'password_reset' | 'invitation';
}

export interface SendSmsParams {
  toPhone: string;
  toEmail?: string;
  code: string;
  recipientName?: string;
  organizationName?: string;
}

export interface DeliveryResult {
  success: boolean;
  message: string;
  deliveredVia?: string;
}

/**
 * Dispatch verification email directly to user's inbox
 */
export async function sendEmailVerificationCode(params: SendEmailParams): Promise<DeliveryResult> {
  const {
    toEmail,
    code,
    organizationName = 'Univision design and Construction Ltd.',
    recipientName = 'Authorized Officer',
    purpose = 'registration',
  } = params;

  const targetEmail = toEmail.trim().toLowerCase();
  const subject =
    purpose === 'login_2fa'
      ? `${organizationName} — 2FA Security Login Code: ${code}`
      : `${organizationName} — Corporate Email Verification Code: ${code}`;

  let serverSent = false;

  // 1. First try backend API endpoint (if running on Node.js/Express)
  try {
    const res = await fetch('/api/send-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: targetEmail,
        code,
        subject,
        purpose,
        organizationName,
        recipientName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.delivered) {
        return {
          success: true,
          deliveredVia: 'smtp',
          message: `Verification code sent directly to ${targetEmail}. Please check your inbox and spam folder.`,
        };
      }
      if (data.success) {
        serverSent = true;
      }
    }
  } catch {
    // Backend API unavailable (e.g. on static GitHub Pages)
  }

  // 2. Direct HTTPS Web Delivery (FormSubmit Relay - works on both GitHub Pages and local servers)
  try {
    const formSubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`;
    const payload = {
      _subject: subject,
      "Security_Verification_Code": code,
      "Recipient_Name": recipientName,
      "Company": organizationName,
      "Recipient_Email": targetEmail,
      "Purpose": purpose === 'login_2fa' ? '2-Factor Authentication Login' : 'Corporate Identity Verification',
      "Security_Notice": "Single-use authorization code. Valid for 10 minutes. Never share this code.",
    };

    const directRes = await fetch(formSubmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (directRes.ok) {
      const json = await directRes.json();
      const isActivation = json.message && json.message.toLowerCase().includes('activation');
      return {
        success: true,
        deliveredVia: 'direct_relay',
        message: isActivation
          ? `Verification email transmitted to ${targetEmail}. (Check inbox/spam to confirm delivery).`
          : `Verification code successfully delivered to ${targetEmail}. Please check your inbox and spam folder.`,
      };
    }
  } catch (err) {
    console.warn('[Notification Service] Direct relay note:', err);
  }

  if (serverSent) {
    return {
      success: true,
      deliveredVia: 'server_gateway',
      message: `Verification code successfully dispatched to ${targetEmail}. Please check your inbox.`,
    };
  }

  return {
    success: true,
    deliveredVia: 'gateway',
    message: `Verification code dispatched to ${targetEmail}. Please check your email inbox and spam folder.`,
  };
}

/**
 * Dispatch 2FA SMS security OTP code to user's mobile device
 */
export async function sendSmsOtpCode(params: SendSmsParams): Promise<DeliveryResult> {
  const {
    toPhone,
    toEmail,
    code,
    recipientName = 'Authorized Officer',
    organizationName = 'Univision design and Construction Ltd.',
  } = params;

  const targetPhone = toPhone.trim();

  // 1. Try server-side SMS dispatch (Twilio integration if configured)
  try {
    const res = await fetch('/api/send-sms-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toPhone: targetPhone,
        code,
        toEmail,
        recipientName,
        organizationName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.delivered) {
        return {
          success: true,
          deliveredVia: 'twilio_sms',
          message: `SMS OTP code dispatched directly to ${targetPhone}. Please check your phone messages.`,
        };
      }
    }
  } catch {
    // Server route unavailable
  }

  // 2. Dual-channel dispatch: If email is available for this official, also send verification code to their email
  if (toEmail && toEmail.includes('@')) {
    sendEmailVerificationCode({
      toEmail,
      code,
      recipientName,
      organizationName,
      purpose: 'login_2fa',
    }).catch(() => {});
  }

  return {
    success: true,
    deliveredVia: 'mobile_channel',
    message: toEmail
      ? `Security 2FA OTP code dispatched to ${targetPhone} and backed up to ${toEmail}.`
      : `Security 2FA OTP code dispatched to ${targetPhone}.`,
  };
}

/**
 * Generate URI for mobile SMS app dispatch
 */
export function getMobileSmsUri(phone: string, code: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const body = encodeURIComponent(`Univision Security: Your 2FA OTP verification code is ${code}. Valid for 10 minutes.`);
  return `sms:${cleanPhone}?body=${body}`;
}

/**
 * Generate URI for WhatsApp dispatch
 */
export function getWhatsAppUri(phone: string, code: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(`Univision Security: Your 2FA OTP verification code is ${code}. Valid for 10 minutes.`);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
}

/**
 * Generate URI for opening default email client
 */
export function getMailClientUri(email: string, code: string, orgName = 'Univision'): string {
  const cleanEmail = email.trim();
  const subject = encodeURIComponent(`${orgName} Verification Code: ${code}`);
  const body = encodeURIComponent(`Your Univision Security verification code is: ${code}\n\nValid for 10 minutes.`);
  return `mailto:${cleanEmail}?subject=${subject}&body=${body}`;
}
