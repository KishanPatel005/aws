import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Calendar, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Employee {
  id: number;
  name: string;
  email: string;
  salary: number;
  user_type: string;
}

interface EmployeeBalance {
  employeeId: number;
  advanceBalance: number;
  salaryDueBalance: number;
  employee: Employee;
}

interface Account {
  id: number;
  type: 'management' | 'company';
  name: string;
}

interface LedgerEntry {
  id: number;
  eventType: 'ADVANCE_GIVEN' | 'SALARY_ACCRUAL' | 'SALARY_PAYMENT' | 'ADVANCE_RECOVERY';
  amount: number;
  eventDate: string;
  monthRef: string;
  note: string;
  accountFrom?: Account;
  createdByUser: {
    id: number;
    name: string;
  };
  salaryDueDelta: number;
  advanceDelta: number;
}

const SalaryManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [balances, setBalances] = useState<EmployeeBalance[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'salary' | 'advance' | 'ledger'>('balances');

  // Form states
  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    monthRef: '',
    cashPayment: '',
    adjustment: '',
    note: ''
  });

  // Salary calculation state
  const [salaryCalculation, setSalaryCalculation] = useState<any>(null);
  const [showCalculationModal, setShowCalculationModal] = useState(false);

  const [advanceForm, setAdvanceForm] = useState({
    employeeId: '',
    amount: '',
    accountFromId: '',
    note: ''
  });

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  // Fetch data
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBalances = async () => {
    try {
      const response = await axios.get('/ledger/balances');
      setBalances(response.data.data);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/ledger/accounts');
      setAccounts(response.data.data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchLedgerEntries = async (employeeId: number) => {
    try {
      const response = await axios.get(`/ledger/entries/employee/${employeeId}`);
      setLedgerEntries(response.data.data);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    }
  };

  const fetchSalaryCalculation = async (employeeId: number, monthRef: string) => {
    try {
      const response = await axios.get(`/ledger/salary/calculation/${employeeId}?monthRef=${monthRef}`);
      setSalaryCalculation(response.data.data);
      setShowCalculationModal(true);
    } catch (error) {
      console.error('Error fetching salary calculation:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchBalances();
    fetchAccounts();
  }, []);

  // Handle salary processing
  const handleSalaryProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/ledger/salary/process', {
        ...salaryForm,
        cashPayment: parseFloat(salaryForm.cashPayment) || 0,
        adjustment: parseFloat(salaryForm.adjustment) || 0
      });

      alert('Salary processed successfully!');
      setShowSalaryModal(false);
      setShowCalculationModal(false);
      setSalaryForm({
        employeeId: '',
        monthRef: '',
        cashPayment: '',
        adjustment: '',
        note: ''
      });
      setSalaryCalculation(null);
      fetchBalances();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error processing salary');
    } finally {
      setLoading(false);
    }
  };

  // Handle employee selection for salary calculation
  const handleEmployeeSelect = (employeeId: string) => {
    if (employeeId && salaryForm.monthRef) {
      fetchSalaryCalculation(parseInt(employeeId), salaryForm.monthRef);
    }
  };

  // Handle advance giving
  const handleAdvanceGive = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/ledger/advance/give', {
        ...advanceForm,
        amount: parseFloat(advanceForm.amount)
      });

      alert('Advance given successfully!');
      setShowAdvanceModal(false);
      setAdvanceForm({
        employeeId: '',
        amount: '',
        accountFromId: '',
        note: ''
      });
      fetchBalances();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error giving advance');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'ADVANCE_GIVEN': return 'Advance Given';
      case 'SALARY_ACCRUAL': return 'Salary Accrual';
      case 'SALARY_PAYMENT': return 'Salary Payment';
      case 'ADVANCE_RECOVERY': return 'Advance Recovery';
      default: return eventType;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'ADVANCE_GIVEN': return 'bg-blue-100 text-blue-800';
      case 'SALARY_ACCRUAL': return 'bg-green-100 text-green-800';
      case 'SALARY_PAYMENT': return 'bg-purple-100 text-purple-800';
      case 'ADVANCE_RECOVERY': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary & Advance Management</h1>
          <p className="text-gray-600 mt-1">
            Ledger-based salary processing and advance management
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSalaryModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Process Salary
          </button>
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Give Advance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'balances', label: 'Employee Balances', icon: Users },
            { id: 'salary', label: 'Salary Processing', icon: DollarSign },
            { id: 'advance', label: 'Advance Management', icon: TrendingUp },
            { id: 'ledger', label: 'Ledger Entries', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Employee Balances</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advance Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary Due Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {balances.map((balance) => (
                  <tr key={balance.employeeId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {balance.employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {balance.employee.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(balance.employee.salary || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        balance.advanceBalance > 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formatCurrency(balance.advanceBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        balance.salaryDueBalance > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {formatCurrency(balance.salaryDueBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedEmployee(balance.employee);
                          fetchLedgerEntries(balance.employeeId);
                          setActiveTab('ledger');
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && selectedEmployee && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Ledger Entries - {selectedEmployee.name}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month Ref
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(entry.eventType)}`}>
                        {getEventTypeLabel(entry.eventType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.monthRef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.note}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.createdByUser.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary Processing Modal */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Process Salary</h3>
            </div>
            <form onSubmit={handleSalaryProcess} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={salaryForm.employeeId}
                    onChange={(e) => {
                      setSalaryForm({ ...salaryForm, employeeId: e.target.value });
                      handleEmployeeSelect(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {formatCurrency(emp.salary || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month Reference (YYYY-MM)
                  </label>
                  <input
                    type="text"
                    value={salaryForm.monthRef}
                    onChange={(e) => {
                      setSalaryForm({ ...salaryForm, monthRef: e.target.value });
                      if (salaryForm.employeeId) {
                        handleEmployeeSelect(salaryForm.employeeId);
                      }
                    }}
                    placeholder="2024-01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Salary Calculation Display */}
              {salaryCalculation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Salary Calculation for {salaryCalculation.employee.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Monthly Salary:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(salaryCalculation.calculations.monthlySalary)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Current Advance Balance:</span>
                      <span className="ml-2 font-semibold">{formatCurrency(salaryCalculation.currentBalances.advanceBalance)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Suggested Cash Payment:</span>
                      <span className="ml-2 font-semibold text-green-600">{formatCurrency(salaryCalculation.calculations.suggestedCashPayment)}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Advance Recovery:</span>
                      <span className="ml-2 font-semibold text-orange-600">{formatCurrency(salaryCalculation.calculations.suggestedAdvanceRecovery)}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-800">
                        Net Payment Required: {formatCurrency(salaryCalculation.calculations.netPayment)}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      This is the actual cash amount you need to pay (Monthly Salary - Advance Balance)
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cash Payment
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salaryForm.cashPayment}
                    onChange={(e) => setSalaryForm({ ...salaryForm, cashPayment: e.target.value })}
                    placeholder={salaryCalculation ? salaryCalculation.calculations.suggestedCashPayment.toString() : "0.00"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {salaryCalculation && (
                    <p className="text-xs text-gray-500 mt-1">
                      Suggested: {formatCurrency(salaryCalculation.calculations.suggestedCashPayment)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advance Recovery (Adjustment)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={salaryForm.adjustment}
                    onChange={(e) => setSalaryForm({ ...salaryForm, adjustment: e.target.value })}
                    placeholder={salaryCalculation ? salaryCalculation.calculations.suggestedAdvanceRecovery.toString() : "0.00"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {salaryCalculation && (
                    <p className="text-xs text-gray-500 mt-1">
                      Suggested: {formatCurrency(salaryCalculation.calculations.suggestedAdvanceRecovery)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  value={salaryForm.note}
                  onChange={(e) => setSalaryForm({ ...salaryForm, note: e.target.value })}
                  placeholder="Optional note"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSalaryModal(false);
                    setSalaryCalculation(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Process Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advance Giving Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Give Advance</h3>
            </div>
            <form onSubmit={handleAdvanceGive} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={advanceForm.employeeId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account From
                </label>
                <select
                  value={advanceForm.accountFromId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, accountFromId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  value={advanceForm.note}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, note: e.target.value })}
                  placeholder="Optional note"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Give Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
