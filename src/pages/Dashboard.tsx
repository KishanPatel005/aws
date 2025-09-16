import { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Search,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import ReportDetailsModal from '../components/ReportDetailsModal';

interface ReportData {
  id: string;
  title: string;
  type: 'builder' | 'project' | 'property' | 'employee';
  category: 'booking' | 'paid' | 'receivable' | 'payable' | 'advance';
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  period: string;
}

interface Document {
  id: number;
  name: string;
  type: 'project' | 'property';
  projectName?: string;
  propertyName?: string;
  category: string;
  uploadedAt: string;
  size: string;
  url: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch reports data from API
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/dashboard/reports?period=${selectedPeriod}`);
      setReports(response.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents data from API
  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/dashboard/documents/search?q=${searchTerm}&type=${selectedFilter}`);
      setDocuments(response.data.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDocuments();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedFilter]);

  // Handle view details click
  const handleViewDetails = (report: ReportData) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  // Handle document view
  const handleViewDocument = (doc: Document) => {
    try {
      console.log('Document data:', doc);
      
      // Check if there are documents available
      if (doc.documents && Array.isArray(doc.documents) && doc.documents.length > 0) {
        // If there are multiple documents, open the first one
        const documentUrl = doc.documents[0];
        console.log('Document URL from documents array:', documentUrl);
        
        // Decode URL and ensure it's properly formatted
        const decodedUrl = decodeURIComponent(documentUrl);
        const fullUrl = decodedUrl.startsWith('http') ? decodedUrl : `http://localhost:8080${decodedUrl}`;
        console.log('Opening document:', fullUrl);
        
        // Try to open the document and handle errors
        const newWindow = window.open(fullUrl, '_blank');
        if (!newWindow) {
          alert('Unable to open document. Please check if pop-ups are blocked.');
        }
      } else if (doc.url) {
        // Fallback to the URL field
        console.log('Document URL from url field:', doc.url);
        const decodedUrl = decodeURIComponent(doc.url);
        const fullUrl = decodedUrl.startsWith('http') ? decodedUrl : `http://localhost:8080${decodedUrl}`;
        console.log('Opening document:', fullUrl);
        
        // Try to open the document and handle errors
        const newWindow = window.open(fullUrl, '_blank');
        if (!newWindow) {
          alert('Unable to open document. Please check if pop-ups are blocked.');
        }
      } else {
        console.log('No documents available for:', doc.name);
        alert('No document available for viewing. Please upload documents first.');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      alert('Error opening document. The file may not exist on the server. Please try uploading the document again.');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.propertyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'project') return matchesSearch && doc.type === 'project';
    if (selectedFilter === 'property') return matchesSearch && doc.type === 'property';
    
    return matchesSearch;
  });

  const getReportIcon = (type: string, category: string) => {
    if (type === 'builder') return <Building2 className="h-5 w-5" />;
    if (type === 'project') return <Home className="h-5 w-5" />;
    if (type === 'property') return <MapPin className="h-5 w-5" />;
    if (type === 'employee') return <Users className="h-5 w-5" />;
    return <BarChart3 className="h-5 w-5" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'paid': return <CreditCard className="h-4 w-4" />;
      case 'receivable': return <Receipt className="h-4 w-4" />;
      case 'payable': return <DollarSign className="h-4 w-4" />;
      case 'advance': return <TrendingUp className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getReportCards = (type: string) => {
    return reports.filter(report => report.type === type).map(report => (
      <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getReportIcon(report.type, report.category)}
            <h3 className="text-sm font-medium text-gray-900">{report.title}</h3>
          </div>
          <div className="flex items-center space-x-1">
            {getCategoryIcon(report.category)}
            <span className="text-xs text-gray-500 capitalize">{report.category}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(report.value)}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-start">
          <button 
            onClick={() => handleViewDetails(report)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={async () => {
              await Promise.all([fetchReports(), fetchDocuments()]);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Reports Section */}
      <div className="space-y-6">
        {/* Builder-wise Reports */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Builder-wise Reports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getReportCards('builder')}
          </div>
        </div>

        {/* Project-wise Reports */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Home className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Project-wise Reports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getReportCards('project')}
          </div>
        </div>

        {/* Property-wise Reports */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Property-wise Reports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getReportCards('property')}
          </div>
        </div>

        {/* Employee-wise Reports */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Employee-wise Reports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getReportCards('employee')}
          </div>
        </div>
      </div>

      {/* Search Documents Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Search className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Search Documents</h2>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents by name, project, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Documents</option>
              <option value="project">Project Documents</option>
              <option value="property">Property Documents</option>
            </select>
            <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found matching your search.</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        {doc.type === 'project' ? <Home className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                        {doc.type === 'project' ? doc.projectName : doc.propertyName}
                      </span>
                      <span>{doc.category}</span>
                      <span>{doc.size}</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleViewDocument(doc)}
                    className={`text-sm font-medium ${
                      (doc.documents && Array.isArray(doc.documents) && doc.documents.length > 0) || doc.url
                        ? 'text-blue-600 hover:text-blue-800'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!(doc.documents && Array.isArray(doc.documents) && doc.documents.length > 0) && !doc.url}
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        report={selectedReport}
      />
    </div>
  );
};

export default Dashboard;