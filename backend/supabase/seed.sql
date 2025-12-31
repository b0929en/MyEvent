-- Seed Data

-- Organizations
INSERT INTO organizations (org_id, org_name, org_description, org_contact_email, org_social_link, org_logo) VALUES
('10000000-0000-0000-0000-000000000001', 'Computer Science Society', 'Official Computer Science Society of Universiti Sains Malaysia fostering innovation and technology excellence.', 'css@usm.my', 'https://facebook.com/cssusm', NULL),
('10000000-0000-0000-0000-000000000002', 'Kelab Sukan USM', 'Official sports club of Universiti Sains Malaysia promoting physical fitness and competitive sports among students.', 'kelab.sukan@usm.my', 'https://facebook.com/kelabsukanusm', NULL),
('10000000-0000-0000-0000-000000000003', 'Kelab Robotik USM', 'Robotics club dedicated to advancing robotics knowledge and skills through hands-on projects.', 'robotics@student.usm.my', NULL, NULL),
('10000000-0000-0000-0000-000000000004', 'Persatuan Debat USM', 'Debate society promoting critical thinking and public speaking excellence.', 'debat@student.usm.my', NULL, NULL),
('10000000-0000-0000-0000-000000000005', 'Engineering Society', 'Fostering engineering excellence and innovation across all disciplines.', 'engsoc@usm.my', 'https://facebook.com/engsocusm', NULL),
('10000000-0000-0000-0000-000000000006', 'Arts & Culture Club', 'Preserving and promoting cultural heritage through arts, dance, and music.', 'artsculture@student.usm.my', NULL, NULL);

-- Users
INSERT INTO users (user_id, user_email, user_role, user_name, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'jm@student.usm.my', 'student', 'Ahmad Ibrahim', '2024-09-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000002', 'choo@student.usm.my', 'student', 'Siti Nurhaliza', '2024-09-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000008', 'ali@student.usm.my', 'student', 'Ali Bin Abu', '2024-09-05T08:00:00Z'),
('00000000-0000-0000-0000-000000000009', 'tan@student.usm.my', 'student', 'Tan Ah Kao', '2024-09-06T08:00:00Z'),
('00000000-0000-0000-0000-000000000010', 'muthu@student.usm.my', 'student', 'Muthusamy', '2024-09-07T08:00:00Z'),
('00000000-0000-0000-0000-000000000011', 'jessica@student.usm.my', 'student', 'Jessica Albert', '2024-09-08T08:00:00Z'),
('00000000-0000-0000-0000-000000000003', 'css@usm.my', 'organization_admin', 'Computer Science Society Admin', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000004', 'bhepa@usm.my', 'admin', 'BHEPA Administrator', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000005', 'kelab.sukan@usm.my', 'organization_admin', 'Kelab Sukan Admin', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000006', 'robotics@student.usm.my', 'organization_admin', 'Robotik Admin', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000007', 'debat@student.usm.my', 'organization_admin', 'Debat Admin', '2024-01-01T08:00:00Z'),
('00000000-0000-0000-0000-000000000012', 'engsoc@usm.my', 'organization_admin', 'EngSoc Admin', '2024-01-05T08:00:00Z'),
('00000000-0000-0000-0000-000000000013', 'artsculture@student.usm.my', 'organization_admin', 'Arts Culture Admin', '2024-01-06T08:00:00Z');

-- Students
INSERT INTO students (user_id, matric_num, faculty) VALUES
('00000000-0000-0000-0000-000000000001', '165432', 'Computer Sciences'),
('00000000-0000-0000-0000-000000000002', '165433', 'Education'),
('00000000-0000-0000-0000-000000000008', '165434', 'Engineering'),
('00000000-0000-0000-0000-000000000009', '165435', 'Management'),
('00000000-0000-0000-0000-000000000010', '165436', 'Humanities'),
('00000000-0000-0000-0000-000000000011', '165437', 'Social Sciences');

-- Organization Admins
INSERT INTO organization_admins (user_id, org_id, user_position) VALUES
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'President'),
('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'President'),
('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'President'),
('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'President'),
('00000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', 'President'),
('00000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006', 'President');

-- Admins
INSERT INTO admins (user_id, admin_role) VALUES
('00000000-0000-0000-0000-000000000004', 'Super Admin');

-- Event Requests (Proposals)
INSERT INTO event_requests (event_request_id, org_id, user_id, status, submitted_at, committee_members) VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'published', '2024-12-01T08:00:00Z', '[{"name": "Ahmad Ibrahim", "matricNumber": "165432", "position": "Head of Logistics", "email": "jm@student.usm.my", "faculty": "Computer Sciences"}]'::jsonb),
('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-11-15T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-12-10T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'published', '2024-12-05T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-12-20T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'published', '2024-12-15T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012', 'published', '2024-12-02T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000013', 'published', '2024-12-03T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-10-15T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012', 'pending', '2024-12-25T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012', 'published', '2024-12-05T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'published', '2024-12-06T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 'published', '2024-12-07T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000007', 'published', '2024-12-08T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'published', '2024-12-09T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000013', 'published', '2024-12-10T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-12-11T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012', 'published', '2024-12-12T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000013', 'published', '2024-12-13T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'published', '2024-12-14T08:00:00Z', '[]'::jsonb),
('50000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012', 'published', '2024-12-14T08:00:00Z', '[]'::jsonb);

-- Events
INSERT INTO events (event_id, event_name, event_date, event_description, event_venue, start_time, end_time, end_date, capacity, category, registered_count, event_request_id, committee_members) VALUES
('20000000-0000-0000-0000-000000000001', 'USM Sports Carnival 2025', '2026-02-15', 'Annual sports carnival featuring various competitive sports including football, basketball, badminton, and track & field events. Join us for a week of athletic excellence!', 'USM Main Campus Sports Complex', '08:00', '18:00', '2026-02-22', 500, 'sport', 342, '50000000-0000-0000-0000-000000000001', '[{"name": "Ahmad Ibrahim", "matricNumber": "165432", "position": "Head of Logistics", "email": "jm@student.usm.my", "faculty": "Computer Sciences"}]'::jsonb),
('20000000-0000-0000-0000-000000000002', 'HackUSM 2025 - National Hackathon', '2026-03-01', '48-hour national hackathon bringing together the brightest minds to solve real-world problems using technology. Prizes worth RM50,000!', 'School of Computer Sciences, USM', '09:00', '17:00', '2026-03-03', 200, 'competition', 156, '50000000-0000-0000-0000-000000000002', '[]'::jsonb),
('20000000-0000-0000-0000-000000000003', 'Introduction to Arduino Workshop', '2026-01-20', 'Beginner-friendly workshop covering Arduino basics, circuit design, and simple robotics projects. All materials provided!', 'Engineering Lab 3, USM', '14:00', '17:00', '2026-01-20', 50, 'workshop', 48, '50000000-0000-0000-0000-000000000003', '[]'::jsonb),
('20000000-0000-0000-0000-000000000004', 'National Debate Championship 2025', '2026-04-10', 'Premier debating competition featuring teams from universities across Malaysia. Topics cover current affairs, policy, and philosophy.', 'USM Dewan Tuanku Syed Putra', '09:00', '18:00', '2026-04-12', 300, 'competition', 87, '50000000-0000-0000-0000-000000000004', '[]'::jsonb),
('20000000-0000-0000-0000-000000000005', 'Career Fair: Tech Industry Insights', '2026-02-05', 'Connect with leading tech companies, learn about career opportunities, and attend industry talks by professionals.', 'Dewan Utama USM', '10:00', '16:00', '2026-02-05', 400, 'talk', 312, '50000000-0000-0000-0000-000000000005', '[]'::jsonb),
('20000000-0000-0000-0000-000000000006', 'Futsal Tournament - Inter-Faculty', '2026-01-25', 'Exciting inter-faculty futsal tournament. Form your team and compete for the championship trophy!', 'USM Indoor Sports Hall', '18:00', '22:00', '2026-01-28', 150, 'sport', 120, '50000000-0000-0000-0000-000000000006', '[]'::jsonb),
('20000000-0000-0000-0000-000000000007', 'Bridge Building Competition 2025', '2026-03-10', 'Test your engineering skills by building the strongest bridge using popsicle sticks.', 'Engineering School Hall', '09:00', '16:00', '2026-03-10', 100, 'competition', 45, '50000000-0000-0000-0000-000000000007', '[]'::jsonb),
('20000000-0000-0000-0000-000000000008', 'Cultural Night 2025', '2026-04-20', 'A night of mesmerizing performances celebrating our diverse cultures.', 'Dewan Budaya', '19:00', '23:00', '2026-04-20', 800, 'cultural', 200, '50000000-0000-0000-0000-000000000008', '[]'::jsonb),
('20000000-0000-0000-0000-000000000009', 'Programming Clinic: Python Basics', '2024-11-20', 'Learn the basics of Python programming in this hands-on workshop.', 'Computer Lab 1', '10:00', '13:00', '2024-11-20', 30, 'workshop', 30, '50000000-0000-0000-0000-000000000009', '[]'::jsonb),
('20000000-0000-0000-0000-000000000010', 'AI & Future Tech Talk', '2026-03-15', 'Explore the future of artificial intelligence.', 'DK 1', '10:00', '12:00', '2026-03-15', 200, 'talk', 180, '50000000-0000-0000-0000-000000000011', '[]'::jsonb),
('20000000-0000-0000-0000-000000000011', 'Badminton Open 2025', '2026-02-28', 'Who will be the champion?', 'USM Sports Complex', '08:00', '18:00', '2026-03-01', 100, 'sport', 95, '50000000-0000-0000-0000-000000000012', '[]'::jsonb),
('20000000-0000-0000-0000-000000000012', 'Robotics Showcase', '2026-04-05', 'See the latest student robotics projects.', 'Foyer SKK', '10:00', '16:00', '2026-04-05', 300, 'workshop', 250, '50000000-0000-0000-0000-000000000013', '[]'::jsonb),
('20000000-0000-0000-0000-000000000013', 'Inter-Varsity Debate', '2026-05-10', 'Intellectual battles.', 'Dewan Pembangunan Siswa', '09:00', '17:00', '2026-05-12', 150, 'competition', 140, '50000000-0000-0000-0000-000000000014', '[]'::jsonb),
('20000000-0000-0000-0000-000000000014', 'Charity Run 2025', '2026-06-01', 'Run for a cause.', 'Padang Kawad', '07:00', '11:00', '2026-06-01', 1000, 'sport', 850, '50000000-0000-0000-0000-000000000015', '[]'::jsonb),
('20000000-0000-0000-0000-000000000015', 'Traditional Dance Workshop', '2026-03-20', 'Learn traditional dances.', 'Dewan Budaya', '14:00', '17:00', '2026-03-20', 50, 'workshop', 45, '50000000-0000-0000-0000-000000000016', '[]'::jsonb),
('20000000-0000-0000-0000-000000000016', 'Mobile App Dev Workshop', '2026-02-10', 'Build your first app.', 'Computer Lab 2', '09:00', '16:00', '2026-02-10', 40, 'workshop', 38, '50000000-0000-0000-0000-000000000017', '[]'::jsonb),
('20000000-0000-0000-0000-000000000017', 'Engineering Career Talk', '2026-03-05', 'Meet engineers from industry.', 'DK 2', '14:00', '16:00', '2026-03-05', 150, 'talk', 120, '50000000-0000-0000-0000-000000000018', '[]'::jsonb),
('20000000-0000-0000-0000-000000000018', 'Music Festival', '2026-07-15', 'Live music performances.', 'Padang Kawad', '18:00', '23:00', '2026-07-15', 2000, 'cultural', 1500, '50000000-0000-0000-0000-000000000019', '[]'::jsonb),
('20000000-0000-0000-0000-000000000019', 'Chess Tournament', '2026-04-15', 'Strategy and focus.', 'Foyer SKK', '08:00', '18:00', '2026-04-15', 64, 'competition', 60, '50000000-0000-0000-0000-000000000020', '[]'::jsonb),
('20000000-0000-0000-0000-000000000020', 'Beach Clean Up', '2026-05-20', 'Community service.', 'Pantai Bersih', '08:00', '12:00', '2026-05-20', 100, 'social', 80, '50000000-0000-0000-0000-000000000021', '[]'::jsonb);

-- Registrations
INSERT INTO registrations (event_id, user_id, attendance, event_status, registration_date) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'absent', 'published', '2024-12-20T10:30:00Z'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'absent', 'published', '2024-12-18T14:20:00Z'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'present', 'published', '2024-12-12T09:15:00Z'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'absent', 'published', '2024-12-22T16:45:00Z'),
('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', NULL, 'published', '2025-01-10T09:00:00Z'),
('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000009', NULL, 'published', '2025-01-12T10:00:00Z'),
('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', 'present', 'published', '2024-11-10T08:00:00Z'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', NULL, 'published', '2025-01-15T10:00:00Z'),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000011', NULL, 'published', '2025-01-16T11:00:00Z'),
('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', NULL, 'published', '2025-01-20T10:00:00Z'), -- Badminton (Sports)
('20000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', NULL, 'published', '2025-01-21T10:00:00Z'); -- Mobile App (Workshop)

-- Payments
INSERT INTO payments (payment_id, event_id, user_id, payment_amount, payment_status, payment_date) VALUES
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 50.00, 'paid', '2024-12-18T14:20:00Z'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 20.00, 'paid', '2024-12-12T09:15:00Z');

-- MyCSD Requests (Organizer requests MyCSD points for an event)
INSERT INTO mycsd_requests (mr_id, user_id, event_id, status) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'approved'), -- Arduino Workshop
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'approved'), -- Sports Carnival
('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'approved'), -- HackUSM
('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000007', 'approved'), -- Bridge Building
('60000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000008', 'approved'), -- Cultural Night
('60000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000009', 'approved'); -- Python Clinic

-- MyCSD Records
-- Use fixed scores based on level: kampus=2, negeri_universiti=4, antarabangsa=8
INSERT INTO mycsd_records (record_id, mycsd_score, mycsd_type) VALUES
('40000000-0000-0000-0000-000000000001', 2, 'event'),
('40000000-0000-0000-0000-000000000002', 4, 'event'),
('40000000-0000-0000-0000-000000000003', 8, 'event'),
('40000000-0000-0000-0000-000000000004', 4, 'event'),
('40000000-0000-0000-0000-000000000005', 4, 'event'),
('40000000-0000-0000-0000-000000000006', 2, 'event');

-- Event MyCSD
INSERT INTO event_mycsd (record_id, mycsd_category, event_level, mr_id) VALUES
('40000000-0000-0000-0000-000000000001', 'Reka Cipta dan Inovasi', 'P.Pengajian / Desasiswa / Persatuan / Kelab', '60000000-0000-0000-0000-000000000001'),
('40000000-0000-0000-0000-000000000002', 'Sukan/Rekreasi/Sosialisasi', 'Negeri / Universiti', '60000000-0000-0000-0000-000000000002'),
('40000000-0000-0000-0000-000000000003', 'Reka Cipta dan Inovasi', 'Antarabangsa', '60000000-0000-0000-0000-000000000003'),
('40000000-0000-0000-0000-000000000004', 'Reka Cipta dan Inovasi', 'Negeri / Universiti', '60000000-0000-0000-0000-000000000004'),
('40000000-0000-0000-0000-000000000005', 'Kebudayaan', 'Negeri / Universiti', '60000000-0000-0000-0000-000000000005'),
('40000000-0000-0000-0000-000000000006', 'Reka Cipta dan Inovasi', 'P.Pengajian / Desasiswa / Persatuan / Kelab', '60000000-0000-0000-0000-000000000006');

-- MyCSD Logs
INSERT INTO mycsd_logs (matric_no, record_id, score, position) VALUES
('165432', '40000000-0000-0000-0000-000000000001', 2, 'Peserta'),
('165432', '40000000-0000-0000-0000-000000000002', 4, 'Peserta'),
('165432', '40000000-0000-0000-0000-000000000003', 8, 'Peserta'),
('165433', '40000000-0000-0000-0000-000000000006', 2, 'Peserta'),
('165433', '40000000-0000-0000-0000-000000000003', 8, 'Peserta'); -- Also participated in HackUSM

-- Mark events with MyCSD and store the computed points (helps UI/queries that read events.mycsd_points)
-- Existing
UPDATE events SET has_mycsd = true, mycsd_level = 'P.Pengajian / Desasiswa / Persatuan / Kelab', mycsd_points = 2 WHERE event_id = '20000000-0000-0000-0000-000000000003';
UPDATE events SET has_mycsd = true, mycsd_level = 'Negeri / Universiti', mycsd_points = 4 WHERE event_id = '20000000-0000-0000-0000-000000000001';
UPDATE events SET has_mycsd = true, mycsd_level = 'Antarabangsa', mycsd_points = 8 WHERE event_id = '20000000-0000-0000-0000-000000000002';
-- New
UPDATE events SET has_mycsd = true, mycsd_level = 'Negeri / Universiti', mycsd_points = 4 WHERE event_id = '20000000-0000-0000-0000-000000000007';
UPDATE events SET has_mycsd = true, mycsd_level = 'Negeri / Universiti', mycsd_points = 4 WHERE event_id = '20000000-0000-0000-0000-000000000008';
UPDATE events SET has_mycsd = true, mycsd_level = 'P.Pengajian / Desasiswa / Persatuan / Kelab', mycsd_points = 2 WHERE event_id = '20000000-0000-0000-0000-000000000009';
