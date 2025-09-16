import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle
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

interface LedgerEntry {
  id: number;
  eventType: 'ADVANCE_GIVEN' | 'SALARY_ACCRUAL' | 'SALARY_PAYMENT' | 'ADVANCE_RECOVERY';
  amount: number;
  eventDate: string;
  monthRef: string;
  note: string;
  accountFrom?: {
    id: number;
    name: string;
    type: string;
  };
  createdByUser: {
    id: number;
    name: string;
  };
  salaryDueDelta: number;
  advanceDelta: number;
}

const SalaryMobile = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<EmployeeBalance[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'ledger'>('balances');

  // Fetch data
  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/ledger/balances');
      setBalances(response.data.data);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerEntries = async (employeeId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/ledger/entries/employee/${employeeId}`);
      setLedgerEntries(response.data.data);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Salary & Advance</h1>
            <p className="text-sm text-gray-500">View-only access</p>
          </div>
          <button
            onClick={fetchBalances}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 ${
              activeTab === 'balances'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            <Users className="h-4 w-4 mx-auto mb-1" />
            Balances
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 ${
              activeTab === 'ledger'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            <FileText className="h-4 w-4 mx-auto mb-1" />
            Ledger
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'balances' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No employee balances found</p>
              </div>
            ) : (
              balances.map((balance) => (
                <div key={balance.employeeId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{balance.employee.name}</h3>
                      <p className="text-sm text-gray-500">{balance.employee.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEmployee(balance.employee);
                        fetchLedgerEntries(balance.employeeId);
                        setActiveTab('ledger');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Monthly Salary</span>
                        <DollarSign className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(balance.employee.salary || 0)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Advance Balance</span>
                        <TrendingUp className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className={`text-sm font-semibold ${
                        balance.advanceBalance > 0 ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {formatCurrency(balance.advanceBalance)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Salary Due Balance</span>
                      <span className={`text-sm font-semibold ${
                        balance.salaryDueBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(balance.salaryDueBalance)}
                      </span>
                    </div>
                    
                    {/* Net Payment Calculation */}
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-700">Net Payment Required</span>
                        <span className="text-sm font-bold text-blue-800">
                          {formatCurrency((balance.employee.salary || 0) - balance.advanceBalance)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Monthly Salary - Advance Balance
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ledger' && selectedEmployee && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-1">
                {selectedEmployee.name}
              </h3>
              <p className="text-sm text-gray-500">
                Ledger Entries
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No ledger entries found</p>
              </div>
            ) : (
              ledgerEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(entry.eventType)}`}>
                      {getEventTypeLabel(entry.eventType)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(entry.amount)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {new Date(entry.eventDate).toLocaleDateString()} • {entry.monthRef}
                  </div>
                  
                  {entry.note && (
                    <p className="text-sm text-gray-500 mb-2">{entry.note}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>By: {entry.createdByUser.name}</span>
                    {entry.accountFrom && (
                      <span>From: {entry.accountFrom.name}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ledger' && !selectedEmployee && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Select an employee to view ledger entries</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryMobile;
