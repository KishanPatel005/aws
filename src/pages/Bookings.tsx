import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Home, User, Phone, DollarSign, Percent, FileText, Clock, CheckCircle, XCircle, Eye, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BookingForm from '../components/BookingForm';

interface Project {
  id: number;
  name: string;
  city: string | null;
  builder: {
    id: number;
    name: string;
    logo: string | null;
  };
}

interface Inventory {
  id: number;
  unitType: string;
  mou: string;
  size: number;
}

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface Booking {
  id: number;
  projectId: number;
  inventoryId: number;
  unitNo: string;
  buyerName: string;
  buyerMobile: string;
  referenceName: string | null;
  rate: number;
  amount: number;
  brokeragePct: number;
  brokerageAmt: number;
  bookedBy: number;
  remarks: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  project: Project;
  inventory: Inventory;
  user: User;
}

const Bookings = () => {
  const { hasPermission } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Note: Role-based restrictions will be implemented in future updates

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, projectsResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:8080/api/bookings'),
        fetch('http://localhost:8080/api/projects'),
        fetch('http://localhost:8080/api/users')
      ]);

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      } else {
        console.error('Failed to fetch bookings');
      }

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      } else {
        console.error('Failed to fetch projects');
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
        // Set first user as current user for demo purposes
        if (usersData.length > 0) {
          setCurrentUser(usersData[0]);
        }
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      const url = editingBooking 
        ? `http://localhost:8080/api/bookings/${editingBooking.id}`
        : 'http://localhost:8080/api/bookings';
      
      const method = editingBooking ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setEditingBooking(null);
        
        // Show success message
        if (!editingBooking) {
          alert('Booking created successfully!');
        } else {
          alert('Booking updated successfully!');
        }
      } else {
        const error = await response.json();
        console.error('Error saving booking:', error);
        alert('Failed to save booking: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Booking deleted successfully!');
      } else {
        console.error('Failed to delete booking');
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  // Handle edit
  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingBooking(null);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200">
              <Clock className="w-3 h-3 mr-1 animate-pulse" />
              Pending Approval
            </span>
            <span className="text-xs text-muted-foreground">Ready to approve</span>
          </div>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking =>
    booking.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.buyerMobile.includes(searchTerm) ||
    (booking.referenceName && booking.referenceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    booking.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.project.city && booking.project.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    booking.project.builder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count pending bookings
  const pendingCount = bookings.filter(booking => booking.status === 'PENDING').length;

  if (showForm) {
    return (
      <div>
        <BookingForm
          booking={editingBooking}
          projects={projects}
          users={users}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage property bookings and their details
            </p>
          </div>
          {hasPermission('booking', 'C') && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Booking
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Approval Info */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Booking Approval</h3>
              <p className="text-xs text-blue-700">
                Only <span className="font-semibold">PENDING</span> bookings can be approved. 
                Click the green "Approve" button to distribute brokerage among team members.
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                <Clock className="w-3 h-3 mr-1" />
                {pendingCount} Pending
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No bookings found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new booking.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b border-border transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Project</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Unit No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Buyer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Brokerage %</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Brokerage Amt</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Project */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-3">
                        {booking.project.builder.logo ? (
                          <img
                            src={`http://localhost:8080${booking.project.builder.logo}`}
                            alt={booking.project.builder.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{booking.project.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.project.builder.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Unit Number */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{booking.unitNo}</p>
                          <p className="text-xs text-muted-foreground">{booking.inventory.unitType}</p>
                        </div>
                      </div>
                    </td>

                    {/* Buyer */}
                    <td className="p-4 align-middle">
                      <div className="text-sm text-foreground">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{booking.buyerName}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{booking.buyerMobile}</span>
                        </div>
                        {booking.referenceName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ref: {booking.referenceName}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ₹{booking.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ₹{booking.rate.toLocaleString()}/{booking.inventory.mou}
                      </p>
                    </td>

                    {/* Brokerage Percentage */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{booking.brokeragePct}%</span>
                      </div>
                    </td>

                    {/* Brokerage Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ₹{booking.brokerageAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 align-middle">
                      {getStatusBadge(booking.status)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        {booking.status === 'PENDING' && hasPermission('booking', 'U') && (
                          <button
                            onClick={() => handleEdit(booking)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                            title="Edit booking"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'PENDING' && hasPermission('booking_approval', 'A') && (
                          <Link
                            to={`/bookings/approve/${booking.id}`}
                            className="inline-flex items-center justify-center rounded-lg text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 h-8 px-4 shadow-md hover:shadow-lg transition-all duration-200"
                            title="Approve booking and distribute brokerage"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Link>
                        )}
                        {booking.status === 'APPROVED' && (
                          <Link
                            to={`/bookings/distributions/${booking.id}`}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-blue-600 hover:text-blue-700"
                            title="View distribution details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        {booking.status === 'REJECTED' && (
                          <div className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-red-100 text-red-600 h-8 px-4">
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejected
                          </div>
                        )}
                        {booking.status === 'PENDING' && hasPermission('booking', 'D') && (
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-destructive hover:text-destructive"
                            title="Delete booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
