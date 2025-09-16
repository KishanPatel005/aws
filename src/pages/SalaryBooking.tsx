import { useState, useEffect } from 'react';
import { Calendar, User, DollarSign, CreditCard, Eye, Plus, Building2, Clock, Calculator, AlertCircle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  user_type: string;
  salary: number | null;
}

interface SalaryRecord {
  id: number;
  type: string;
  accountFrom: string;
  toUserId: number;
  month: string;
  amount: number;
  remarks: string | null;
  createdAt: string;
  toUser?: User;
}

interface AdvanceRecord {
  id: number;
  type: string;
  accountFrom: string;
  toUserId: number;
  amount: number;
  remarks: string | null;
  createdAt: string;
  toUser?: User;
}

interface AdvanceSummary {
  totalAdvances: number;
  totalSalaryPaid: number;
  netBalance: number;
  remainingAdvance: number;
  suggestedAmount: number;
  advances: AdvanceRecord[];
  salaryPayments: SalaryRecord[];
  monthFilter: string | null;
}

interface AdvanceCalculation {
  userId: number;
  userName: string;
  baseSalary: number;
  totalAdvances: number;
  totalSalaryPaid: number;
  advanceAdjustment: number;
  netSalary: number;
  remainingAdvance: number;
  suggestedAmount: number;
  month: string;
}

const SalaryBooking = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [managementUsers, setManagementUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [advanceSummary, setAdvanceSummary] = useState<AdvanceSummary | null>(null);
  const [advanceCalculation, setAdvanceCalculation] = useState<AdvanceCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPastRecords, setShowPastRecords] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    accountFrom: '',
    toUserId: '',
    month: '',
    salaryAmount: '',
    remarks: ''
  });

  // Initialize current month and generate month options
  const generateMonthOptions = () => {
    const months = [];
    const now = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthString = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push(monthString);
    }
    
    return months;
  };

  const monthOptions = generateMonthOptions();

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    setSelectedMonth(currentMonth);
    setFormData(prev => ({
      ...prev,
      month: currentMonth
    }));
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
        
        // Filter management users for account from
        const management = usersData.filter((user: User) => 
          user.user_type === 'MANAGEMENT' || user.user_type === 'SYSTEM_ADMIN'
        );
        setManagementUsers(management);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch advance summary for selected user and month
  const fetchAdvanceSummary = async (userId: number, month?: string) => {
    try {
      setCalculating(true);
      const url = month 
        ? `http://localhost:8080/api/advances/summary/${userId}?month=${encodeURIComponent(month)}`
        : `http://localhost:8080/api/advances/summary/${userId}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAdvanceSummary(data);
      }
    } catch (error) {
      console.error('Error fetching advance summary:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Calculate advance adjustment
  const calculateAdvanceAdjustment = async (userId: number, month: string) => {
    try {
      setCalculating(true);
      const response = await fetch('http://localhost:8080/api/advances/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, month }),
      });

      if (response.ok) {
        const data = await response.json();
        setAdvanceCalculation(data);
        
        // Update form with calculated net salary
        setFormData(prev => ({
          ...prev,
          salaryAmount: data.netSalary.toString()
        }));
      }
    } catch (error) {
      console.error('Error calculating advance adjustment:', error);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle user selection
  const handleUserSelect = async (userId: string) => {
    const user = users.find(u => u.id === parseInt(userId));
    setSelectedUser(user || null);
    
    if (user) {
      setFormData(prev => ({
        ...prev,
        toUserId: userId,
        salaryAmount: user.salary ? user.salary.toString() : '0'
      }));

      // Calculate advance adjustment for the selected user and month
      if (selectedMonth) {
        await calculateAdvanceAdjustment(user.id, selectedMonth);
        await fetchAdvanceSummary(user.id, selectedMonth);
      }
    }
  };

  // Handle month change
  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
    setFormData(prev => ({
      ...prev,
      month
    }));

    // Recalculate advance adjustment if user is selected
    if (selectedUser) {
      await calculateAdvanceAdjustment(selectedUser.id, month);
      await fetchAdvanceSummary(selectedUser.id, month);
    }
  };

  // Get salary history for selected user
  const getUserSalaryHistory = () => {
    if (!advanceSummary) return [];
    return advanceSummary.salaryPayments;
  };

  // Get advance history for selected user
  const getUserAdvanceHistory = () => {
    if (!advanceSummary) return [];
    return advanceSummary.advances;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !formData.accountFrom || !formData.month) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const salaryData = {
        type: 'SALARY',
        accountFrom: formData.accountFrom,
        toUserId: selectedUser.id,
        month: formData.month,
        amount: parseFloat(formData.salaryAmount),
        remarks: formData.remarks || `Salary payment for ${formData.month}`
      };

      const response = await fetch('http://localhost:8080/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaryData),
      });

      if (response.ok) {
        alert('Salary booked successfully!');
        // Refresh advance summary
        if (selectedUser) {
          await fetchAdvanceSummary(selectedUser.id, selectedMonth);
          await calculateAdvanceAdjustment(selectedUser.id, selectedMonth);
        }
        // Reset form
        setFormData(prev => ({
          ...prev,
          toUserId: '',
          salaryAmount: '',
          remarks: ''
        }));
        setSelectedUser(null);
        setAdvanceCalculation(null);
        setAdvanceSummary(null);
      } else {
        const error = await response.json();
        alert('Failed to book salary: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error booking salary:', error);
      alert('Error booking salary');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Salary Booking</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage salary payments with advance tracking and adjustments
            </p>
          </div>
          <button
            onClick={() => setShowPastRecords(!showPastRecords)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2.5 shadow-sm transition-colors"
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPastRecords ? 'Hide' : 'View'} Past Records
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salary Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Book Salary Payment</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date Field */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <Calendar className="inline mr-2 h-4 w-4" />
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                {/* Account From Field */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <Building2 className="inline mr-2 h-4 w-4" />
                    Account From *
                  </label>
                  <select
                    value={formData.accountFrom}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountFrom: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select account from</option>
                    <option value="Company">Company</option>
                    {managementUsers.map((user) => (
                      <option key={user.id} value={user.name}>
                        {user.name} ({user.user_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Selection */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <Calendar className="inline mr-2 h-4 w-4" />
                    Month *
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select month</option>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Selection */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <User className="inline mr-2 h-4 w-4" />
                    Select Employee/Manager *
                  </label>
                  <select
                    value={formData.toUserId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select user</option>
                    {users.filter(user => ['MANAGER', 'EMPLOYEE'].includes(user.user_type)).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.user_type}) - ₹{user.salary?.toLocaleString() || '0'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Salary Display - Show when user is selected */}
                {selectedUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Selected User Information</h4>
                      <div className="text-sm text-blue-700">
                        {selectedUser.user_type}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Name:</span>
                        <div className="text-blue-900">{selectedUser.name}</div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Base Salary:</span>
                        <div className="text-blue-900 font-semibold">₹{selectedUser.salary?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Salary Information Display */}
                {selectedUser && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground flex items-center">
                        <Calculator className="mr-2 h-4 w-4" />
                        Salary Calculations
                      </h3>
                      {calculating && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Calculating...
                        </div>
                      )}
                    </div>
                    
                    {advanceCalculation ? (
                      <div className="space-y-4">
                        {/* Base Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white rounded-lg border">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Base Salary</div>
                            <div className="text-lg font-semibold text-blue-600">₹{advanceCalculation.baseSalary.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Total Advances</div>
                            <div className="text-lg font-semibold text-orange-600">₹{advanceCalculation.totalAdvances.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Salary Paid</div>
                            <div className="text-lg font-semibold text-green-600">₹{advanceCalculation.totalSalaryPaid.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Simple Calculation Details */}
                        <div className="bg-white rounded-lg border p-4">
                          <h4 className="font-medium text-foreground mb-3">Simple Calculation</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-muted-foreground">Salary:</span>
                              <span className="font-medium text-blue-600">₹{advanceCalculation.baseSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-muted-foreground">Advance Given:</span>
                              <span className="font-medium text-orange-600">₹{advanceCalculation.totalAdvances.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-muted-foreground">Salary Paid:</span>
                              <span className="font-medium text-green-600">₹{advanceCalculation.totalSalaryPaid.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-muted-foreground">Remaining Advance:</span>
                              <span className="font-medium text-red-600">
                                ₹{advanceCalculation.remainingAdvance.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-green-50 rounded p-3 border border-green-200">
                              <div className="text-center">
                                <p className="font-medium text-green-800 mb-2">Suggested Payment:</p>
                                <p className="text-2xl font-bold text-green-600 mb-2">₹{advanceCalculation.suggestedAmount.toLocaleString()}</p>
                                <p className="text-xs text-green-700">
                                  Salary (₹{advanceCalculation.baseSalary.toLocaleString()}) - Remaining Advance (₹{advanceCalculation.remainingAdvance.toLocaleString()}) = Payment
                                </p>
                                {advanceCalculation.remainingAdvance === 0 && (
                                  <p className="text-xs text-blue-700 mt-2 font-medium">
                                    ✅ Advance fully cleared! Pay full salary.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Editable Salary Amount */}
                        <div>
                          <label className="text-sm font-medium">Final Salary Amount to Pay:</label>
                          <input
                            type="number"
                            value={formData.salaryAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, salaryAmount: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Enter amount to pay"
                          />
                          {advanceCalculation.remainingAdvance > 0 && (
                            <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                              <AlertCircle className="inline h-4 w-4 mr-1" />
                              <strong>Advance Recovery:</strong> User has ₹{advanceCalculation.remainingAdvance.toLocaleString()} remaining advance balance. 
                              This will be deducted from salary. Suggested payment: ₹{advanceCalculation.suggestedAmount.toLocaleString()}.
                            </div>
                          )}
                          {advanceCalculation.remainingAdvance === 0 && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                              <AlertCircle className="inline h-4 w-4 mr-1" />
                              <strong>No Advance Balance:</strong> User has no advance balance. Full salary of ₹{advanceCalculation.baseSalary.toLocaleString()} needs to be paid.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground mb-2">Select a user and month to see salary calculations</div>
                        <div className="text-xs text-muted-foreground">Calculations will show advance adjustments and net salary</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <DollarSign className="inline mr-2 h-4 w-4" />
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    rows={3}
                    placeholder="Enter any additional remarks"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Book Salary Payment
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Past Records Sidebar */}
        {showPastRecords && selectedUser && (
          <div className="space-y-6">
            {/* Salary History */}
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Salary History
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getUserSalaryHistory().map((record) => (
                    <div key={record.id} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="font-medium">{record.month}</div>
                      <div className="text-muted-foreground">₹{record.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {getUserSalaryHistory().length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No salary records found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advance History */}
            <div className="bg-card rounded-lg border border-border shadow-sm">
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Advance History
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getUserAdvanceHistory().map((record) => (
                    <div key={record.id} className="text-sm p-2 bg-orange-50 rounded">
                      <div className="font-medium text-orange-800">₹{record.amount.toLocaleString()}</div>
                      <div className="text-muted-foreground">{record.remarks || 'Advance payment'}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {getUserAdvanceHistory().length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No advance records found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryBooking;
