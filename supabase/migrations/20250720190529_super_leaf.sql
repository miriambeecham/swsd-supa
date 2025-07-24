/*
  # Initial Schema for Streetwise Self Defense

  1. New Tables
    - `classes` - Class schedules and information
    - `bookings` - User bookings for classes
    - `testimonials` - Customer testimonials
    - `content_pages` - Dynamic page content
    - `corporate_clients` - Corporate client logos and info
    - `cbo_partners` - CBO partner logos and info
    - `instructors` - Instructor information
    - `contact_inquiries` - Contact form submissions

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access where appropriate
    - Add policies for authenticated admin access
*/

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('mothers-daughters', 'adult-teen', 'corporate', 'cbo')),
  age_range text,
  duration_minutes integer DEFAULT 90,
  max_participants integer DEFAULT 20,
  price_cents integer DEFAULT 0,
  instructor_id uuid,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Class schedules
CREATE TABLE IF NOT EXISTS class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  available_spots integer DEFAULT 20,
  is_cancelled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES class_schedules(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  participant_name text NOT NULL,
  participant_email text NOT NULL,
  participant_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  amount_paid_cents integer,
  special_requirements text,
  created_at timestamptz DEFAULT now()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  content text NOT NULL,
  rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  class_type text,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content pages for easy editing
CREATE TABLE IF NOT EXISTS content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  meta_description text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Corporate clients
CREATE TABLE IF NOT EXISTS corporate_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- CBO partners
CREATE TABLE IF NOT EXISTS cbo_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Instructors
CREATE TABLE IF NOT EXISTS instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  photo_url text,
  certifications text[],
  is_lead_instructor boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Contact inquiries
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  city text,
  state text,
  message text,
  inquiry_type text DEFAULT 'general' CHECK (inquiry_type IN ('general', 'corporate', 'cbo', 'class')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbo_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read active classes" ON classes FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read class schedules" ON class_schedules FOR SELECT USING (true);
CREATE POLICY "Public can read published testimonials" ON testimonials FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read published content" ON content_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read corporate clients" ON corporate_clients FOR SELECT USING (true);
CREATE POLICY "Public can read CBO partners" ON cbo_partners FOR SELECT USING (true);
CREATE POLICY "Public can read active instructors" ON instructors FOR SELECT USING (is_active = true);

-- Booking policies
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Contact inquiry policies
CREATE POLICY "Anyone can submit contact inquiries" ON contact_inquiries FOR INSERT WITH CHECK (true);

-- Admin policies (you'll need to set up admin role)
CREATE POLICY "Admins can manage all data" ON classes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage schedules" ON class_schedules FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage bookings" ON bookings FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage testimonials" ON testimonials FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage content" ON content_pages FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage corporate clients" ON corporate_clients FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage CBO partners" ON cbo_partners FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage instructors" ON instructors FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can manage inquiries" ON contact_inquiries FOR ALL USING (auth.jwt() ->> 'role' = 'admin');