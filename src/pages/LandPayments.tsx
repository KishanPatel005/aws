import { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, User, Calendar, FileText, MapPin, Building2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface LandBooking {
  id: number;
  buyerName: string;
  land: {
    id: number;
    name: string;
    village: string | null;
    taluka: string | null;
    district: string | null;
  };
}

interface PaymentCollection {
  id: number;
  type: string;
  date: string;
  from: string;
  collectedBy: number;
  receivedBy: number;
  amount: number;
  remarks: string | null;
  landBookingId: number | null;
  collectedUser: User;
  receivedUser: User;
  landBooking: LandBooking | null;
}

const LandPayments = () => {
  const [payments, setPayments] = useState<PaymentCollection[]>([]);
  const [landBookings, setLandBookings] = useState<LandBooking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, landBookingsResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:8080/api/payments?type=LAND'),
        fetch('http://localhost:8080/api/land-bookings?status=APPROVED'),
        fetch('http://localhost:8080/api/users')
      ]);

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      } else {
        console.error('Failed to fetch land payments');
      }

      if (landBookingsResponse.ok) {
        const landBookingsData = await landBookingsResponse.json();
        setLandBookings(landBookingsData);
      } else {
        console.error('Failed to fetch land bookings');
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
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
      const response = await fetch('http://localhost:8080/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          type: 'LAND'
        })
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        alert('Land payment created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save land payment: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving land payment:', error);
      alert('Failed to save land payment');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
  };

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment =>
    payment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.collectedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.receivedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount.toString().includes(searchTerm) ||
    (payment.landBooking && payment.landBooking.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (payment.landBooking && payment.landBooking.land.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (showForm) {
    return (
      <div>
        <LandPaymentForm
          landBookings={landBookings}
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
            <h1 className="text-2xl font-bold text-foreground">Land Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track payments for land bookings
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payments by buyer, land, collector, amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No payments found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new payment.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b border-border transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">From</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Land Booking</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Collected By</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Received By</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Date */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </td>

                    {/* From */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        {payment.from}
                      </div>
                    </td>

                    {/* Land Booking */}
                    <td className="p-4 align-middle">
                      {payment.landBooking ? (
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-foreground">
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{payment.landBooking.land.name}</span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="mr-2 h-3 w-3" />
                            {payment.landBooking.buyerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.landBooking.land.village && `${payment.landBooking.land.village}, `}
                            {payment.landBooking.land.taluka && `${payment.landBooking.land.taluka}, `}
                            {payment.landBooking.land.district}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Collected By */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.collectedUser.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.collectedUser.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Received By */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.receivedUser.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.receivedUser.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="p-4 align-middle">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {payment.remarks || '-'}
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

// Land Payment Form Component
interface LandPaymentFormProps {
  landBookings: LandBooking[];
  users: User[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const LandPaymentForm = ({ landBookings, users, onSubmit, onCancel }: LandPaymentFormProps) => {
  const [formData, setFormData] = useState({
    landBookingId: '',
    from: '',
    collectedBy: '',
    receivedBy: '',
    amount: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<LandBooking | null>(null);

  // Filter management users for "Received By" field
  const managementUsers = users.filter(user => 
    ['SYSTEM_ADMIN', 'MANAGEMENT'].includes(user.user_type)
  );

  useEffect(() => {
    if (formData.landBookingId) {
      const booking = landBookings.find(b => b.id === parseInt(formData.landBookingId));
      setSelectedBooking(booking || null);
      
      // Set default "from" value based on selected booking
      if (booking) {
        setFormData(prev => ({
          ...prev,
          from: `${booking.land.name} - ${booking.buyerName}`
        }));
      }
    } else {
      setSelectedBooking(null);
    }
  }, [formData.landBookingId, landBookings]);

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

    if (!formData.landBookingId) newErrors.landBookingId = 'Land Booking is required';
    if (!formData.from.trim()) newErrors.from = 'From is required';
    if (!formData.collectedBy) newErrors.collectedBy = 'Collected by is required';
    if (!formData.receivedBy) newErrors.receivedBy = 'Received by is required';
    if (!formData.amount.trim()) newErrors.amount = 'Amount is required';

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (formData.amount.trim() && (isNaN(amount) || amount <= 0)) {
      newErrors.amount = 'Amount must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const paymentData = {
      landBookingId: parseInt(formData.landBookingId),
      from: formData.from.trim(),
      collectedBy: parseInt(formData.collectedBy),
      receivedBy: parseInt(formData.receivedBy),
      amount: parseFloat(formData.amount),
      remarks: formData.remarks.trim() || null
    };

    onSubmit(paymentData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              Add New Land Payment
            </h3>
            <p className="text-sm text-muted-foreground">
              Record a payment for a land booking
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
          {/* Land Booking Selection */}
          <div>
            <label htmlFor="landBookingId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <MapPin className="inline mr-2 h-4 w-4" />
              Land Booking *
            </label>
            <select
              id="landBookingId"
              name="landBookingId"
              value={formData.landBookingId}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.landBookingId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a land booking</option>
              {landBookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  {booking.land.name} - {booking.buyerName}
                </option>
              ))}
            </select>
            {errors.landBookingId && (
              <p className="mt-1 text-sm text-destructive">{errors.landBookingId}</p>
            )}
          </div>

          {/* Land Booking Details Display */}
          {selectedBooking && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Land Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Land:</span>
                    <span className="ml-2 font-medium">{selectedBooking.land.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Buyer:</span>
                    <span className="ml-2 font-medium">{selectedBooking.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Village:</span>
                    <span className="ml-2 font-medium">{selectedBooking.land.village}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taluka:</span>
                    <span className="ml-2 font-medium">{selectedBooking.land.taluka}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* From */}
          <div>
            <label htmlFor="from" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Building2 className="inline mr-2 h-4 w-4" />
              From *
            </label>
            <input
              type="text"
              id="from"
              name="from"
              value={formData.from}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.from ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              placeholder="Enter source of payment"
            />
            {errors.from && (
              <p className="mt-1 text-sm text-destructive">{errors.from}</p>
            )}
          </div>

          {/* Collected By and Received By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="collectedBy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <User className="inline mr-2 h-4 w-4" />
                Collected By *
              </label>
              <select
                id="collectedBy"
                name="collectedBy"
                value={formData.collectedBy}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.collectedBy ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.user_type})
                  </option>
                ))}
              </select>
              {errors.collectedBy && (
                <p className="mt-1 text-sm text-destructive">{errors.collectedBy}</p>
              )}
            </div>

            <div>
              <label htmlFor="receivedBy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <User className="inline mr-2 h-4 w-4" />
                Received By (Management) *
              </label>
              <select
                id="receivedBy"
                name="receivedBy"
                value={formData.receivedBy}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.receivedBy ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select management user</option>
                {managementUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.user_type})
                  </option>
                ))}
              </select>
              {errors.receivedBy && (
                <p className="mt-1 text-sm text-destructive">{errors.receivedBy}</p>
              )}
            </div>
          </div>

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
              step="0.01"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.amount ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              placeholder="Enter amount"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-destructive">{errors.amount}</p>
            )}
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
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LandPayments;
