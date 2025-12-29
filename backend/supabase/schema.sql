-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and types to ensure a clean slate
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS mycsd_logs CASCADE;
DROP TABLE IF EXISTS event_mycsd CASCADE;
DROP TABLE IF EXISTS organization_mycsd CASCADE;
DROP TABLE IF EXISTS mycsd_records CASCADE;
DROP TABLE IF EXISTS mycsd_requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_requests CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS organization_admins CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS mycsd_type_enum CASCADE;
DROP TYPE IF EXISTS mycsd_position_enum CASCADE;
DROP TYPE IF EXISTS mycsd_status_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS attendance_status_enum CASCADE;
DROP TYPE IF EXISTS event_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;

-- Enums
CREATE TYPE user_role_enum AS ENUM ('student', 'organization_admin', 'admin');
CREATE TYPE event_status_enum AS ENUM ('draft', 'pending', 'approved', 'rejected', 'revision_needed', 'published', 'completed', 'cancelled');
CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'excused');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE mycsd_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE mycsd_type_enum AS ENUM ('event', 'organization');
CREATE TYPE mycsd_position_enum AS ENUM ('Pengikut', 'Peserta', 'AJK Kecil', 'AJK Tertinggi', 'Pengarah');

-- 1. USER (Base Entity)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT UNIQUE NOT NULL,
    user_password TEXT,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    user_role user_role_enum NOT NULL
);

-- 2. ORGANIZATION
CREATE TABLE organizations (
    org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_name TEXT NOT NULL,
    org_description TEXT,
    org_contact_email TEXT,
    org_social_link TEXT,
    org_logo TEXT
);

-- 3. STUDENT (Inherits from USER)
CREATE TABLE students (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    matric_num TEXT UNIQUE NOT NULL
);

-- 4. ORGANIZATION_ADMIN (Inherits from USER)
CREATE TABLE organization_admins (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(org_id),
    user_position TEXT
);

-- 5. ADMIN (Inherits from USER)
CREATE TABLE admins (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    admin_role TEXT
);

-- 6. EVENT_REQUEST (Proposal)
CREATE TABLE event_requests (
    event_request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_request_file TEXT,
    org_id UUID REFERENCES organizations(org_id),
    user_id UUID REFERENCES users(user_id),
    status event_status_enum DEFAULT 'pending',
    admin_notes TEXT,
    committee_members JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EVENT
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_description TEXT,
    event_venue TEXT,
    event_request_id UUID REFERENCES event_requests(event_request_id),
    start_time TIME,
    end_time TIME,
    end_date DATE,
    capacity INT DEFAULT 0,
    banner_image TEXT,
    category TEXT,
    registered_count INT DEFAULT 0,
    objectives TEXT[],
    links JSONB,
    has_mycsd BOOLEAN DEFAULT false,
    mycsd_category TEXT,
    mycsd_level TEXT,
    mycsd_points INT,
    agenda TEXT[],
    committee_members JSONB DEFAULT '[]'::jsonb,
    is_mycsd_claimed BOOLEAN DEFAULT false
);

-- 8. REGISTRATION
CREATE TABLE registrations (
    event_id UUID REFERENCES events(event_id),
    user_id UUID REFERENCES users(user_id),
    attendance attendance_status_enum,
    event_status event_status_enum,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- 9. PAYMENT
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(event_id),
    user_id UUID REFERENCES users(user_id),
    payment_amount NUMERIC(10, 2),
    payment_method TEXT,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_status payment_status_enum DEFAULT 'pending',
    proof_of_payment TEXT
);

-- 10. MYCSD_REQUEST
CREATE TABLE mycsd_requests (
    mr_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    event_id UUID REFERENCES events(event_id),
    lk_document TEXT,
    status mycsd_status_enum DEFAULT 'pending'
);

-- 11. MYCSD_RECORD (Base Entity)
CREATE TABLE mycsd_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mycsd_score INT,
    mycsd_type mycsd_type_enum
);

-- 12. ORGANIZATION_MYCSD (Inherits from MYCSD_RECORD)
CREATE TABLE organization_mycsd (
    record_id UUID PRIMARY KEY REFERENCES mycsd_records(record_id) ON DELETE CASCADE,
    org_role TEXT,
    role_level TEXT,
    role_score INT,
    org_id UUID REFERENCES organizations(org_id)
);

-- 13. EVENT_MYCSD (Inherits from MYCSD_RECORD)
CREATE TABLE event_mycsd (
    record_id UUID PRIMARY KEY REFERENCES mycsd_records(record_id) ON DELETE CASCADE,
    mycsd_category TEXT,
    event_level TEXT,
    mr_id UUID REFERENCES mycsd_requests(mr_id)
);

-- 14. MYCSD_LOG
CREATE TABLE mycsd_logs (
    matric_no TEXT REFERENCES students(matric_num),
    record_id UUID REFERENCES mycsd_records(record_id),
    score INT,
    position mycsd_position_enum,
    PRIMARY KEY (matric_no, record_id)
);

-- 15. NOTIFICATIONS
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycsd_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycsd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_mycsd ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_mycsd ENABLE ROW LEVEL SECURITY;
ALTER TABLE mycsd_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for development
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON organizations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON registrations FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON registrations FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON students FOR SELECT USING (true);
CREATE POLICY "Public read access" ON organization_admins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON admins FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_requests FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON event_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON event_requests FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON events FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON mycsd_requests FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON mycsd_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON mycsd_requests FOR UPDATE USING (true);

-- FIX: Added insert access for record tables
CREATE POLICY "Public read access" ON mycsd_records FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON mycsd_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON organization_mycsd FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON organization_mycsd FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON event_mycsd FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON event_mycsd FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON mycsd_logs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON mycsd_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON notifications FOR UPDATE USING (true);

-- Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('event-banners', 'event-banners', true),
  ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id IN ('event-banners', 'documents') );

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id IN ('event-banners', 'documents') );

DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id IN ('event-banners', 'documents') );

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id IN ('event-banners', 'documents') );

-- Triggers
CREATE OR REPLACE FUNCTION update_event_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE events
    SET registered_count = registered_count + 1
    WHERE event_id = NEW.event_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE events
    SET registered_count = registered_count - 1
    WHERE event_id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_count_trigger ON registrations;
CREATE TRIGGER update_event_count_trigger
AFTER INSERT OR DELETE ON registrations
FOR EACH ROW
EXECUTE FUNCTION update_event_registered_count();

-- Create a function to automatically mark events as completed
CREATE OR REPLACE FUNCTION mark_events_completed()
RETURNS void AS $$
BEGIN
  -- Update events that have passed their end date/time
  -- We compare against the current time in Asia/Kuala_Lumpur timezone to ensure accurate completion
  
  UPDATE event_requests er
  SET status = 'completed'
  FROM events e
  WHERE er.event_request_id = e.event_request_id
    AND er.status IN ('published', 'approved') 
    AND (
      (e.end_date < (current_timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')::date)
      OR
      (
        e.end_date = (current_timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')::date
        AND
        e.end_time < (current_timestamp AT TIME ZONE 'Asia/Kuala_Lumpur')::time
      )
    );
END;
$$ LANGUAGE plpgsql;