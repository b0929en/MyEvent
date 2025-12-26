-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and types to ensure a clean slate
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
DROP TYPE IF EXISTS mycsd_status_enum CASCADE;
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS attendance_status_enum CASCADE;
DROP TYPE IF EXISTS event_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;

-- Enums
CREATE TYPE user_role_enum AS ENUM ('student', 'organization_admin', 'admin');
CREATE TYPE event_status_enum AS ENUM ('draft', 'pending', 'approved', 'rejected', 'published', 'completed', 'cancelled');
CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'excused');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE mycsd_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE mycsd_type_enum AS ENUM ('event', 'organization');

-- 1. USER (Base Entity)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT UNIQUE NOT NULL,
    user_password TEXT, -- Note: In Supabase, auth is usually handled by auth.users, but keeping this for ERD compliance
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
    -- Additional attributes
    status event_status_enum DEFAULT 'pending',
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
    -- Additional attributes for functionality
    start_time TIME,
    end_time TIME,
    end_date DATE,
    capacity INT DEFAULT 0,
    banner_image TEXT,
    category TEXT,
    registered_count INT DEFAULT 0
);

-- 8. REGISTRATION
CREATE TABLE registrations (
    event_id UUID REFERENCES events(event_id),
    user_id UUID REFERENCES users(user_id),
    attendance attendance_status_enum,
    event_status event_status_enum, -- Status of the registration/event context
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
    event_type TEXT,
    event_level TEXT,
    mr_id UUID REFERENCES mycsd_requests(mr_id)
);

-- 14. MYCSD_LOG
CREATE TABLE mycsd_logs (
    matric_no TEXT REFERENCES students(matric_num),
    record_id UUID REFERENCES mycsd_records(record_id),
    score INT,
    position TEXT,
    PRIMARY KEY (matric_no, record_id)
);

-- RLS Policies (Basic Setup)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Public read access" ON mycsd_records FOR SELECT USING (true);
CREATE POLICY "Public read access" ON organization_mycsd FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_mycsd FOR SELECT USING (true);
CREATE POLICY "Public read access" ON mycsd_logs FOR SELECT USING (true);