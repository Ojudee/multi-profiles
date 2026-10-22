# Univision Design and Construction Ltd. — HR & Accounts Portal

A multi-organizational enterprise Human Resources (HR) and Corporate Accounts portal for Univision Design and Construction Ltd. Built with React 19, TypeScript, Vite, and Tailwind CSS.

## 🌟 Key Capabilities

1. **Multi-Organizational Gateway & Access Control**:
   - Streamlined authentication with corporate email and password.
   - Separation of duty between Organization Administrator, Human Resources (HR), and Finance & Accounts Directorates.
   - 3-attempt brute-force protection with automated 1-hour security lockout timer.

2. **Staff Credentials & Corporate Dossier Inventory**:
   - Biometric Gambian & ECOWAS Identity Documents (ISO/IEC 7810 ID-1 standard: 85.60 × 53.98 mm).
   - Official Gambia Revenue Authority (GRA) Taxpayer Identification (TIN) Registration Certificates (Half-A4 scale: 210 × 148.5 mm).
   - High-fidelity print preview and pixel-perfect vector A4 print-out PDF exports.
   - Smart aspect ratio fitting (`object-fit: contain`) preventing clipping of document signatures, seals, or card numbers.

3. **Finance & Accounts Directorate**:
   - Bank remittance schedules (Trust Bank Gambia, GTBank, Ecobank, Bloom Bank, etc.).
   - Statutory PAYE tax tracking and Gambian GRA Withholding Tax (WHT) calculations.
   - Subcontractor milestone payment schedules with advance payment and retention holdback management.

4. **Human Resources & Compliance**:
   - Official audit trail logging all actions, security events, and profile updates.
   - Workspace invitations with role-based permission delegation.

---

## 🚀 GitHub Pages Deployment (Main Branch)

This repository is configured to deploy directly on the `main` branch:

- **Origin URL**: `https://github.com/Ojudee/multi-invoice.git`
- **Live URL**: `https://ojudee.github.io/multi-invoice/`

### Supported Deployment Modes:
1. **GitHub Pages (Source: Deploy from a branch)**:
   - Branch: `main`
   - Folder: `/docs` (pre-built production bundle in `docs/`) OR `/ (root)` (root redirect & assets)
2. **GitHub Actions**:
   - Pre-configured `.github/workflows/deploy.yml` automatically builds and deploys `./dist` to GitHub Pages.

### One-Click Command Line Deploy:
```bash
./publish.sh https://<YOUR_GITHUB_TOKEN>@github.com/Ojudee/multi-invoice.git
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Run TypeScript validation
npm run lint

# Build static production bundle
npm run build
```

---

## 🏢 Univision Design and Construction Ltd.
- **Location**: Sukuta-Jabang Highway, Sukuta Dalaba, The Gambia
- **Phone**: +220 872104724 / +220 7821044
- **Email**: univision0111@gmail.com
- **Slogan**: *Quality Designs. Accurate Solutions. Smarter Construction.*
