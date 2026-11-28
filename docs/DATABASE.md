# Database (Supabase Postgres)

The site's data lives in a Supabase Postgres database. It was migrated from
Airtable table-for-table, so names and allowed values mostly match the old
Airtable fields.

**Source of truth:** `supabase/migrations/0001_initial_schema.sql` and
`0002_keepalive.sql`. If this document and the migrations disagree, the
migrations win; please update this file when you add a migration.

## How to read this schema

- **Access.** Row-level security is enabled on every table with no policies,
  so only the service-role key can read or write. All access goes through the
  serverless functions in `/api` (client in `api/_supabase.js`); the browser
  never talks to Supabase directly.
- **Keys.** `id` (uuid) is the primary key and what every foreign key points
  to. Most tables also have a readable auto-number (`booking_id`,
  `schedule_id`, `participant_id`, ...) used for display and references in
  emails.
- **`airtable_record_id`** on every table is the original Airtable record ID.
  It is historical only; nothing new should depend on it.
- **`created_at` / `updated_at`** are on every table. A trigger
  (`set_updated_at`) updates `updated_at` automatically on every update.
- **Allowed values.** Columns listed below with a set of values have a CHECK
  constraint; writing anything else fails.

## Things that aren't obvious from the columns

- **Class times:** use `class_schedules.start_time_new` / `end_time_new`
  (timestamptz). The text columns `start_time` / `end_time` (e.g. `"6:00 PM"`)
  are older display fields from Airtable.
- **Capacity:** `class_schedules.available_spots` is the class's **total**
  capacity, not the number remaining. Remaining spots =
  `available_spots` minus the sum of `bookings.number_of_participants` for
  bookings on that schedule where `status != 'Cancelled'` (see
  `api/check-availability.js` and `api/create-booking.js`). Note that
  `Refunded` and `Aborted` bookings still count against capacity; this
  matches how Airtable's "Booked Spots" rollup counted them.
- **Abandoned checkouts:** a cron job (`api/cleanup-expired-bookings.js`)
  sets bookings with `status = 'Pending Payment'` and `booking_date` older
  than 35 minutes to `status = 'Cancelled'`, `payment_status = 'Expired'`.
  `bookings.hold_expires_at` exists but is not used.
- **Reschedules** (`api/admin/reschedule-booking.js`): moving some or all of
  a booking's participants creates a child booking.
  - `child.original_booking_id` = the parent booking's `id` (uuid stored as
    text).
  - `parent.offshoot_booking_ids` = comma-separated list of child `id`s (text).
  - `original_participant_count` records how many participants the parent had
    before the split.
  - `reschedule_status = 'Pending Reschedule'` marks bookings waiting to be
    assigned to a new class.
- **Persons vs participants:** `participants` are the people on a specific
  booking. `persons` is the ongoing directory of people (students, parents,
  teaching assistants). A participant can be converted into a person
  (`api/admin/persons/convert-from-participant.js`), which sets
  `persons.source_participant_id`.
- **Unused / leftover columns (safe to ignore):**
  `bookings.zoho_synced` and `class_schedules.synced_to_zoho` (the Zoho sync
  was removed), `bookings.participants_json`, `bookings.hold_expires_at`,
  `categories.faq_copy`, `categories.whattoexpect_content_cwc_15plus_copy`,
  `faq.categories_copy`, `participants.teaching_assistants`.
- **`waiver_holding_table`** is a legacy import from WaiverSign that the app
  doesn't read. Waiver details are now entered directly on WaiverSign.
- **`keepalive`** is a one-row table written every few days by a GitHub
  workflow (`.github/workflows/supabase-keepalive.yml`) so the free-tier
  Supabase project doesn't pause for inactivity. Ignore it.
  - **Known issue (as of 2026-11-28):** the **staging** half of the
    keep-alive job has failed on every run since 2026-05-14 with
    `Could not resolve host` for the project in the `SUPABASE_URL_STAGING`
    GitHub secret. The last successful staging ping was 2026-05-11. The
    staging site still works, so it is probably using a different Supabase
    project than the one the secret names. The staging backup workflow
    (`supabase-backup-staging.yml`) uses the same secrets and hasn't
    succeeded since 2026-05-06. **Prod is unaffected:** its keep-alive and
    backups succeed. Because of this the workflow shows as failed on every
    run, so check the prod job's own result rather than the overall status.

## Relationships

```
classes ──< class_schedules ──< bookings ──< participants
                 │    │                            │
                 │    └──< satisfaction_surveys    └──(source_participant_id)── persons
                 │                                                                │
                 └──────────────< teaching_assignments >──────────────────────────┘

categories ──< faq
```

| Foreign key | References | On delete |
| --- | --- | --- |
| `class_schedules.class_id` | `classes.id` | restrict |
| `bookings.class_schedule_id` | `class_schedules.id` | restrict |
| `participants.booking_id` | `bookings.id` | **cascade** |
| `persons.source_participant_id` | `participants.id` | set null |
| `teaching_assignments.person_id` | `persons.id` | restrict |
| `teaching_assignments.class_schedule_id` | `class_schedules.id` | restrict |
| `satisfaction_surveys.class_schedule_id` | `class_schedules.id` | set null |
| `faq.category_id` | `categories.id` | set null |

`teaching_assignments` has a unique constraint on
`(person_id, class_schedule_id)`.

`testimonials`, `form_submissions`, `waiver_holding_table` and `keepalive`
have no foreign keys.

## Tables

Every table except `keepalive` also has `id uuid` (primary key),
`airtable_record_id text` (unique), `created_at` and `updated_at`; these are
not repeated below. "not null" is noted where it applies; everything else is
nullable.

### classes

A class offering (the template a schedule is created from).

| Column | Type | Notes |
| --- | --- | --- |
| `class_id` | text | Airtable "ID" label |
| `class_name` | text | not null |
| `description` | text | |
| `type` | text | `Public: Adult & Teen`, `Public: Mother & Daughter`, `Private`, `Corporate`, `Community: Mother & Daughter` |
| `age_range` | text | |
| `duration` | integer | |
| `max_participants` | integer | |
| `location` | text | |
| `instructor` | text | |
| `price` | integer | whole dollars |
| `booking_method` | text | `External`, `Contact`, `SWSD website`, `Streetwise Self Defense` |
| `registration_instructions` | text | |
| `is_active` | boolean | not null, default false |
| `partner_organization` | text | `City of Walnut Creek -- Arts & Recreation`, `Diablo Valley College`, `Streetwise Self Defense` |
| `city` | text | `Walnut Creek`, `Pleasant Hill`, `Richmond`, `San Francisco`, `San Jose` |
| `parking_instructions` | text | |
| `parking_map_url` | text | |
| `pricing_unit` | text | `Per Person`, `Per Mother/Daughter Pair` |

### class_schedules

One scheduled session of a class.

| Column | Type | Notes |
| --- | --- | --- |
| `schedule_id` | bigint | not null, auto-number, unique |
| `class_id` | uuid | → `classes.id` |
| `date` | date | |
| `start_time` / `end_time` | text | legacy display strings; prefer the `_new` columns |
| `start_time_new` / `end_time_new` | timestamptz | actual start/end |
| `is_cancelled` | boolean | not null, default false |
| `special_notes` | text | |
| `description` | text | |
| `booking_url` | text | |
| `pricing_unit` | text | `Per Person`, `Per Mother/Daughter Pair` |
| `registration_opens` | timestamptz | |
| `available_spots` | integer | **total capacity** (see above) |
| `waiver_url` | text | |
| `synced_to_zoho` | boolean | unused |

### bookings

One purchase/registration by a contact, for one or more participants.

| Column | Type | Notes |
| --- | --- | --- |
| `booking_id` | bigint | not null, auto-number, unique |
| `class_schedule_id` | uuid | → `class_schedules.id` |
| `booking_date` | timestamptz | when the booking was created |
| `status` | text | `Pending Payment`, `Confirmed`, `Cancelled`, `Refunded`, `Aborted` |
| `contact_first_name`, `contact_last_name`, `contact_email`, `contact_phone` | text | the person who booked |
| `contact_is_participant` | boolean | not null, default false |
| `number_of_participants` | integer | used for capacity |
| `total_amount` | numeric(10,2) | |
| `stripe_payment_intent_id`, `stripe_checkout_session_id` | text | |
| `payment_status` | text | `Pending`, `Completed`, `Refunded`, `Failed`, `Expired`, `Prepaid` |
| `payment_date` | timestamptz | |
| `payment_notes` | text | |
| `age_validation_status` | text | `Valid`, `Needs Review` |
| `validation_notes` | text | |
| `refund_status` | text | `None`, `Partial`, `Full` |
| `refund_amount` | numeric(10,2) | |
| `refund_date` | timestamptz | |
| `refund_reason` | text | `Customer Request`, `Class Cancelled`, `Other` |
| `refund_notes` | text | |
| `participants_json` | text | unused |
| `hold_expires_at` | timestamptz | unused |
| `zoho_synced` | boolean | unused |
| `confirmation_email_*`, `reminder_email_*` | | `_id` text, `_status` text (`Sent`, `Delivered`, `Delayed`, `Bounced`, `Spam`, `Opened`, `Clicked`), `_sent_at`, `_delivered_at`, `_clicked_at` timestamptz. Updated by the Resend webhook. |
| `followup_email_*` | | same columns; `_status` is free text |
| `email_unsubscribed` | boolean | not null, default false |
| `email_unsubscribed_at` | timestamptz | |
| `reminder_sms_*`, `preclass_sms_*` | | `_id` text, `_status` text (`Sent`, `Delivered`, `Failed`, `Undelivered`), `_sent_at`, `_delivered_at` timestamptz. Updated by the Twilio webhook. |
| `sms_unsubscribed` | boolean | not null, default false |
| `sms_unsubscribed_at`, `sms_consent_date`, `sms_opted_out_date` | timestamptz | |
| `original_participant_count` | integer | reschedules (see above) |
| `offshoot_booking_ids` | text | comma-separated child booking uuids |
| `original_booking_id` | text | parent booking uuid |
| `reschedule_status` | text | `Pending Reschedule` |
| `reschedule_notes` | text | |

Indexes: `class_schedule_id`, `status`, `contact_email`, `contact_phone`,
`stripe_checkout_session_id`, `stripe_payment_intent_id`.

### participants

A person attending under a booking. Deleted automatically when their booking
is deleted.

| Column | Type | Notes |
| --- | --- | --- |
| `participant_id` | bigint | not null, auto-number, unique |
| `booking_id` | uuid | → `bookings.id` (cascade) |
| `first_name`, `last_name` | text | not null |
| `age_group` | text | `Under 12`, `12-15`, `16+` |
| `participant_number` | integer | position within the booking |
| `special_needs`, `guardian_name`, `dietary_requirements` | text | |
| `contact_email`, `emergency_contact_number` | text | |
| `attendance` | text | not null, default `Not Recorded`; `Not Recorded`, `Present`, `Absent` |
| `teaching_assistants` | text | unused |
| `confirmation_email_*`, `reminder_email_*` | | `_id`, `_status` (same values as bookings), `_sent_at`, `_delivered_at`, `_opened_at` |

### persons

Ongoing directory of people: students, parents, teaching assistants.

| Column | Type | Notes |
| --- | --- | --- |
| `name` | text | not null |
| `email`, `phone` | text | |
| `roles` | text[] | any of `Student`, `Parent`, `Teaching Assistant` |
| `status` | text | not null, default `Active`; `Active`, `Inactive` |
| `notes` | text | |
| `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_phone`, `emergency_contact_email` | text | |
| `source_participant_id` | uuid | → `participants.id`, set when converted from a participant |

### teaching_assignments

Which person (usually a teaching assistant) is assigned to which class
schedule.

| Column | Type | Notes |
| --- | --- | --- |
| `assignment_id` | bigint | not null, auto-number, unique |
| `person_id` | uuid | → `persons.id` |
| `class_schedule_id` | uuid | → `class_schedules.id` |
| `assignment_notes` | text | |

### satisfaction_surveys

Post-class survey responses.

| Column | Type | Notes |
| --- | --- | --- |
| `survey_id` | bigint | not null, auto-number, unique |
| `submission_date` | timestamptz | not null, default now() |
| `class_schedule_id` | uuid | → `class_schedules.id` |
| `first_name`, `last_name`, `email`, `phone` | text | |
| `q1_overall_experience` | text | `Excellent`, `Good`, `Neutral`, `Poor`, `Very Poor` |
| `q2_confidence_level` | text | `Very Confident`, `Somewhat Confident`, `Neutral`, `Not Very Confident`, `Not Confident at All` |
| `q3_most_valuable_part`, `q4_areas_for_improvement` | text | free text |
| `q5_would_recommend`, `q6_opt_in_future_communication` | text | `Yes`, `No` |
| `q7_willing_to_share_experience` | text | `Google/Yelp Review`, `Write Here`, `No`, `Private Feedback` |
| `q7_written_testimonial` | text | |
| `q7_review_platform_clicked` | text | `Google`, `Yelp`, `Both` |
| `preferred_contact_method` | text[] | any of `Phone`, `Text`, `Email` |
| `ip_address`, `user_agent` | text | |

### testimonials

Reviews shown on the website.

| Column | Type | Notes |
| --- | --- | --- |
| `testimonial_id` | text | Airtable "ID" label |
| `name` | text | |
| `content` | text | not null |
| `rating` | text | `1`–`5` (stored as text) |
| `class_type` | text | `Public Classes`, `Private Sessions`, `Corporate Training`, `Community Programs` |
| `platform` | text | `google`, `yelp`, `facebook`, `trustpilot`, `linkedin`, `nextdoor`, `website`, `survey` |
| `review_date` | date | |
| `profile_picture`, `platform_screenshot` | jsonb | Airtable attachment metadata (array of `{url, filename, ...}`) |
| `original_review_url`, `profile_image_url` | text | |
| `is_featured`, `is_published` | boolean | not null, default false |
| `status` | text | not null, default `Active`; `Active`, `Hidden`, `Archived` |
| `internal_notes` | text | |
| `homepage_position` | text | `Quote 1`–`Quote 6`, `None`, `cbo1`, `cbo2`, `corporate1`, `corporate2` |

### form_submissions

Inquiries from the website contact forms.

| Column | Type | Notes |
| --- | --- | --- |
| `submission_id` | bigint | not null, auto-number, unique |
| `first_name`, `last_name`, `email`, `phone` | text | |
| `form_type` | text | `Private Training`, `Workplace Safety`, `Community Organizations` |
| `submitted_date` | timestamptz | |
| `status` | text | default `New`; `New`, `Contacted`, `Scheduled`, `Converted`, `Closed` |
| `newsletter_signup` | boolean | not null, default false |
| `notes` | text | |
| `follow_up_date` | date | |
| `web_lead_message` | text | |
| `city`, `state`, `organization`, `title` | text | |

### categories

FAQ categories.

| Column | Type | Notes |
| --- | --- | --- |
| `category_name` | text | not null |
| `display_order` | integer | |
| `is_active` | boolean | not null, default true |
| `description` | text | |
| `faq_copy`, `whattoexpect_content_cwc_15plus_copy` | text | unused |

### faq

| Column | Type | Notes |
| --- | --- | --- |
| `faq_id` | bigint | not null, auto-number, unique |
| `question`, `answer` | text | not null |
| `category_id` | uuid | → `categories.id` |
| `question_order` | integer | |
| `is_published` | boolean | not null, default false |
| `categories_copy` | text | unused |

### waiver_holding_table

Legacy WaiverSign import; not read by the app.

| Column | Type | Notes |
| --- | --- | --- |
| `name` | text | not null |
| `notes`, `assignee` | text | |
| `status` | text | `Todo`, `In progress`, `Done` |
| `attachments` | jsonb | |
| `attachment_summary`, `document_id`, `document_name` | text | |
| `first_name`, `last_name`, `email`, `phone` | text | |
| `date_of_birth` | date | |
| `street_address`, `city`, `state`, `zip_code` | text | |
| `completed_date` | timestamptz | |
| `waiver_url` | text | |
| `guardian_send_email`, `guardian_send_sms`, `is_adult` | boolean | not null, default false |
| `course_location`, `emergency_contact_name`, `emergency_contact_phone`, `referral_source` | text | |

### keepalive

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer | primary key, always 1 |
| `updated_at` | timestamptz | written every few days to keep the project awake |
