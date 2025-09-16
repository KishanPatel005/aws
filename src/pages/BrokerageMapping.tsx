import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, FileText, Building2, Home, User } from 'lucide-react';

interface Booking {
  id: number;
  unitNo: string;
  buyerName: string;
  brokerageAmt: number;
  project: {
    id: number;
    name: string;
    builder: {
      id: number;
      name: string;
    };
  };
}

interface BrokerageMapping {
  id: number;
  bookingId: number;
  date: string;
  currentDue: number;
  amount: number;
  remarks: string | null;
  booking: Booking;
}

const BrokerageMapping = () => {
  const [mappings, setMappings] = useState<BrokerageMapping[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<BrokerageMapping | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [mappingsResponse, bookingsResponse] = await Promise.all([
        fetch('http://localhost:8080/api/brokerage/mapping'),
        fetch('http://localhost:8080/api/bookings')
      ]);

      if (mappingsResponse.ok) {
        const mappingsData = await mappingsResponse.json();
        setMappings(mappingsData);
      } else {
        console.error('Failed to fetch brokerage mappings');
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        // Filter only approved bookings
        const approvedBookings = bookingsData.filter((booking: any) => booking.status === 'APPROVED');
        setBookings(approvedBookings);
      } else {
        console.error('Failed to fetch bookings');
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
      const url = editingMapping 
        ? `http://localhost:8080/api/brokerage/mapping/${editingMapping.id}`
        : 'http://localhost:8080/api/brokerage/mapping';
      
      const method = editingMapping ? 'PUT' : 'POST';
      
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
        setEditingMapping(null);
        alert(editingMapping ? 'Brokerage mapping updated successfully!' : 'Brokerage mapping created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save brokerage mapping: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving brokerage mapping:', error);
      alert('Failed to save brokerage mapping');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this brokerage mapping?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/brokerage/mapping/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Brokerage mapping deleted successfully!');
      } else {
        alert('Failed to delete brokerage mapping');
      }
    } catch (error) {
      console.error('Error deleting brokerage mapping:', error);
      alert('Failed to delete brokerage mapping');
    }
  };

  // Handle edit
  const handleEdit = (mapping: BrokerageMapping) => {
    setEditingMapping(mapping);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingMapping(null);
  };

  // Filter mappings based on search term
  const filteredMappings = mappings.filter(mapping =>
    mapping.booking.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.booking.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.booking.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.booking.project.builder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.amount.toString().includes(searchTerm)
  );

  if (showForm) {
    return (
      <div>
        <BrokerageMappingForm
          mapping={editingMapping}
          bookings={bookings}
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
            <h1 className="text-2xl font-bold text-foreground">Brokerage Mapping</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Map brokerage amounts for approved bookings
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Mapping
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search mappings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Mappings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading mappings...</p>
          </div>
        </div>
      ) : filteredMappings.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No mappings found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new mapping.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b border-border transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Booking</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Current Due</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Remarks</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Date */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(mapping.date).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Booking */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-foreground">
                          <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Unit {mapping.booking.unitNo}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="mr-2 h-3 w-3" />
                          {mapping.booking.buyerName}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Building2 className="mr-2 h-3 w-3" />
                          {mapping.booking.project.name} - {mapping.booking.project.builder.name}
                        </div>
                      </div>
                    </td>

                    {/* Current Due */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          ₹{mapping.currentDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ₹{mapping.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="p-4 align-middle">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {mapping.remarks || '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.id)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

// Brokerage Mapping Form Component
interface BrokerageMappingFormProps {
  mapping?: BrokerageMapping | null;
  bookings: Booking[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const BrokerageMappingForm = ({ mapping, bookings, onSubmit, onCancel }: BrokerageMappingFormProps) => {
  const [formData, setFormData] = useState({
    bookingId: '',
    amount: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentDue, setCurrentDue] = useState(0);

  useEffect(() => {
    if (mapping) {
      setFormData({
        bookingId: mapping.bookingId.toString(),
        amount: mapping.amount.toString(),
        remarks: mapping.remarks || ''
      });
      setSelectedBooking(mapping.booking);
      setCurrentDue(mapping.currentDue);
    }
  }, [mapping]);

  // Calculate current due when booking changes
  useEffect(() => {
    if (formData.bookingId) {
      const booking = bookings.find(b => b.id === parseInt(formData.bookingId));
      if (booking) {
        setSelectedBooking(booking);
        // For now, we'll use the full brokerage amount as current due
        // In a real app, you'd calculate this by subtracting already mapped amounts
        setCurrentDue(booking.brokerageAmt);
      }
    } else {
      setSelectedBooking(null);
      setCurrentDue(0);
    }
  }, [formData.bookingId, bookings]);

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

    if (!formData.bookingId) newErrors.bookingId = 'Booking is required';
    if (!formData.amount.trim()) newErrors.amount = 'Amount is required';

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (formData.amount.trim() && (isNaN(amount) || amount <= 0)) {
      newErrors.amount = 'Amount must be a positive number';
    } else if (amount > currentDue) {
      newErrors.amount = `Amount cannot exceed current due of ₹${currentDue.toLocaleString()}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const mappingData = {
      bookingId: parseInt(formData.bookingId),
      amount: parseFloat(formData.amount),
      remarks: formData.remarks.trim() || null
    };

    onSubmit(mappingData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {mapping ? 'Edit Brokerage Mapping' : 'Add New Brokerage Mapping'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {mapping ? 'Update brokerage mapping information' : 'Map brokerage amount for a booking'}
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
          {/* Booking Selection */}
          <div>
            <label htmlFor="bookingId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Home className="inline mr-2 h-4 w-4" />
              Booking *
            </label>
            <select
              id="bookingId"
              name="bookingId"
              value={formData.bookingId}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.bookingId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a booking</option>
              {bookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  Unit {booking.unitNo} - {booking.buyerName} - {booking.project.name}
                </option>
              ))}
            </select>
            {errors.bookingId && (
              <p className="mt-1 text-sm text-destructive">{errors.bookingId}</p>
            )}
          </div>

          {/* Current Due Display */}
          {selectedBooking && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Unit:</span>
                    <span className="ml-2 font-medium">{selectedBooking.unitNo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Buyer:</span>
                    <span className="ml-2 font-medium">{selectedBooking.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Project:</span>
                    <span className="ml-2 font-medium">{selectedBooking.project.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Builder:</span>
                    <span className="ml-2 font-medium">{selectedBooking.project.builder.name}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Due:</span>
                    <span className="font-semibold text-foreground">
                      ₹{currentDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <DollarSign className="inline mr-2 h-4 w-4" />
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              max={currentDue}
              step="0.01"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.amount ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              placeholder="Enter amount to map"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-destructive">{errors.amount}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum: ₹{currentDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
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
              {mapping ? 'Update Mapping' : 'Add Mapping'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrokerageMapping;
