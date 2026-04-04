// /src/pages/AdminClassSchedulesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Edit,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  X,
  Plus,
  Ban,
} from 'lucide-react';

interface ClassSchedule {
  id: string;
  date: string;
  startTime: string;
  startTimeNew?: string;
  classId: string;
  className: string;
  type: string;
  bookingMethod: string;
  city: string;
  availableSpots: number;
  bookedSpots: number;
  remainingSpots: number;
  registrationOpens?: string;
  isCancelled: boolean;
  isRegistrationOpen: boolean;
}

type SortField = 'date' | 'classId' | 'type' | 'bookingMethod' | 'city' | 'availableSpots' | 'bookedSpots' | 'remainingSpots';
type SortDirection = 'asc' | 'desc';

const AdminClassSchedulesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ClassSchedule[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Filters
  const [filterClassId, setFilterClassId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBookingMethod, setFilterBookingMethod] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'future' | 'past'>('future');
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Filter options (populated from data)
  const [classIdOptions, setClassIdOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [bookingMethodOptions, setBookingMethodOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify-session');
        if (!response.ok) {
          navigate('/admin/login');
          return;
        }
        const data = await response.json();
        if (!data.authenticated) {
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch schedules
  useEffect(() => {
    fetchSchedules();
  }, []);

  // Apply filters and sorting whenever they change
  useEffect(() => {
    applyFiltersAndSort();
  }, [schedules, filterClassId, filterType, filterBookingMethod, filterCity, filterDateRange, sortField, sortDirection]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/class-schedules');
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      
      const data = await response.json();
      setSchedules(data.schedules || []);
      
      // Extract unique values for filter dropdowns
      const uniqueClassIds = [...new Set(data.schedules.map((s: ClassSchedule) => s.classId))].filter(Boolean).sort();
      const uniqueTypes = [...new Set(data.schedules.map((s: ClassSchedule) => s.type))].filter(Boolean).sort();
      const uniqueBookingMethods = [...new Set(data.schedules.map((s: ClassSchedule) => s.bookingMethod))].filter(Boolean).sort();
      const uniqueCities = [...new Set(data.schedules.map((s: ClassSchedule) => s.city))].filter(Boolean).sort();
      
      setClassIdOptions(uniqueClassIds);
      setTypeOptions(uniqueTypes);
      setBookingMethodOptions(uniqueBookingMethods);
      setCityOptions(uniqueCities);
      
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...schedules];
    
    // Apply filters
    if (filterClassId) {
      filtered = filtered.filter(s => s.classId === filterClassId);
    }
    if (filterType) {
      filtered = filtered.filter(s => s.type === filterType);
    }
    if (filterBookingMethod) {
      filtered = filtered.filter(s => s.bookingMethod === filterBookingMethod);
    }
    if (filterCity) {
      filtered = filtered.filter(s => s.city === filterCity);
    }
    
    // Date range filter
    const now = new Date();
    if (filterDateRange === 'future') {
      filtered = filtered.filter(s => {
        const scheduleDate = s.startTimeNew ? new Date(s.startTimeNew) : new Date(s.date);
        return scheduleDate >= now;
      });
    } else if (filterDateRange === 'past') {
      filtered = filtered.filter(s => {
        const scheduleDate = s.startTimeNew ? new Date(s.startTimeNew) : new Date(s.date);
        return scheduleDate < now;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortField) {
        case 'date':
          aVal = a.startTimeNew ? new Date(a.startTimeNew).getTime() : new Date(a.date).getTime();
          bVal = b.startTimeNew ? new Date(b.startTimeNew).getTime() : new Date(b.date).getTime();
          break;
        case 'classId':
          aVal = a.classId.toLowerCase();
          bVal = b.classId.toLowerCase();
          break;
        case 'type':
          aVal = a.type.toLowerCase();
          bVal = b.type.toLowerCase();
          break;
        case 'bookingMethod':
          aVal = a.bookingMethod.toLowerCase();
          bVal = b.bookingMethod.toLowerCase();
          break;
        case 'city':
          aVal = a.city.toLowerCase();
          bVal = b.city.toLowerCase();
          break;
        case 'availableSpots':
        case 'bookedSpots':
        case 'remainingSpots':
          aVal = a[sortField];
          bVal = b[sortField];
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredSchedules(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilterClassId('');
    setFilterType('');
    setFilterBookingMethod('');
    setFilterCity('');
    setFilterDateRange('future');
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/admin/class-schedule-manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scheduleId, fields: { 'Is Cancelled': true } }),
      });
      if (response.ok) {
        setDeleteConfirmId(null);
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatDate = (dateStr: string, startTimeNew?: string) => {
    if (startTimeNew) {
      const date = new Date(startTimeNew);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (startTimeNew?: string) => {
    if (!startTimeNew) return '';
    const date = new Date(startTimeNew);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = filteredSchedules.slice(startIndex, endIndex);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return <span className="text-teal-600 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative w-16 h-16 mb-4">
            <div className="absolute border-4 border-gray-200 rounded-full w-16 h-16"></div>
            <div className="absolute border-4 border-teal-500 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Class Schedules - Admin | Streetwise Self Defense</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Class Schedules</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/schedules/new')}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Schedule</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Classes</div>
            <div className="text-2xl font-bold text-gray-900">{filteredSchedules.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Classes</div>
            <div className="text-2xl font-bold text-teal-600">
              {filteredSchedules.filter(s => !s.isCancelled).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Cancelled Classes</div>
            <div className="text-2xl font-bold text-red-600">
              {filteredSchedules.filter(s => s.isCancelled).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Low Availability</div>
            <div className="text-2xl font-bold text-orange-600">
              {filteredSchedules.filter(s => !s.isCancelled && s.remainingSpots <= 3 && s.remainingSpots > 0).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Classes</option>
                {classIdOptions.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Types</option>
                {typeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking Method</label>
              <select
                value={filterBookingMethod}
                onChange={(e) => setFilterBookingMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Methods</option>
                {bookingMethodOptions.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">All Cities</option>
                {cityOptions.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value as 'all' | 'future' | 'past')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="future">Future Only</option>
                <option value="all">All Dates</option>
                <option value="past">Past Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('date')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Date & Time
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('classId')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Class ID
                      <SortIcon field="classId" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('type')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Type
                      <SortIcon field="type" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('bookingMethod')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Booking Method
                      <SortIcon field="bookingMethod" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('city')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      City
                      <SortIcon field="city" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('availableSpots')}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-center">
                      Slots
                      <SortIcon field="availableSpots" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No schedules found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  currentSchedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className={`hover:bg-gray-50 ${schedule.isCancelled ? 'bg-gray-100 opacity-60' : ''} ${
                        !schedule.isCancelled && schedule.remainingSpots <= 3 && schedule.remainingSpots > 0
                          ? 'bg-orange-50'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(schedule.date, schedule.startTimeNew)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(schedule.startTimeNew)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.classId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {schedule.type}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {schedule.bookingMethod}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {schedule.city}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {schedule.bookedSpots}/{schedule.availableSpots}
                        </div>
                        <div className="text-xs text-gray-500">
                          {schedule.remainingSpots} left
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {schedule.isRegistrationOpen ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Open
                          </span>
                        ) : schedule.registrationOpens ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Opens Later
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {schedule.isCancelled ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/schedules/${schedule.id}/edit`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden lg:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => navigate(`/admin/attendance?classScheduleId=${schedule.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            <span className="hidden lg:inline">Attendance</span>
                          </button>
                          {!schedule.isCancelled && (
                            <button
                              onClick={() => setDeleteConfirmId(schedule.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                              <span className="hidden lg:inline">Inactivate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredSchedules.length)}</span> of{' '}
                    <span className="font-medium">{filteredSchedules.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-teal-50 border-teal-500 text-teal-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span
                            key={pageNum}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Inactivation</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to inactivate this class schedule? The class will be marked as cancelled
              and will no longer appear as active.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Ban className="w-4 h-4" />
                Yes, Inactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassSchedulesPage;
