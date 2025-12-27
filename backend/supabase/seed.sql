-- Seed Data

-- Organizations
INSERT INTO organizations (org_id, org_name, org_description, org_contact_email, org_social_link, org_logo) VALUES
('10000000-0000-0000-0000-000000000001', 'Computer Science Society', 'Official Computer Science Society of Universiti Sains Malaysia fostering innovation and technology excellence.', 'css@usm.my', 'https://facebook.com/cssusm', NULL),
('10000000-0000-0000-0000-000000000002', 'Kelab Sukan USM', 'Official sports club of Universiti Sains Malaysia promoting physical fitness and competitive sports among students.', 'kelab.sukan@usm.my', 'https://facebook.com/kelabsukanusm', NULL),
('10000000-0000-0000-0000-000000000003', 'Kelab Robotik USM', 'Robotics club dedicated to advancing robotics knowledge and skills through hands-on projects.', 'robotics@student.usm.my', NULL, NULL),
('10000000-0000-0000-0000-000000000004', 'Persatuan Debat USM', 'Debate society promoting critical thinking and public speaking excellence.', 'debat@student.usm.my', NULL, NULL);

-- Users
INSERT INTO users (user_id, user_email, user_role, user_name, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'jm@student.usm.my', 'student', 'Ahmad Ibrahim', '2024-09-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000002', 'siti.nurhaliza@student.usm.my', 'student', 'Siti Nurhaliza', '2024-09-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000003', 'css@usm.my', 'organization_admin', 'Computer Science Society Admin', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000004', 'bhepa@usm.my', 'admin', 'BHEPA Administrator', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000005', 'kelab.sukan@usm.my', 'organization_admin', 'Kelab Sukan Admin', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000006', 'robotics@student.usm.my', 'organization_admin', 'Robotik Admin', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000007', 'debat@student.usm.my', 'organization_admin', 'Debat Admin', '2024-01-01T08:00:00Z');

-- Students
INSERT INTO students (user_id, matric_num) VALUES
('00000000-0000-0000-0000-000000000001', '165432'),
('00000000-0000-0000-0000-000000000002', '165433');

-- Organization Admins
INSERT INTO organization_admins (user_id, org_id, user_position) VALUES
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'President'),
('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'President'),
('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'President'),
('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'President');

-- Admins
INSERT INTO admins (user_id, admin_role) VALUES
('00000000-0000-0000-0000-000000000004', 'Super Admin');

-- Event Requests (Proposals)
INSERT INTO event_requests (event_request_id, org_id, user_id, status, submitted_at) VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'published', '2024-12-01T08:00:00Z'),
('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-11-15T08:00:00Z'),
('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-12-10T08:00:00Z'),
('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'published', '2024-12-05T08:00:00Z'),
('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-12-20T08:00:00Z'),
('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'published', '2024-12-15T08:00:00Z');

-- Events
INSERT INTO events (event_id, event_name, event_date, event_description, event_venue, start_time, end_time, end_date, capacity, category, registered_count, event_request_id) VALUES
('20000000-0000-0000-0000-000000000001', 'USM Sports Carnival 2025', '2026-02-15', 'Annual sports carnival featuring various competitive sports including football, basketball, badminton, and track & field events. Join us for a week of athletic excellence!', 'USM Main Campus Sports Complex', '08:00', '18:00', '2026-02-22', 500, 'sport', 342, '50000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002', 'HackUSM 2025 - National Hackathon', '2026-03-01', '48-hour national hackathon bringing together the brightest minds to solve real-world problems using technology. Prizes worth RM50,000!', 'School of Computer Sciences, USM', '09:00', '17:00', '2026-03-03', 200, 'competition', 156, '50000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000003', 'Introduction to Arduino Workshop', '2026-01-20', 'Beginner-friendly workshop covering Arduino basics, circuit design, and simple robotics projects. All materials provided!', 'Engineering Lab 3, USM', '14:00', '17:00', '2026-01-20', 50, 'workshop', 48, '50000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000004', 'National Debate Championship 2025', '2026-04-10', 'Premier debating competition featuring teams from universities across Malaysia. Topics cover current affairs, policy, and philosophy.', 'USM Dewan Tuanku Syed Putra', '09:00', '18:00', '2026-04-12', 300, 'competition', 87, '50000000-0000-0000-0000-000000000004'),
('20000000-0000-0000-0000-000000000005', 'Career Fair: Tech Industry Insights', '2026-02-05', 'Connect with leading tech companies, learn about career opportunities, and attend industry talks by professionals.', 'Dewan Utama USM', '10:00', '16:00', '2026-02-05', 400, 'talk', 312, '50000000-0000-0000-0000-000000000005'),
('20000000-0000-0000-0000-000000000006', 'Futsal Tournament - Inter-Faculty', '2026-01-25', 'Exciting inter-faculty futsal tournament. Form your team and compete for the championship trophy!', 'USM Indoor Sports Hall', '18:00', '22:00', '2026-01-28', 150, 'sport', 120, '50000000-0000-0000-0000-000000000006');

-- Registrations
INSERT INTO registrations (event_id, user_id, attendance, event_status, registration_date) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'absent', 'published', '2024-12-20T10:30:00Z'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'absent', 'published', '2024-12-18T14:20:00Z'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'present', 'published', '2024-12-12T09:15:00Z'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'absent', 'published', '2024-12-22T16:45:00Z');

-- Payments
INSERT INTO payments (payment_id, event_id, user_id, payment_amount, payment_status, payment_date) VALUES
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 50.00, 'paid', '2024-12-18T14:20:00Z'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 20.00, 'paid', '2024-12-12T09:15:00Z');

-- MyCSD Requests (Organizer requests MyCSD points for an event)
INSERT INTO mycsd_requests (mr_id, user_id, event_id, status) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'approved'), -- Arduino Workshop
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'approved'), -- Sports Carnival
('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'approved'); -- HackUSM

-- MyCSD Records
-- Use fixed scores based on level: kampus=2, negeri_universiti=4, antarabangsa=8
INSERT INTO mycsd_records (record_id, mycsd_score, mycsd_type) VALUES
('40000000-0000-0000-0000-000000000001', 2, 'event'),
('40000000-0000-0000-0000-000000000002', 4, 'event'),
('40000000-0000-0000-0000-000000000003', 8, 'event');

-- Event MyCSD
INSERT INTO event_mycsd (record_id, mycsd_category, event_level, mr_id) VALUES
('40000000-0000-0000-0000-000000000001', 'REKA CIPTA DAN INOVASI', 'kampus', '60000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000002', 'SUKAN/REKREASI/SOSIALISASI', 'negeri_universiti', '60000000-0000-0000-0000-000000000002'),
('40000000-0000-0000-0000-000000000003', 'REKA CIPTA DAN INOVASI', 'antarabangsa', '60000000-0000-0000-0000-000000000003');

-- MyCSD Logs
INSERT INTO mycsd_logs (matric_no, record_id, score, position) VALUES
('165432', '40000000-0000-0000-0000-000000000001', 2, 'participant'),
('165432', '40000000-0000-0000-0000-000000000002', 4, 'participant'),
('165432', '40000000-0000-0000-0000-000000000003', 8, 'participant');

-- Mark events with MyCSD and store the computed points (helps UI/queries that read events.mycsd_points)
UPDATE events SET has_mycsd = true, mycsd_level = 'kampus', mycsd_points = 2 WHERE event_id = '20000000-0000-0000-0000-000000000003';
UPDATE events SET has_mycsd = true, mycsd_level = 'negeri_universiti', mycsd_points = 4 WHERE event_id = '20000000-0000-0000-0000-000000000001';
UPDATE events SET has_mycsd = true, mycsd_level = 'antarabangsa', mycsd_points = 8 WHERE event_id = '20000000-0000-0000-0000-000000000002';
