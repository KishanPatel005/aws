import { useState, useEffect } from 'react';
import { Plus, CreditCard, Search, Filter, Edit, Trash2, DollarSign, User, Calendar, FileText, Building2 } from 'lucide-react';
import ExpenseForm from '../components/ExpenseForm';

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

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch expenses and users from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:8080/api/expenses'),
        fetch('http://localhost:8080/api/users')
      ]);

      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData);
      } else {
        console.error('Failed to fetch expenses');
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

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle form submission
  const handleFormSubmit = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'toUser'>) => {
    try {
      const url = editingExpense 
        ? `http://localhost:8080/api/expenses/${editingExpense.id}`
        : 'http://localhost:8080/api/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        await fetchData(); // Refresh the list
        setShowForm(false);
        setEditingExpense(null);
      } else {
        const error = await response.json();
        console.error('Failed to save expense:', error);
        alert('Failed to save expense: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense');
    }
  };

  // Handle edit expense
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await fetch(`http://localhost:8080/api/expenses/${expenseId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchData(); // Refresh the list
        } else {
          console.error('Failed to delete expense');
          alert('Failed to delete expense');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense');
      }
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense =>
    expense.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.accountFrom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.toUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (expense.month?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (expense.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // Format expense type for display
  const formatExpenseType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get expense type badge color
  const getExpenseTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'SALARY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ADVERTISEMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OFFICE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADVANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'WITHDRAWAL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format amount for display
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage company expenses and financial records
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
          </div>
          
          {/* Filter Button */}
          <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading expenses...</p>
            </div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? 'No expenses found' : 'No expenses yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms to find expenses.'
                : 'Get started by adding your first expense to the system.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b border-border transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Account From</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">To</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Month</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Remarks</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getExpenseTypeBadgeColor(expense.type)}`}>
                        <CreditCard className="mr-1 h-3 w-3" />
                        {formatExpenseType(expense.type)}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        {expense.accountFrom}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {expense.toUser ? (
                        <div className="flex items-center text-sm text-foreground">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          {expense.toUser.name}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {expense.month ? (
                        <div className="flex items-center text-sm text-foreground">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {expense.month}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      {expense.date ? (
                        <div className="flex items-center text-sm text-foreground">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm font-medium text-foreground">
                        <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                        {formatAmount(expense.amount)}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {expense.remarks ? (
                        <div className="flex items-center text-sm text-foreground max-w-xs">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{expense.remarks}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-sm text-muted-foreground">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
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
        )}
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ExpenseForm
              expense={editingExpense}
              users={users}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
