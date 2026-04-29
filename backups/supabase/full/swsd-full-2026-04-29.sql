


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "booking_id" bigint NOT NULL,
    "class_schedule_id" "uuid",
    "booking_date" timestamp with time zone,
    "status" "text",
    "contact_first_name" "text",
    "contact_last_name" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "contact_is_participant" boolean DEFAULT false NOT NULL,
    "number_of_participants" integer,
    "total_amount" numeric(10,2),
    "stripe_payment_intent_id" "text",
    "stripe_checkout_session_id" "text",
    "payment_status" "text",
    "payment_date" timestamp with time zone,
    "payment_notes" "text",
    "age_validation_status" "text",
    "validation_notes" "text",
    "refund_status" "text",
    "refund_amount" numeric(10,2),
    "refund_date" timestamp with time zone,
    "refund_reason" "text",
    "refund_notes" "text",
    "participants_json" "text",
    "hold_expires_at" timestamp with time zone,
    "zoho_synced" boolean DEFAULT false NOT NULL,
    "confirmation_email_id" "text",
    "confirmation_email_status" "text",
    "confirmation_email_sent_at" timestamp with time zone,
    "confirmation_email_delivered_at" timestamp with time zone,
    "confirmation_email_clicked_at" timestamp with time zone,
    "reminder_email_id" "text",
    "reminder_email_status" "text",
    "reminder_email_sent_at" timestamp with time zone,
    "reminder_email_delivered_at" timestamp with time zone,
    "reminder_email_clicked_at" timestamp with time zone,
    "followup_email_id" "text",
    "followup_email_status" "text",
    "followup_email_sent_at" timestamp with time zone,
    "followup_email_delivered_at" timestamp with time zone,
    "followup_email_clicked_at" timestamp with time zone,
    "email_unsubscribed" boolean DEFAULT false NOT NULL,
    "email_unsubscribed_at" timestamp with time zone,
    "reminder_sms_id" "text",
    "reminder_sms_status" "text",
    "reminder_sms_sent_at" timestamp with time zone,
    "reminder_sms_delivered_at" timestamp with time zone,
    "preclass_sms_id" "text",
    "preclass_sms_status" "text",
    "preclass_sms_sent_at" timestamp with time zone,
    "preclass_sms_delivered_at" timestamp with time zone,
    "sms_unsubscribed" boolean DEFAULT false NOT NULL,
    "sms_unsubscribed_at" timestamp with time zone,
    "sms_consent_date" timestamp with time zone,
    "sms_opted_out_date" timestamp with time zone,
    "original_participant_count" integer,
    "offshoot_booking_ids" "text",
    "original_booking_id" "text",
    "reschedule_status" "text",
    "reschedule_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bookings_age_validation_status_check" CHECK (("age_validation_status" = ANY (ARRAY['Valid'::"text", 'Needs Review'::"text"]))),
    CONSTRAINT "bookings_confirmation_email_status_check" CHECK (("confirmation_email_status" = ANY (ARRAY['Sent'::"text", 'Delivered'::"text", 'Delayed'::"text", 'Bounced'::"text", 'Spam'::"text", 'Opened'::"text", 'Clicked'::"text"]))),
    CONSTRAINT "bookings_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['Pending'::"text", 'Completed'::"text", 'Refunded'::"text", 'Failed'::"text", 'Expired'::"text", 'Prepaid'::"text"]))),
    CONSTRAINT "bookings_preclass_sms_status_check" CHECK (("preclass_sms_status" = ANY (ARRAY['Sent'::"text", 'Delivered'::"text", 'Failed'::"text", 'Undelivered'::"text"]))),
    CONSTRAINT "bookings_refund_reason_check" CHECK (("refund_reason" = ANY (ARRAY['Customer Request'::"text", 'Class Cancelled'::"text", 'Other'::"text"]))),
    CONSTRAINT "bookings_refund_status_check" CHECK (("refund_status" = ANY (ARRAY['None'::"text", 'Partial'::"text", 'Full'::"text"]))),
    CONSTRAINT "bookings_reminder_email_status_check" CHECK (("reminder_email_status" = ANY (ARRAY['Sent'::"text", 'Delivered'::"text", 'Delayed'::"text", 'Bounced'::"text", 'Spam'::"text", 'Opened'::"text", 'Clicked'::"text"]))),
    CONSTRAINT "bookings_reminder_sms_status_check" CHECK (("reminder_sms_status" = ANY (ARRAY['Sent'::"text", 'Delivered'::"text", 'Failed'::"text", 'Undelivered'::"text"]))),
    CONSTRAINT "bookings_reschedule_status_check" CHECK (("reschedule_status" = 'Pending Reschedule'::"text")),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['Pending Payment'::"text", 'Confirmed'::"text", 'Cancelled'::"text", 'Refunded'::"text", 'Aborted'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


ALTER TABLE "public"."bookings" ALTER COLUMN "booking_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bookings_booking_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "category_name" "text" NOT NULL,
    "display_order" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "description" "text",
    "faq_copy" "text",
    "whattoexpect_content_cwc_15plus_copy" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "schedule_id" bigint NOT NULL,
    "class_id" "uuid",
    "date" "date",
    "start_time" "text",
    "end_time" "text",
    "start_time_new" timestamp with time zone,
    "end_time_new" timestamp with time zone,
    "is_cancelled" boolean DEFAULT false NOT NULL,
    "special_notes" "text",
    "description" "text",
    "booking_url" "text",
    "pricing_unit" "text",
    "registration_opens" timestamp with time zone,
    "available_spots" integer,
    "waiver_url" "text",
    "synced_to_zoho" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "class_schedules_pricing_unit_check" CHECK (("pricing_unit" = ANY (ARRAY['Per Person'::"text", 'Per Mother/Daughter Pair'::"text"])))
);


ALTER TABLE "public"."class_schedules" OWNER TO "postgres";


ALTER TABLE "public"."class_schedules" ALTER COLUMN "schedule_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."class_schedules_schedule_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "class_id" "text",
    "class_name" "text" NOT NULL,
    "description" "text",
    "type" "text",
    "age_range" "text",
    "duration" integer,
    "max_participants" integer,
    "location" "text",
    "instructor" "text",
    "price" integer,
    "booking_method" "text",
    "registration_instructions" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "partner_organization" "text",
    "city" "text",
    "parking_instructions" "text",
    "parking_map_url" "text",
    "pricing_unit" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "classes_booking_method_check" CHECK (("booking_method" = ANY (ARRAY['External'::"text", 'Contact'::"text", 'SWSD website'::"text", 'Streetwise Self Defense'::"text"]))),
    CONSTRAINT "classes_city_check" CHECK (("city" = ANY (ARRAY['Walnut Creek'::"text", 'Pleasant Hill'::"text", 'Richmond'::"text", 'San Francisco'::"text", 'San Jose'::"text"]))),
    CONSTRAINT "classes_partner_organization_check" CHECK (("partner_organization" = ANY (ARRAY['City of Walnut Creek -- Arts & Recreation'::"text", 'Diablo Valley College'::"text", 'Streetwise Self Defense'::"text"]))),
    CONSTRAINT "classes_pricing_unit_check" CHECK (("pricing_unit" = ANY (ARRAY['Per Person'::"text", 'Per Mother/Daughter Pair'::"text"]))),
    CONSTRAINT "classes_type_check" CHECK (("type" = ANY (ARRAY['Public: Adult & Teen'::"text", 'Public: Mother & Daughter'::"text", 'Private'::"text", 'Corporate'::"text", 'Community: Mother & Daughter'::"text"])))
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faq" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "faq_id" bigint NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "category_id" "uuid",
    "question_order" integer,
    "is_published" boolean DEFAULT false NOT NULL,
    "categories_copy" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."faq" OWNER TO "postgres";


ALTER TABLE "public"."faq" ALTER COLUMN "faq_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."faq_faq_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "submission_id" bigint NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "form_type" "text",
    "submitted_date" timestamp with time zone,
    "status" "text" DEFAULT 'New'::"text",
    "newsletter_signup" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "follow_up_date" "date",
    "web_lead_message" "text",
    "city" "text",
    "state" "text",
    "organization" "text",
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "form_submissions_form_type_check" CHECK (("form_type" = ANY (ARRAY['Private Training'::"text", 'Workplace Safety'::"text", 'Community Organizations'::"text"]))),
    CONSTRAINT "form_submissions_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'Contacted'::"text", 'Scheduled'::"text", 'Converted'::"text", 'Closed'::"text"])))
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


ALTER TABLE "public"."form_submissions" ALTER COLUMN "submission_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."form_submissions_submission_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "participant_id" bigint NOT NULL,
    "booking_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "age_group" "text",
    "participant_number" integer,
    "special_needs" "text",
    "guardian_name" "text",
    "dietary_requirements" "text",
    "contact_email" "text",
    "emergency_contact_number" "text",
    "attendance" "text" DEFAULT 'Not Recorded'::"text" NOT NULL,
    "teaching_assistants" "text",
    "confirmation_email_id" "text",
    "confirmation_email_status" "text",
    "confirmation_email_sent_at" timestamp with time zone,
    "confirmation_email_delivered_at" timestamp with time zone,
    "confirmation_email_opened_at" timestamp with time zone,
    "reminder_email_id" "text",
    "reminder_email_status" "text",
    "reminder_email_sent_at" timestamp with time zone,
    "reminder_email_delivered_at" timestamp with time zone,
    "reminder_email_opened_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "participants_age_group_check" CHECK (("age_group" = ANY (ARRAY['Under 12'::"text", '12-15'::"text", '16+'::"text"]))),
    CONSTRAINT "participants_attendance_check" CHECK (("attendance" = ANY (ARRAY['Not Recorded'::"text", 'Present'::"text", 'Absent'::"text"]))),
    CONSTRAINT "participants_confirmation_email_status_check" CHECK (("confirmation_email_status" = ANY (ARRAY['Sent'::"text", 'Delivered'::"text", 'Delayed'::"text", 'Bounced'::"text", 'Spam'::"text", 'Opened'::"text", 'Clicked'::"text"]))),
    CONSTRAINT "participants_reminder_email_status_check" CHECK (("reminder_email_status" = ANY (ARRAY['Sent'::"text", 'Delivered'::"text", 'Delayed'::"text", 'Bounced'::"text", 'Spam'::"text", 'Opened'::"text", 'Clicked'::"text"])))
);


ALTER TABLE "public"."participants" OWNER TO "postgres";


ALTER TABLE "public"."participants" ALTER COLUMN "participant_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."participants_participant_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."persons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "roles" "text"[],
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "notes" "text",
    "emergency_contact_name" "text",
    "emergency_contact_relationship" "text",
    "emergency_contact_phone" "text",
    "emergency_contact_email" "text",
    "source_participant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "persons_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Inactive'::"text"])))
);


ALTER TABLE "public"."persons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."satisfaction_surveys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "survey_id" bigint NOT NULL,
    "submission_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "class_schedule_id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "q1_overall_experience" "text",
    "q2_confidence_level" "text",
    "q3_most_valuable_part" "text",
    "q4_areas_for_improvement" "text",
    "q5_would_recommend" "text",
    "q6_opt_in_future_communication" "text",
    "q7_willing_to_share_experience" "text",
    "q7_written_testimonial" "text",
    "q7_review_platform_clicked" "text",
    "preferred_contact_method" "text"[],
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "satisfaction_surveys_q1_overall_experience_check" CHECK (("q1_overall_experience" = ANY (ARRAY['Excellent'::"text", 'Good'::"text", 'Neutral'::"text", 'Poor'::"text", 'Very Poor'::"text"]))),
    CONSTRAINT "satisfaction_surveys_q2_confidence_level_check" CHECK (("q2_confidence_level" = ANY (ARRAY['Very Confident'::"text", 'Somewhat Confident'::"text", 'Neutral'::"text", 'Not Very Confident'::"text", 'Not Confident at All'::"text"]))),
    CONSTRAINT "satisfaction_surveys_q5_would_recommend_check" CHECK (("q5_would_recommend" = ANY (ARRAY['Yes'::"text", 'No'::"text"]))),
    CONSTRAINT "satisfaction_surveys_q6_opt_in_future_communication_check" CHECK (("q6_opt_in_future_communication" = ANY (ARRAY['Yes'::"text", 'No'::"text"]))),
    CONSTRAINT "satisfaction_surveys_q7_review_platform_clicked_check" CHECK (("q7_review_platform_clicked" = ANY (ARRAY['Google'::"text", 'Yelp'::"text", 'Both'::"text"]))),
    CONSTRAINT "satisfaction_surveys_q7_willing_to_share_experience_check" CHECK (("q7_willing_to_share_experience" = ANY (ARRAY['Google/Yelp Review'::"text", 'Write Here'::"text", 'No'::"text", 'Private Feedback'::"text"])))
);


ALTER TABLE "public"."satisfaction_surveys" OWNER TO "postgres";


ALTER TABLE "public"."satisfaction_surveys" ALTER COLUMN "survey_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."satisfaction_surveys_survey_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."teaching_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "assignment_id" bigint NOT NULL,
    "person_id" "uuid",
    "class_schedule_id" "uuid",
    "assignment_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teaching_assignments" OWNER TO "postgres";


ALTER TABLE "public"."teaching_assignments" ALTER COLUMN "assignment_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."teaching_assignments_assignment_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "testimonial_id" "text",
    "name" "text",
    "content" "text" NOT NULL,
    "rating" "text",
    "class_type" "text",
    "platform" "text",
    "review_date" "date",
    "profile_picture" "jsonb",
    "platform_screenshot" "jsonb",
    "original_review_url" "text",
    "profile_image_url" "text",
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'Active'::"text" NOT NULL,
    "internal_notes" "text",
    "homepage_position" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "testimonials_class_type_check" CHECK (("class_type" = ANY (ARRAY['Public Classes'::"text", 'Private Sessions'::"text", 'Corporate Training'::"text", 'Community Programs'::"text"]))),
    CONSTRAINT "testimonials_homepage_position_check" CHECK (("homepage_position" = ANY (ARRAY['Quote 1'::"text", 'Quote 2'::"text", 'Quote 3'::"text", 'Quote 4'::"text", 'Quote 5'::"text", 'Quote 6'::"text", 'None'::"text", 'cbo1'::"text", 'cbo2'::"text", 'corporate1'::"text", 'corporate2'::"text"]))),
    CONSTRAINT "testimonials_platform_check" CHECK (("platform" = ANY (ARRAY['google'::"text", 'yelp'::"text", 'facebook'::"text", 'trustpilot'::"text", 'linkedin'::"text", 'nextdoor'::"text", 'website'::"text", 'survey'::"text"]))),
    CONSTRAINT "testimonials_rating_check" CHECK (("rating" = ANY (ARRAY['1'::"text", '2'::"text", '3'::"text", '4'::"text", '5'::"text"]))),
    CONSTRAINT "testimonials_status_check" CHECK (("status" = ANY (ARRAY['Active'::"text", 'Hidden'::"text", 'Archived'::"text"])))
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waiver_holding_table" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "airtable_record_id" "text",
    "name" "text" NOT NULL,
    "notes" "text",
    "assignee" "text",
    "status" "text",
    "attachments" "jsonb",
    "attachment_summary" "text",
    "document_id" "text",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "document_name" "text",
    "phone" "text",
    "date_of_birth" "date",
    "street_address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "completed_date" timestamp with time zone,
    "waiver_url" "text",
    "guardian_send_email" boolean DEFAULT false NOT NULL,
    "guardian_send_sms" boolean DEFAULT false NOT NULL,
    "is_adult" boolean DEFAULT false NOT NULL,
    "course_location" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "referral_source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "waiver_holding_table_status_check" CHECK (("status" = ANY (ARRAY['Todo'::"text", 'In progress'::"text", 'Done'::"text"])))
);


ALTER TABLE "public"."waiver_holding_table" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_booking_id_key" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_schedule_id_key" UNIQUE ("schedule_id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."faq"
    ADD CONSTRAINT "faq_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."faq"
    ADD CONSTRAINT "faq_faq_id_key" UNIQUE ("faq_id");



ALTER TABLE ONLY "public"."faq"
    ADD CONSTRAINT "faq_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_submission_id_key" UNIQUE ("submission_id");



ALTER TABLE ONLY "public"."participants"
    ADD CONSTRAINT "participants_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."participants"
    ADD CONSTRAINT "participants_participant_id_key" UNIQUE ("participant_id");



ALTER TABLE ONLY "public"."participants"
    ADD CONSTRAINT "participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."persons"
    ADD CONSTRAINT "persons_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."persons"
    ADD CONSTRAINT "persons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."satisfaction_surveys"
    ADD CONSTRAINT "satisfaction_surveys_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."satisfaction_surveys"
    ADD CONSTRAINT "satisfaction_surveys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."satisfaction_surveys"
    ADD CONSTRAINT "satisfaction_surveys_survey_id_key" UNIQUE ("survey_id");



ALTER TABLE ONLY "public"."teaching_assignments"
    ADD CONSTRAINT "teaching_assignments_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."teaching_assignments"
    ADD CONSTRAINT "teaching_assignments_assignment_id_key" UNIQUE ("assignment_id");



ALTER TABLE ONLY "public"."teaching_assignments"
    ADD CONSTRAINT "teaching_assignments_person_id_class_schedule_id_key" UNIQUE ("person_id", "class_schedule_id");



ALTER TABLE ONLY "public"."teaching_assignments"
    ADD CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waiver_holding_table"
    ADD CONSTRAINT "waiver_holding_table_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."waiver_holding_table"
    ADD CONSTRAINT "waiver_holding_table_pkey" PRIMARY KEY ("id");



CREATE INDEX "bookings_class_schedule_id_idx" ON "public"."bookings" USING "btree" ("class_schedule_id");



CREATE INDEX "bookings_contact_email_idx" ON "public"."bookings" USING "btree" ("contact_email");



CREATE INDEX "bookings_contact_phone_idx" ON "public"."bookings" USING "btree" ("contact_phone");



CREATE INDEX "bookings_hold_expires_at_idx" ON "public"."bookings" USING "btree" ("hold_expires_at") WHERE ("status" = 'Pending Payment'::"text");



CREATE INDEX "bookings_status_idx" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "bookings_stripe_payment_intent_idx" ON "public"."bookings" USING "btree" ("stripe_payment_intent_id");



CREATE INDEX "bookings_stripe_session_id_idx" ON "public"."bookings" USING "btree" ("stripe_checkout_session_id");



CREATE INDEX "categories_display_order_idx" ON "public"."categories" USING "btree" ("display_order");



CREATE INDEX "categories_is_active_idx" ON "public"."categories" USING "btree" ("is_active");



CREATE INDEX "class_schedules_class_id_idx" ON "public"."class_schedules" USING "btree" ("class_id");



CREATE INDEX "class_schedules_date_idx" ON "public"."class_schedules" USING "btree" ("date");



CREATE INDEX "class_schedules_is_cancelled_idx" ON "public"."class_schedules" USING "btree" ("is_cancelled");



CREATE INDEX "classes_is_active_idx" ON "public"."classes" USING "btree" ("is_active");



CREATE INDEX "classes_type_idx" ON "public"."classes" USING "btree" ("type");



CREATE INDEX "faq_category_id_idx" ON "public"."faq" USING "btree" ("category_id");



CREATE INDEX "faq_is_published_idx" ON "public"."faq" USING "btree" ("is_published");



CREATE INDEX "form_submissions_email_idx" ON "public"."form_submissions" USING "btree" ("email");



CREATE INDEX "form_submissions_form_type_idx" ON "public"."form_submissions" USING "btree" ("form_type");



CREATE INDEX "form_submissions_status_idx" ON "public"."form_submissions" USING "btree" ("status");



CREATE INDEX "participants_booking_id_idx" ON "public"."participants" USING "btree" ("booking_id");



CREATE INDEX "persons_email_idx" ON "public"."persons" USING "btree" ("email");



CREATE INDEX "persons_phone_idx" ON "public"."persons" USING "btree" ("phone");



CREATE INDEX "persons_roles_idx" ON "public"."persons" USING "gin" ("roles");



CREATE INDEX "persons_status_idx" ON "public"."persons" USING "btree" ("status");



CREATE INDEX "satisfaction_surveys_class_schedule_id_idx" ON "public"."satisfaction_surveys" USING "btree" ("class_schedule_id");



CREATE INDEX "satisfaction_surveys_email_idx" ON "public"."satisfaction_surveys" USING "btree" ("email");



CREATE INDEX "teaching_assignments_class_schedule_id_idx" ON "public"."teaching_assignments" USING "btree" ("class_schedule_id");



CREATE INDEX "teaching_assignments_person_id_idx" ON "public"."teaching_assignments" USING "btree" ("person_id");



CREATE INDEX "testimonials_is_featured_idx" ON "public"."testimonials" USING "btree" ("is_featured");



CREATE INDEX "testimonials_is_published_idx" ON "public"."testimonials" USING "btree" ("is_published");



CREATE INDEX "testimonials_status_idx" ON "public"."testimonials" USING "btree" ("status");



CREATE INDEX "waiver_holding_table_email_idx" ON "public"."waiver_holding_table" USING "btree" ("email");



CREATE INDEX "waiver_holding_table_status_idx" ON "public"."waiver_holding_table" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "class_schedules_updated_at" BEFORE UPDATE ON "public"."class_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "classes_updated_at" BEFORE UPDATE ON "public"."classes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "faq_updated_at" BEFORE UPDATE ON "public"."faq" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "form_submissions_updated_at" BEFORE UPDATE ON "public"."form_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "participants_updated_at" BEFORE UPDATE ON "public"."participants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "persons_updated_at" BEFORE UPDATE ON "public"."persons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "satisfaction_surveys_updated_at" BEFORE UPDATE ON "public"."satisfaction_surveys" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "teaching_assignments_updated_at" BEFORE UPDATE ON "public"."teaching_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "testimonials_updated_at" BEFORE UPDATE ON "public"."testimonials" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "waiver_holding_table_updated_at" BEFORE UPDATE ON "public"."waiver_holding_table" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_class_schedule_id_fkey" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."class_schedules"
    ADD CONSTRAINT "class_schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."faq"
    ADD CONSTRAINT "faq_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."participants"
    ADD CONSTRAINT "participants_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."persons"
    ADD CONSTRAINT "persons_source_participant_id_fkey" FOREIGN KEY ("source_participant_id") REFERENCES "public"."participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."satisfaction_surveys"
    ADD CONSTRAINT "satisfaction_surveys_class_schedule_id_fkey" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teaching_assignments"
    ADD CONSTRAINT "teaching_assignments_class_schedule_id_fkey" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."teaching_assignments"
    ADD CONSTRAINT "teaching_assignments_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE RESTRICT;



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."faq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."persons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."satisfaction_surveys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teaching_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waiver_holding_table" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bookings_booking_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bookings_booking_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bookings_booking_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."class_schedules" TO "anon";
GRANT ALL ON TABLE "public"."class_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."class_schedules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."class_schedules_schedule_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."class_schedules_schedule_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."class_schedules_schedule_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."faq" TO "anon";
GRANT ALL ON TABLE "public"."faq" TO "authenticated";
GRANT ALL ON TABLE "public"."faq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."faq_faq_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."faq_faq_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."faq_faq_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."form_submissions_submission_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."form_submissions_submission_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."form_submissions_submission_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."participants" TO "anon";
GRANT ALL ON TABLE "public"."participants" TO "authenticated";
GRANT ALL ON TABLE "public"."participants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."participants_participant_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."participants_participant_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."participants_participant_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."persons" TO "anon";
GRANT ALL ON TABLE "public"."persons" TO "authenticated";
GRANT ALL ON TABLE "public"."persons" TO "service_role";



GRANT ALL ON TABLE "public"."satisfaction_surveys" TO "anon";
GRANT ALL ON TABLE "public"."satisfaction_surveys" TO "authenticated";
GRANT ALL ON TABLE "public"."satisfaction_surveys" TO "service_role";



GRANT ALL ON SEQUENCE "public"."satisfaction_surveys_survey_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."satisfaction_surveys_survey_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."satisfaction_surveys_survey_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."teaching_assignments" TO "anon";
GRANT ALL ON TABLE "public"."teaching_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."teaching_assignments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teaching_assignments_assignment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teaching_assignments_assignment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teaching_assignments_assignment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."waiver_holding_table" TO "anon";
GRANT ALL ON TABLE "public"."waiver_holding_table" TO "authenticated";
GRANT ALL ON TABLE "public"."waiver_holding_table" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































