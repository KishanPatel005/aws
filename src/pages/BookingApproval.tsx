import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Home, User, Phone, DollarSign, Percent, Calculator, Plus, X, CheckCircle, AlertCircle, Info, Calendar, MapPin, CreditCard, Users, TrendingUp, FileText, Clock } from 'lucide-react';

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

interface Distribution {
  userId: string | null;
  sharePct: string;
  shareAmt: number;
  remarks: string;
}

const BookingApproval = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [distributions, setDistributions] = useState<Distribution[]>([
    { userId: '', sharePct: '', shareAmt: 0, remarks: '' }
  ]);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch booking and users data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingResponse, usersResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/bookings/${id}`),
          fetch('http://localhost:8080/api/users')
        ]);

        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          setBooking(bookingData);
          setRemarks(bookingData.remarks || '');
        } else {
          console.error('Failed to fetch booking');
          alert('Failed to fetch booking details');
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Calculate distribution amounts when percentages change
  useEffect(() => {
    if (booking) {
      const updatedDistributions = distributions.map(dist => ({
        ...dist,
        shareAmt: booking.brokerageAmt * (parseFloat(dist.sharePct) || 0) / 100
      }));
      setDistributions(updatedDistributions);
    }
  }, [distributions.map(d => d.sharePct).join(','), booking?.brokerageAmt]);

  const addDistribution = () => {
    setDistributions([...distributions, { userId: '', sharePct: '', shareAmt: 0, remarks: '' }]);
  };

  const removeDistribution = (index: number) => {
    if (distributions.length > 1) {
      setDistributions(distributions.filter((_, i) => i !== index));
    }
  };

  const updateDistribution = (index: number, field: keyof Distribution, value: string) => {
    const updated = [...distributions];
    updated[index] = { ...updated[index], [field]: value };
    setDistributions(updated);

    // Clear errors for this field
    if (errors[`dist_${index}_${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`dist_${index}_${field}`]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate distributions
    if (distributions.length === 0) {
      newErrors.distributions = 'At least one distribution is required';
    }

    let totalPercentage = 0;
    distributions.forEach((dist, index) => {
      if (!dist.userId && dist.userId !== '') {
        newErrors[`dist_${index}_userId`] = 'Please select a user or company';
      }
      if (!dist.sharePct || dist.sharePct === '') {
        newErrors[`dist_${index}_sharePct`] = 'Share percentage is required';
      } else {
        const pct = parseFloat(dist.sharePct);
        if (isNaN(pct) || pct <= 0 || pct > 100) {
          newErrors[`dist_${index}_sharePct`] = 'Share percentage must be between 0 and 100';
        } else {
          totalPercentage += pct;
        }
      }
    });

    if (Math.abs(totalPercentage - 100) > 0.01) {
      newErrors.totalPercentage = `Total percentage must equal 100%. Current total: ${totalPercentage.toFixed(2)}%`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !booking) return;

    try {
      setSubmitting(true);
      const response = await fetch(`http://localhost:8080/api/bookings/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          distributions: distributions.map(dist => ({
            userId: dist.userId === '' ? null : parseInt(dist.userId),
            sharePct: parseFloat(dist.sharePct),
            remarks: dist.remarks || null
          })),
          remarks: remarks || null
        })
      });

      if (response.ok) {
        alert('Booking approved successfully!');
        navigate('/bookings');
      } else {
        const error = await response.json();
        alert('Failed to approve booking: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      alert('Failed to approve booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-foreground">Loading booking details...</p>
          <p className="mt-1 text-sm text-muted-foreground">Please wait while we fetch the information</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Booking Not Found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            The booking you're looking for doesn't exist or may have been removed.
          </p>
          <button
            onClick={() => navigate('/bookings')}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (booking.status !== 'PENDING') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Booking Already Processed</h3>
          <p className="text-sm text-muted-foreground mb-6">
            This booking has already been <span className="font-semibold text-blue-600">{booking.status.toLowerCase()}</span> and cannot be modified.
          </p>
          <button
            onClick={() => navigate('/bookings')}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const totalPercentage = distributions.reduce((sum, dist) => sum + (parseFloat(dist.sharePct) || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <div className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/bookings')}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Bookings
              </button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <CheckCircle className="mr-3 h-6 w-6 text-green-600" />
                  Booking Approval
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review booking details and distribute brokerage commission
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                <Clock className="inline mr-1 h-3 w-3" />
                Pending Approval
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Enhanced Booking Details */}
          <div className="xl:col-span-1">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  Booking Information
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Project Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Project Details</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                    {booking.project.builder.logo ? (
                      <img
                        src={`http://localhost:8080${booking.project.builder.logo}`}
                        alt={booking.project.builder.name}
                        className="h-12 w-12 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{booking.project.name}</p>
                      <p className="text-sm text-muted-foreground">{booking.project.builder.name}</p>
                      {booking.project.city && (
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {booking.project.city}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unit Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <Home className="h-4 w-4" />
                    <span>Unit Information</span>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Unit Number</span>
                      <span className="text-sm font-semibold text-blue-600">#{booking.unitNo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="text-sm font-medium text-foreground">{booking.inventory.unitType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Size</span>
                      <span className="text-sm font-medium text-foreground">
                        {booking.inventory.size} {booking.inventory.mou}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buyer Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Buyer Information</span>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Name</span>
                      <span className="text-sm font-semibold text-foreground">{booking.buyerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Mobile</span>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{booking.buyerMobile}</span>
                      </div>
                    </div>
                    {booking.referenceName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Reference</span>
                        <span className="text-sm font-medium text-foreground">{booking.referenceName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Financial Details</span>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Total Amount</span>
                      <span className="text-lg font-bold text-green-700">
                        ₹{booking.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rate per {booking.inventory.mou}</span>
                      <span className="text-sm font-semibold text-foreground">
                        ₹{booking.rate.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="border-t border-green-200 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Brokerage ({booking.brokeragePct}%)</span>
                        <span className="text-lg font-bold text-blue-700">
                          ₹{booking.brokerageAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Booking Information</span>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Booked By</span>
                      <span className="text-sm font-medium text-foreground">{booking.user.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Role</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {booking.user.user_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Brokerage Distribution Form */}
          <div className="xl:col-span-2">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
                  Brokerage Distribution
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Distribute the brokerage amount among team members and company
                </p>
              </div>
              
              <div className="p-6">
            
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Distribution Rows */}
                  <div className="space-y-4">
                    {distributions.map((dist, index) => (
                      <div key={index} className="p-6 border border-border rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Distribution {index + 1}</h3>
                          </div>
                          {distributions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDistribution(index)}
                              className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* User Selection */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground flex items-center">
                              <Users className="mr-2 h-4 w-4" />
                              User/Company
                            </label>
                            <select
                              value={dist.userId}
                              onChange={(e) => updateDistribution(index, 'userId', e.target.value)}
                              className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[`dist_${index}_userId`] ? 'border-destructive focus:ring-destructive' : 'border-input'}`}
                            >
                              <option value="">Select user or company</option>
                              <option value="">🏢 Company</option>
                              {users.map(user => (
                                <option key={user.id} value={user.id}>
                                  👤 {user.name} ({user.user_type})
                                </option>
                              ))}
                            </select>
                            {errors[`dist_${index}_userId`] && (
                              <p className="text-xs text-destructive flex items-center">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                {errors[`dist_${index}_userId`]}
                              </p>
                            )}
                          </div>

                          {/* Share Percentage */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground flex items-center">
                              <Percent className="mr-2 h-4 w-4" />
                              Share Percentage
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={dist.sharePct}
                                onChange={(e) => updateDistribution(index, 'sharePct', e.target.value)}
                                min="0"
                                max="100"
                                step="0.01"
                                className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[`dist_${index}_sharePct`] ? 'border-destructive focus:ring-destructive' : 'border-input'}`}
                                placeholder="0.00"
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                %
                              </div>
                            </div>
                            {errors[`dist_${index}_sharePct`] && (
                              <p className="text-xs text-destructive flex items-center">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                {errors[`dist_${index}_sharePct`]}
                              </p>
                            )}
                          </div>

                          {/* Calculated Amount */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground flex items-center">
                              <DollarSign className="mr-2 h-4 w-4" />
                              Calculated Amount
                            </label>
                            <div className="h-10 flex items-center justify-between px-3 py-2 bg-muted rounded-lg border border-input">
                              <span className="text-sm font-medium text-foreground">₹</span>
                              <span className="text-sm font-semibold text-foreground">
                                {dist.shareAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remarks */}
                        <div className="mt-4 space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Remarks
                          </label>
                          <input
                            type="text"
                            value={dist.remarks}
                            onChange={(e) => updateDistribution(index, 'remarks', e.target.value)}
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter remarks for this distribution (optional)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Distribution Button */}
                  <button
                    type="button"
                    onClick={addDistribution}
                    className="w-full inline-flex items-center justify-center rounded-xl text-sm font-medium border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-400 text-blue-700 h-12 px-4 py-2 transition-all duration-200"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Another Distribution
                  </button>

                  {/* Total Percentage Summary */}
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-5 w-5 text-amber-600" />
                        <span className="text-sm font-semibold text-foreground">Total Distribution</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Percentage:</span>
                        <span className={`text-lg font-bold ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-green-600' : 'text-destructive'}`}>
                          {totalPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    {Math.abs(totalPercentage - 100) < 0.01 ? (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Perfect! Distribution is ready for approval.
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center text-sm text-destructive">
                        <AlertCircle className="mr-1 h-4 w-4" />
                        Total must equal exactly 100%
                      </div>
                    )}
                    {errors.totalPercentage && (
                      <p className="mt-2 text-xs text-destructive flex items-center">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        {errors.totalPercentage}
                      </p>
                    )}
                  </div>

                  {/* General Remarks */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      General Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                      className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Enter any additional remarks about this approval..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-border">
                    <button
                      type="submit"
                      disabled={submitting || Math.abs(totalPercentage - 100) > 0.01}
                      className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed h-12 px-6 py-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing Approval...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-3 h-5 w-5" />
                          Approve Booking & Distribute Brokerage
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      This action will approve the booking and distribute the brokerage as specified above.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingApproval;
