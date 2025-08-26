# 📘 Plan2Fund NextGen – User Journey (V12)

This is the **structured, developer-friendly version** of the User Journey. It complements `User_journey.pdf` and should always remain in sync with it.

---

## 1. Overview

The user journey defines how different users interact with the Plan2Fund NextGen webapp. It describes each step, the expected behaviors, fallbacks, and requirements. Personas (Frustrated, Newbie, Expert, Idea-stage) are **lenses/requirements**, not content, and must always be respected.

---

## 2. 🔎 Learnings

### Issues with Current Journey (Critical Gaps)

* Too text-heavy → not structured visually for developers.
* Not modular → missing clear separation of blocks vs. pages.
* Ambiguity → sometimes “page” means “component” (e.g. Pricing is both a page and a block).
* No system for personas → personas exist conceptually, but not mapped into UI flow.
* Animations vague → not defined how/where/when.
* Trust-building missing → missing compliance, testimonials, global coverage cues.
* Global patterns missing → navigation, breadcrumbs, loaders, responsiveness.

### How Revolut / Stripe / Apple Do It

* Atomic components → reusable (Cards, Buttons, Grids).
* Progressive disclosure → simple first, advanced later.
* Meaningful animations → guide attention, not distract.
* Persona-driven CTAs → adapted to user needs.
* Trust stacking → compliance, testimonials, logos.
* Global navigation → sticky nav, breadcrumbs, footer.
* Mobile-first design → responsive by default.
* Incremental engagement → try quickly, dive deeper later.

---

## 3. Global Rules

* **Navigation**: Dynamic NavBar (sticky, progress shown, current highlighted, future greyed).
* **Inputs**: Mandatory at least one per section. Optional auto-filled + flagged.
* **Uploads**: Drag & drop zones per block (Vision, Market, Finance). Types: PDF, DOCX, XLSX.
* **Persistence**: Local auto-save of persona, survey answers, drafts.
* **Layout**: `Layout.jsx` wraps routes with NavBar + Footer.
* **Footer**: Terms, Privacy, GDPR, Contact (always accessible).
* **Trust**: Placeholder compliance badges + testimonials.
* **Animations**: Cards stagger, tooltips slide, hover lift, respect “reduce motion”.
* **Responsiveness**: Mobile NavBar collapse, vertical stacking, horizontal scroll for tables.

---

## 4. Step-by-Step Journey

### Step 1 – Landing / Choose Path

* Hero + InfoSection introduces product.
* CTAs: **Find Funding** (3a) or **Generate Plan** (3b).
* Persona cards displayed.
* NavBar appears dynamically after choice.

### Step 3a – Funding Recommendation Engine

* 3-question wizard (Sector, Location, Stage).
* One question at a time, Next disabled until answered.
* Results: ProgramCards fade in staggered.
* Popup CTA: Continue to Plan Generator.
* Expert shortcut: “Already know your program?”
* Education: Subtext explains why question matters.
* Dev Components: `RecoPage.jsx`, `QuestionWizard.jsx`, `ProgramCard.jsx`.

### Step 3b – Plan Generator

* SideNav + Main Editor.
* Blocks: Vision, Market, Finance.
* Features: mandatory + optional inputs, upload zones, tooltips, “Mark Complete”.
* Personas affect UI (defaults, tooltips, expert toggles, educational bubbles).
* Education (QBank): questions per block.
* Dev Components: `PlanPage.jsx`, `BlockEditor.jsx`, `TooltipSidebar.jsx`, `ChapterNav.jsx`.

### Step 4 – Funding Readiness

* Advisory-only, never blocking.
* Checklist + traffic light indicator (Green/Orange/Red).
* Dev Components: `ReadinessPage.jsx`, `Checklist.jsx`, `Meter.jsx`.

### Step 5 – Preview + Pricing

* Document viewer + completeness meter.
* Auto-filled flagged as “auto-generated”.
* Uploaded files displayed.
* Pricing block with add-ons.
* CTA: Continue to Checkout.
* Dev Components: `PreviewPage.jsx`, `DocViewer.jsx`, `FileList.jsx`, `PricingBlock.jsx`.

### Step 6 – Pricing

* Pricing cards, Revolut-style.
* Toggle: Standard vs. Priority.
* CTA → Checkout.
* Dev Components: `PricingPage.jsx`, `PricingCard.jsx`.

### Step 7 – Checkout

* Stripe integration.
* Mandatory email.
* Optional final upload.
* Priority toggle.
* Dev Components: `CheckoutPage.jsx`, Stripe integration.

### Step 8 – Confirmation

* On-site confirmation page + email.
* CTA: Request Revision.
* Dev Components: `ConfirmationPage.jsx`, email stub.

### Step 9 – After-Sales

* Support form for revisions.
* Optional upsell: coaching.
* Dev Components: `AfterSalesPage.jsx`.

### Step 10 – AI Plan Machine (Future)

* Placeholder teaser.

---

## 5. Subpages

* Terms & Conditions: General, Liability, Governing Law.
* Privacy Policy: GDPR-compliant placeholder.
* GDPR Info: Data stored securely, deletable on request.
* Contact: Simple form (Name, Email, Message).

---

## 6. Fallbacks & Edge Cases

* Skipped inputs → defaults auto-filled + flagged.
* No results → Add program manually.
* Readiness advisory-only.
* Preview incomplete → warning banner.
* Checkout fails → retry / alternative.
* Confirmation email fails → web confirmation still shown.
* Uploads fail → retry option.
* Offline mode → save locally, sync later.

---

## 7. Benchmark Compliance – Stripe / Revolut / Apple

### Confirmed Alignments

* Dynamic navigation with progress.
* Revolut-style pricing toggle.
* Trust elements defined.
* Progressive disclosure supported by persona logic.
* Animations defined as meaningful, not decorative.

### Gaps vs Best Practices

1. Mobile-first Checkout – refine layouts, tap targets, Apple/Google Pay.
2. Real-time validation – inline form errors, smart defaults.
3. Guest/fast-track flows – quick checkout path.
4. Consistent trust placement – Pricing, Checkout, Confirmation.
5. Error handling clarity – inline + contextual messages.
6. Navigation consistency – branding, breadcrumbs, back-navigation.
7. Accessibility – ARIA, WCAG compliance, reduced motion.

### Action Items

* Define mobile Checkout layout + wallet support.
* Specify inline validation patterns.
* Implement consistent trust UI pattern.
* Map animations step by step.
* Enforce branding + unified NavBar.
* Add guest path option.
* Ensure accessibility compliance.

---

## 8. Developer Notes

* Always work in **small packages**.
* Always run `npm run build` before commits.
* Personas applied as conditional UI logic.
* Always update `DEV_GUIDE.md` after each package.

---

## 9. File Management

* `docs/User_journey.pdf` → canonical design doc (visual reference).
* `docs/User_journey.md` → structured doc (this file).
* `docs/MASTER_PROMPT.md` → workflow + rules.
* `docs/DEV_GUIDE.md` → progress tracker.
