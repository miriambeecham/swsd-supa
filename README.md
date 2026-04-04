# Streetwise Self Defense - Web Application

React + TypeScript frontend with Vercel serverless API functions, backed by Airtable.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v7
- **Backend:** Vercel serverless functions (Node.js)
- **Database:** Airtable
- **Payments:** Stripe
- **Icons:** Lucide React

## Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. API requests are proxied to `http://0.0.0.0:3001` via Vite config.

## Project Structure

```
src/
  pages/           React page components
  components/      Reusable components (Layout, ClassCard, etc.)
  hooks/           Custom React hooks
  lib/             Utility libraries (api, airtable, stripe, booking rules)
  App.tsx          Main routing configuration

api/               Vercel serverless functions
  admin/           Authenticated admin endpoints (JWT)

docs/              Airtable schema documentation
public/            Static assets
```

## Admin Pages

All admin pages are behind JWT authentication (`/admin/login`).

| Route | Page | Purpose |
|---|---|---|
| `/admin/attendance` | AdminAttendancePage | Class roster, attendance tracking, communications |
| `/admin/schedules` | AdminClassSchedulesPage | View/filter all class schedules with sorting and pagination |
| `/admin/schedules/new` | AdminClassScheduleEditPage | Create a new class schedule |
| `/admin/schedules/:id/edit` | AdminClassScheduleEditPage | Edit an existing class schedule |
| `/admin/class-prep-links` | AdminClassPrepLinksPage | Generate and copy class prep URLs for students |
| `/admin/import` | AdminImportPage | Import external bookings |

## Pricing Architecture

Price and Pricing Unit fields exist on **both** the `Classes` table and the `Class Schedules` table in Airtable.

The public classes page (`PublicClassesPage.tsx`) uses a fallback chain:

```
Price:        schedule.Price  ||  class.Price
Pricing Unit: schedule['Pricing Unit']  ||  class['Pricing Unit']
```

In practice, **the Classes table is the canonical source** for pricing. The schedule-level fields are mostly empty and exist only to support per-date overrides if needed.

Pricing Unit is a display-only field that appends "/person" or "/pair" to the price on the public classes page. It is **not used in any booking or payment calculation logic** — the booking system always charges `price x number of participants`.

The admin schedule edit page does not expose Pricing Unit since it should be managed at the class level.

## E2E Testing (Playwright)

### Setup

Playwright is configured to run against the staging deployment. Install browsers once:

```bash
npx playwright install chromium
```

### Running Tests

```bash
# Run all tests headlessly with reports
npm run test:e2e

# Run with visible browser for debugging
npm run test:e2e:headed

# Open the HTML report after tests have run
npm run test:e2e:report
```

### Test Reports

Tests generate three report formats:

- **HTML report** — `playwright-report/index.html` (visual, with screenshots/video on failure)
- **JSON report** — `test-results/results.json` (machine-readable)
- **JUnit XML** — `test-results/results.xml` (for CI/CD integration)

On failure, Playwright automatically captures screenshots, video recordings, and traces.

### Test Suites

| File | What it tests |
|---|---|
| `e2e/adult-booking.spec.js` | Full adult booking: browse classes → select → fill form → Stripe checkout → confirmation |
| `e2e/mother-daughter-booking.spec.js` | Mother-daughter booking with age validation (daughter must be 12-15) |
| `e2e/community-mother-daughter-booking.spec.js` | Community M-D booking via direct URL (`/book-community-md/:scheduleId`) |
| `e2e/contact-page.spec.js` | Contact page renders all contact methods and social links |
| `e2e/navigation.spec.js` | Core pages load correctly, desktop nav has all links |

### Test Data (Staging Airtable)

The following test class schedules were created in the staging Airtable base (`appjIAqDe6oFUTBnR`):

| Type | Schedule ID | Class | Date |
|---|---|---|---|
| Adult | `recZOxv48BpAnVw2K` | Adult&Teen - Not Sponsored | 2026-04-17 |
| Mother-Daughter | `recgIQpnH9Mv06XR6` | Mothers&Daughters - New | 2026-05-15 |
| Community M-D | `rechvXSnrxhzaCK1q` | Girl Scouts Community | 2026-05-16 |

**To recreate test data** if schedules expire or are deleted:

1. Open the staging Airtable base
2. In the `Class Schedules` table, create new records with:
   - A future date (at least 5 hours from now)
   - `Start Time New` and `End Time New` set to future datetimes
   - `Available Spots` = 10
   - Link to the appropriate class in the `Class` field
3. Update the schedule IDs in the test files if they change

**Test email:** All bookings use `info@streetwiseselfdefense.com` so confirmation emails can be verified in that inbox.

**Stripe:** Tests use the sandbox test card `4242 4242 4242 4242` (exp 12/30, CVC 123).

### reCAPTCHA Bypass

The `VITE_TEST_MODE=true` environment variable must be set on the staging Vercel deployment. When enabled, the `create-booking` API skips server-side reCAPTCHA verification. This flag should never be set in production.

## Environment Variables

Required in `.env` / Vercel environment:

- `AIRTABLE_API_KEY` - Airtable personal access token
- `AIRTABLE_BASE_ID` - Airtable base ID
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `JWT_SECRET` - Secret for admin JWT tokens
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA secret
- `VITE_TEST_MODE` - Set to `true` on staging only to bypass reCAPTCHA for E2E tests
- `VITE_CONTENTFUL_SPACE_ID` - Contentful space ID for blog
- `VITE_CONTENTFUL_ACCESS_TOKEN` - Contentful Content Delivery API token
