import { useState, useEffect } from 'react';
import { X, Download, Calendar, DollarSign, TrendingUp, TrendingDown, Building2, Home, MapPin, Users, FileText, BarChart3 } from 'lucide-react';
import axios from 'axios';

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    id: string;
    title: string;
    type: 'builder' | 'project' | 'property' | 'employee';
    category: 'booking' | 'paid' | 'receivable' | 'payable' | 'advance';
    value: number;
    count: number;
    change: number;
    changeType: 'increase' | 'decrease';
    period: string;
  } | null;
}

interface BreakdownItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  count: number;
  date: string;
  status?: string;
  details?: any;
}

const ReportDetailsModal = ({ isOpen, onClose, report }: ReportDetailsModalProps) => {
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && report) {
      fetchBreakdown();
    }
  }, [isOpen, report]);

  const fetchBreakdown = async () => {
    if (!report) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/dashboard/reports/${report.id}/breakdown?period=${report.period}`);
      setBreakdown(response.data.data);
    } catch (error) {
      console.error('Error fetching breakdown:', error);
      setError('Failed to load detailed breakdown');
      // Mock data for demonstration
      setBreakdown(generateMockBreakdown());
    } finally {
      setLoading(false);
    }
  };

  const generateMockBreakdown = (): BreakdownItem[] => {
    if (!report) return [];
    
    const mockData: BreakdownItem[] = [];
    const baseAmount = report.value / 5; // Distribute across 5 items
    
    for (let i = 0; i < 5; i++) {
      const amount = baseAmount + (Math.random() - 0.5) * baseAmount * 0.3;
      const percentage = (amount / report.value) * 100;
      
      mockData.push({
        id: `${report.id}-${i}`,
        name: getMockName(report.type, i),
        amount: Math.round(amount),
        percentage: Math.round(percentage * 100) / 100,
        count: Math.floor(Math.random() * 10) + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: Math.random() > 0.5 ? 'Active' : 'Pending'
      });
    }
    
    return mockData.sort((a, b) => b.amount - a.amount);
  };

  const getMockName = (type: string, index: number): string => {
    const names = {
      builder: ['ABC Builders', 'XYZ Construction', 'PQR Developers', 'DEF Builders', 'GHI Construction'],
      project: ['Green Valley', 'Sky Towers', 'Royal Gardens', 'Modern Heights', 'Luxury Residency'],
      property: ['Villa A-101', 'Apartment B-205', 'Penthouse C-301', 'Studio D-102', 'Duplex E-401'],
      employee: ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown']
    };
    
    return names[type as keyof typeof names]?.[index] || `Item ${index + 1}`;
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'builder': return <Building2 className="h-6 w-6 text-blue-600" />;
      case 'project': return <Home className="h-6 w-6 text-green-600" />;
      case 'property': return <MapPin className="h-6 w-6 text-purple-600" />;
      case 'employee': return <Users className="h-6 w-6 text-orange-600" />;
      default: return <BarChart3 className="h-6 w-6 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      case 'receivable': return <TrendingUp className="h-4 w-4" />;
      case 'payable': return <TrendingDown className="h-4 w-4" />;
      case 'advance': return <FileText className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getReportIcon(report.type)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
              <p className="text-sm text-gray-500 capitalize">
                {report.type} • {report.category} • {report.period}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(report.value)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Count</p>
                  <p className="text-2xl font-bold text-green-900">{report.count}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className={`rounded-lg p-4 ${report.changeType === 'increase' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${report.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    Change
                  </p>
                  <p className={`text-2xl font-bold ${report.changeType === 'increase' ? 'text-green-900' : 'text-red-900'}`}>
                    {report.changeType === 'increase' ? '+' : ''}{report.change}%
                  </p>
                </div>
                {report.changeType === 'increase' ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
            <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading breakdown...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={fetchBreakdown}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {breakdown.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getCategoryIcon(report.category)}
                          <span className="ml-2 text-sm font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{item.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {breakdown.length} items • Last updated: {new Date().toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsModal;
