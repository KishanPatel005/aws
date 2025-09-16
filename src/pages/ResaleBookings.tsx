import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, FileText, Building2, User, Phone, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ResaleProperty {
  id: number;
  propertyName: string;
  building: string | null;
  type: string;
  propertyType: string;
  size: number;
}

interface ResaleBooking {
  id: number;
  propertyId: number;
  date: string;
  buyerName: string;
  buyerMobile: string;
  referenceName: string | null;
  rate: number;
  amount: number;
  buyerBrokeragePct: number;
  buyerBrokerageAmt: number;
  sellerBrokeragePct: number;
  sellerBrokerageAmt: number;
  remarks: string | null;
  status: string;
  pdfPath: string | null;
  property: ResaleProperty;
}

const ResaleBookings = () => {
  const { hasPermission } = useAuth();
  const [bookings, setBookings] = useState<ResaleBooking[]>([]);
  const [properties, setProperties] = useState<ResaleProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<ResaleBooking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsResponse, propertiesResponse] = await Promise.all([
        fetch(`http://localhost:8080/api/resale-bookings?search=${encodeURIComponent(searchTerm)}`),
        fetch('http://localhost:8080/api/resale-properties')
      ]);
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      } else {
        console.error('Failed to fetch resale bookings');
      }

      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        setProperties(propertiesData);
      } else {
        console.error('Failed to fetch resale properties');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      const url = editingBooking 
        ? `http://localhost:8080/api/resale-bookings/${editingBooking.id}`
        : 'http://localhost:8080/api/resale-bookings';
      
      const method = editingBooking ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setEditingBooking(null);
        alert(editingBooking ? 'Booking updated successfully!' : 'Booking created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save booking: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking');
    }
  };

  // Handle approve
  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/resale-bookings/${id}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchData();
        alert('Booking approved successfully!');
      } else {
        alert('Failed to approve booking');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      alert('Failed to approve booking');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/resale-bookings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Booking deleted successfully!');
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  // Handle edit
  const handleEdit = (booking: ResaleBooking) => {
    setEditingBooking(booking);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingBooking(null);
  };

  if (showForm) {
    return (
      <div>
        <ResaleBookingForm
          booking={editingBooking}
          properties={properties}
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
            <h1 className="text-2xl font-bold text-foreground">Resale Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage property bookings and brokerage
            </p>
          </div>
          {hasPermission('resale_booking', 'C') && (
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
            placeholder="Search bookings by buyer, property..."
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
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Property</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Buyer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Buyer Brokerage</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Seller Brokerage</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Property */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-medium">{booking.property.propertyName}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Building2 className="mr-1 h-3 w-3" />
                          {booking.property.building || 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {booking.property.type} • {booking.property.propertyType}
                        </p>
                      </div>
                    </td>

                    {/* Buyer */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3 text-muted-foreground" />
                          <p className="font-medium">{booking.buyerName}</p>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="mr-1 h-3 w-3" />
                          {booking.buyerMobile}
                        </div>
                        {booking.referenceName && (
                          <p className="text-xs text-muted-foreground">Ref: {booking.referenceName}</p>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-semibold text-green-600">₹{booking.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Rate: ₹{booking.rate.toLocaleString()}</p>
                      </div>
                    </td>

                    {/* Buyer Brokerage */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-medium text-blue-600">₹{booking.buyerBrokerageAmt.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{booking.buyerBrokeragePct}%</p>
                      </div>
                    </td>

                    {/* Seller Brokerage */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-medium text-purple-600">₹{booking.sellerBrokerageAmt.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{booking.sellerBrokeragePct}%</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        booking.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        {booking.status === 'PENDING' && hasPermission('resale_booking', 'U') && (
                          <button
                            onClick={() => handleEdit(booking)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'PENDING' && hasPermission('resale_booking', 'A') && (
                          <button
                            onClick={() => handleApprove(booking.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'PENDING' && hasPermission('resale_booking', 'D') && (
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'APPROVED' && booking.pdfPath && (
                          <a
                            href={`http://localhost:8080${booking.pdfPath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
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

// Resale Booking Form Component
interface ResaleBookingFormProps {
  booking?: ResaleBooking | null;
  properties: ResaleProperty[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ResaleBookingForm = ({ booking, properties, onSubmit, onCancel }: ResaleBookingFormProps) => {
  const [formData, setFormData] = useState({
    propertyId: '',
    buyerName: '',
    buyerMobile: '',
    referenceName: '',
    rate: '',
    amount: '',
    buyerBrokeragePct: '',
    sellerBrokeragePct: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProperty, setSelectedProperty] = useState<ResaleProperty | null>(null);

  useEffect(() => {
    if (booking) {
      setFormData({
        propertyId: booking.propertyId.toString(),
        buyerName: booking.buyerName,
        buyerMobile: booking.buyerMobile,
        referenceName: booking.referenceName || '',
        rate: booking.rate.toString(),
        amount: booking.amount.toString(),
        buyerBrokeragePct: booking.buyerBrokeragePct.toString(),
        sellerBrokeragePct: booking.sellerBrokeragePct.toString(),
        remarks: booking.remarks || ''
      });
      setSelectedProperty(booking.property);
    }
  }, [booking]);

  useEffect(() => {
    if (formData.propertyId) {
      const property = properties.find(p => p.id === parseInt(formData.propertyId));
      setSelectedProperty(property || null);
    }
  }, [formData.propertyId, properties]);

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

    if (!formData.propertyId) newErrors.propertyId = 'Property is required';
    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer Name is required';
    if (!formData.buyerMobile.trim()) newErrors.buyerMobile = 'Buyer Mobile is required';
    if (!formData.rate.trim()) newErrors.rate = 'Rate is required';
    if (!formData.buyerBrokeragePct.trim()) newErrors.buyerBrokeragePct = 'Buyer Brokerage % is required';
    if (!formData.sellerBrokeragePct.trim()) newErrors.sellerBrokeragePct = 'Seller Brokerage % is required';

    // Validate numbers
    const rate = parseFloat(formData.rate);
    const buyerBrokeragePct = parseFloat(formData.buyerBrokeragePct);
    const sellerBrokeragePct = parseFloat(formData.sellerBrokeragePct);
    
    if (formData.rate.trim() && (isNaN(rate) || rate <= 0)) {
      newErrors.rate = 'Rate must be a positive number';
    }
    
    if (formData.buyerBrokeragePct.trim() && (isNaN(buyerBrokeragePct) || buyerBrokeragePct < 0 || buyerBrokeragePct > 100)) {
      newErrors.buyerBrokeragePct = 'Buyer Brokerage % must be between 0 and 100';
    }
    
    if (formData.sellerBrokeragePct.trim() && (isNaN(sellerBrokeragePct) || sellerBrokeragePct < 0 || sellerBrokeragePct > 100)) {
      newErrors.sellerBrokeragePct = 'Seller Brokerage % must be between 0 and 100';
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

    const submitData = {
      ...formData,
      propertyId: parseInt(formData.propertyId),
      rate: parseFloat(formData.rate),
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      buyerBrokeragePct: parseFloat(formData.buyerBrokeragePct),
      sellerBrokeragePct: parseFloat(formData.sellerBrokeragePct),
      referenceName: formData.referenceName || null,
      remarks: formData.remarks || null
    };

    onSubmit(submitData);
  };

  const calculateAmount = () => {
    const rate = parseFloat(formData.rate);
    if (!isNaN(rate) && selectedProperty && rate > 0) {
      return rate * selectedProperty.size;
    }
    return 0;
  };

  const calculateBuyerBrokerage = () => {
    const amount = calculateAmount();
    const pct = parseFloat(formData.buyerBrokeragePct);
    if (!isNaN(pct) && amount > 0) {
      return amount * (pct / 100);
    }
    return 0;
  };

  const calculateSellerBrokerage = () => {
    const amount = calculateAmount();
    const pct = parseFloat(formData.sellerBrokeragePct);
    if (!isNaN(pct) && amount > 0) {
      return amount * (pct / 100);
    }
    return 0;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {booking ? 'Edit Booking' : 'Add New Booking'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {booking ? 'Update booking information' : 'Enter booking details'}
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
          {/* Property Selection */}
          <div>
            <label htmlFor="propertyId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Property *
            </label>
            <select
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.propertyId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.propertyName} - {property.building || 'N/A'} ({property.type})
                </option>
              ))}
            </select>
            {errors.propertyId && (
              <p className="mt-1 text-sm text-destructive">{errors.propertyId}</p>
            )}
          </div>

          {/* Selected Property Info */}
          {selectedProperty && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-2">Selected Property</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type:</p>
                  <p className="font-medium">{selectedProperty.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Property Type:</p>
                  <p className="font-medium">{selectedProperty.propertyType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size:</p>
                  <p className="font-medium">{selectedProperty.size} sq ft</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Building:</p>
                  <p className="font-medium">{selectedProperty.building || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Buyer Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Buyer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="buyerName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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

              <div>
                <label htmlFor="referenceName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Financial Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Amount (Auto)
                </label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  ₹{calculateAmount().toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Brokerage Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Brokerage Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="buyerBrokeragePct" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Buyer Brokerage % *
                </label>
                <input
                  type="number"
                  id="buyerBrokeragePct"
                  name="buyerBrokeragePct"
                  value={formData.buyerBrokeragePct}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.buyerBrokeragePct ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter buyer brokerage %"
                />
                {errors.buyerBrokeragePct && (
                  <p className="mt-1 text-sm text-destructive">{errors.buyerBrokeragePct}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Amount: ₹{calculateBuyerBrokerage().toLocaleString()}
                </p>
              </div>

              <div>
                <label htmlFor="sellerBrokeragePct" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Seller Brokerage % *
                </label>
                <input
                  type="number"
                  id="sellerBrokeragePct"
                  name="sellerBrokeragePct"
                  value={formData.sellerBrokeragePct}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.sellerBrokeragePct ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter seller brokerage %"
                />
                {errors.sellerBrokeragePct && (
                  <p className="mt-1 text-sm text-destructive">{errors.sellerBrokeragePct}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Amount: ₹{calculateSellerBrokerage().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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

export default ResaleBookings;
