// High fidelity graphic rendering for the Gambia ECOWAS Cards, US Passport, and Gambia Revenue Authority TIN Certificates

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export function generateEcowasIdFront(data: {
  surname: string;
  firstnames: string;
  dob: string;
  issueDate: string;
  expiryDate: string;
  placeOfIssue: string;
  docNumber: string;
  sex: string;
  height: string;
  idNumber: string;
  nationality?: string;
  placeOfBirth?: string;
  serialNumber: string;
  nin?: string;
  hasPhoto?: boolean;
}): string {
  const surname = escapeXml(data.surname);
  const firstnames = escapeXml(data.firstnames);
  const dob = escapeXml(data.dob);
  const issueDate = escapeXml(data.issueDate);
  const expiryDate = escapeXml(data.expiryDate);
  const placeOfIssue = escapeXml(data.placeOfIssue);
  const docNumber = escapeXml(data.docNumber);
  const sex = escapeXml(data.sex);
  const height = escapeXml(data.height);
  const idNumber = escapeXml(data.idNumber);
  const nationality = escapeXml(data.nationality);
  const serialNumber = escapeXml(data.serialNumber);
  const nin = escapeXml(data.nin);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 580" width="920" height="580" style="font-family: Arial, Helvetica, sans-serif;">
    <defs>
      <!-- Ecowas subtle background pattern -->
      <pattern id="ecowasGuilloche" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 0 15 Q 15 0 30 15 T 60 15" fill="none" stroke="#86efac" stroke-width="0.7" opacity="0.35"/>
      </pattern>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ecfdf5"/>
        <stop offset="50%" stop-color="#e0f2fe"/>
        <stop offset="100%" stop-color="#dcfce7"/>
      </linearGradient>
    </defs>

    <!-- Card Base -->
    <rect width="920" height="580" rx="30" fill="url(#cardGrad)" stroke="#15803d" stroke-width="3"/>
    <rect width="920" height="580" rx="30" fill="url(#ecowasGuilloche)"/>

    <!-- ECOWAS Emblem & Header -->
    <g transform="translate(45, 30)">
      <circle cx="45" cy="45" r="42" fill="#ffffff" stroke="#16a34a" stroke-width="3"/>
      <circle cx="45" cy="45" r="34" fill="#15803d"/>
      <circle cx="45" cy="45" r="24" fill="#ffffff"/>
      <path d="M 36 28 Q 45 22 54 28 Q 58 45 52 56 Q 45 64 38 52 Z" fill="#eab308"/>
      <text x="45" y="80" fill="#15803d" font-size="9" font-weight="bold" text-anchor="middle">ECOWAS</text>

      <text x="110" y="38" fill="#166534" font-size="34" font-weight="900" letter-spacing="1">ECOWAS IDENTITY CARD</text>
      <text x="110" y="62" fill="#dc2626" font-size="14" font-weight="bold" letter-spacing="0.5">CARTE D&apos;IDENTITE CEDEAO / BILHETE DE IDENTIDADE CEDEAO</text>
    </g>

    <!-- The Gambia Flag -->
    <g transform="translate(775, 40)">
      <rect width="100" height="56" fill="#1e3a8a" rx="4"/>
      <rect y="0" width="100" height="18" fill="#dc2626" rx="4"/>
      <rect y="16" width="100" height="4" fill="#ffffff"/>
      <rect y="20" width="100" height="16" fill="#1d4ed8"/>
      <rect y="36" width="100" height="4" fill="#ffffff"/>
      <rect y="40" width="100" height="16" fill="#16a34a" rx="4"/>
      <rect width="100" height="56" fill="none" stroke="#94a3b8" stroke-width="1.5" rx="4"/>
    </g>

    <!-- Photo Container -->
    <g transform="translate(45, 140)">
      <rect width="210" height="260" rx="14" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
      <!-- Portrait silhouette / avatar -->
      <circle cx="105" cy="95" r="50" fill="#1e293b"/>
      <path d="M 40 240 C 40 165 170 165 170 240 Z" fill="#1e293b"/>
      <!-- Chip watermark badge -->
      <rect x="15" y="270" width="180" height="40" rx="6" fill="#0f172a"/>
      <text x="105" y="295" fill="#f8fafc" font-size="12" font-family="monospace" font-weight="bold" text-anchor="middle">
        BIOMETRIC SECURED
      </text>
    </g>

    <!-- Main Data Fields -->
    <g transform="translate(285, 135)" fill="#0f172a">
      <!-- Surname -->
      <text x="0" y="16" fill="#475569" font-size="12" font-weight="bold">Surname / Nom</text>
      <text x="0" y="44" fill="#0f172a" font-size="26" font-weight="900">${surname}</text>

      <!-- Firstnames -->
      <text x="0" y="75" fill="#475569" font-size="12" font-weight="bold">Firstnames / Pr&eacute;noms</text>
      <text x="0" y="103" fill="#0f172a" font-size="24" font-weight="900">${firstnames}</text>

      <!-- DOB -->
      <text x="0" y="134" fill="#475569" font-size="12" font-weight="bold">Date of Birth / Date de Naissance</text>
      <text x="0" y="160" fill="#0f172a" font-size="20" font-weight="bold">${dob}</text>

      ${nationality ? `
      <!-- Nationality -->
      <text x="260" y="134" fill="#475569" font-size="12" font-weight="bold">Nationality / Nationalit&eacute;</text>
      <text x="260" y="160" fill="#0f172a" font-size="19" font-weight="bold">${nationality}</text>
      ` : ''}

      <!-- Issue & Expiry Dates -->
      <text x="0" y="195" fill="#475569" font-size="12" font-weight="bold">Date of Issue / Date d&apos;&eacute;mission</text>
      <text x="0" y="220" fill="#0f172a" font-size="19" font-weight="bold">${issueDate}</text>

      <text x="260" y="195" fill="#475569" font-size="12" font-weight="bold">Date of Expiry / Date d&apos;expiration</text>
      <text x="260" y="220" fill="#b91c1c" font-size="19" font-weight="bold">${expiryDate}</text>

      <!-- Place of Issue & Sex/Height -->
      <text x="0" y="254" fill="#475569" font-size="12" font-weight="bold">Place of Issue / Lieu de d&eacute;livrance</text>
      <text x="0" y="280" fill="#0f172a" font-size="20" font-weight="900">${placeOfIssue}</text>

      <text x="260" y="254" fill="#475569" font-size="12" font-weight="bold">Sex / Sexe</text>
      <text x="260" y="280" fill="#0f172a" font-size="20" font-weight="bold">${sex}</text>

      <text x="360" y="254" fill="#475569" font-size="12" font-weight="bold">Height / Taille</text>
      <text x="360" y="280" fill="#0f172a" font-size="20" font-weight="bold">${height}</text>

      <!-- Document & ID / NIN Number -->
      <text x="0" y="316" fill="#475569" font-size="12" font-weight="bold">Document Number / Num&eacute;ro du document</text>
      <text x="0" y="342" fill="#0f172a" font-size="22" font-weight="900" font-family="monospace">${docNumber}</text>

      <text x="260" y="316" fill="#475569" font-size="12" font-weight="bold">${nin ? 'National ID Number (NIN)' : 'ID Number / Num&eacute;ro d&apos;identit&eacute;'}</text>
      <text x="260" y="342" fill="#1e3a8a" font-size="22" font-weight="900" font-family="monospace">${nin || idNumber}</text>
    </g>

    <!-- Holographic seal in center -->
    <g transform="translate(480, 220)" opacity="0.3">
      <polygon points="40,0 80,25 80,75 40,100 0,75 0,25" fill="#f59e0b" stroke="#d97706" stroke-width="3"/>
      <polygon points="40,20 60,35 60,65 40,80 20,65 20,35" fill="none" stroke="#d97706" stroke-width="2"/>
    </g>

    <!-- Bottom Signature & Serial Number -->
    <g transform="translate(285, 500)">
      <text x="0" y="20" fill="#64748b" font-size="12">Signature / Signature</text>
      <path d="M 0 50 Q 30 10 50 45 T 100 30 T 150 50" fill="none" stroke="#0f172a" stroke-width="2.5"/>
    </g>

    <text x="860" y="540" fill="#334155" font-size="28" font-family="monospace" font-weight="bold" text-anchor="end">
      ${serialNumber}
    </text>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateEcowasIdBack(data: {
  surname: string;
  firstnames: string;
  nationality: string;
  placeOfBirth: string;
  permanentAddress: string;
  occupation: string;
  cardNo: string;
  mrz1: string;
  mrz2: string;
  mrz3: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 580" width="920" height="580" style="font-family: Arial, Helvetica, sans-serif;">
    <defs>
      <linearGradient id="cardBackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0fdf4"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
    </defs>

    <rect width="920" height="580" rx="30" fill="url(#cardBackGrad)" stroke="#15803d" stroke-width="3"/>

    <!-- Top Flag & State Header -->
    <g transform="translate(60, 35)">
      <text x="250" y="32" fill="#166534" font-size="26" font-weight="900" letter-spacing="1">REPUBLIC OF THE GAMBIA</text>
    </g>

    <g transform="translate(775, 25)">
      <rect width="90" height="48" fill="#1e3a8a" rx="4"/>
      <rect y="0" width="90" height="15" fill="#dc2626" rx="4"/>
      <rect y="13" width="90" height="4" fill="#ffffff"/>
      <rect y="17" width="90" height="14" fill="#1d4ed8"/>
      <rect y="31" width="90" height="4" fill="#ffffff"/>
      <rect y="35" width="90" height="13" fill="#16a34a" rx="4"/>
      <rect width="90" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5" rx="4"/>
    </g>

    <!-- Side Serial Number (Vertical) -->
    <g transform="translate(40, 280) rotate(-90)">
      <text x="0" y="0" fill="#475569" font-size="22" font-family="monospace" font-weight="bold">${data.cardNo}</text>
    </g>

    <!-- Chip Module -->
    <g transform="translate(90, 145)">
      <rect width="130" height="100" rx="14" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
      <circle cx="65" cy="50" r="30" fill="none" stroke="#b45309" stroke-width="1.5"/>
      <rect x="25" y="20" width="80" height="60" fill="none" stroke="#b45309" stroke-width="1.5"/>
      <line x1="25" y1="50" x2="105" y2="50" stroke="#b45309" stroke-width="1.5"/>
    </g>

    <!-- Fields Details -->
    <g transform="translate(260, 95)">
      <!-- Nationality -->
      <text x="0" y="16" fill="#64748b" font-size="13" font-weight="bold">Nationality / Nationalité</text>
      <text x="0" y="44" fill="#0f172a" font-size="22" font-weight="900">${escapeXml(data.nationality)}</text>

      <!-- Place of birth -->
      <text x="0" y="85" fill="#64748b" font-size="13" font-weight="bold">Place of birth / Lieu de naissance</text>
      <text x="0" y="113" fill="#0f172a" font-size="22" font-weight="900">${escapeXml(data.placeOfBirth)}</text>

      <!-- Permanent Address -->
      <text x="0" y="155" fill="#64748b" font-size="13" font-weight="bold">Permanent Address / Domicile Permanent</text>
      <text x="0" y="183" fill="#0f172a" font-size="22" font-weight="900">${escapeXml(data.permanentAddress)}</text>

      <!-- Occupation -->
      <text x="0" y="225" fill="#64748b" font-size="13" font-weight="bold">Occupation / Profession</text>
      <text x="0" y="253" fill="#0f172a" font-size="22" font-weight="900">${escapeXml(data.occupation)}</text>
    </g>

    <!-- Issuing Authority & Signature -->
    <g transform="translate(580, 200)">
      <text x="0" y="16" fill="#475569" font-size="11" font-weight="bold">Signature de l'autorité / Issuing Authority</text>
      <path d="M 0 50 C 40 10 70 60 120 30 C 160 5 190 60 240 40" fill="none" stroke="#0f172a" stroke-width="3"/>
      <text x="0" y="90" fill="#0f172a" font-size="13" font-weight="900" letter-spacing="1">DIRECTOR GENERAL OF IMMIGRATION</text>
    </g>

    <!-- Machine Readable Zone (MRZ) -->
    <g transform="translate(50, 420)">
      <rect width="820" height="125" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      <text x="25" y="40" fill="#0f172a" font-size="22" font-family="monospace" font-weight="bold" letter-spacing="3.5">${escapeXml(data.mrz1)}</text>
      <text x="25" y="75" fill="#0f172a" font-size="22" font-family="monospace" font-weight="bold" letter-spacing="3.5">${escapeXml(data.mrz2)}</text>
      <text x="25" y="110" fill="#0f172a" font-size="22" font-family="monospace" font-weight="bold" letter-spacing="3.5">${escapeXml(data.mrz3)}</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateUSPassportBio(data: {
  passportNo: string;
  surname: string;
  givenNames: string;
  dob: string;
  sex: string;
  pob?: string;
  placeOfBirth?: string;
  nationality?: string;
  issueDate: string;
  expiryDate: string;
  authority?: string;
  signature?: string;
  mrz1?: string;
  mrz2?: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 620" width="920" height="620" style="font-family: Arial, Helvetica, sans-serif;">
    <defs>
      <linearGradient id="passBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#eff6ff"/>
        <stop offset="50%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#e0e7ff"/>
      </linearGradient>
    </defs>

    <rect width="920" height="620" rx="20" fill="url(#passBg)" stroke="#1e3a8a" stroke-width="3"/>

    <!-- Header bar -->
    <g transform="translate(60, 40)">
      <text x="0" y="24" fill="#1e3a8a" font-size="14" font-weight="bold">PASSPORT / PASSEPORT</text>
      <text x="260" y="32" fill="#1e3a8a" font-size="28" font-serif font-weight="900" letter-spacing="1">THE UNITED STATES OF AMERICA</text>
    </g>

    <!-- Top Info -->
    <g transform="translate(320, 95)" font-size="12">
      <text x="0" y="14" fill="#64748b">Type / Tipo</text>
      <text x="0" y="34" fill="#0f172a" font-size="16" font-weight="bold">P</text>

      <text x="120" y="14" fill="#64748b">Code</text>
      <text x="120" y="34" fill="#0f172a" font-size="16" font-weight="bold">USA</text>

      <text x="240" y="14" fill="#64748b">Passport No. / No. du Passeport</text>
      <text x="240" y="36" fill="#1e3a8a" font-size="24" font-weight="900" font-family="monospace">${data.passportNo}</text>
    </g>

    <!-- Photo -->
    <g transform="translate(60, 110)">
      <rect width="220" height="270" rx="8" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
      <circle cx="110" cy="100" r="50" fill="#334155"/>
      <path d="M 40 250 C 40 180 180 180 180 250 Z" fill="#334155"/>
      <text x="110" y="295" fill="#1e3a8a" font-size="16" font-weight="bold" text-anchor="middle">USA BEARER</text>
    </g>

    <!-- Great Seal Watermark -->
    <g transform="translate(620, 200)" opacity="0.18">
      <circle cx="80" cy="80" r="75" fill="none" stroke="#1e3a8a" stroke-width="4"/>
      <polygon points="80,20 100,60 140,65 110,95 120,135 80,115 40,135 50,95 20,65 60,60" fill="#1e3a8a"/>
    </g>

    <!-- Fields Details -->
    <g transform="translate(320, 160)" font-size="11">
      <text x="0" y="14" fill="#64748b">Surname / Nom</text>
      <text x="0" y="38" fill="#0f172a" font-size="22" font-weight="bold">${data.surname}</text>

      <text x="0" y="68" fill="#64748b">Given names / Prénoms</text>
      <text x="0" y="92" fill="#0f172a" font-size="20" font-weight="bold">${data.givenNames}</text>

      <text x="0" y="122" fill="#64748b">Nationality / Nationalité</text>
      <text x="0" y="146" fill="#0f172a" font-size="18" font-weight="bold">UNITED STATES OF AMERICA</text>

      <text x="0" y="176" fill="#64748b">Date of birth / Date de naissance</text>
      <text x="0" y="200" fill="#0f172a" font-size="18" font-weight="bold">${data.dob}</text>

      <text x="260" y="176" fill="#64748b">Sex / Sexe</text>
      <text x="260" y="200" fill="#0f172a" font-size="18" font-weight="bold">${data.sex}</text>

      <text x="0" y="230" fill="#64748b">Place of birth / Lieu de naissance</text>
      <text x="0" y="254" fill="#0f172a" font-size="18" font-weight="bold">${data.pob}</text>

      <text x="0" y="284" fill="#64748b">Date of issue</text>
      <text x="0" y="306" fill="#0f172a" font-size="17" font-weight="bold">${data.issueDate}</text>

      <text x="260" y="284" fill="#64748b">Date of expiration</text>
      <text x="260" y="306" fill="#b91c1c" font-size="17" font-weight="bold">${data.expiryDate}</text>

      <text x="0" y="336" fill="#64748b">Authority / Autorité</text>
      <text x="0" y="358" fill="#0f172a" font-size="15" font-weight="bold">${data.authority}</text>
    </g>

    <!-- MRZ -->
    <g transform="translate(45, 500)">
      <rect width="830" height="90" rx="8" fill="#0f172a"/>
      <text x="25" y="38" fill="#38bdf8" font-size="22" font-family="monospace" font-weight="bold" letter-spacing="4">P&lt;USACEESAY&lt;&lt;KITABU&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="25" y="72" fill="#38bdf8" font-size="22" font-family="monospace" font-weight="bold" letter-spacing="4">A270025354USA6502218M3307294450123553&lt;080974</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateUSPassportSignature(data: {
  signatureName: string;
  passportNo: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 620" width="920" height="620" style="font-family: Arial, Helvetica, sans-serif;">
    <rect width="920" height="620" rx="20" fill="#f8fafc" stroke="#1e3a8a" stroke-width="3"/>
    
    <g transform="translate(60, 50)">
      <text x="0" y="20" fill="#475569" font-size="14" font-weight="bold">Endorsements / Mentions Spéciales / Anotaciones</text>
      <text x="0" y="44" fill="#64748b" font-size="12">If your passport expires within six months of your date of departure, you may be denied entry.</text>
    </g>

    <!-- Top Watermark Eagle -->
    <g transform="translate(360, 150)" opacity="0.2">
      <circle cx="100" cy="100" r="90" fill="none" stroke="#1e3a8a" stroke-width="4"/>
    </g>

    <!-- Bearer Photo Thumbnail & Signature Area -->
    <g transform="translate(60, 240)">
      <rect width="180" height="220" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="90" cy="80" r="40" fill="#475569"/>
      <path d="M 30 200 C 30 140 150 140 150 200 Z" fill="#475569"/>

      <!-- Signature block -->
      <g transform="translate(240, 60)">
        <text x="0" y="80" fill="#1e3a8a" font-size="44" font-style="italic" font-family="'Brush Script MT', cursive, sans-serif">${escapeXml(data.signatureName)}</text>
        <line x1="0" y1="100" x2="520" y2="100" stroke="#0f172a" stroke-width="2"/>
        <text x="0" y="125" fill="#475569" font-size="13" font-weight="bold" letter-spacing="1">SIGNATURE OF BEARER / SIGNATURE DU TITULAIRE</text>
      </g>
    </g>

    <text x="850" y="100" fill="#94a3b8" font-size="28" font-family="monospace" font-weight="bold" text-anchor="end">${escapeXml(data.passportNo)}</text>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateGambiaTinCertificate(data: {
  tin: string;
  name: string;
  issueOffice: string;
  birthDate: string;
  physicalAddress: string;
  issueDate: string;
  statutoryNote?: string;
}): string {
  const tin = escapeXml(data.tin);
  const name = escapeXml(data.name);
  const issueOffice = escapeXml(data.issueOffice);
  const birthDate = escapeXml(data.birthDate);
  const physicalAddress = escapeXml(data.physicalAddress);
  const issueDate = escapeXml(data.issueDate);
  const note = escapeXml(
    data.statutoryNote ||
      'The certificate is issued pursuant to Part VII Section 221 (3) & 222 (2) of the Income & VAT Act No, 2012 (as amended)'
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 640" width="940" height="640" style="font-family: Arial, Helvetica, -apple-system, sans-serif;">
    <defs>
      <!-- Security Guilloche background pattern -->
      <pattern id="tinGuilloche" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 0 20 Q 20 0 40 20 T 80 20" fill="none" stroke="#e2e8f0" stroke-width="0.8" opacity="0.6"/>
        <circle cx="20" cy="20" r="14" fill="none" stroke="#f1f5f9" stroke-width="0.5"/>
      </pattern>
      <!-- Subtle parchment gradient -->
      <linearGradient id="certGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </linearGradient>
    </defs>

    <!-- Certificate Base -->
    <rect width="940" height="640" fill="url(#certGrad)"/>
    <rect width="940" height="640" fill="url(#tinGuilloche)"/>

    <!-- Double Security Frame with Corner Ornaments -->
    <rect x="18" y="18" width="904" height="604" fill="none" stroke="#0f172a" stroke-width="3"/>
    <rect x="25" y="25" width="890" height="590" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="8,4"/>
    <rect x="29" y="29" width="882" height="582" fill="none" stroke="#1e3a8a" stroke-width="1.5"/>

    <!-- Corner Brackets -->
    <path d="M 20 40 L 40 20 M 20 45 L 45 20 M 920 40 L 900 20 M 920 45 L 895 20 M 20 600 L 40 620 M 20 595 L 45 620 M 920 600 L 900 620 M 920 595 L 895 620" stroke="#0f172a" stroke-width="1.5"/>

    <!-- Top Emblem & Authority Header -->
    <g transform="translate(55, 42)">
      <!-- GRA Hexagonal Emblem -->
      <polygon points="45,8 82,26 82,66 45,84 8,66 8,26" fill="#0f172a" stroke="#1e3a8a" stroke-width="2"/>
      <polygon points="45,14 76,29 76,63 45,78 14,63 14,29" fill="#f8fafc"/>
      <polygon points="45,20 70,32 70,60 45,72 20,60 20,32" fill="#0f172a"/>
      <text x="45" y="52" fill="#ffffff" font-size="16" font-weight="900" text-anchor="middle" letter-spacing="1">GRA</text>
      <text x="45" y="100" fill="#0f172a" font-size="8.5" font-weight="bold" text-anchor="middle" letter-spacing="0.5">GAMBIA REVENUE AUTHORITY</text>

      <!-- Center Certificate Header -->
      <text x="430" y="24" fill="#64748b" font-size="13" font-weight="bold" letter-spacing="2" text-anchor="middle">REPUBLIC OF THE GAMBIA</text>
      <text x="430" y="54" fill="#0f172a" font-size="28" font-weight="900" letter-spacing="1.5" text-anchor="middle">GAMBIA REVENUE AUTHORITY</text>
      <text x="430" y="78" fill="#1e3a8a" font-size="13" font-weight="bold" letter-spacing="1.5" text-anchor="middle">DOMESTIC TAXES DEPARTMENT</text>
      
      <!-- Certificate Title Banner -->
      <rect x="130" y="94" width="600" height="34" rx="4" fill="#0f172a"/>
      <text x="430" y="117" fill="#ffffff" font-size="16" font-weight="bold" letter-spacing="1.5" text-anchor="middle">
        TAXPAYER IDENTIFICATION NUMBER (TIN) CERTIFICATE
      </text>

      <!-- Barcode simulation top right -->
      <g transform="translate(680, 5)">
        <rect width="130" height="28" fill="#ffffff" stroke="#cbd5e1" rx="3"/>
        <!-- Simulated Barcode bars -->
        <rect x="10" y="5" width="2" height="18" fill="#0f172a"/>
        <rect x="15" y="5" width="4" height="18" fill="#0f172a"/>
        <rect x="22" y="5" width="1" height="18" fill="#0f172a"/>
        <rect x="26" y="5" width="3" height="18" fill="#0f172a"/>
        <rect x="32" y="5" width="2" height="18" fill="#0f172a"/>
        <rect x="37" y="5" width="5" height="18" fill="#0f172a"/>
        <rect x="45" y="5" width="1" height="18" fill="#0f172a"/>
        <rect x="49" y="5" width="3" height="18" fill="#0f172a"/>
        <rect x="55" y="5" width="2" height="18" fill="#0f172a"/>
        <rect x="60" y="5" width="4" height="18" fill="#0f172a"/>
        <rect x="67" y="5" width="1" height="18" fill="#0f172a"/>
        <rect x="71" y="5" width="3" height="18" fill="#0f172a"/>
        <rect x="77" y="5" width="4" height="18" fill="#0f172a"/>
        <rect x="84" y="5" width="2" height="18" fill="#0f172a"/>
        <rect x="89" y="5" width="3" height="18" fill="#0f172a"/>
        <rect x="95" y="5" width="1" height="18" fill="#0f172a"/>
        <rect x="99" y="5" width="4" height="18" fill="#0f172a"/>
        <rect x="106" y="5" width="2" height="18" fill="#0f172a"/>
        <rect x="111" y="5" width="3" height="18" fill="#0f172a"/>
        <rect x="117" y="5" width="2" height="18" fill="#0f172a"/>
        <text x="65" y="44" fill="#64748b" font-size="10" font-family="monospace" text-anchor="middle">REF: ${tin}</text>
      </g>
    </g>

    <!-- Certificate Details Table Box -->
    <g transform="translate(65, 195)">
      <rect width="810" height="235" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
      
      <!-- Row 1: Issue Office & TIN Number -->
      <line x1="0" y1="52" x2="810" y2="52" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="430" y1="0" x2="430" y2="52" stroke="#e2e8f0" stroke-width="1.5"/>

      <!-- Issue Office -->
      <text x="25" y="32" fill="#475569" font-size="13" font-weight="bold">ISSUE OFFICE:</text>
      <text x="145" y="32" fill="#0f172a" font-size="17" font-weight="900" letter-spacing="0.5">${issueOffice}</text>

      <!-- TIN Number Box -->
      <rect x="430" y="0" width="380" height="52" fill="#f8fafc" rx="0"/>
      <text x="455" y="33" fill="#475569" font-size="13" font-weight="bold">TIN NUMBER:</text>
      <text x="575" y="34" fill="#1e3a8a" font-size="22" font-weight="900" font-family="monospace" letter-spacing="1.5">${tin}</text>

      <!-- Row 2: Name -->
      <line x1="0" y1="102" x2="810" y2="102" stroke="#e2e8f0" stroke-width="1.5"/>
      <text x="25" y="80" fill="#475569" font-size="13" font-weight="bold">TAXPAYER NAME:</text>
      <text x="175" y="81" fill="#0f172a" font-size="18" font-weight="900">${name}</text>

      <!-- Row 3: Trading Name & Birth Date -->
      <line x1="0" y1="152" x2="810" y2="152" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="430" y1="102" x2="430" y2="152" stroke="#e2e8f0" stroke-width="1.5"/>

      <text x="25" y="130" fill="#475569" font-size="13" font-weight="bold">TRADING NAME:</text>
      <text x="175" y="130" fill="#64748b" font-size="14" font-style="italic">&mdash; NONE &mdash;</text>

      <text x="455" y="130" fill="#475569" font-size="13" font-weight="bold">BIRTH DATE:</text>
      <text x="560" y="130" fill="#0f172a" font-size="15" font-weight="bold">${birthDate}</text>

      <!-- Row 4: Physical Address -->
      <text x="25" y="185" fill="#475569" font-size="13" font-weight="bold">PHYSICAL ADDRESS:</text>
      <text x="175" y="185" fill="#0f172a" font-size="16" font-weight="bold">${physicalAddress}</text>

      <!-- Row 5: Registration / Issue Date -->
      <line x1="0" y1="200" x2="810" y2="200" stroke="#e2e8f0" stroke-width="1"/>
      <text x="25" y="222" fill="#64748b" font-size="12" font-weight="bold">REGISTRATION DATE:</text>
      <text x="175" y="222" fill="#0f172a" font-size="13" font-weight="bold">${issueDate}</text>
    </g>

    <!-- Statutory Legal Citation Box -->
    <g transform="translate(65, 445)">
      <rect width="810" height="38" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
      <text x="20" y="24" fill="#1e293b" font-size="11.5" font-weight="bold">
        ${note}
      </text>
    </g>

    <!-- Commissioner Stamp & Endorsement Area -->
    <g transform="translate(180, 502)">
      <!-- Official Blue Stamp -->
      <circle cx="85" cy="42" r="38" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="6,3"/>
      <circle cx="85" cy="42" r="32" fill="none" stroke="#1d4ed8" stroke-width="1"/>
      <text x="85" y="32" fill="#1d4ed8" font-size="7.5" font-weight="bold" text-anchor="middle" letter-spacing="0.5">REGISTRATION OFFICE</text>
      <text x="85" y="44" fill="#1d4ed8" font-size="7" font-weight="bold" text-anchor="middle">DOMESTIC TAXES</text>
      <text x="85" y="55" fill="#1d4ed8" font-size="6.5" font-weight="bold" text-anchor="middle">${issueOffice}</text>

      <!-- Commissioner General Signature -->
      <path d="M 40 40 Q 75 10 100 45 T 150 25 T 180 40" fill="none" stroke="#0f172a" stroke-width="2.5"/>
      <line x1="25" y1="68" x2="210" y2="68" stroke="#64748b" stroke-width="1"/>
      <text x="115" y="82" fill="#0f172a" font-size="12" font-weight="bold" text-anchor="middle">COMMISSIONER GENERAL</text>
    </g>

    <!-- Issue Date on Right -->
    <g transform="translate(640, 532)">
      <text x="0" y="16" fill="#475569" font-size="13" font-weight="bold">DATE OF ISSUE:</text>
      <text x="120" y="16" fill="#0f172a" font-size="15" font-weight="900">${issueDate}</text>
      <line x1="0" y1="28" x2="210" y2="28" stroke="#cbd5e1" stroke-width="1"/>
    </g>

    <!-- Mandatory Statutory Clearance Warning Footer -->
    <g transform="translate(65, 604)">
      <rect width="810" height="24" rx="3" fill="#fee2e2" stroke="#fca5a5" stroke-width="1"/>
      <text x="405" y="16" fill="#991b1b" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="0.5">
        NOTE: THIS CERTIFICATE IS NOT A TAX CLEARANCE CERTIFICATE
      </text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateSubcontractAgreementPreview(data: {
  contractorName: string;
  vendorCode: string;
  scopeOfWork: string;
  issueDate: string;
  contractValue: string;
  whtRate?: string;
}): string {
  const contractor = escapeXml(data.contractorName);
  const vendorCode = escapeXml(data.vendorCode);
  const scope = escapeXml(data.scopeOfWork);
  const issueDate = escapeXml(data.issueDate);
  const value = escapeXml(data.contractValue);
  const wht = escapeXml(data.whtRate || '10%');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 640" width="940" height="640" style="font-family: Arial, Helvetica, sans-serif;">
    <rect width="940" height="640" fill="#ffffff"/>
    <rect x="20" y="20" width="900" height="600" fill="none" stroke="#0f172a" stroke-width="2"/>
    <rect x="26" y="26" width="888" height="588" fill="none" stroke="#94a3b8" stroke-width="1"/>
    
    <!-- Header -->
    <g transform="translate(50, 45)">
      <rect x="0" y="0" width="840" height="70" fill="#0f172a" rx="4"/>
      <text x="420" y="30" fill="#ffffff" font-size="18" font-weight="900" letter-spacing="1.5" text-anchor="middle">APEX INFRASTRUCTURE &amp; ENTERPRISE GROUP</text>
      <text x="420" y="52" fill="#93c5fd" font-size="12" font-weight="bold" letter-spacing="1" text-anchor="middle">OFFICIAL SUBCONTRACT SERVICE AGREEMENT &amp; COMPLIANCE SCHEDULE</text>
    </g>

    <!-- Ref & Vendor Bar -->
    <g transform="translate(50, 130)">
      <rect width="840" height="34" fill="#f8fafc" stroke="#e2e8f0" rx="3"/>
      <text x="15" y="22" fill="#475569" font-size="12" font-weight="bold">VENDOR CODE: <tspan fill="#1e3a8a" font-weight="900">${vendorCode}</tspan></text>
      <text x="500" y="22" fill="#475569" font-size="12" font-weight="bold">CONTRACT EFFECTIVE DATE: <tspan fill="#0f172a" font-weight="900">${issueDate}</tspan></text>
    </g>

    <!-- Table of Details -->
    <g transform="translate(50, 180)">
      <rect width="840" height="230" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <line x1="0" y1="46" x2="840" y2="46" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="92" x2="840" y2="92" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="138" x2="840" y2="138" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="184" x2="840" y2="184" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="240" y1="0" x2="240" y2="230" stroke="#e2e8f0" stroke-width="1.5"/>

      <!-- Row 1 -->
      <text x="20" y="28" fill="#475569" font-size="12" font-weight="bold">SUBCONTRACTOR ENTITY:</text>
      <text x="260" y="28" fill="#0f172a" font-size="14" font-weight="900">${contractor}</text>

      <!-- Row 2 -->
      <text x="20" y="74" fill="#475569" font-size="12" font-weight="bold">SCOPE OF ENGAGEMENT:</text>
      <text x="260" y="74" fill="#0f172a" font-size="13" font-weight="bold">${scope}</text>

      <!-- Row 3 -->
      <text x="20" y="120" fill="#475569" font-size="12" font-weight="bold">COMMITTED VALUE / RATE:</text>
      <text x="260" y="120" fill="#15803d" font-size="14" font-weight="900">${value}</text>

      <!-- Row 4 -->
      <text x="20" y="166" fill="#475569" font-size="12" font-weight="bold">TAX WITHHOLDING (WHT):</text>
      <text x="260" y="166" fill="#dc2626" font-size="13" font-weight="bold">${wht} Remitted directly to Domestic Revenue Authority</text>

      <!-- Row 5 -->
      <text x="20" y="210" fill="#475569" font-size="12" font-weight="bold">COMPLIANCE &amp; LIABILITY:</text>
      <text x="260" y="210" fill="#0f172a" font-size="12">Verified Trade License, GRA TIN Registration &amp; Site HSE Protocol</text>
    </g>

    <!-- Signatures -->
    <g transform="translate(50, 440)">
      <!-- HR / Operations Side -->
      <g transform="translate(40, 0)">
        <text x="0" y="20" fill="#64748b" font-size="11" font-weight="bold">FOR APEX CORPORATE OPERATIONS:</text>
        <path d="M 0 55 Q 40 25 80 50 T 160 40" fill="none" stroke="#0f172a" stroke-width="2.5"/>
        <line x1="0" y1="75" x2="260" y2="75" stroke="#94a3b8" stroke-width="1"/>
        <text x="0" y="94" fill="#0f172a" font-size="12" font-weight="900">Managing Director / Project Lead</text>
      </g>

      <!-- Accounts Controller Side -->
      <g transform="translate(480, 0)">
        <text x="0" y="20" fill="#64748b" font-size="11" font-weight="bold">FOR ACCOUNTS &amp; FINANCE CONTROLLER:</text>
        <path d="M 0 55 Q 30 15 70 50 T 140 35" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>
        <line x1="0" y1="75" x2="260" y2="75" stroke="#94a3b8" stroke-width="1"/>
        <text x="0" y="94" fill="#0f172a" font-size="12" font-weight="900">Chief Financial Controller &amp; Tax Lead</text>
      </g>
    </g>

    <!-- Red Official Seal -->
    <g transform="translate(730, 490)">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#b91c1c" stroke-width="2" stroke-dasharray="5,3"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#dc2626" stroke-width="1.5"/>
      <text x="50" y="44" fill="#dc2626" font-size="8" font-weight="bold" text-anchor="middle">LEGAL &amp; ACCOUNTS</text>
      <text x="50" y="56" fill="#dc2626" font-size="9" font-weight="900" text-anchor="middle">CERTIFIED</text>
      <text x="50" y="68" fill="#dc2626" font-size="7.5" font-weight="bold" text-anchor="middle">CONTRACT</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateEmploymentContractPreview(data: {
  employeeName: string;
  staffId: string;
  designation: string;
  department: string;
  hireDate: string;
}): string {
  const name = escapeXml(data.employeeName);
  const staffId = escapeXml(data.staffId);
  const designation = escapeXml(data.designation);
  const dept = escapeXml(data.department);
  const hireDate = escapeXml(data.hireDate);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 640" width="940" height="640" style="font-family: Arial, Helvetica, sans-serif;">
    <rect width="940" height="640" fill="#ffffff"/>
    <rect x="20" y="20" width="900" height="600" fill="none" stroke="#0f172a" stroke-width="2"/>
    <rect x="26" y="26" width="888" height="588" fill="none" stroke="#94a3b8" stroke-width="1"/>

    <!-- Header -->
    <g transform="translate(50, 45)">
      <rect x="0" y="0" width="840" height="70" fill="#0f172a" rx="4"/>
      <text x="420" y="30" fill="#ffffff" font-size="18" font-weight="900" letter-spacing="1.5" text-anchor="middle">APEX INFRASTRUCTURE &amp; ENTERPRISE GROUP</text>
      <text x="420" y="52" fill="#86efac" font-size="12" font-weight="bold" letter-spacing="1" text-anchor="middle">HUMAN RESOURCES DEPARTMENT · OFFICIAL APPOINTMENT CERTIFICATE</text>
    </g>

    <g transform="translate(50, 130)">
      <rect width="840" height="34" fill="#f8fafc" stroke="#e2e8f0" rx="3"/>
      <text x="15" y="22" fill="#475569" font-size="12" font-weight="bold">STAFF ID: <tspan fill="#1e3a8a" font-weight="900">${staffId}</tspan></text>
      <text x="500" y="22" fill="#475569" font-size="12" font-weight="bold">DATE OF ENGAGEMENT: <tspan fill="#0f172a" font-weight="900">${hireDate}</tspan></text>
    </g>

    <g transform="translate(50, 180)">
      <rect width="840" height="230" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <line x1="0" y1="46" x2="840" y2="46" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="92" x2="840" y2="92" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="138" x2="840" y2="138" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="184" x2="840" y2="184" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="240" y1="0" x2="240" y2="230" stroke="#e2e8f0" stroke-width="1.5"/>

      <text x="20" y="28" fill="#475569" font-size="12" font-weight="bold">EMPLOYEE FULL NAME:</text>
      <text x="260" y="28" fill="#0f172a" font-size="14" font-weight="900">${name}</text>

      <text x="20" y="74" fill="#475569" font-size="12" font-weight="bold">OFFICIAL DESIGNATION:</text>
      <text x="260" y="74" fill="#0f172a" font-size="13" font-weight="bold">${designation}</text>

      <text x="20" y="120" fill="#475569" font-size="12" font-weight="bold">DEPARTMENT / UNIT:</text>
      <text x="260" y="120" fill="#1e3a8a" font-size="14" font-weight="900">${dept}</text>

      <text x="20" y="166" fill="#475569" font-size="12" font-weight="bold">STATUTORY BENEFITS:</text>
      <text x="260" y="166" fill="#15803d" font-size="13" font-weight="bold">Social Security, National Pension Fund, Corporate Health Cover, PAYE Remitted</text>

      <text x="20" y="210" fill="#475569" font-size="12" font-weight="bold">HR CLEARANCE STATUS:</text>
      <text x="260" y="210" fill="#0f172a" font-size="12">Verified Identity, Background Check Cleared, Signed Code of Conduct</text>
    </g>

    <g transform="translate(50, 440)">
      <g transform="translate(40, 0)">
        <text x="0" y="20" fill="#64748b" font-size="11" font-weight="bold">EMPLOYEE SIGNATURE &amp; ACCEPTANCE:</text>
        <path d="M 0 55 Q 30 15 70 50 T 140 40" fill="none" stroke="#0f172a" stroke-width="2.5"/>
        <line x1="0" y1="75" x2="260" y2="75" stroke="#94a3b8" stroke-width="1"/>
        <text x="0" y="94" fill="#0f172a" font-size="12" font-weight="900">${name}</text>
      </g>

      <g transform="translate(480, 0)">
        <text x="0" y="20" fill="#64748b" font-size="11" font-weight="bold">HEAD OF HUMAN RESOURCES &amp; PEOPLE:</text>
        <path d="M 0 55 Q 40 25 80 50 T 160 35" fill="none" stroke="#15803d" stroke-width="2.5"/>
        <line x1="0" y1="75" x2="260" y2="75" stroke="#94a3b8" stroke-width="1"/>
        <text x="0" y="94" fill="#0f172a" font-size="12" font-weight="900">Head of People &amp; Corporate Culture</text>
      </g>
    </g>

    <g transform="translate(730, 490)">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#15803d" stroke-width="2" stroke-dasharray="5,3"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#16a34a" stroke-width="1.5"/>
      <text x="50" y="44" fill="#15803d" font-size="8" font-weight="bold" text-anchor="middle">HUMAN RESOURCES</text>
      <text x="50" y="56" fill="#15803d" font-size="9" font-weight="900" text-anchor="middle">VERIFIED</text>
      <text x="50" y="68" fill="#15803d" font-size="7.5" font-weight="bold" text-anchor="middle">PERSONNEL</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

export function generateBankVerificationSlip(data: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  currency: string;
}): string {
  const bank = escapeXml(data.bankName);
  const accName = escapeXml(data.accountName);
  const accNum = escapeXml(data.accountNumber);
  const branch = escapeXml(data.branch);
  const cur = escapeXml(data.currency);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 940 500" width="940" height="500" style="font-family: Arial, Helvetica, sans-serif;">
    <rect width="940" height="500" fill="#f8fafc"/>
    <rect x="20" y="20" width="900" height="460" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="2.5"/>
    
    <g transform="translate(50, 40)">
      <rect width="840" height="50" rx="4" fill="#0369a1"/>
      <text x="420" y="32" fill="#ffffff" font-size="16" font-weight="900" letter-spacing="1" text-anchor="middle">OFFICIAL BANK REMITTANCE &amp; DISBURSEMENT MANDATE</text>
    </g>

    <g transform="translate(50, 110)">
      <rect width="840" height="220" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
      <line x1="0" y1="55" x2="840" y2="55" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="110" x2="840" y2="110" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="0" y1="165" x2="840" y2="165" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="220" y1="0" x2="220" y2="220" stroke="#e2e8f0" stroke-width="1.5"/>

      <text x="20" y="34" fill="#64748b" font-size="12" font-weight="bold">DEPOSITORY INSTITUTION:</text>
      <text x="240" y="34" fill="#0f172a" font-size="16" font-weight="900">${bank}</text>

      <text x="20" y="89" fill="#64748b" font-size="12" font-weight="bold">ACCOUNT TITLE / BENEFICIARY:</text>
      <text x="240" y="89" fill="#0f172a" font-size="15" font-weight="bold">${accName}</text>

      <text x="20" y="144" fill="#64748b" font-size="12" font-weight="bold">ACCOUNT NUMBER / IBAN:</text>
      <text x="240" y="144" fill="#0369a1" font-size="20" font-weight="900" font-family="monospace">${accNum}</text>

      <text x="20" y="198" fill="#64748b" font-size="12" font-weight="bold">BRANCH &amp; CURRENCY:</text>
      <text x="240" y="198" fill="#0f172a" font-size="13" font-weight="bold">${branch} · <tspan fill="#16a34a">${cur}</tspan></text>
    </g>

    <g transform="translate(50, 360)">
      <rect width="840" height="80" rx="4" fill="#f0f9ff" stroke="#bae6fd"/>
      <text x="25" y="30" fill="#0369a1" font-size="12" font-weight="bold">ACCOUNTS &amp; DISBURSEMENT MANDATE:</text>
      <text x="25" y="52" fill="#334155" font-size="12">Verified with attached voided cheque/bank letter. Authorized for Electronic Direct Deposit &amp; Payroll ACH.</text>
      <circle cx="780" cy="40" r="30" fill="#0284c7" opacity="0.15"/>
      <text x="780" y="44" fill="#0369a1" font-size="10" font-weight="bold" text-anchor="middle">VERIFIED</text>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}

