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

## Environment Variables

Required in `.env` / Vercel environment:

- `AIRTABLE_API_KEY` - Airtable personal access token
- `AIRTABLE_BASE_ID` - Airtable base ID
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `JWT_SECRET` - Secret for admin JWT tokens
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA secret
