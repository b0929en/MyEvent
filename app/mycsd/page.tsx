'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Search, ArrowUpDown, ChevronUp, ChevronDown, Award, Calendar, Layers, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserMyCSDRecords, getUserClubPositions, calculateMyCSDSummary } from '@/backend/services/mycsdService';
import { MyCSDRecord, ClubPosition } from '@/types';

export default function MyCSDPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'positions'>('events');
  const ITEMS_PER_PAGE = 10;

  const [mycsdRecords, setMycsdRecords] = useState<MyCSDRecord[]>([]);
  const [clubPositions, setClubPositions] = useState<ClubPosition[]>([]);
  const [summary, setSummary] = useState({
    totalPoints: 0,
    totalEvents: 0,
    pointsByCategory: { 
      'REKA CIPTA DAN INOVASI': 0, 
      'KEUSAHAWAN': 0, 
      'KEBUDAYAAN': 0, 
      'SUKAN/REKREASI/SOSIALISASI': 0, 
      'KEPIMPINAN': 0 
    } as Record<string, number>,
    pointsByLevel: { antarabangsa: 0, negeri_universiti: 0, kampus: 0 } as Record<string, number>,
    eventsThisMonth: 0,
    pointsThisMonth: 0,
  });

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Get real data for the logged-in user
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const records = await getUserMyCSDRecords(user.id);
        const positions = await getUserClubPositions(user.id);
        setMycsdRecords(records);
        setClubPositions(positions);
        setSummary(calculateMyCSDSummary(user.id, records, positions));
      }
    };
    if (user) fetchData();
  }, [user]);

  // --- Events Tab State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    teras: '',
    jawatan: '',
    peringkat: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: 'sem' | 'mata' | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });
  const [eventPage, setEventPage] = useState(1);

  // --- Positions Tab State ---
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posFilters, setPosFilters] = useState({
    position: '',
  });
  const [posSortConfig, setPosSortConfig] = useState<{ key: 'semRegistered' | 'mata' | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });
  const [posPage, setPosPage] = useState(1);

  // Transform MyCSD records to match the existing table format
  const eventData = mycsdRecords.map((record, index) => ({
    bil: index + 1,
    sem: record.semester,
    teras: record.category.toUpperCase(),
    namaProjek: record.eventName,
    persatuan: record.organizationName,
    jawatan: record.role === 'participant' ? 'Peserta' : record.role === 'committee' ? 'AJK' : 'Penganjur',
    peringkat: record.level === 'antarabangsa' ? 'Antarabangsa' : 
               record.level === 'negeri_universiti' ? 'Universiti' : 
               'P.Pengajian / Desasiswa / Persatuan / Kelab',
    mata: record.points,
    mycsd: record.status === 'approved' ? 'YA' : 'Pending',
    date: record.submittedAt.split('T')[0],
  }));

  // Transform club positions to match the existing format
  const positionData = clubPositions.map((position, index) => ({
    bil: index + 1,
    semRegistered: position.semesterRegistered,
    persatuan: position.organizationName,
    position: position.position,
    mata: position.points
  }));

  const categoriesOrder = React.useMemo(() => [
    'REKA CIPTA DAN INOVASI',
    'KEUSAHAWAN',
    'KEBUDAYAAN',
    'SUKAN/REKREASI/SOSIALISASI',
    'KEPIMPINAN'
  ], []);

  const COLORS_MAP: Record<string, string> = {
    'REKA CIPTA DAN INOVASI': '#0088FE',
    'KEUSAHAWAN': '#00C49F',
    'KEBUDAYAAN': '#800080',
    'SUKAN/REKREASI/SOSIALISASI': '#FF8042',
    'KEPIMPINAN': '#DAA520',
  };

  // --- Helper for Badges ---
  const getPositionBadgeColor = (jawatan: string) => {
    const lower = jawatan.toLowerCase();
    if (lower.includes('pengarah') || lower.includes('director')) return 'bg-purple-100 text-purple-800';
    if (lower.includes('ajk tertinggi') || lower.includes('top committee')) return 'bg-blue-100 text-blue-800';
    if (lower.includes('ajk') || lower.includes('committee')) return 'bg-cyan-100 text-cyan-800';
    if (lower.includes('peserta') || lower.includes('participant')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getLevelBadgeColor = (peringkat: string) => {
    const lower = peringkat.toLowerCase();
    if (lower.includes('antarabangsa') || lower.includes('international')) return 'bg-yellow-100 text-yellow-800';
    if (lower.includes('kebangsaan') || lower.includes('national')) return 'bg-orange-100 text-orange-800';
    if (lower.includes('negeri') || lower.includes('state') || lower.includes('universiti')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-600';
  };


  // --- Filter Reset Logic ---
  // Automatically reset to page 1 when filters or search changes
  const eventPageRef = React.useRef(eventPage);
  const posPageRef = React.useRef(posPage);
  
  React.useEffect(() => {
    eventPageRef.current = 1;
    setEventPage(1);
  }, [searchQuery, filters]);

  React.useEffect(() => {
    posPageRef.current = 1;
    setPosPage(1);
  }, [posSearchQuery, posFilters]);


  // Logic
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    eventData.forEach(event => {
      counts[event.teras] = (counts[event.teras] || 0) + event.mata;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [eventData]);

  // Summary Table Data Aggregation
  const summaryTableData = useMemo(() => {
    const grouped: Record<string, { count: number, pointsLocal: number, pointsIntl: number }> = {};

    categoriesOrder.forEach(cat => {
      grouped[cat] = { count: 0, pointsLocal: 0, pointsIntl: 0 };
    });

    eventData.forEach(event => {
      if (!grouped[event.teras]) {
        grouped[event.teras] = { count: 0, pointsLocal: 0, pointsIntl: 0 };
      }
      grouped[event.teras].count += 1;

      if (event.peringkat === 'Antarabangsa') {
        grouped[event.teras].pointsIntl += event.mata;
      } else {
        grouped[event.teras].pointsLocal += event.mata;
      }
    });

    return Object.keys(grouped).map(key => ({
      teras: key,
      ...grouped[key]
    }));
  }, [categoriesOrder, eventData]);

  const grandTotal = summaryTableData.reduce((acc, curr) => ({
    count: acc.count + curr.count,
    pointsLocal: acc.pointsLocal + curr.pointsLocal,
    pointsIntl: acc.pointsIntl + curr.pointsIntl
  }), { count: 0, pointsLocal: 0, pointsIntl: 0 });

  // Use real summary data
  const totalPoints = summary.totalPoints;
  const totalEvents = summary.totalEvents;
  const eventsThisMonth = summary.eventsThisMonth;
  const pointsThisMonth = summary.pointsThisMonth;

  // --- EVENTS: Processing & Pagination ---
  const filteredAndSortedEvents = useMemo(() => {
    let result = [...eventData];
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.namaProjek.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.teras) result = result.filter(item => item.teras === filters.teras);
    if (filters.jawatan) result = result.filter(item => item.jawatan === filters.jawatan);
    if (filters.peringkat) result = result.filter(item => item.peringkat === filters.peringkat);

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [eventData, searchQuery, filters, sortConfig]);

  const totalEventPages = Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredAndSortedEvents.slice(
    (eventPage - 1) * ITEMS_PER_PAGE,
    eventPage * ITEMS_PER_PAGE
  );

  // --- POSITIONS: Processing & Pagination ---
  const filteredAndSortedPositions = useMemo(() => {
    let result = [...positionData];
    if (posSearchQuery) {
      const lowerQuery = posSearchQuery.toLowerCase();
      result = result.filter(item => item.persatuan.toLowerCase().includes(lowerQuery));
    }
    if (posFilters.position) result = result.filter(item => item.position === posFilters.position);

    if (posSortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[posSortConfig.key!];
        const bValue = b[posSortConfig.key!];
        if (aValue < bValue) return posSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return posSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [positionData, posSearchQuery, posFilters, posSortConfig]);

  const totalPosPages = Math.ceil(filteredAndSortedPositions.length / ITEMS_PER_PAGE);
  const paginatedPositions = filteredAndSortedPositions.slice(
    (posPage - 1) * ITEMS_PER_PAGE,
    posPage * ITEMS_PER_PAGE
  );


  const uniqueTeras = Array.from(new Set(eventData.map(e => e.teras)));
  const uniqueJawatan = Array.from(new Set(eventData.map(e => e.jawatan)));
  const uniquePeringkat = Array.from(new Set(eventData.map(e => e.peringkat)));
  const uniquePositions = Array.from(new Set(positionData.map(e => e.position)));

  const handleSort = (key: 'sem' | 'mata') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  const handlePosSort = (key: 'semRegistered' | 'mata') => {
    setPosSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };


  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="grow">

        {/* Breadcrumb & Header Container */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'MyCSD Summary' }
              ]}
            />
            <div className="mt-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                <span className="text-purple-900">MyCSD</span> <span className="text-orange-500">Summary</span>
              </h1>
            </div>
          </div>
        </div>


        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          {/* Section 1: Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Points - Purple */}
            <div className="relative overflow-hidden rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-purple-900 text-white group border border-purple-800">
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                {/* Watermark Background */}
                <Image src="/usm-card-background.webp" alt="" fill className="object-cover grayscale opacity-50 mix-blend-overlay" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h4 className="text-purple-100 font-semibold text-xs uppercase tracking-wider">Total MyCSD Points</h4>
                  <span className="text-4xl font-bold text-white mt-2 block">{totalPoints}</span>
                </div>
                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Total Events - Orange */}
            <div className="relative overflow-hidden rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-orange-500 text-white border border-orange-400">
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <Image src="/usm-card-background.webp" alt="" fill className="object-cover grayscale opacity-50 mix-blend-overlay" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h4 className="text-orange-100 font-semibold text-xs uppercase tracking-wider">Total Events Joined</h4>
                  <span className="text-4xl font-bold text-white mt-2 block">{totalEvents}</span>
                </div>
                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Events This Month - Purple */}
            <div className="relative overflow-hidden rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-purple-900 text-white border border-purple-800">
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <Image src="/usm-card-background.webp" alt="" fill className="object-cover grayscale opacity-50 mix-blend-overlay" />
              </div>
              <div className="relative z-10 flex items-center space-x-2 mb-2">
                <Layers className="h-4 w-4 text-purple-200" />
                <h4 className="text-purple-100 font-semibold text-sm uppercase">Events This Month</h4>
              </div>
              <div className="relative z-10 mt-2">
                <span className="text-3xl font-bold text-white">{eventsThisMonth}</span>
              </div>
            </div>

            {/* Points This Month - Orange */}
            <div className="relative overflow-hidden rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow bg-orange-500 text-white border border-orange-400">
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <Image src="/usm-card-background.webp" alt="" fill className="object-cover grayscale opacity-50 mix-blend-overlay" />
              </div>
              <div className="relative z-10 flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-orange-100" />
                <h4 className="text-orange-100 font-semibold text-sm uppercase">Points This Month</h4>
              </div>
              <div className="relative z-10 mt-2">
                <span className="text-3xl font-bold text-white">{pointsThisMonth}</span>
              </div>
            </div>
          </div>


          {/* Section 2: Visualization & Detailed Summary Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
              <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide mb-6">Points Distribution</h3>
              <div className="w-full h-100">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_MAP[entry.name] || '#999'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Category Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                      <th rowSpan={2} className="px-6 py-3 text-left font-bold border-r border-gray-200 bg-gray-50 w-1/2">Teras</th>
                      <th rowSpan={2} className="px-4 py-3 text-center font-bold border-r border-gray-200 bg-gray-50">Bil Aktiviti</th>
                      <th colSpan={2} className="px-4 py-2 text-center font-bold bg-gray-200 text-gray-700 border-b border-gray-300">Mata</th>
                    </tr>
                    <tr className="bg-blue-50 text-blue-900 text-xs uppercase">
                      <th className="px-4 py-2 text-center border-r border-blue-100 font-semibold">
                        Negeri / Universiti <br /> P.Pengajian / Desasiswa / Persatuan / Kelab
                      </th>
                      <th className="px-4 py-2 text-center font-semibold bg-gray-50 text-gray-500 border-l border-gray-200">
                        Antarabangsa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {summaryTableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 border-r border-gray-100 flex items-center">
                          <span className="w-3 h-3 rounded-sm mr-3 shrink-0" style={{ backgroundColor: COLORS_MAP[row.teras] || '#ccc' }}></span>
                          <span className="font-medium text-gray-700">{row.teras}</span>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-gray-600 border-r border-gray-100">{row.count}</td>
                        <td className="px-4 py-4 text-center text-gray-600 border-r border-gray-100">{row.pointsLocal}</td>
                        <td className="px-4 py-4 text-center text-gray-600">{row.pointsIntl}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-300">
                      <td className="px-6 py-4 text-right border-r border-gray-200">Total:</td>
                      <td className="px-4 py-4 text-center border-r border-gray-200">{grandTotal.count}</td>
                      <td className="px-4 py-4 text-center border-r border-gray-200">{grandTotal.pointsLocal}</td>
                      <td className="px-4 py-4 text-center">{grandTotal.pointsIntl}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Records Section */}
          <div className="space-y-4 pt-4">
            {/* Simple Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('events')}
                  className={`${activeTab === 'events'
                      ? 'border-purple-900 text-purple-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Event Participation
                </button>
                <button
                  onClick={() => setActiveTab('positions')}
                  className={`${activeTab === 'positions'
                      ? 'border-purple-900 text-purple-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Club/Society Position
                </button>
              </nav>
            </div>

            {/* Controls Bar */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              {activeTab === 'events' ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-900 focus:border-purple-900 sm:text-sm"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-purple-900 focus:border-purple-900 sm:text-sm rounded-md"
                      value={filters.teras}
                      onChange={(e) => setFilters({ ...filters, teras: e.target.value })}
                    >
                      <option value="">All Categories</option>
                      {uniqueTeras.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="relative">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-purple-900 focus:border-purple-900 sm:text-sm rounded-md"
                      value={filters.jawatan}
                      onChange={(e) => setFilters({ ...filters, jawatan: e.target.value })}
                    >
                      <option value="">All Positions</option>
                      {uniqueJawatan.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="relative">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-purple-900 focus:border-purple-900 sm:text-sm rounded-md"
                      value={filters.peringkat}
                      onChange={(e) => setFilters({ ...filters, peringkat: e.target.value })}
                    >
                      <option value="">All Levels</option>
                      {uniquePeringkat.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative col-span-1 md:col-span-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-900 focus:border-purple-900 sm:text-sm"
                      placeholder="Search persatuan/kelab..."
                      value={posSearchQuery}
                      onChange={(e) => setPosSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative col-span-1 md:col-span-2">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 focus:outline-none focus:ring-purple-900 focus:border-purple-900 sm:text-sm rounded-md"
                      value={posFilters.position}
                      onChange={(e) => setPosFilters({ ...posFilters, position: e.target.value })}
                    >
                      <option value="">All Positions</option>
                      {uniquePositions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                {activeTab === 'events' ? (
                  <>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-900 hover:bg-gray-100"
                            onClick={() => handleSort('sem')}
                          >
                            <div className="flex items-center">
                              Sem
                              {sortConfig.key === 'sem' ? (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club/Assoc</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                          <th
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-900 hover:bg-gray-100"
                            onClick={() => handleSort('mata')}
                          >
                            <div className="flex items-center justify-center">
                              Points
                              {sortConfig.key === 'mata' ? (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedEvents.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{(eventPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.sem}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800" style={{
                                backgroundColor: `${COLORS_MAP[row.teras]}20` || '#f3f4f6',
                                color: COLORS_MAP[row.teras] || '#374151'
                              }}>
                                {row.teras}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium max-w-xs truncate" title={row.namaProjek}>{row.namaProjek}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={row.persatuan}>{row.persatuan}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPositionBadgeColor(row.jawatan)}`}>
                                {row.jawatan}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelBadgeColor(row.peringkat)}`}>
                                {row.peringkat}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-orange-600">{row.mata}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {row.mycsd}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {paginatedEvents.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500 text-sm">
                              No events found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {/* Pagination Controls */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{filteredAndSortedEvents.length > 0 ? (eventPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium">{Math.min(eventPage * ITEMS_PER_PAGE, filteredAndSortedEvents.length)}</span> of <span className="font-medium">{filteredAndSortedEvents.length}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setEventPage(p => Math.max(1, p - 1))}
                              disabled={eventPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Previous</span>
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            {[...Array(totalEventPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setEventPage(i + 1)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                            ${eventPage === i + 1
                                    ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              onClick={() => setEventPage(p => Math.min(totalEventPages, p + 1))}
                              disabled={eventPage === totalEventPages || totalEventPages === 0}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Next</span>
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </>

                ) : (
                  <>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-900 hover:bg-gray-100"
                            onClick={() => handlePosSort('semRegistered')}
                          >
                            <div className="flex items-center">
                              Semester Registered
                              {posSortConfig.key === 'semRegistered' ? (
                                posSortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club / Association</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-purple-900 hover:bg-gray-100"
                            onClick={() => handlePosSort('mata')}
                          >
                            <div className="flex items-center justify-center">
                              Points
                              {posSortConfig.key === 'mata' ? (
                                posSortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedPositions.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{(posPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.semRegistered}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.persatuan}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {row.position}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-orange-600">{row.mata}</td>
                          </tr>
                        ))}
                        {paginatedPositions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                              No position records found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {/* Pagination Controls for Positions */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{filteredAndSortedPositions.length > 0 ? (posPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium">{Math.min(posPage * ITEMS_PER_PAGE, filteredAndSortedPositions.length)}</span> of <span className="font-medium">{filteredAndSortedPositions.length}</span> results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setPosPage(p => Math.max(1, p - 1))}
                              disabled={posPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Previous</span>
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            {[...Array(totalPosPages)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setPosPage(i + 1)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                            ${posPage === i + 1
                                    ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                            <button
                              onClick={() => setPosPage(p => Math.min(totalPosPages, p + 1))}
                              disabled={posPage === totalPosPages || totalPosPages === 0}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <span className="sr-only">Next</span>
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
