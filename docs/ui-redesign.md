# Sarabo UI Redesign — Working Plan

**Status:** approved direction, not yet started
**Branch:** `ui/service-spine` (cut from `development`)
**Scope:** `sarabo-client` only. The server is frozen and is not touched at any point in this plan.
**Approved mockup:** the six-screen "service spine" direction (petrol ink / marigold / verdigris).

---

## 1. The design idea, in one paragraph

Nobody choosing a repair service is excited about repair — they are anxious. *Where is my device, who has
it, what will this cost, when do I get it back.* The redesign answers that question everywhere, using one
structural device: **the service spine**, a four-stage progression (Request → Inspect → Approve → Repaired)
that appears in the hero, on the public tracking page, as the request form's stepper, and in every
dashboard. One idea carried through every screen is what makes the product read as a single thing instead
of a pile of pages.


## 2. Design tokens

| Role | Light | Dark | Notes |
|---|---|---|---|
| Ink (headings, bands, sidebar) | `#0F2430` | `#E8EDE9` on `#0B1519` | Deep petrol, not black |
| Marigold (the one action colour) | `#F2B138` | `#F2B138` | **Carries ink text, never white** — 8.5:1 |
| Verdigris (links, completed) | `#1E6F63` | `#5FBFAE` | 5.99:1 on white |
| Paper (page ground) | `#F6F7F5` | `#0B1519` | Cool-biased neutral |
| Card | `#FFFFFF` | `#13212A` | |
| Line | `#E2E5E1` | `#22343D` | |

Semantic colours (waiting / live / done) stay separate from the accent so "needs attention" never reads as
"brand". Radii are a fixed set: controls `6px`, cards `12px`, pills full. Monospace is used deliberately and
consistently for tracking codes, BDT amounts, stage counters and micro-labels.

## 3. Rules that hold in every phase

1. **No server changes.** No new endpoints, no payload changes, no contract changes.
2. **No route changes.** Every path in `routes/router.jsx` stays exactly as it is.
3. **No query-key changes.** Caches are shared between screens; renaming a key breaks other pages.
4. **Guards are untouched** as an authorization boundary. Client role handling stays UX-only.
5. **Frozen internal values.** `user` / `rider` / `admin`, `parcel_picked_up`, `driver_assigned` and every
   other stored status string keep their names.
6. **User-facing terms:** Customer, Technician, Repair Request, Sarabo. Currency is BDT.
7. **Nothing invented.** No ratings, testimonials, customer counts, turnaround promises, warranties, or
   month-on-month trends. Every number shown maps to something the platform actually stores.
8. **Never push `main`. Never deploy.**

## 4. Phases

Each phase is one commit. Phases are ordered so the app is never left visually broken between them —
foundation first, then the shell each area lives in, then the screens.

| # | Phase | Main files | Done when |
|---|---|---|---|
| 0 | **Design foundation** | `index.css`, `ui/button-variants.js`, `ui/card`, `ui/input`, `ui/textarea`, `ui/badge-variants`, `ui/alert-variants`, `config/statusPresentation.js` | New palette + both themes defined; every existing `ds-*` screen picks it up automatically; no layout changed |
| 1 | **Spine primitives** | new `utils/repairStage.js`, `components/spine/*` | Pure status→stage mapping covers every status incl. cancelled and declined; horizontal + vertical variants render |
| 2 | **Public shell** | `NavBar`, `Footer`, `RootLayout` | New nav, ink footer, one primary action, mobile sheet |
| 3 | **Home** | `pages/Home/*`, `utils/publicContent.js` | Hero with the live repair card, band, service price list, quote explainer, FAQ, CTA |
| 4 | **Track a repair** | `TrackRequest`, `utils/trackingPresentation.js` | Vertical spine with timestamps, explicit privacy note, sanitized fields only |
| 5 | **Remaining public pages** | `Services`, `ServiceAreas`, `About/*`, `BecomeTechnician` | Consistent with the new home |
| 6 | **Auth** | `Login`, `Register`, `SocialLogin`, `VerifyEmail`, `AuthLayout` | DaisyUI removed from auth; new form styling |
| 7 | **Dashboard shell** | `DashboardShell`, `DashboardSidebar`, `DashboardHeader`, `MobileDashboardNav`, `CommandMenu`, `Breadcrumbs`, `UserMenu`, `DashboardVerificationBanner` | Ink sidebar with marigold active rail, counts in nav |
| 8 | **Create a repair request** | `RepairRequestV2Form`, `ServiceDefinitionSelector`, `RequestFlowSteps`, `EstimateCard`, `damage-images/*` | Spine as the stepper, estimate rail, photo slots |
| 9 | **Customer screens** | `CustomerOverview`, `MyRequests`, `RequestDetails`, `workspace/*`, `quote/*` | "Your move" panel above everything; quote broken into labour / parts / additional |
| 10 | **Technician screens** | `TechnicianOverview`, `AssignedJobs`, `CompletedJobs`, `inspection/*`, `repair/*` | One job, one action; earnings show labour only |
| 11 | **Admin screens** | `AdminOverview`, `ManageRepairRequests`, `AssignTechnicians`, `ApproveTechnicians`, `UsersManagement`, `admin/data-table/*` | Leads with what is blocked; counts underneath; charts last |
| 12 | **Payments, notifications, profile** | `Payment*`, `PaymentHistory`, `NotificationsPage`, `Profile` | Last DaisyUI usage removed; the plugin can be dropped from `index.css` |
| 13 | **Quality pass** | across the app | Contrast, focus, keyboard, headings, reduced motion, 320→1920 responsive, dark theme sweep, empty / loading / error states |

**Every page phase (2–12) includes, not just the happy path:** loading skeletons, empty states, error states
with a retry, the dark theme, mobile down to 320px, keyboard focus order and visible focus.

## 5. Workflow per phase

1. Implement the phase on the branch.
2. Run `npm run lint` and `npm run build` (this repo has no test suite — lint + build + a manual route walk
   is the gate).
3. **Print a phase report to the console:** scope, files changed with line counts, what to look at, the
   verification results, any deviation from this plan and why, and what the next phase is.
4. **Stop and wait for approval.** Nothing is committed before that.
5. On approval: commit — single line, conventional prefix, no body, author `Jahid Hasan
   <jahidjubaer17@gmail.com>`.
6. Push the branch to `origin`. Never `main`.
7. Append the phase result to §6 below, then start the next phase.

## 6. Salvaged from the abandoned attempt

An earlier action-first attempt was rejected on the visuals and archived at commit `058139b` on
`ui/action-first-redesign` (local only, never pushed, never merged). Two changes in it were not visual and
are worth keeping. They are scheduled, not lost:

| Change | Where it lands |
|---|---|
| `.focus-ring` driven by `--ds-ring` instead of a fixed accent (2.16:1 → 5.99:1 on white) | **done in Phase 0** |
| `PrivateRoute` / `CustomerRoute` preserving `location.search` through login, so a deep link survives auth | Phase 8, with the deep link that needs it |
| `?category=<slug>` prefill on the request form, ignored unless the slug is in the live catalogue | Phase 8 |

## 7. Phase log

| # | Phase | Commit | Date | Notes |
|---|---|---|---|---|
| 0 | Design foundation | `e8954cd` | 2026-08-14 | Retuned the shared palette, control variants, badges and focus treatment. |
| 0b | Type scale | `336cd37` | 2026-08-14 | Added the shared role-based type scale. |
| 1 | Spine primitives | `42bfc1b` | 2026-08-14 | Added the canonical status-to-stage model and horizontal and vertical spine variants. |
| 2 | Public shell | `fea478e` | 2026-08-14 | Redesigned the public shell and preserved query strings through login redirects. |
| 3 | Home | `1b2fb28` | 2026-08-14 | Rebuilt Home around the service spine, live catalogue and quote explanation. |
| 4 | Track a repair | `434d02a` | 2026-08-14 | Added the sanitized public tracking model, vertical spine and timeline presentation. |
| 5A | Services + Service Areas + About | `a5312bd` | 2026-08-15 | Redesigned the three remaining unauthenticated content pages. |
