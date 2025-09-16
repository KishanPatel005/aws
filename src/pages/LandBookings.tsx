import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, User, Phone, DollarSign, Percent, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Land {
  id: number;
  name: string;
  village: string | null;
  taluka: string | null;
  district: string | null;
  mouUnit: string;
  size: number;
}

interface LandBooking {
  id: number;
  landId: number;
  date: string;
  buyerName: string;
  buyerMobile: string;
  referenceName: string | null;
  rate: number;
  amount: number;
  brokeragePct: number;
  brokerageAmt: number;
  remarks: string | null;
  status: string;
  land: Land;
}

const LandBookings = () => {
  const { hasPermission } = useAuth();
  const [bookings, setBookings] = useState<LandBooking[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<LandBooking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, landsResponse] = await Promise.all([
        fetch('http://localhost:8080/api/land-bookings'),
        fetch('http://localhost:8080/api/lands?status=true')
      ]);

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      } else {
        console.error('Failed to fetch land bookings');
      }

      if (landsResponse.ok) {
        const landsData = await landsResponse.json();
        setLands(landsData);
      } else {
        console.error('Failed to fetch lands');
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
        ? `http://localhost:8080/api/land-bookings/${editingBooking.id}`
        : 'http://localhost:8080/api/land-bookings';
      
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
        alert(editingBooking ? 'Land booking updated successfully!' : 'Land booking created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save land booking: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving land booking:', error);
      alert('Failed to save land booking');
    }
  };

  // Handle approve
  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/land-bookings/${id}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchData();
        alert('Land booking approved successfully!');
      } else {
        alert('Failed to approve land booking');
      }
    } catch (error) {
      console.error('Error approving land booking:', error);
      alert('Failed to approve land booking');
    }
  };

  // Handle reject
  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/land-bookings/${id}/reject`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchData();
        alert('Land booking rejected successfully!');
      } else {
        alert('Failed to reject land booking');
      }
    } catch (error) {
      console.error('Error rejecting land booking:', error);
      alert('Failed to reject land booking');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this land booking?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/land-bookings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Land booking deleted successfully!');
      } else {
        alert('Failed to delete land booking');
      }
    } catch (error) {
      console.error('Error deleting land booking:', error);
      alert('Failed to delete land booking');
    }
  };

  // Handle edit
  const handleEdit = (booking: LandBooking) => {
    setEditingBooking(booking);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingBooking(null);
  };

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking =>
    booking.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.buyerMobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.land.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.land.village && booking.land.village.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (booking.land.taluka && booking.land.taluka.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (booking.land.district && booking.land.district.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    let colorClass = '';
    let icon = null;
    let text = '';

    switch (status) {
      case 'PENDING':
        colorClass = 'bg-yellow-100 text-yellow-800';
        icon = <Clock className="w-3 h-3 mr-1" />;
        text = 'Pending';
        break;
      case 'APPROVED':
        colorClass = 'bg-green-100 text-green-800';
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
        text = 'Approved';
        break;
      case 'REJECTED':
        colorClass = 'bg-red-100 text-red-800';
        icon = <XCircle className="w-3 h-3 mr-1" />;
        text = 'Rejected';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800';
        text = status;
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
        {icon}
        {text}
      </span>
    );
  };

  if (showForm) {
    return (
      <div>
        <LandBookingForm
          booking={editingBooking}
          lands={lands}
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
            <h1 className="text-2xl font-bold text-foreground">Land Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage land bookings and their status
            </p>
          </div>
          {hasPermission('land_booking', 'C') && (
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
            placeholder="Search bookings by buyer, land, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
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
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Land</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Buyer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rate</th>
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
                    {/* Land */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-medium">{booking.land.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="mr-1 h-3 w-3" />
                          {booking.land.village && `${booking.land.village}, `}
                          {booking.land.taluka && `${booking.land.taluka}, `}
                          {booking.land.district}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {booking.land.size} {booking.land.mouUnit}
                        </p>
                      </div>
                    </td>

                    {/* Buyer */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-foreground">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{booking.buyerName}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="mr-2 h-3 w-3" />
                          {booking.buyerMobile}
                        </div>
                        {booking.referenceName && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {booking.referenceName}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="p-4 align-middle">
                      <p className="font-medium">₹{booking.rate.toLocaleString()}</p>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <p className="font-semibold text-green-600">₹{booking.amount.toLocaleString()}</p>
                    </td>

                    {/* Brokerage % */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Percent className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{booking.brokeragePct}%</span>
                      </div>
                    </td>

                    {/* Brokerage Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">₹{booking.brokerageAmt.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 align-middle">
                      {getStatusBadge(booking.status)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        {booking.status === 'PENDING' && hasPermission('land_booking', 'U') && (
                          <button
                            onClick={() => handleEdit(booking)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'PENDING' && hasPermission('land_booking', 'A') && (
                          <button
                            onClick={() => handleApprove(booking.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-8 px-3"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'PENDING' && hasPermission('land_booking', 'A') && (
                          <button
                            onClick={() => handleReject(booking.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-red-600 text-white hover:bg-red-700 h-8 px-3"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'PENDING' && hasPermission('land_booking', 'D') && (
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status !== 'PENDING' && (
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-destructive hover:text-destructive"
                            disabled
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

// Land Booking Form Component
interface LandBookingFormProps {
  booking?: LandBooking | null;
  lands: Land[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const LandBookingForm = ({ booking, lands, onSubmit, onCancel }: LandBookingFormProps) => {
  const [formData, setFormData] = useState({
    landId: '',
    buyerName: '',
    buyerMobile: '',
    referenceName: '',
    rate: '',
    amount: '',
    brokeragePct: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);

  useEffect(() => {
    if (booking) {
      setFormData({
        landId: booking.landId.toString(),
        buyerName: booking.buyerName,
        buyerMobile: booking.buyerMobile,
        referenceName: booking.referenceName || '',
        rate: booking.rate.toString(),
        amount: booking.amount.toString(),
        brokeragePct: booking.brokeragePct.toString(),
        remarks: booking.remarks || ''
      });
      setSelectedLand(booking.land);
    }
  }, [booking]);

  // Set selected land when landId changes
  useEffect(() => {
    if (formData.landId) {
      const land = lands.find(l => l.id === parseInt(formData.landId));
      setSelectedLand(land || null);
      
      // Auto-calculate amount if rate is provided
      if (formData.rate && land) {
        const rate = parseFloat(formData.rate);
        if (!isNaN(rate) && rate > 0) {
          const amount = land.size * rate;
          setFormData(prev => ({
            ...prev,
            amount: amount.toString()
          }));
        }
      }
    } else {
      setSelectedLand(null);
    }
  }, [formData.landId, formData.rate, lands]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.landId) newErrors.landId = 'Land is required';
    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer Name is required';
    if (!formData.buyerMobile.trim()) newErrors.buyerMobile = 'Buyer Mobile is required';
    if (!formData.rate.trim()) newErrors.rate = 'Rate is required';
    if (!formData.brokeragePct.trim()) newErrors.brokeragePct = 'Brokerage % is required';

    // Validate numbers
    const rate = parseFloat(formData.rate);
    const amount = parseFloat(formData.amount);
    const brokeragePct = parseFloat(formData.brokeragePct);
    
    if (formData.rate.trim() && (isNaN(rate) || rate <= 0)) {
      newErrors.rate = 'Rate must be a positive number';
    }
    
    if (formData.amount.trim() && (isNaN(amount) || amount <= 0)) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (formData.brokeragePct.trim() && (isNaN(brokeragePct) || brokeragePct < 0 || brokeragePct > 100)) {
      newErrors.brokeragePct = 'Brokerage % must be between 0 and 100';
    }

    // Validate mobile number
    if (formData.buyerMobile.trim() && !/^\d{10}$/.test(formData.buyerMobile.trim())) {
      newErrors.buyerMobile = 'Mobile number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const bookingData = {
      landId: parseInt(formData.landId),
      buyerName: formData.buyerName.trim(),
      buyerMobile: formData.buyerMobile.trim(),
      referenceName: formData.referenceName.trim() || null,
      rate: parseFloat(formData.rate),
      amount: parseFloat(formData.amount),
      brokeragePct: parseFloat(formData.brokeragePct),
      remarks: formData.remarks.trim() || null
    };

    onSubmit(bookingData);
  };

  const calculateBrokerageAmount = () => {
    const amount = parseFloat(formData.amount);
    const brokeragePct = parseFloat(formData.brokeragePct);
    if (!isNaN(amount) && !isNaN(brokeragePct) && amount > 0 && brokeragePct >= 0) {
      return amount * (brokeragePct / 100);
    }
    return 0;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {booking ? 'Edit Land Booking' : 'Add New Land Booking'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {booking ? 'Update land booking information' : 'Enter land booking details'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Land Selection */}
          <div>
            <label htmlFor="landId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <MapPin className="inline mr-2 h-4 w-4" />
              Land *
            </label>
            <select
              id="landId"
              name="landId"
              value={formData.landId}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.landId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a land</option>
              {lands.map(land => (
                <option key={land.id} value={land.id}>
                  {land.name} - {land.village}, {land.taluka}, {land.district} ({land.size} {land.mouUnit})
                </option>
              ))}
            </select>
            {errors.landId && (
              <p className="mt-1 text-sm text-destructive">{errors.landId}</p>
            )}
          </div>

          {/* Land Details Display */}
          {selectedLand && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Land Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{selectedLand.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <span className="ml-2 font-medium">{selectedLand.size} {selectedLand.mouUnit}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Village:</span>
                    <span className="ml-2 font-medium">{selectedLand.village}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taluka:</span>
                    <span className="ml-2 font-medium">{selectedLand.taluka}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buyer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyerName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <User className="inline mr-2 h-4 w-4" />
                Buyer Name *
              </label>
              <input
                type="text"
                id="buyerName"
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.buyerName ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter buyer name"
              />
              {errors.buyerName && (
                <p className="mt-1 text-sm text-destructive">{errors.buyerName}</p>
              )}
            </div>

            <div>
              <label htmlFor="buyerMobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Phone className="inline mr-2 h-4 w-4" />
                Buyer Mobile *
              </label>
              <input
                type="tel"
                id="buyerMobile"
                name="buyerMobile"
                value={formData.buyerMobile}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.buyerMobile ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter buyer mobile"
              />
              {errors.buyerMobile && (
                <p className="mt-1 text-sm text-destructive">{errors.buyerMobile}</p>
              )}
            </div>
          </div>

          {/* Reference Name */}
          <div>
            <label htmlFor="referenceName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <User className="inline mr-2 h-4 w-4" />
              Reference Name
            </label>
            <input
              type="text"
              id="referenceName"
              name="referenceName"
              value={formData.referenceName}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter reference name"
            />
          </div>

          {/* Rate and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <DollarSign className="inline mr-2 h-4 w-4" />
                Rate *
              </label>
              <input
                type="number"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.rate ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter rate"
              />
              {errors.rate && (
                <p className="mt-1 text-sm text-destructive">{errors.rate}</p>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <DollarSign className="inline mr-2 h-4 w-4" />
                Amount (Auto)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.amount ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter amount"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-destructive">{errors.amount}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-calculated as Rate × Land Size
              </p>
            </div>
          </div>

          {/* Brokerage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brokeragePct" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Percent className="inline mr-2 h-4 w-4" />
                Brokerage % *
              </label>
              <input
                type="number"
                id="brokeragePct"
                name="brokeragePct"
                value={formData.brokeragePct}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.brokeragePct ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter brokerage %"
              />
              {errors.brokeragePct && (
                <p className="mt-1 text-sm text-destructive">{errors.brokeragePct}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <DollarSign className="inline mr-2 h-4 w-4" />
                Brokerage Amount (Auto)
              </label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center">
                ₹{calculateBrokerageAmount().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <FileText className="inline mr-2 h-4 w-4" />
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter any additional remarks"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              {booking ? 'Update Booking' : 'Add Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandBookings;
