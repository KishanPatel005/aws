import { useState, useEffect } from 'react';
import { X, DollarSign, Building2, User, Calendar, FileText, CreditCard } from 'lucide-react';

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface Expense {
  id: number;
  type: string;
  accountFrom: string;
  toUserId: number | null;
  month: string | null;
  amount: number;
  remarks: string | null;
  createdAt: string;
  toUser?: User | null;
  date?: string;
}

interface ExpenseFormProps {
  expense?: Expense | null;
  users: User[];
  onSubmit: (data: Omit<Expense, 'id' | 'createdAt' | 'toUser'>) => void;
  onCancel: () => void;
}

const ExpenseForm = ({ expense, users, onSubmit, onCancel }: ExpenseFormProps) => {
  const [formData, setFormData] = useState({
    type: 'SALARY',
    accountFrom: '',
    toUserId: '',
    month: '',
    amount: '',
    remarks: '',
    date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [advanceData, setAdvanceData] = useState<{
    totalAdvances: number;
    totalSalaryPaid: number;
    netBalance: number;
    remainingAdvance: number;
    suggestedAmount: number;
    advanceDetails: Array<{month: string, amount: number, date: string}>;
  } | null>(null);

  // Initialize current month and date
  useEffect(() => {
    if (!expense) {
      const now = new Date();
      const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      setFormData(prev => ({
        ...prev,
        month: currentMonth,
        date: currentDate
      }));
    }
  }, [expense]);

  // Initialize form data when editing
  useEffect(() => {
    if (expense) {
      setFormData({
        type: expense.type,
        accountFrom: expense.accountFrom,
        toUserId: expense.toUserId ? expense.toUserId.toString() : '',
        month: expense.month || '',
        amount: expense.amount.toString(),
        remarks: expense.remarks || '',
        date: expense.createdAt ? new Date(expense.createdAt).toISOString().split('T')[0] : ''
      });
    }
  }, [expense]);

  // Update selected user when toUserId changes
  useEffect(() => {
    if (formData.toUserId) {
      const user = users.find(u => u.id === parseInt(formData.toUserId));
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
      setAdvanceData(null);
    }
  }, [formData.toUserId, users]);

  // Fetch advance data when user and month change
  useEffect(() => {
    const fetchAdvanceData = async () => {
      if (formData.toUserId && formData.month && formData.type === 'SALARY') {
        try {
          // Use the corrected API endpoint
          const response = await fetch(`http://localhost:8080/api/advances/summary/${formData.toUserId}?month=${formData.month}`);
          if (response.ok) {
            const data = await response.json();
            // The backend now returns the corrected data structure
            setAdvanceData(data);
          }
        } catch (error) {
          console.error('Error fetching advance data:', error);
          setAdvanceData(null);
        }
      } else {
        setAdvanceData(null);
      }
    };

    fetchAdvanceData();
  }, [formData.toUserId, formData.month, formData.type]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Generate month options
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

  // Get management users for accountFrom dropdown
  const managementUsers = users.filter(user => 
    user.user_type === 'MANAGEMENT' || user.user_type === 'SYSTEM_ADMIN'
  );

  // Get all users for toUser dropdown
  const allUsers = users;

  // Check if type requires user selection
  const requiresUserSelection = ['SALARY', 'ADVANCE', 'WITHDRAWAL'].includes(formData.type);

  // Check if type requires month
  const requiresMonth = formData.type === 'SALARY';

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Type validation
    if (!formData.type) {
      newErrors.type = 'Expense type is required';
    }

    // Account From validation
    if (!formData.accountFrom.trim()) {
      newErrors.accountFrom = 'Account from is required';
    }

    // To User validation (if required)
    if (requiresUserSelection && !formData.toUserId) {
      newErrors.toUserId = 'User selection is required for this expense type';
    }

    // Month validation (if required)
    if (requiresMonth && !formData.month.trim()) {
      newErrors.month = 'Month is required for salary expenses';
    }

    // Date validation
    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const expenseData = {
      type: formData.type,
      accountFrom: formData.accountFrom.trim(),
      toUserId: formData.toUserId ? parseInt(formData.toUserId) : null,
      month: formData.month.trim() || null,
      amount: parseFloat(formData.amount),
      remarks: formData.remarks.trim() || null,
      date: formData.date.trim()
    };

    onSubmit(expenseData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {expense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {expense ? 'Update expense information' : 'Enter expense details to add to the system. Select Salary for salary payments, Advance for advance payments, or other expense types.'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Type Field */}
          <div>
            <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <CreditCard className="inline mr-2 h-4 w-4" />
              Expense Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="SALARY">Salary - Monthly salary payments to employees</option>
              <option value="ADVANCE">Advance - Advance payments to employees</option>
              <option value="ADVERTISEMENT">Advertisement - Marketing and advertising expenses</option>
              <option value="OFFICE">Office - Office supplies and operational expenses</option>
              <option value="WITHDRAWAL">Withdrawal - Business withdrawals</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {formData.type === 'SALARY' && 'Salary expenses require user selection and month'}
              {formData.type === 'ADVANCE' && 'Advance expenses require user selection'}
              {formData.type === 'WITHDRAWAL' && 'Withdrawal expenses require user selection'}
              {!['SALARY', 'ADVANCE', 'WITHDRAWAL'].includes(formData.type) && 'General expenses do not require user selection'}
            </p>
          </div>

          {/* Account From Field */}
          <div>
            <label htmlFor="accountFrom" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Building2 className="inline mr-2 h-4 w-4" />
              Account From *
            </label>
            <select
              id="accountFrom"
              name="accountFrom"
              value={formData.accountFrom}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.accountFrom ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select account from</option>
              <option value="Company">Company</option>
              {managementUsers.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name} ({user.user_type})
                </option>
              ))}
            </select>
            {errors.accountFrom && (
              <p className="mt-1 text-sm text-destructive">{errors.accountFrom}</p>
            )}
          </div>

          {/* To User Field (conditional) */}
          {requiresUserSelection && (
            <div>
              <label htmlFor="toUserId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <User className="inline mr-2 h-4 w-4" />
                To User *
              </label>
              <select
                id="toUserId"
                name="toUserId"
                value={formData.toUserId}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.toUserId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select user</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.user_type})
                  </option>
                ))}
              </select>
              {errors.toUserId && (
                <p className="mt-1 text-sm text-destructive">{errors.toUserId}</p>
              )}
            </div>
          )}

          {/* Month Field (conditional) */}
          {requiresMonth && (
            <div>
              <label htmlFor="month" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Calendar className="inline mr-2 h-4 w-4" />
                Month *
              </label>
              <select
                id="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.month ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select month</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              {errors.month && (
                <p className="mt-1 text-sm text-destructive">{errors.month}</p>
              )}
            </div>
          )}

          {/* Date Field */}
          <div>
            <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Calendar className="inline mr-2 h-4 w-4" />
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.date ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          {/* User Salary Display (conditional) */}
          {requiresUserSelection && selectedUser && selectedUser.salary && (
            <div className="space-y-3">
              {/* Base Salary */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Current salary of {selectedUser.name}:
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{selectedUser.salary.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Advance/Adjustment Information */}
              {formData.type === 'SALARY' && advanceData && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">
                        Advance/Adjustment Summary for {formData.month}:
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Base Salary:</p>
                        <p className="font-semibold text-blue-900">₹{(selectedUser?.salary || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Total Advances:</p>
                        <p className="font-semibold text-blue-900">₹{advanceData.totalAdvances.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Total Salary Paid:</p>
                        <p className="font-semibold text-blue-900">₹{advanceData.totalSalaryPaid.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Simple Advance Summary */}
                    <div className="pt-2 border-t border-blue-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-800">Advance Given:</p>
                          <p className="text-lg font-bold text-orange-600">
                            ₹{advanceData.totalAdvances?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-800">Salary Paid:</p>
                          <p className="text-lg font-bold text-green-600">
                            ₹{advanceData.totalSalaryPaid?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2">
                          <p className="text-sm font-medium text-blue-800">Remaining Advance:</p>
                          <p className="text-lg font-bold text-red-600">
                            ₹{advanceData.remainingAdvance?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Simple Payment Calculation */}
                    <div className="pt-2 border-t border-blue-200 bg-green-50 rounded p-3">
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-800 mb-2">Suggested Payment:</p>
                        <div className="flex items-center justify-center space-x-2">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{advanceData.suggestedAmount?.toLocaleString() || '0'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const suggestedAmount = advanceData.suggestedAmount || 0;
                              setFormData(prev => ({
                                ...prev,
                                amount: suggestedAmount.toString()
                              }));
                            }}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Use This
                          </button>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                          Salary (₹{(selectedUser?.salary || 0).toLocaleString()}) - Remaining Advance (₹{advanceData.remainingAdvance?.toLocaleString() || '0'}) = Payment
                        </p>
                        {advanceData.remainingAdvance === 0 && (
                          <p className="text-xs text-blue-700 mt-1 font-medium">
                            ✅ Advance fully cleared! Pay full salary.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Advance Details */}
                    {advanceData.advanceDetails && advanceData.advanceDetails.length > 0 && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-700 mb-2">Recent Advances:</p>
                        <div className="space-y-1">
                          {advanceData.advanceDetails.slice(0, 3).map((advance, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-blue-600">{advance.month}</span>
                              <span className="font-medium text-blue-800">₹{advance.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <DollarSign className="inline mr-2 h-4 w-4" />
              Amount (₹) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Enter amount"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.amount ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Remarks Field */}
          <div>
            <label htmlFor="remarks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <FileText className="inline mr-2 h-4 w-4" />
              Remarks (Optional)
            </label>
            <textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Enter any additional remarks"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
            >
              {expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
