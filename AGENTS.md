<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
- Build a production-grade AI-powered voice-first business assistant SaaS (HisaabAI) with authentication, onboarding, dashboard, inventory, subscription billing, and professional invoice PDFs.

## Constraints & Preferences
- Next.js 16 App Router (uses `proxy.ts` instead of `middleware.ts`)
- TypeScript, Tailwind CSS v4, shadcn/ui with CSS variables theming
- MongoDB + Mongoose, Groq SDK for AI, Razorpay for payments
- next-auth v5 beta for authentication (Google OAuth + email OTP)
- Landing page components use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` containers
- Responsive on mobile, tablet, laptop, desktop
- Multi-step onboarding after sign-up
- OTP-based email sign-in flow with Brevo SMTP
- All border-radius set to `0` (no rounded corners)
- All price inputs use `type="text" inputMode="decimal"` with regex sanitization — no number spinners

## Progress
### Done
- Installed all dependencies: next-auth@beta, mongoose, groq-sdk, razorpay, nodemailer, bcryptjs, next-themes, jspdf, 20+ shadcn components
- Set up MongoDB connection singleton (`lib/mongodb.ts`)
- Created Mongoose models: User, Business, Customer, Invoice, VerificationToken, InventoryItem (`lib/models/`)
- Built Groq integration: Whisper transcription + LLaMA 3.3 70B structured extraction (`lib/groq.ts`), voice parse API deducts credits and fetches inventory for AI matching
- Built Razorpay utility for subscription/payment orders (`lib/razorpay.ts`)
- Created next-auth v5 config with GoogleProvider + CredentialsProvider (email OTP) (`lib/auth.ts`) — JWT callbacks accept explicit updateSession data
- Created `proxy.ts` for route protection — redirects unauthenticated users, enforces onboarding
- Created OTP send API (`app/api/auth/otp/send/route.ts`) with Brevo SMTP + rate limiting
- Created onboarding API (`app/api/auth/onboarding/route.ts`) — creates User + Business, hashes password, sets 30-day trial
- Created login, register, multi-step onboarding pages — login/register with Suspense boundaries, onboarding passes data to updateSession()
- Created landing page: header (AppLogo + UserMenu), hero, features, how-it-works, testimonials, pricing, cta, footer (`components/landing/`)
- Created root layout with SessionProvider + ThemeProvider + Toaster + full SEO metadata
- Set `--radius: 0` in `globals.css`
- Built dashboard layout with sidebar + navbar + UserMenu (`app/dashboard/layout.tsx`)
- Built dashboard home with real stats + trial banners + recent invoices
- Built voice capture UI — MediaRecorder → Groq API → editable preview, live SpeechRecognition transcript, after save shows InvoiceActions + "New Invoice" reset
- Built inventory management — search, add/edit dialog, delete, bulk upload (CSV/JSON/TXT with drag-drop preview table via BulkUploadDialog)
- Built invoice listing with search/status filter + delete per row (ConfirmDialog)
- Built manual invoice creation — after save shows InvoiceActions + "New Invoice" reset instead of redirecting
- Built invoice detail view — status management, WhatsApp share (jspdf A4 PDF + Web Share API), PDF download (`window.print()`)
- Built customers page with search
- Built settings page (`app/dashboard/settings/page.tsx`) — business details, personal details (name + email change OTP), subscription with Razorpay Checkout modal, data export, account deletion, callback success handling, wrapped in Suspense
- Created API routes: inventory CRUD, inventory bulk upload, subscription GET/POST, subscription verify (syncs Razorpay status to DB), webhook handler, account DELETE, data export, email change
- Updated stats API to handle missing trialEnd (falls back to createdAt+30d)
- Updated voice parse API — checks credits > 0, deducts 1 per transcription, fetches inventory for AI matching
- Created `getAuthBusinessId()` helper, invoice utilities
- Created reusable components: ConfirmDialog, AppLogo (responsive + theme-aware + hydration-safe), BulkUploadDialog
- Created Razorpay plan seed script (`scripts/seed-razorpay-plans.ts`) — creates Starter ₹499/mo and Pro ₹999/mo plans
- Added `RAZORPAY_STARTER_PLAN_ID`, `RAZORPAY_PRO_PLAN_ID`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` to `.env.local`
- Changed subscription flow from `window.open(shortUrl)` to Razorpay Checkout modal (loads SDK dynamically, user never leaves app), sets `callback_url` in modal config
- Excluded `scripts/` from tsconfig build
- **Revised `InvoiceActions` component with professional invoice layout**: Fetches business details from `/api/business`; renders business name, address, phone, email, GSTIN in both jspdf (WhatsApp share) and HTML print (PDF download) versions; professional table format with item/qty/rate/amount columns, services section, totals block, notes, and footer
- **Fixed subscription activation**: Verify endpoint (`app/api/subscription/verify/route.ts`) now always updates the DB with plan + subscription ID even if Razorpay status isn't active yet; fixed race condition in settings page by merging the two competing effects into one
- **Tabular invoice creation**: Created `InvoiceTable` components (`components/invoice-table.tsx`) with editable table UI — replaced the grid layout on both invoices/new and voice pages with proper table headers, inline editing, and auto-calculated amounts
- **Dashboard charts**: Added revenue bar chart, customer growth line chart, service popularity bar chart, period filter (week/month/quarter/year), and summary analytics panel using recharts
- **Analytics page**: Created `/dashboard/analytics` with detailed revenue trend charts, customer growth, invoice status breakdown (pie chart), service usage, and premium-gated features (top-selling items, revenue by status) behind paid plan checks
- **Installed recharts** for charting
- **Updated sidebar** with Analytics navigation link

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- **Single business ID per user**: After onboarding, User has `businessId` reference to Business document. All data queries use this ID.
- **Email OTP + Google OAuth dual auth**: Users sign up via email (OTP + password) or Google (skip password).
- **JWT session strategy**: No DB sessions, JWT carries onboarding status, businessId, name. `updateSession()` passes explicit data to `jwt` callback.
- **Browser print + jspdf for PDF**: Download uses `window.print()` via formatted HTML; WhatsApp share generates A4 PDF via `jspdf` + Web Share API with file attachment.
- **Razorpay Checkout modal for subscriptions**: Opens in-page with `subscription_id` — user never leaves the app. `callback_url` set in modal JS config (not subscription.create API, which rejects it).
- **Subscription activation on callback**: Verify endpoint fetches subscription status from Razorpay and updates DB directly when user returns from checkout — bypasses webhook (which can't reach localhost).
- **Logo hydration safety**: `AppLogo` renders empty spacer during SSR, swaps in theme-aware image only after client mount — prevents hydration mismatch.
- **30-day free trial**: Onboarding sets trialStart/trialEnd. Voice parse checks credits > 0. Dashboard shows trial banner. Settings page has upgrade via Razorpay Checkout modal.

## Next Steps
1. Configure Google OAuth credentials in `.env.local` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. Test full auth flow end-to-end: register → OTP → onboarding → dashboard
3. Test Google OAuth flow: sign-in → onboarding (2 steps) → dashboard
4. Test voice capture with real microphone and Groq API
5. Write README with setup instructions

## Critical Context
- Build compiles with 27 routes + proxy (verified `npm run build` succeeds)
- `/onboarding` route at `app/onboarding/` (not route group — route group wasn't picked up by Next.js 16)
- `next-auth` v5 beta has peer dep warnings with `nodemailer@8` — use `--legacy-peer-deps`
- `AUTH_TRUST_HOST=true` required for non-localhost dev
- Web Speech API fallback: `webkitSpeechRecognition` used for live transcript, silent fallback if unsupported
- `navigator.share()` with files requires HTTPS + mobile — WhatsApp share falls back to `wa.me` URL on desktop
- All API routes use session-based `businessId` from `getAuthBusinessId()`
- Razorpay `subscription.create` does NOT accept `callback_url`/`callback_method` — these go in the Checkout modal JS config
- `scripts/` excluded from tsconfig to prevent Next.js build type errors
- Price inputs are `type="text" inputMode="decimal"` — zero renders as empty string, not `0`
- InvoiceActions fetches business data from `/api/business` on mount — business details appear in both jspdf (WhatsApp) and HTML print (PDF download) versions
## Relevant Files
- `lib/auth.ts`: NextAuth v5 config — JWT callback handles explicit updateSession data
- `proxy.ts`: Route protection — blocks unauthenticated, enforces onboarding
- `lib/models/business.ts`: Business schema with subscriptionStatus, trialStart/End, unique email/phone
- `lib/models/inventory.ts`: InventoryItem schema for AI matching
- `lib/groq.ts`: `parseInvoiceFromTranscript()` accepts optional inventory array
- `lib/api-auth.ts`: `getAuthBusinessId()` helper for all API routes
- `app/api/auth/onboarding/route.ts`: Creates Business with trial dates, returns name+businessId+onboardingCompleted
- `app/api/voice/parse/route.ts`: Checks credits, deducts 1, fetches inventory for AI matching
- `app/api/subscription/route.ts`: GET plan/credits/trial, POST creates Razorpay subscription
- `app/api/subscription/verify/route.ts`: POST syncs subscription status from Razorpay to DB
- `app/api/webhooks/razorpay/route.ts`: Handles subscription lifecycle events
- `app/api/inventory/bulk/route.ts`: POST bulk insert via `insertMany`
- `app/api/export/route.ts`: GET all user data as JSON download
- `app/api/account/route.ts`: DELETE all user data and account
- `app/api/auth/change-email/route.ts`: POST verifies OTP, updates User+Business email
- `components/invoice-actions.tsx`: Fetches business data; professional invoice PDF with business header, billing, items table, services, totals, notes, footer
- `components/app-logo.tsx`: Reusable theme-aware responsive logo with hydration safety
- `components/confirm-dialog.tsx`: Reusable shadcn AlertDialog for confirmations
- `components/bulk-upload-dialog.tsx`: Drag-drop CSV/JSON/TXT bulk upload with preview
- `scripts/seed-razorpay-plans.ts`: Creates Starter and Pro plans in Razorpay
- `app/dashboard/settings/page.tsx`: Subscription with Checkout modal, personal details, callback success handling
- `app/dashboard/analytics/page.tsx`: Detailed analytics with recharts, paid-plan gated features (top items, revenue by status)
- `app/api/analytics/route.ts`: Analytics API — revenue by period, service usage, customer growth, status breakdown, top items, premium gating
- `components/invoice-table.tsx`: Reusable InvoiceItemsTable, InvoiceServicesTable, InvoiceTotals components for tabular invoice editing
- `app/globals.css`: `--radius: 0` for zero rounded corners
- `tsconfig.json`: excludes `["node_modules", "scripts"]`