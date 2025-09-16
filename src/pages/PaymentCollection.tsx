import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, DollarSign, User, Calendar, FileText, Building2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface Builder {
  id: number;
  name: string;
  status: boolean;
}

interface Project {
  id: number;
  name: string;
  city: string;
  builder: {
    id: number;
    name: string;
  };
}

interface PaymentCollection {
  id: number;
  type: string;
  date: string;
  from: string;
  collectedBy: number;
  receivedBy: number;
  amount: number;
  remarks: string | null;
  collectedUser: User;
  receivedUser: User;
}

const PaymentCollection = () => {
  const [payments, setPayments] = useState<PaymentCollection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentCollection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const paymentTypes = [
    { value: 'PROJECT', label: 'Project' },
    { value: 'LAND', label: 'Land' },
    { value: 'RENT', label: 'Rent' },
    { value: 'RESALE', label: 'Resale' }
  ];

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, usersResponse, buildersResponse, projectsResponse] = await Promise.all([
        fetch('http://localhost:8080/api/payments'),
        fetch('http://localhost:8080/api/users'),
        fetch('http://localhost:8080/api/builders'),
        fetch('http://localhost:8080/api/projects')
      ]);

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      } else {
        console.error('Failed to fetch payments');
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } else {
        console.error('Failed to fetch users');
      }

      if (buildersResponse.ok) {
        const buildersData = await buildersResponse.json();
        setBuilders(buildersData);
      } else {
        console.error('Failed to fetch builders');
      }

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      } else {
        console.error('Failed to fetch projects');
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
      const url = editingPayment 
        ? `http://localhost:8080/api/payments/${editingPayment.id}`
        : 'http://localhost:8080/api/payments';
      
      const method = editingPayment ? 'PUT' : 'POST';
      
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
        setEditingPayment(null);
        alert(editingPayment ? 'Payment updated successfully!' : 'Payment created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save payment: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Failed to save payment');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/payments/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Payment deleted successfully!');
      } else {
        alert('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment');
    }
  };

  // Handle edit
  const handleEdit = (payment: PaymentCollection) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  // Filter payments based on search term
  const filteredPayments = payments.filter(payment =>
    payment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.collectedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.receivedUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount.toString().includes(searchTerm)
  );

  if (showForm) {
    return (
      <div>
        <PaymentForm
          payment={editingPayment}
          users={users}
          builders={builders}
          projects={projects}
          paymentTypes={paymentTypes}
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
            <h1 className="text-2xl font-bold text-foreground">Payment Collection</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track and manage payment collections
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
            placeholder="Search payments..."
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
      ) : filteredPayments.length === 0 ? (
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">From</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Collected By</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Received By</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Remarks</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Date */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                        {paymentTypes.find(t => t.value === payment.type)?.label || payment.type}
                      </span>
                    </td>

                    {/* From */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        {payment.from}
                      </div>
                    </td>

                    {/* Collected By */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.collectedUser.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.collectedUser.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Received By */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{payment.receivedUser.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.receivedUser.user_type}</p>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ₹{payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="p-4 align-middle">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {payment.remarks || '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
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

// Payment Form Component
interface PaymentFormProps {
  payment?: PaymentCollection | null;
  users: User[];
  builders: Builder[];
  projects: Project[];
  paymentTypes: Array<{value: string, label: string}>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const PaymentForm = ({ payment, users, builders, projects, paymentTypes, onSubmit, onCancel }: PaymentFormProps) => {
  const [formData, setFormData] = useState({
    type: '',
    date: '',
    from: '',
    fromType: 'custom', // 'custom', 'builder', 'project', 'employee'
    selectedBuilder: '',
    selectedProject: '',
    selectedEmployee: '',
    collectedBy: '',
    receivedBy: '',
    amount: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (payment) {
      setFormData({
        type: payment.type,
        date: new Date(payment.date).toISOString().split('T')[0],
        from: payment.from,
        fromType: 'custom',
        selectedBuilder: '',
        selectedProject: '',
        selectedEmployee: '',
        collectedBy: payment.collectedBy.toString(),
        receivedBy: payment.receivedBy.toString(),
        amount: payment.amount.toString(),
        remarks: payment.remarks || ''
      });
    } else {
      // Set default date to today
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [payment]);

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

    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.date) newErrors.date = 'Date is required';
    
    // Validate from field based on fromType
    if (formData.fromType === 'custom' && !formData.from.trim()) {
      newErrors.from = 'From is required';
    } else if (formData.fromType === 'builder' && !formData.selectedBuilder) {
      newErrors.from = 'Please select a builder';
    } else if (formData.fromType === 'project' && !formData.selectedProject) {
      newErrors.from = 'Please select a project';
    } else if (formData.fromType === 'employee' && !formData.selectedEmployee) {
      newErrors.from = 'Please select an employee';
    }
    
    if (!formData.collectedBy) newErrors.collectedBy = 'Collected by is required';
    if (!formData.receivedBy) newErrors.receivedBy = 'Received by is required';
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

    // Determine the 'from' value based on fromType
    let fromValue = '';
    if (formData.fromType === 'custom') {
      fromValue = formData.from.trim();
    } else if (formData.fromType === 'builder') {
      const builder = builders.find(b => b.id.toString() === formData.selectedBuilder);
      fromValue = builder ? builder.name : '';
    } else if (formData.fromType === 'project') {
      const project = projects.find(p => p.id.toString() === formData.selectedProject);
      fromValue = project ? `${project.name} (${project.builder.name})` : '';
    } else if (formData.fromType === 'employee') {
      const employee = users.find(u => u.id.toString() === formData.selectedEmployee);
      fromValue = employee ? employee.name : '';
    }

    const paymentData = {
      type: formData.type,
      date: formData.date,
      from: fromValue,
      collectedBy: parseInt(formData.collectedBy),
      receivedBy: parseInt(formData.receivedBy),
      amount: parseFloat(formData.amount),
      remarks: formData.remarks.trim() || null
    };

    onSubmit(paymentData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {payment ? 'Edit Payment' : 'Add New Payment'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {payment ? 'Update payment information' : 'Enter payment collection details'}
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
          {/* Type and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.type ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select type</option>
                {paymentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-destructive">{errors.type}</p>
              )}
            </div>

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
          </div>

          {/* From Type Selection */}
          <div>
            <label htmlFor="fromType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Building2 className="inline mr-2 h-4 w-4" />
              Payment Source Type *
            </label>
            <select
              id="fromType"
              name="fromType"
              value={formData.fromType}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="custom">Custom Name</option>
              <option value="builder">Builder</option>
              <option value="project">Project</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          {/* From Field - Dynamic based on fromType */}
          <div>
            <label htmlFor="from" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Building2 className="inline mr-2 h-4 w-4" />
              From *
            </label>
            
            {formData.fromType === 'custom' && (
              <input
                type="text"
                id="from"
                name="from"
                value={formData.from}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.from ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter custom source name"
              />
            )}
            
            {formData.fromType === 'builder' && (
              <select
                id="selectedBuilder"
                name="selectedBuilder"
                value={formData.selectedBuilder}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.from ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select Builder</option>
                {builders.filter(b => b.status).map(builder => (
                  <option key={builder.id} value={builder.id}>
                    {builder.name}
                  </option>
                ))}
              </select>
            )}
            
            {formData.fromType === 'project' && (
              <select
                id="selectedProject"
                name="selectedProject"
                value={formData.selectedProject}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.from ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.builder.name} ({project.city})
                  </option>
                ))}
              </select>
            )}
            
            {formData.fromType === 'employee' && (
              <select
                id="selectedEmployee"
                name="selectedEmployee"
                value={formData.selectedEmployee}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.from ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select Employee</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.user_type})
                  </option>
                ))}
              </select>
            )}
            
            {errors.from && (
              <p className="mt-1 text-sm text-destructive">{errors.from}</p>
            )}
          </div>

          {/* Collected By and Received By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="collectedBy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <User className="inline mr-2 h-4 w-4" />
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
                {users.map(user => (
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
                <User className="inline mr-2 h-4 w-4" />
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
                {users.map(user => (
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
              placeholder="Enter amount"
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
              {payment ? 'Update Payment' : 'Add Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentCollection;
