import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, FileText, Building2, Home, User, ArrowRight } from 'lucide-react';

interface Booking {
  id: number;
  unitNo: string;
  buyerName: string;
  project: {
    id: number;
    name: string;
    builder: {
      id: number;
      name: string;
    };
  };
}

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface BrokerageDistribution {
  id: number;
  bookingId: number;
  date: string;
  givenBy: number;
  recipient: number;
  amount: number;
  remarks: string | null;
  booking: Booking;
  giver: User;
  receiver: User;
}

const BrokerageDistribution = () => {
  const [distributions, setDistributions] = useState<BrokerageDistribution[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState<BrokerageDistribution | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [distributionsResponse, bookingsResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:8080/api/brokerage/distribution'),
        fetch('http://localhost:8080/api/bookings'),
        fetch('http://localhost:8080/api/users')
      ]);

      if (distributionsResponse.ok) {
        const distributionsData = await distributionsResponse.json();
        setDistributions(distributionsData);
      } else {
        console.error('Failed to fetch brokerage distributions');
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        // Filter only approved bookings
        const approvedBookings = bookingsData.filter((booking: any) => booking.status === 'APPROVED');
        setBookings(approvedBookings);
      } else {
        console.error('Failed to fetch bookings');
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
      const url = editingDistribution 
        ? `http://localhost:8080/api/brokerage/distribution/${editingDistribution.id}`
        : 'http://localhost:8080/api/brokerage/distribution';
      
      const method = editingDistribution ? 'PUT' : 'POST';
      
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
        setEditingDistribution(null);
        alert(editingDistribution ? 'Brokerage distribution updated successfully!' : 'Brokerage distribution created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save brokerage distribution: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving brokerage distribution:', error);
      alert('Failed to save brokerage distribution');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this brokerage distribution?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/brokerage/distribution/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Brokerage distribution deleted successfully!');
      } else {
        alert('Failed to delete brokerage distribution');
      }
    } catch (error) {
      console.error('Error deleting brokerage distribution:', error);
      alert('Failed to delete brokerage distribution');
    }
  };

  // Handle edit
  const handleEdit = (distribution: BrokerageDistribution) => {
    setEditingDistribution(distribution);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingDistribution(null);
  };

  // Filter distributions based on search term
  const filteredDistributions = distributions.filter(distribution =>
    distribution.booking.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.booking.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.booking.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.booking.project.builder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.giver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.receiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    distribution.amount.toString().includes(searchTerm)
  );

  if (showForm) {
    return (
      <div>
        <BrokerageDistributionForm
          distribution={editingDistribution}
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
            <h1 className="text-2xl font-bold text-foreground">Brokerage Distribution</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Distribute brokerage amounts to employees
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Distribution
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search distributions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Distributions Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading distributions...</p>
          </div>
        </div>
      ) : filteredDistributions.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No distributions found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new distribution.'}
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Given By</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Recipient</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Remarks</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredDistributions.map((distribution) => (
                  <tr key={distribution.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Date */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(distribution.date).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Booking */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-foreground">
                          <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Unit {distribution.booking.unitNo}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="mr-2 h-3 w-3" />
                          {distribution.booking.buyerName}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Building2 className="mr-2 h-3 w-3" />
                          {distribution.booking.project.name} - {distribution.booking.project.builder.name}
                        </div>
                      </div>
                    </td>

                    {/* Given By */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{distribution.giver.name}</p>
                          <p className="text-xs text-muted-foreground">{distribution.giver.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Recipient */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <ArrowRight className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{distribution.receiver.name}</p>
                          <p className="text-xs text-muted-foreground">{distribution.receiver.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ₹{distribution.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="p-4 align-middle">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {distribution.remarks || '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(distribution)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(distribution.id)}
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

// Brokerage Distribution Form Component
interface BrokerageDistributionFormProps {
  distribution?: BrokerageDistribution | null;
  bookings: Booking[];
  users: User[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const BrokerageDistributionForm = ({ distribution, bookings, users, onSubmit, onCancel }: BrokerageDistributionFormProps) => {
  const [formData, setFormData] = useState({
    bookingId: '',
    givenBy: '',
    recipient: '',
    amount: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filter management users for "Given By" field
  const managementUsers = users.filter(user => 
    ['SYSTEM_ADMIN', 'MANAGEMENT'].includes(user.user_type)
  );

  // Filter employee users for "Recipient" field
  const employeeUsers = users.filter(user => 
    ['MANAGER', 'EMPLOYEE'].includes(user.user_type)
  );

  useEffect(() => {
    if (distribution) {
      setFormData({
        bookingId: distribution.bookingId.toString(),
        givenBy: distribution.givenBy.toString(),
        recipient: distribution.recipient.toString(),
        amount: distribution.amount.toString(),
        remarks: distribution.remarks || ''
      });
      setSelectedBooking(distribution.booking);
    }
  }, [distribution]);

  // Set selected booking when booking changes
  useEffect(() => {
    if (formData.bookingId) {
      const booking = bookings.find(b => b.id === parseInt(formData.bookingId));
      setSelectedBooking(booking || null);
    } else {
      setSelectedBooking(null);
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
    if (!formData.givenBy) newErrors.givenBy = 'Given by is required';
    if (!formData.recipient) newErrors.recipient = 'Recipient is required';
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

    const distributionData = {
      bookingId: parseInt(formData.bookingId),
      givenBy: parseInt(formData.givenBy),
      recipient: parseInt(formData.recipient),
      amount: parseFloat(formData.amount),
      remarks: formData.remarks.trim() || null
    };

    onSubmit(distributionData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {distribution ? 'Edit Brokerage Distribution' : 'Add New Brokerage Distribution'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {distribution ? 'Update brokerage distribution information' : 'Distribute brokerage amount to an employee'}
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

          {/* Booking Details Display */}
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
              </div>
            </div>
          )}

          {/* Given By and Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="givenBy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <User className="inline mr-2 h-4 w-4" />
                Given By (Management) *
              </label>
              <select
                id="givenBy"
                name="givenBy"
                value={formData.givenBy}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.givenBy ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select management user</option>
                {managementUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.user_type})
                  </option>
                ))}
              </select>
              {errors.givenBy && (
                <p className="mt-1 text-sm text-destructive">{errors.givenBy}</p>
              )}
            </div>

            <div>
              <label htmlFor="recipient" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <ArrowRight className="inline mr-2 h-4 w-4" />
                Recipient (Employee) *
              </label>
              <select
                id="recipient"
                name="recipient"
                value={formData.recipient}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.recipient ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select employee</option>
                {employeeUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.user_type})
                  </option>
                ))}
              </select>
              {errors.recipient && (
                <p className="mt-1 text-sm text-destructive">{errors.recipient}</p>
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
              placeholder="Enter amount to distribute"
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
              {distribution ? 'Update Distribution' : 'Add Distribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrokerageDistribution;
