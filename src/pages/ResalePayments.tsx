import { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, User, Calendar, Building2, FileText } from 'lucide-react';

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface ResaleBooking {
  id: number;
  buyerName: string;
  property: {
    id: number;
    propertyName: string;
    building: string | null;
    type: string;
  };
}

interface Payment {
  id: number;
  type: string;
  date: string;
  from: string;
  collectedBy: number;
  receivedBy: number;
  amount: number;
  remarks: string | null;
  resaleBookingId: number | null;
  collectedUser: User;
  receivedUser: User;
  resaleBooking: ResaleBooking | null;
}

const ResalePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<ResaleBooking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, bookingsResponse, usersResponse] = await Promise.all([
        fetch(`http://localhost:8080/api/payments?type=RESALE&search=${encodeURIComponent(searchTerm)}`),
        fetch('http://localhost:8080/api/resale-bookings'),
        fetch('http://localhost:8080/api/users')
      ]);
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      } else {
        console.error('Failed to fetch resale payments');
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        // Filter only approved bookings
        const approvedBookings = bookingsData.filter((booking: any) => booking.status === 'APPROVED');
        setBookings(approvedBookings);
      } else {
        console.error('Failed to fetch resale bookings');
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
  }, [searchTerm]);

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch('http://localhost:8080/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          type: 'RESALE'
        })
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        alert('Payment added successfully!');
      } else {
        const error = await response.json();
        alert('Failed to add payment: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div>
        <ResalePaymentForm
          bookings={bookings}
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
            <h1 className="text-2xl font-bold text-foreground">Resale Payments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track payments for resale property bookings
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
            placeholder="Search payments by buyer, property, amount..."
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
      ) : payments.length === 0 ? (
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Property</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Collected By</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Received By</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Remarks</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Date */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    {/* From */}
                    <td className="p-4 align-middle">
                      <p className="font-medium">{payment.from}</p>
                    </td>

                    {/* Property */}
                    <td className="p-4 align-middle">
                      {payment.resaleBooking ? (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Building2 className="mr-1 h-3 w-3 text-muted-foreground" />
                            <p className="font-medium">{payment.resaleBooking.property.propertyName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {payment.resaleBooking.property.building || 'N/A'} • {payment.resaleBooking.property.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Buyer: {payment.resaleBooking.buyerName}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Collected By */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.collectedUser.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.collectedUser.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Received By */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.receivedUser.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.receivedUser.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          ₹{payment.amount.toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="p-4 align-middle">
                      <p className="text-sm text-muted-foreground">
                        {payment.remarks || '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {payments.length > 0 && (
        <div className="mt-6 bg-muted rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Payment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Payments</p>
              <p className="font-semibold text-foreground">{payments.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-green-600">
                ₹{payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Average Amount</p>
              <p className="font-semibold text-foreground">
                ₹{Math.round(payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Resale Payment Form Component
interface ResalePaymentFormProps {
  bookings: ResaleBooking[];
  users: User[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ResalePaymentForm = ({ bookings, users, onSubmit, onCancel }: ResalePaymentFormProps) => {
  const [formData, setFormData] = useState({
    resaleBookingId: '',
    from: '',
    collectedBy: '',
    receivedBy: '',
    amount: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.resaleBookingId) newErrors.resaleBookingId = 'Property Booking is required';
    if (!formData.from.trim()) newErrors.from = 'From is required';
    if (!formData.collectedBy) newErrors.collectedBy = 'Collected By is required';
    if (!formData.receivedBy) newErrors.receivedBy = 'Received By is required';
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

    const submitData = {
      ...formData,
      resaleBookingId: parseInt(formData.resaleBookingId),
      collectedBy: parseInt(formData.collectedBy),
      receivedBy: parseInt(formData.receivedBy),
      amount: parseFloat(formData.amount),
      remarks: formData.remarks || null
    };

    onSubmit(submitData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              Add New Payment
            </h3>
            <p className="text-sm text-muted-foreground">
              Record a payment for a resale property booking
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
          {/* Property Booking */}
          <div>
            <label htmlFor="resaleBookingId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Property Booking *
            </label>
            <select
              id="resaleBookingId"
              name="resaleBookingId"
              value={formData.resaleBookingId}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.resaleBookingId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a property booking</option>
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.property.propertyName} - {booking.buyerName} ({booking.property.type})
                </option>
              ))}
            </select>
            {errors.resaleBookingId && (
              <p className="mt-1 text-sm text-destructive">{errors.resaleBookingId}</p>
            )}
          </div>

          {/* From */}
          <div>
            <label htmlFor="from" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              From *
            </label>
            <input
              type="text"
              id="from"
              name="from"
              value={formData.from}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.from ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              placeholder="Enter payer name"
            />
            {errors.from && (
              <p className="mt-1 text-sm text-destructive">{errors.from}</p>
            )}
          </div>

          {/* Collected By and Received By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="collectedBy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                {users.map((user) => (
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
                Received By *
              </label>
              <select
                id="receivedBy"
                name="receivedBy"
                value={formData.receivedBy}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.receivedBy ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select user</option>
                {users.map((user) => (
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

export default ResalePayments;
