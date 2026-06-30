export interface IndustryTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  accent: string;
  text: string;
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'healthcare',
    name: 'Healthcare SaaS',
    icon: '🏥',
    description: 'Patient management, EHR, HIPAA compliance',
    accent: 'border-red-200 bg-red-50 hover:border-red-400',
    text: `Healthcare Patient Management System

Overview:
Build a HIPAA-compliant web application for managing patient records, appointments, and telehealth consultations for a mid-size clinic network.

Core Features:
1. Patient Registration & Profile Management
   - Secure patient onboarding with identity verification
   - Medical history upload (PDF, images)
   - Insurance information management
   - Emergency contacts and primary care physician

2. Appointment Scheduling
   - Real-time availability calendar for multiple providers
   - Automated reminders (SMS, email, push)
   - Cancellation and rescheduling workflows
   - Waitlist management

3. Telehealth Module
   - HIPAA-compliant video consultations
   - Secure messaging between patients and providers
   - E-prescription workflow
   - Session notes with structured templates

4. Electronic Health Records (EHR)
   - Structured clinical notes (SOAP format)
   - Lab results and imaging viewer (DICOM support)
   - Medication tracking and allergy history
   - ICD-10 diagnosis coding

5. Billing & Insurance
   - Insurance eligibility verification API
   - Claims submission (HL7 FHIR standard)
   - Patient payment portal (co-pay, balance)
   - Revenue cycle reporting dashboard

Non-Functional Requirements:
- HIPAA compliance mandatory (BAA with vendors)
- 99.9% uptime SLA with disaster recovery
- AES-256 encryption at rest and in transit
- Full audit logs for all PHI access
- Multi-factor authentication (MFA) required
- Role-based access: Admin, Doctor, Nurse, Receptionist, Patient
- Mobile responsive web + native iOS/Android app

Compliance: HIPAA, HL7 FHIR R4, WCAG 2.1 AA

Integrations:
- Epic/Cerner EHR via FHIR API
- Stripe for patient payments
- Twilio for SMS/Video
- AWS S3 with server-side encryption for documents`,
  },
  {
    id: 'fintech',
    name: 'Fintech Platform',
    icon: '💳',
    description: 'Digital banking, payments, KYC/AML',
    accent: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400',
    text: `Digital Banking Platform Requirements

Overview:
Build a modern neobank platform with multi-currency accounts, payment processing, investment tracking, and full regulatory compliance (KYC/AML).

Core Features:
1. Account Management
   - Multi-currency accounts (USD, EUR, GBP, CAD)
   - Virtual and physical debit card issuance
   - Real-time transaction history and statements
   - Spend analytics and AI-based categorization

2. Payment Processing
   - Domestic ACH and international SWIFT wire transfers
   - Real-time P2P payments (phone/email lookup)
   - QR code payments
   - Scheduled and recurring payment management
   - Instant payment notifications (push + email)

3. KYC/AML Compliance
   - Identity verification (government ID + liveness selfie)
   - Address verification (utility bill/bank statement)
   - PEP, sanctions, and adverse media screening
   - Continuous transaction monitoring with ML flagging
   - SAR (Suspicious Activity Report) filing workflow
   - OFAC compliance checks

4. Investment Module
   - Fractional stock and ETF trading (market hours)
   - Portfolio performance dashboard with benchmarks
   - Dividend reinvestment (DRIP)
   - Tax-loss harvesting suggestions
   - Annual tax document generation (1099-B/DIV)

5. Lending
   - Personal loan applications with instant decisioning
   - Credit bureau integration (Equifax, Experian, TransUnion)
   - Amortization schedule and early repayment options
   - Collections workflow for delinquent accounts

Non-Functional Requirements:
- PCI DSS Level 1 compliance
- SOC 2 Type II certification
- 99.99% uptime (4 nines — financial grade)
- Sub-200ms API response for payment APIs
- End-to-end encryption with HSM key management
- FinCEN BSA reporting, GDPR, CCPA compliance
- Fraud detection using real-time ML scoring

Integrations:
- Plaid for bank account linking
- Stripe Issuing for card program
- Onfido or Jumio for KYC
- AWS GovCloud for regulated data storage`,
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Marketplace',
    icon: '🛒',
    description: 'Multi-vendor marketplace, inventory, logistics',
    accent: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    text: `Multi-Vendor E-Commerce Marketplace Requirements

Overview:
Build a scalable multi-vendor marketplace where independent sellers list and manage products, and buyers can purchase with multiple payment options, real-time inventory, and full delivery tracking.

Core Features:
1. Vendor Onboarding & Management
   - Self-service vendor registration with KYC verification
   - Customizable storefront (banner, logo, bio, policies)
   - Bulk product import via CSV / Shopify export
   - Vendor analytics dashboard (GMV, returns, rating trends)
   - Automated payout scheduling (weekly/bi-weekly via Stripe Connect)
   - Commission rules engine (category-based %, flat fee, tiered)

2. Product Catalog
   - Unlimited hierarchical categories
   - Product variants (size, color, material, bundle)
   - Image gallery with auto-optimization (up to 12 images + video)
   - Dynamic pricing: bulk discounts, flash sales, coupons
   - SEO metadata, schema markup, XML sitemap generation
   - Inventory thresholds and low-stock alerts

3. Buyer Experience
   - Algolia-powered search with facets and typo tolerance
   - AI personalized recommendations (collaborative filtering)
   - Wishlist, compare, and recently viewed
   - Verified-purchase reviews and Q&A
   - Loyalty points and referral program

4. Order & Returns Management
   - Multi-vendor cart with split checkout
   - Real-time inventory reservation at order creation
   - Order lifecycle notifications (confirmed, shipped, delivered)
   - Self-service returns portal with label generation
   - Dispute resolution workflow between buyer and vendor

5. Logistics
   - Multi-carrier rate shopping (FedEx, UPS, DHL, USPS)
   - Real-time tracking aggregation
   - 3PL fulfillment center integration (ShipBob, Flexport)
   - Estimated delivery date calculation

Non-Functional Requirements:
- 100,000 concurrent users during peak (Black Friday)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1
- 99.9% uptime with auto-scaling (AWS ECS Fargate)
- GDPR and CCPA compliant
- Fraud prevention (Signifyd or Kount integration)

Integrations:
- Stripe Connect for vendor payouts
- Algolia for search
- Sendgrid for transactional email
- Shippo for multi-carrier shipping`,
  },
  {
    id: 'edtech',
    name: 'EdTech LMS',
    icon: '🎓',
    description: 'Online courses, live sessions, certificates',
    accent: 'border-purple-200 bg-purple-50 hover:border-purple-400',
    text: `Online Learning Management System (LMS) Requirements

Overview:
Build a comprehensive LMS for corporate training and individual learner upskilling. Supports course authoring, live sessions, progress tracking, and certificate issuance.

Core Features:
1. Course Authoring Studio
   - Drag-and-drop lesson builder with rich content blocks
   - Content types: HD video, quizzes, SCORM 1.2/xAPI, PDFs, live sessions, assignments
   - Branching paths and prerequisite logic
   - Content versioning (draft → review → published)
   - AI-assisted outline and quiz generation from uploaded docs
   - Multi-language content with auto-subtitles (Whisper API)

2. Learner Experience
   - Adaptive learning paths based on skill assessments
   - Progress tracker with milestone celebrations
   - Offline access via PWA with background sync
   - Course discussion forums with upvoting
   - Peer-to-peer study groups
   - OpenBadges-compliant digital certificates

3. Instructor & Creator Tools
   - Zoom / Google Meet integration for live cohorts
   - Assignment rubric builder and batch grading
   - Cohort management (enrollment, progress, communication)
   - Revenue dashboard for paid courses (Stripe Connect)
   - Detailed analytics: completion rates, engagement heat maps, drop-off points

4. Assessment Engine
   - Question bank with tags and difficulty levels
   - Randomized question pools per attempt
   - Timed assessments with auto-submit
   - Proctoring: AI-based attention detection + tab-switch tracking
   - Automated grading for MCQ/true-false; manual for essays
   - Peer review with structured rubrics

5. Enterprise / B2B Features
   - SSO (SAML 2.0, OIDC / Azure AD, Okta)
   - White-label branding per tenant
   - Org hierarchy (Company → Department → Team)
   - Mandatory compliance training tracking with audit export
   - SCORM 1.2 and xAPI (Tin Can) import/export

Non-Functional Requirements:
- WCAG 2.1 AA accessibility (screen reader compatible)
- FERPA and GDPR compliant
- 50,000 concurrent learners with CDN-delivered video
- 99.9% uptime; video delivery via Cloudfront + S3
- Mobile apps (iOS + Android) with React Native

Integrations:
- Zoom for live sessions
- Stripe for course payments
- Salesforce for enterprise lead management
- Moodle data migration toolkit`,
  },
  {
    id: 'hrtech',
    name: 'HR Management System',
    icon: '👥',
    description: 'Recruitment, payroll, performance reviews',
    accent: 'border-amber-200 bg-amber-50 hover:border-amber-400',
    text: `Human Resource Management System (HRMS) Requirements

Overview:
Build an end-to-end cloud HRMS covering the full employee lifecycle: recruitment, onboarding, payroll, performance management, and self-service.

Core Features:
1. Applicant Tracking System (ATS)
   - One-click job posting to LinkedIn, Indeed, Glassdoor, ZipRecruiter
   - Kanban-style recruitment pipeline with custom stages
   - AI resume parsing and candidate scoring (skills match %)
   - Structured interview scheduling with Google/Outlook calendar sync
   - Offer letter generation with e-signature (DocuSign integration)
   - DEI reporting and anonymized screening mode

2. Employee Onboarding
   - Digital document collection (I-9, W-4, direct deposit, NDA)
   - Equipment procurement and IT provisioning checklist
   - Buddy/mentor assignment with intro meeting scheduling
   - 30/60/90-day milestone tracking with automated check-ins
   - New hire training path auto-assignment

3. Payroll Management
   - Multi-state and multi-country payroll calculations
   - Gross-to-net computation (federal, state, local taxes)
   - Direct deposit and check printing
   - Expense reimbursement workflow with receipt OCR
   - Off-cycle payroll for bonuses and corrections
   - Year-end: W-2, 1099, ACA 1095 generation

4. Performance Management
   - OKR framework (Company → Team → Individual alignment)
   - Continuous feedback loops (peer, manager, upward, 360°)
   - Bi-annual and annual review cycles with calibration sessions
   - Rating normalization and forced distribution controls
   - Compensation planning module tied to performance ratings

5. Employee Self-Service Portal
   - PTO request, approval, and accrual tracking
   - Benefits enrollment (health, dental, 401k) with open enrollment wizard
   - Live org chart and employee directory
   - Payslip vault and document storage
   - Internal job board for internal mobility

Non-Functional Requirements:
- SOC 2 Type II compliance
- GDPR, CCPA, PIPEDA data privacy compliance
- 99.9% uptime with multi-region failover
- SSO (Okta, Azure AD, Google Workspace)
- Mobile app (iOS + Android) for approvals and self-service
- Data residency options (US, EU, APAC)

Integrations:
- ADP or Gusto as payroll calculation engine
- DocuSign for e-signatures
- Slack / Teams for notifications
- Workday data migration for enterprise clients`,
  },
];
