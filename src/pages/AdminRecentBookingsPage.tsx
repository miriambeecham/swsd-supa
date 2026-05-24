// /src/pages/AdminRecentBookingsPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LogOut, Users, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

interface Booking {
  id: string;
  bookingId: number;
  bookingDate: string;
  status: string;
  paymentStatus: string;
  contactName: string;
  contactEmail: string;
  numberOfParticipants: number;
  totalAmount: number | null;
  classScheduleId: string | null;
  className: string;
  classCode: string;
  classType: string;
  city: string;
  classDate: string;
  classStartTime: string;
  scheduleCancelled: boolean;
}

const STATUS_OPTIONS = ['Confirmed', 'Pending Payment', 'Cancelled', 'Refunded', 'Aborted'] as const;

const STATUS_BADGE_CLASS: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-800',
  'Pending Payment': 'bg-yellow-100 text-yellow-800',
  Cancelled: 'bg-gray-200 text-gray-700',
  Refunded: 'bg-orange-100 text-orange-800',
  Aborted: 'bg-red-100 text-red-800',
};

function formatBookingDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatClassDate(dateStr: string, startTime: string): string {
  if (startTime) {
    const d = new Date(startTime);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  }
  if (!dateStr) return '';
  const [y, m, day] = dateStr.split('-').map(Number);
  if (!y || !m || !day) return dateStr;
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const AdminRecentBookingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('Confirmed');
  const [classTypeFilter, setClassTypeFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify-session');
        if (!response.ok) {
          navigate('/admin/login');
          return;
        }
        const data = await response.json();
        if (!data.authenticated) navigate('/admin/login');
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/recent-bookings?limit=500');
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const classTypeOptions = useMemo(
    () => [...new Set(bookings.map((b) => b.classType).filter(Boolean))].sort(),
    [bookings],
  );

  const filtered = useMemo(() => {
    let rows = bookings;
    if (statusFilter) rows = rows.filter((b) => b.status === statusFilter);
    if (classTypeFilter) rows = rows.filter((b) => b.classType === classTypeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((b) =>
        b.contactName.toLowerCase().includes(q) ||
        b.contactEmail.toLowerCase().includes(q) ||
        b.className.toLowerCase().includes(q) ||
        b.classCode.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [bookings, statusFilter, classTypeFilter, search]);

  const totalParticipants = useMemo(
    () => filtered.reduce((sum, b) => sum + (b.numberOfParticipants || 0), 0),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, classTypeFilter, search]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearFilters = () => {
    setStatusFilter('Confirmed');
    setClassTypeFilter('');
    setSearch('');
  };

  const hasActiveFilters = statusFilter !== 'Confirmed' || classTypeFilter !== '' || search !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute border-4 border-gray-200 rounded-full w-16 h-16"></div>
            <div className="absolute border-4 border-teal-500 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Recent Bookings - Admin | Streetwise Self Defense</title>
      </Helmet>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Recent Bookings</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/schedules')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Class Schedules
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Bookings shown</div>
            <div className="text-2xl font-bold text-gray-900">{filtered.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">People registered</div>
            <div className="text-2xl font-bold text-teal-600 flex items-center gap-2">
              <Users className="w-6 h-6" /> {totalParticipants}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Status filter</div>
            <div className="text-2xl font-bold text-gray-900">{statusFilter || 'All'}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-4 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={classTypeFilter}
              onChange={(e) => setClassTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All class types</option>
              {classTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search name, email, class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Booking Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"># Registered</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No bookings match the current filters.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatBookingDateTime(b.bookingDate)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{b.className || '—'}</div>
                        <div className="text-xs text-gray-500">
                          {[b.classCode, b.city].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatClassDate(b.classDate, b.classStartTime)}
                        {b.scheduleCancelled && (
                          <span className="ml-2 text-xs text-red-600 font-semibold">CANCELLED</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                        {b.numberOfParticipants}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900">{b.contactName || '—'}</div>
                        <div className="text-xs text-gray-500">{b.contactEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE_CLASS[b.status] || 'bg-gray-100 text-gray-700'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > itemsPerPage && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, filtered.length)}</span> of{' '}
                <span className="font-medium">{filtered.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRecentBookingsPage;
