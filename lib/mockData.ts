/**
 * Mock data for MyEvent @ USM
 * This file contains realistic mock data for development and testing
 */

import { 
  User, 
  Event, 
  Registration, 
  MyCSDRecord, 
  Organization,
  ClubPosition,
  EventCategory,
  MyCSDCategory,
  MyCSDLevel
} from '@/types';

// ============================================================================
// Mock Users
// ============================================================================

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'jm@student.usm.my',
    role: 'student',
    name: 'Ahmad Ibrahim',
    matricNumber: '165432',
    phone: '0123456789',
    faculty: 'School of Computer Sciences',
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '2',
    email: 'siti.nurhaliza@student.usm.my',
    role: 'student',
    name: 'Siti Nurhaliza',
    matricNumber: '165433',
    phone: '0123456790',
    faculty: 'School of Engineering',
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '3',
    email: 'css@usm.my',
    role: 'organizer',
    name: 'Kelab Sukan USM',
    organizationId: '1',
    phone: '0124567890',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '4',
    email: 'bhepa@usm.my',
    role: 'admin',
    name: 'BHEPA Administrator',
    phone: '0124567891',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
];

// ============================================================================
// Mock Organizations
// ============================================================================

export const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Kelab Sukan USM',
    description: 'Official sports club of Universiti Sains Malaysia promoting physical fitness and competitive sports among students.',
    email: 'kelab.sukan@usm.my',
    phone: '0124567890',
    createdAt: '2020-01-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '2',
    name: 'Persatuan Mahasiswa Sains Komputer',
    description: 'Computer Science Student Association fostering innovation and technology excellence.',
    email: 'pmsk@student.usm.my',
    phone: '0124567891',
    facultyId: 'cs',
    createdAt: '2020-01-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '3',
    name: 'Kelab Robotik USM',
    description: 'Robotics club dedicated to advancing robotics knowledge and skills through hands-on projects.',
    email: 'robotics@student.usm.my',
    phone: '0124567892',
    createdAt: '2020-01-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '4',
    name: 'Persatuan Debat USM',
    description: 'Debate society promoting critical thinking and public speaking excellence.',
    email: 'debat@student.usm.my',
    phone: '0124567893',
    createdAt: '2020-01-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
];

// ============================================================================
// Mock Events
// ============================================================================

export const mockEvents: Event[] = [
  {
    id: '1',
    organizerId: '1',
    organizerName: 'Kelab Sukan USM',
    title: 'USM Sports Carnival 2025',
    description: 'Annual sports carnival featuring various competitive sports including football, basketball, badminton, and track & field events. Join us for a week of athletic excellence!',
    category: 'sport',
    startDate: '2025-02-15',
    endDate: '2025-02-22',
    startTime: '08:00',
    endTime: '18:00',
    venue: 'USM Main Campus Sports Complex',
    capacity: 500,
    registeredCount: 342,
    participationFee: 0,
    hasMyCSD: true,
    mycsdCategory: 'teras',
    mycsdLevel: 'negeri_universiti',
    mycsdPoints: 15,
    status: 'published',
    registrationDeadline: '2025-02-10',
    objectives: [
      'Promote physical fitness among students',
      'Foster competitive spirit and sportsmanship',
      'Build community through sports'
    ],
    createdAt: '2024-12-01T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '2',
    organizerId: '2',
    organizerName: 'Persatuan Mahasiswa Sains Komputer',
    title: 'HackUSM 2025 - National Hackathon',
    description: '48-hour national hackathon bringing together the brightest minds to solve real-world problems using technology. Prizes worth RM50,000!',
    category: 'competition',
    startDate: '2025-03-01',
    endDate: '2025-03-03',
    startTime: '09:00',
    endTime: '17:00',
    venue: 'School of Computer Sciences, USM',
    capacity: 200,
    registeredCount: 156,
    participationFee: 50,
    hasMyCSD: true,
    mycsdCategory: 'advance',
    mycsdLevel: 'antarabangsa',
    mycsdPoints: 30,
    status: 'published',
    registrationDeadline: '2025-02-25',
    objectives: [
      'Encourage innovation and creativity in tech',
      'Provide platform for networking with industry leaders',
      'Develop practical problem-solving skills'
    ],
    links: [
      { title: 'Registration Form', url: 'https://forms.gle/hackusm2025' },
      { title: 'Competition Rules', url: 'https://hackusm.com/rules' },
    ],
    createdAt: '2024-11-15T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '3',
    organizerId: '3',
    organizerName: 'Kelab Robotik USM',
    title: 'Introduction to Arduino Workshop',
    description: 'Beginner-friendly workshop covering Arduino basics, circuit design, and simple robotics projects. All materials provided!',
    category: 'workshop',
    startDate: '2025-01-20',
    endDate: '2025-01-20',
    startTime: '14:00',
    endTime: '17:00',
    venue: 'Engineering Lab 3, USM',
    capacity: 50,
    registeredCount: 48,
    participationFee: 20,
    hasMyCSD: true,
    mycsdCategory: 'baruna',
    mycsdLevel: 'kampus',
    mycsdPoints: 5,
    status: 'published',
    registrationDeadline: '2025-01-18',
    createdAt: '2024-12-10T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '4',
    organizerId: '4',
    organizerName: 'Persatuan Debat USM',
    title: 'National Debate Championship 2025',
    description: 'Premier debating competition featuring teams from universities across Malaysia. Topics cover current affairs, policy, and philosophy.',
    category: 'competition',
    startDate: '2025-04-10',
    endDate: '2025-04-12',
    startTime: '09:00',
    endTime: '18:00',
    venue: 'USM Dewan Tuanku Syed Putra',
    capacity: 300,
    registeredCount: 87,
    participationFee: 0,
    hasMyCSD: true,
    mycsdCategory: 'advance',
    mycsdLevel: 'antarabangsa',
    mycsdPoints: 25,
    status: 'published',
    registrationDeadline: '2025-04-01',
    createdAt: '2024-12-05T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '5',
    organizerId: '2',
    organizerName: 'Persatuan Mahasiswa Sains Komputer',
    title: 'Career Fair: Tech Industry Insights',
    description: 'Connect with leading tech companies, learn about career opportunities, and attend industry talks by professionals.',
    category: 'talk',
    startDate: '2025-02-05',
    endDate: '2025-02-05',
    startTime: '10:00',
    endTime: '16:00',
    venue: 'Dewan Utama USM',
    capacity: 400,
    registeredCount: 312,
    participationFee: 0,
    hasMyCSD: true,
    mycsdCategory: 'labels',
    mycsdLevel: 'negeri_universiti',
    mycsdPoints: 10,
    status: 'published',
    registrationDeadline: '2025-02-03',
    createdAt: '2024-12-20T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
  {
    id: '6',
    organizerId: '1',
    organizerName: 'Kelab Sukan USM',
    title: 'Futsal Tournament - Inter-Faculty',
    description: 'Exciting inter-faculty futsal tournament. Form your team and compete for the championship trophy!',
    category: 'sport',
    startDate: '2025-01-25',
    endDate: '2025-01-28',
    startTime: '18:00',
    endTime: '22:00',
    venue: 'USM Indoor Sports Hall',
    capacity: 150,
    registeredCount: 120,
    participationFee: 100,
    hasMyCSD: true,
    mycsdCategory: 'teras',
    mycsdLevel: 'kampus',
    mycsdPoints: 8,
    status: 'published',
    registrationDeadline: '2025-01-22',
    createdAt: '2024-12-15T08:00:00Z',
    updatedAt: '2024-12-24T08:00:00Z',
  },
];

// ============================================================================
// Mock Registrations
// ============================================================================

export const mockRegistrations: Registration[] = [
  {
    id: '1',
    eventId: '1',
    userId: '1',
    userName: 'Ahmad Ibrahim',
    userEmail: 'ahmad.ibrahim@student.usm.my',
    matricNumber: '165432',
    status: 'confirmed',
    registeredAt: '2024-12-20T10:30:00Z',
    updatedAt: '2024-12-20T10:30:00Z',
  },
  {
    id: '2',
    eventId: '2',
    userId: '1',
    userName: 'Ahmad Ibrahim',
    userEmail: 'ahmad.ibrahim@student.usm.my',
    matricNumber: '165432',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentAmount: 50,
    registeredAt: '2024-12-18T14:20:00Z',
    updatedAt: '2024-12-18T14:20:00Z',
  },
  {
    id: '3',
    eventId: '3',
    userId: '1',
    userName: 'Ahmad Ibrahim',
    userEmail: 'ahmad.ibrahim@student.usm.my',
    matricNumber: '165432',
    status: 'attended',
    paymentStatus: 'paid',
    paymentAmount: 20,
    attendanceMarkedAt: '2025-01-20T14:05:00Z',
    registeredAt: '2024-12-12T09:15:00Z',
    updatedAt: '2025-01-20T14:05:00Z',
  },
  {
    id: '4',
    eventId: '5',
    userId: '1',
    userName: 'Ahmad Ibrahim',
    userEmail: 'ahmad.ibrahim@student.usm.my',
    matricNumber: '165432',
    status: 'confirmed',
    registeredAt: '2024-12-22T16:45:00Z',
    updatedAt: '2024-12-22T16:45:00Z',
  },
];

// ============================================================================
// Mock MyCSD Records
// ============================================================================

export const mockMyCSDRecords: MyCSDRecord[] = [
  {
    id: '1',
    userId: '1',
    eventId: '3',
    eventName: 'Introduction to Arduino Workshop',
    organizationName: 'Kelab Robotik USM',
    category: 'baruna',
    level: 'kampus',
    role: 'participant',
    points: 5,
    semester: '2024/2025-1',
    status: 'approved',
    submittedAt: '2025-01-20T18:00:00Z',
    approvedAt: '2025-01-22T10:30:00Z',
    approvedBy: '4',
  },
  {
    id: '2',
    userId: '1',
    eventId: '1',
    eventName: 'USM Sports Carnival 2025',
    organizationName: 'Kelab Sukan USM',
    category: 'teras',
    level: 'negeri_universiti',
    role: 'participant',
    points: 15,
    semester: '2024/2025-2',
    status: 'pending',
    submittedAt: '2024-12-20T12:00:00Z',
  },
  {
    id: '3',
    userId: '1',
    eventId: '2',
    eventName: 'HackUSM 2025 - National Hackathon',
    organizationName: 'Persatuan Mahasiswa Sains Komputer',
    category: 'advance',
    level: 'antarabangsa',
    role: 'participant',
    points: 30,
    semester: '2024/2025-2',
    status: 'pending',
    submittedAt: '2024-12-18T15:00:00Z',
  },
];

// ============================================================================
// Mock Club Positions
// ============================================================================

export const mockClubPositions: ClubPosition[] = [
  {
    id: '1',
    userId: '1',
    organizationId: '2',
    organizationName: 'Persatuan Mahasiswa Sains Komputer',
    position: 'Committee Member - Technical',
    semesterRegistered: '2024/2025-1',
    points: 20,
    startDate: '2024-09-01',
    status: 'active',
  },
  {
    id: '2',
    userId: '1',
    organizationId: '3',
    organizationName: 'Kelab Robotik USM',
    position: 'Vice President',
    semesterRegistered: '2023/2024-2',
    points: 35,
    startDate: '2024-01-15',
    endDate: '2024-12-20',
    status: 'completed',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get events with optional filters
 */
export function getFilteredEvents(filters?: {
  search?: string;
  category?: EventCategory[];
  hasMyCSD?: boolean;
  mycsdCategory?: MyCSDCategory[];
  mycsdLevel?: MyCSDLevel[];
}): Event[] {
  let filtered = [...mockEvents];

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(event => 
      event.title.toLowerCase().includes(search) ||
      event.description.toLowerCase().includes(search) ||
      event.organizerName.toLowerCase().includes(search)
    );
  }

  if (filters?.category && filters.category.length > 0) {
    filtered = filtered.filter(event => 
      filters.category!.includes(event.category)
    );
  }

  if (filters?.hasMyCSD !== undefined) {
    filtered = filtered.filter(event => event.hasMyCSD === filters.hasMyCSD);
  }

  if (filters?.mycsdCategory && filters.mycsdCategory.length > 0) {
    filtered = filtered.filter(event => 
      event.mycsdCategory && filters.mycsdCategory!.includes(event.mycsdCategory)
    );
  }

  if (filters?.mycsdLevel && filters.mycsdLevel.length > 0) {
    filtered = filtered.filter(event => 
      event.mycsdLevel && filters.mycsdLevel!.includes(event.mycsdLevel)
    );
  }

  return filtered;
}

/**
 * Get user's registered events
 */
export function getUserRegistrations(userId: string): Registration[] {
  return mockRegistrations.filter(reg => reg.userId === userId);
}

/**
 * Get user's MyCSD records
 */
export function getUserMyCSDRecords(userId: string): MyCSDRecord[] {
  return mockMyCSDRecords.filter(record => record.userId === userId);
}

/**
 * Get user's club positions
 */
export function getUserClubPositions(userId: string): ClubPosition[] {
  return mockClubPositions.filter(pos => pos.userId === userId);
}

/**
 * Calculate MyCSD summary for a user
 */
export function calculateMyCSDSummary(userId: string) {
  const records = getUserMyCSDRecords(userId);
  const positions = getUserClubPositions(userId);
  
  const totalPoints = records
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.points, 0) +
    positions.reduce((sum, p) => sum + p.points, 0);
  
  const totalEvents = records.length;
  
  const pointsByCategory = {
    teras: 0,
    baruna: 0,
    advance: 0,
    labels: 0,
  };
  
  records.forEach(record => {
    if (record.status === 'approved') {
      pointsByCategory[record.category] += record.points;
    }
  });
  
  const pointsByLevel = {
    antarabangsa: 0,
    negeri_universiti: 0,
    kampus: 0,
  };
  
  records.forEach(record => {
    if (record.status === 'approved') {
      pointsByLevel[record.level] += record.points;
    }
  });
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const eventsThisMonth = records.filter(record => {
    const date = new Date(record.submittedAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  
  const pointsThisMonth = records
    .filter(record => {
      const date = new Date(record.submittedAt);
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear &&
             record.status === 'approved';
    })
    .reduce((sum, r) => sum + r.points, 0);
  
  return {
    totalPoints,
    totalEvents,
    pointsByCategory,
    pointsByLevel,
    eventsThisMonth,
    pointsThisMonth,
  };
}

/**
 * Get event by ID
 */
export function getEventById(id: string): Event | undefined {
  return mockEvents.find(event => event.id === id);
}

/**
 * Get user by email (for login simulation)
 */
export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(user => user.email === email);
}

/**
 * Get organization by ID
 */
export function getOrganizationById(id: string): Organization | undefined {
  return mockOrganizations.find(org => org.id === id);
}
