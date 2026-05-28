<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
Build and improve an AI‑powered voice‑first invoicing SaaS with cross‑platform sharing, dark‑mode‑immune public pages, responsive tables, GST support, masonry layout, and refined dashboard UX.

## Constraints & Preferences
- All invoice outputs use the exact same light‑theme colors (oklch values from globals.css `:root`), never dark mode.
- wa.me URLs cannot attach files; WhatsApp sharing falls back to a public invoice link.
- The email send route generates a server‑side jsPDF and sends it as an attachment with a branded HTML template; accepts custom `customerEmail` in request body.
- The public page `/invoice/[id]` renders invoice in light theme only with Print and Download PDF buttons.
- Business details (name, address, phone, email, GSTIN) are fetched from `/api/business` for all print/PDF/email outputs.
- Phone input validation borders (green/red) appear only while focused.
- The dashboard uses CSS columns for masonry layout — cards take natural height, no stretching.
- GST is optional (defaults to 0%) via per-invoice `taxRate` or Business-level `defaultTaxRate` from settings.
- Data export supports JSON, CSV, and TXT formats with a format selector in settings.
- Email inputs have green/red validation borders only while focused (like PhoneInput).
- Customer name field on invoice creation has autocomplete dropdown that searches existing customers and auto-fills phone/email.
- Analytics page uses a date range picker; free/trial users are restricted to last 7 days only with locked period options.

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

### Done (cross-platform invoice sharing)
- Created public API route `app/api/share/[id]/route.ts` (no auth, uses invoice ID as token).
- Created public invoice page `app/invoice/[id]/page.tsx` — fully hardcoded oklch light‑theme colors, plain `<button>` (no shadcn/theme vars), `handleDownload` opens new window with same HTML template used by dashboard.
- Replaced jsPDF‑based `app/api/invoices/[id]/pdf` with the public `/invoice/[id]` page.
- Updated both WhatsApp handlers (`components/invoice-actions.tsx` and `app/dashboard/invoices/[id]/page.tsx`) to share the public invoice URL instead of trying to attach a PDF.
- Added business‑data fetching to the invoice detail page so the print/download PDF now shows name, address, phone, email, GSTIN.
- Upgraded the email send API (`app/api/invoices/[id]/send/route.ts`) with a professional branded HTML template and a fully styled jsPDF attachment (watermark, blue accent bars, BILL TO table, totals block, etc.).
- Replaced all dynamic `getComputedStyle` reads in `handleDownload` with hardcoded light‑theme `:root` oklch values so the print PDF is always light‑theme regardless of the user's current mode.

### Done (masonry dashboard + global GST + email dialogs + export + phone border fix)
- **Phone input validation borders only on focus**: Changed `border-red-500`/`border-green-500` to `focus:border-red-500`/`focus:border-green-500` in `components/phone-input.tsx` so colored borders appear only while the input is focused.
- **Global default tax rate**: Added `defaultTaxRate: Number` to `Business` model (`lib/models/business.ts`), accepted in `PUT /api/business/route.ts`, added UI input in settings page (`app/dashboard/settings/page.tsx`), and invoice creation API (`POST /api/invoices/route.ts`) uses `business.defaultTaxRate` when `taxRate` is not explicitly provided.
- **Data export with format selector**: `GET /api/export` now accepts `?format=json|csv|txt`. CSV flattens all records, TXT outputs formatted tables with columns. Settings page shows a `Select` dropdown (JSON/CSV/TXT) before the Export button.
- **Email button with confirmation/input dialog (invoice detail page)**: `app/dashboard/invoices/[id]/page.tsx` now shows "Send Email" always. If `customerEmail` exists, a `ConfirmDialog` asks for confirmation before sending. If no email on file, a `Dialog` with an email input appears; user enters an email and it's passed as `customerEmail` in the API request body.
- **Email button in InvoiceActions (voice entry)**: `components/invoice-actions.tsx` now has a "Send Email" button that either sends directly (if `customerEmail` exists) or opens an email input `Dialog`. Added `Mail` icon, `Loader2` spinner, and the same email input UI. Works on both `paid` and non-paid states.
- **Masonry dashboard**: Replaced CSS `grid` charts section and bottom section with `columns-1 md:columns-2` + `break-inside-avoid` on each card, so cards flow naturally in columns without stretching to equal height.

### Done (email validation + customer autocomplete + analytics date range + terms + combobox + customer detail + upgrade dialog + analytics gating)
- **Email validation**: Created `components/email-input.tsx` with `isValidEmail()`, `getEmailError()`, and green/red `focus:` borders (same pattern as PhoneInput). Replaced raw `<Input type="email">` in invoice creation forms (both manual + voice), invoice detail email dialog, InvoiceActions email dialog, and settings page.
- **Customer autocomplete**: Created `components/customer-autocomplete.tsx` — debounced search against `/api/customers?search=`, dropdown shows matching customers with phone/email, selection auto-fills all fields and passes `customerId` to the invoice creation API (`POST /api/invoices` accepts `customerId`). Integrated in both manual and voice invoice creation pages.
- **Analytics date range + paid gating**: Created `components/date-range-picker.tsx` (Calendar + Popover) and `components/ui/popover.tsx`. Updated analytics API (`GET /api/analytics`) to accept `startDate`/`endDate` params. Updated analytics page: free users see only "Last 7 days" in period selector (others show lock icon + disabled), date range picker also locked for free users. Premium features (top items, revenue by status) retain existing `PaidOverlay` blur.
- **Terms checkbox in onboarding**: Added `Checkbox` + terms link to onboarding step 2 (business info), `acceptedTerms` validated client-side (blocks proceeding) and server-side (400 if false/missing). Created `app/terms-and-conditions/page.tsx` as a dummy placeholder page.
- **Combobox customer search**: Created `components/customer-combobox.tsx` using `@base-ui/react` Combobox. Replaced `CustomerAutocomplete` in both manual and voice invoice forms with the combobox, which fetches customers via API and allows keyboard-navigable search with auto-fill.
- **Customer detail page**: Created `app/dashboard/customers/[id]/page.tsx` and `app/api/customers/[id]/route.ts`. Shows customer info, total spent, visit count, most purchased items (pro-gated), retention rate (pro-gated), visit history (pro-gated), and full invoice list. Cards in customers list are now clickable Links.
- **Upgrade dialog + lock UX**: Created `components/upgrade-dialog.tsx` — Dialog triggered when free users click locked periods/features. Dashboard and analytics period selectors now use `isPaid` to gate non-week options; clicking locked options opens the upgrade dialog instead of selecting the period. Lock icons displayed on gated items.
- **Subscription cards analytics info**: Updated Starter plan features in settings to include `Basic analytics (7-day view)`.
- **Dashboard analytics gating**: Dashboard period selector now respects `isPaid` — non-paid users see lock icons on month/quarter/year options and cannot select them. If a non-paid user clicks a locked option, `UpgradeDialog` opens.

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- **Single business ID per user**: After onboarding, User has `businessId` reference to Business document. All data queries use this ID.
- **Email OTP + Google OAuth dual auth**: Users sign up via email (OTP + password) or Google (skip password).
- **JWT session strategy**: No DB sessions, JWT carries onboarding status, businessId, name. `updateSession()` passes explicit data to `jwt` callback.
- **Separate public invoice page from dashboard**: `/invoice/[id]` is publicly accessible (MongoDB ObjectID = unguessable token); `/dashboard/invoices/[id]` remains authenticated.
- **`window.print()` for PDF on public page**: Opens a new window with the same HTML template used by the dashboard `handleDownload`, ensuring identical output.
- **Email PDF as server‑side jsPDF**: Cannot use `window.print` server‑side, but styled to match HTML version closely (same brand colors #2563eb / ACCENT, watermark, BILL TO, totals).
- **Razorpay Checkout modal for subscriptions**: Opens in-page with `subscription_id` — user never leaves the app. `callback_url` set in modal JS config (not subscription.create API, which rejects it).
- **Subscription activation on callback**: Verify endpoint fetches subscription status from Razorpay and updates DB directly when user returns from checkout — bypasses webhook (which can't reach localhost).
- **Logo hydration safety**: `AppLogo` renders empty spacer during SSR, swaps in theme-aware image only after client mount — prevents hydration mismatch.
- **30-day free trial**: Onboarding sets trialStart/trialEnd. Voice parse checks credits > 0. Dashboard shows trial banner. Settings page has upgrade via Razorpay Checkout modal.
- **Email dialog patterns**: Two patterns in the codebase — `ConfirmDialog` when the invoice already has a customer email (for confirmation), and a custom `Dialog` with an email `Input` when the customer email is missing.
- **Masonry via CSS columns**: Dashboard uses `columns-1 md:columns-2` + `break-inside-avoid` instead of CSS grid to prevent card stretching.
- **Global GST fallback**: Invoice creation uses `"taxRate" in body ? body.taxRate : business.defaultTaxRate ?? 0` — forms omit `taxRate` when 0 so default applies.
- **Combobox from @base-ui/react**: Uses `Combobox` with object values `{ _id, name, phone, email }`, `itemToStringLabel` for display, external API fetch on debounced search.
- **UpgradeDialog**: Reusable `Dialog` triggered when free users click locked features; links to `/dashboard/settings`.
- **Customer analytics gating**: Most purchased items, retention rate, and visit history are gated behind `isPaid` on customer detail page; basic info always visible.

## Next Steps
1. Verify the WhatsApp shared link opens the public page in light theme on all devices.
2. Confirm that the email‑attached PDF (jsPDF) uses the same brand colors as the HTML print version.
3. Configure Google OAuth credentials in `.env.local` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
4. Test full auth flow end-to-end: register → OTP → onboarding → dashboard
5. Test Google OAuth flow: sign-in → onboarding (2 steps) → dashboard
6. Test customer combobox on both manual and voice invoice forms
7. Verify customer detail page loads all data correctly
8. Test upgrade dialog on dashboard and analytics pages for free users

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
- `proxy.ts` middleware protects only `/dashboard` and `/onboarding`; `/invoice/[id]` and `/api/share/[id]` pass through without auth
- `:root` light‑theme oklch values: `--primary: oklch(0.704 0.04 256.788)`, `--background: oklch(0.9818 0.0054 95.0986)`, `--foreground: oklch(0.145 0 0)`, `--muted: oklch(0.923 0.003 48.717)`, `--muted-foreground: oklch(0.553 0.013 58.071)`, `--border: oklch(0.869 0.005 56.366)`, `--destructive: oklch(0.6368 0.2078 25.3313)`
- Send email API now accepts `customerEmail` in request body for custom recipient
- `app/api/invoices/[id]/send/route.ts` uses `recipient` variable (body.customerEmail || invoice.customerEmail)
- `calculateTotals(items, services, labourCharges, discount, taxRate)` formula: `tax = subtotal * taxRate / 100`, `total = subtotal + tax + labourCharges - discount`
- Business model has `defaultTaxRate` field (Number, default 0)
- `components/email-input.tsx` mirrors `phone-input.tsx` with `isValidEmail()` / `getEmailError()` and focus‑only borders
- `components/customer-autocomplete.tsx` does debounced search (300ms) against `/api/customers?search=&limit=8`, passes `customerId` to invoice creation
- `components/date-range-picker.tsx` wraps `Calendar` + `Popover`; analytics page disables non‑week periods for free users via `disabled` + lock icon
- `components/ui/popover.tsx` is the shadcn popover component using `@radix-ui/react-popover`
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
- `app/dashboard/settings/page.tsx`: Subscription with Checkout modal, personal details, callback success handling, export format selector, default GST rate input
- `app/dashboard/analytics/page.tsx`: Detailed analytics with recharts, paid-plan gated features (top items, revenue by status), date range picker, locked periods for free users
- `app/api/analytics/route.ts`: Analytics API — revenue by period, service usage, customer growth, status breakdown, top items, premium gating, accepts `startDate`/`endDate` params
- `components/invoice-table.tsx`: Reusable InvoiceItemsTable, InvoiceServicesTable, InvoiceTotals components for tabular invoice editing
- `app/globals.css`: `--radius: 0` for zero rounded corners; defines `:root` oklch light‑theme values used across all PDF/print/public outputs
- `app/invoice/[id]/page.tsx`: Public invoice page — hardcoded oklch colors, plain `<button>`, `handleDownload` shares HTML template with dashboard
- `app/api/share/[id]/route.ts`: Public API returning invoice + business data (no auth)
- `app/api/invoices/[id]/send/route.ts`: Email send API with branded HTML template + styled jsPDF attachment, accepts optional `customerEmail` in body
- `tsconfig.json`: excludes `["node_modules", "scripts"]`
- `components/invoice-actions.tsx`: Now includes email send button with Mail dialog for missing emails
- `app/dashboard/invoices/[id]/page.tsx`: Now has email button with ConfirmDialog (email exists) or email Input dialog (no email)
- `app/api/export/route.ts`: GET with `?format=json|csv|txt` support
- `app/dashboard/page.tsx`: Dashboard with CSS columns masonry layout for charts and bottom section
- `components/phone-input.tsx`: Green/red border only while focused (`focus:border-*`)
- `components/email-input.tsx`: Email input with validation and focus-only borders (same pattern as PhoneInput)
- `components/customer-autocomplete.tsx`: Debounced customer search dropdown that auto-fills phone/email and passes customerId to invoice creation
- `components/customer-combobox.tsx`: Combobox search using @base-ui/react — replaces CustomerAutocomplete
- `components/date-range-picker.tsx`: Calendar + Popover date range picker for analytics
- `components/ui/popover.tsx`: shadcn Popover component using `@radix-ui/react-popover`
- `components/upgrade-dialog.tsx`: Dialog triggered when free users click locked features
- `app/dashboard/customers/[id]/page.tsx`: Customer detail page with info + pro-gated analytics
- `app/api/customers/[id]/route.ts`: Customer detail API with invoices and analytics computation