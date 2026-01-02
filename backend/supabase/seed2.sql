-- Clear existing data (handled by schema.sql drop/create usually, but good practice if running on existing db)
-- user_id and org_id are manually assigned to ensure relationships are correct without variables

-- 1. Organizations (5 Clubs based on Computer Science / Tech theme typically, or generic)
INSERT INTO organizations (org_id, org_name, org_description, org_contact_email, org_social_link) VALUES
('10000000-0000-0000-0000-000000000001', 'Computer Science Society', 'Official CS Society', 'css@usm.my', 'fb.com/css'),
('10000000-0000-0000-0000-000000000002', 'USM Football Club', 'Promoting football spirits', 'football@usm.my', 'fb.com/usmfc'),
('10000000-0000-0000-0000-000000000003', 'Cultural & Arts Society', 'Preserving heritage', 'culture@usm.my', 'fb.com/culture'),
('10000000-0000-0000-0000-000000000004', 'Debate Club', 'Critical thinking and public speaking', 'debate@usm.my', 'fb.com/debate'),
('10000000-0000-0000-0000-000000000005', 'Red Crescent Society', 'Voluntary humanitarian organization', 'pbsm@usm.my', 'fb.com/pbsm');

-- 2. Users (11 Total)

-- 5 Students
INSERT INTO users (user_id, user_email, user_role, user_name, created_at) VALUES
('20000000-0000-0000-0000-000000000001', 'jm@student.usm.my', 'student', 'Ali Bin Abu', NOW()),
('20000000-0000-0000-0000-000000000002', 'cs@student.usm.my', 'student', 'Siti Aminah', NOW()),
('20000000-0000-0000-0000-000000000003', 'ben@student.usm.my', 'student', 'Chong Wei Hong', NOW()),
('20000000-0000-0000-0000-000000000004', 'choo@student.usm.my', 'student', 'Muthusamy A/L Raj', NOW()),
('20000000-0000-0000-0000-000000000005', 'demo@student.usm.my', 'student', 'Sarah Connor', NOW());

-- 1 BHEPA Admin
INSERT INTO users (user_id, user_email, user_role, user_name, created_at) VALUES
('30000000-0000-0000-0000-000000000001', 'admin@usm.my', 'admin', 'BHEPA Admin', NOW());

-- 5 Organization Admins
INSERT INTO users (user_id, user_email, user_role, user_name, created_at) VALUES
('40000000-0000-0000-0000-000000000001', 'css@usm.my', 'organization_admin', 'CSS President', NOW()),
('40000000-0000-0000-0000-000000000002', 'football@usm.my', 'organization_admin', 'Football Club President', NOW()),
('40000000-0000-0000-0000-000000000003', 'culture@usm.my', 'organization_admin', 'Cultural Soc President', NOW()),
('40000000-0000-0000-0000-000000000004', 'debate@usm.my', 'organization_admin', 'Debate President', NOW()),
('40000000-0000-0000-0000-000000000005', 'pbsm@usm.my', 'organization_admin', 'PBSM President', NOW());

-- 3. Student Details
INSERT INTO students (user_id, matric_num, faculty) VALUES
('20000000-0000-0000-0000-000000000001', '100001', 'School of Computer Sciences'),
('20000000-0000-0000-0000-000000000002', '100002', 'School of Management'),
('20000000-0000-0000-0000-000000000003', '100003', 'School of Biological Sciences'),
('20000000-0000-0000-0000-000000000004', '100004', 'School of Humanities'),
('20000000-0000-0000-0000-000000000005', '100005', 'School of Physics');

-- 4. Admin Details
INSERT INTO admins (user_id, admin_role) VALUES
('30000000-0000-0000-0000-000000000001', 'Super Admin');

-- 5. Organization Admin Details
INSERT INTO organization_admins (user_id, org_id, user_position) VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'President'),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'President'),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'President'),
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'President'),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'President');

-- 6. Sample Events (Optional but good to have some content)
INSERT INTO event_requests (event_request_id, org_id, user_id, status, submitted_at) VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'published', NOW());

INSERT INTO events (event_id, event_name, event_date, event_description, event_venue, start_time, end_time, capacity, category, registered_count, event_request_id, gallery) VALUES
('60000000-0000-0000-0000-000000000001', 'CS Night 2025', '2026-05-20', 'Annual CS Dinner', 'Dewan Budaya', '19:00', '23:00', 200, 'social', 0, '50000000-0000-0000-0000-000000000001', '{}');
