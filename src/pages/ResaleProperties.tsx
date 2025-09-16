import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Building2, User, Phone, FileText, Copy, DollarSign } from 'lucide-react';

interface ResaleProperty {
  id: number;
  date: string;
  type: string;
  building: string | null;
  propertyName: string;
  unitNo: string | null;
  propertyType: string;
  size: number;
  rate: number;
  amount: number;
  status: boolean;
  ownerName: string;
  ownerMobile: string;
  refName: string | null;
  refMobile: string | null;
  additionalCharges: Array<{name: string, type: string, rate: number}> | null;
  documents: string[] | null;
  createdAt: string;
  updatedAt: string;
}

const ResaleProperties = () => {
  const [properties, setProperties] = useState<ResaleProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<ResaleProperty | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/resale-properties?search=${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const propertiesData = await response.json();
        setProperties(propertiesData);
      } else {
        console.error('Failed to fetch resale properties');
      }
    } catch (error) {
      console.error('Error fetching resale properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    try {
      const url = editingProperty 
        ? `http://localhost:8080/api/resale-properties/${editingProperty.id}`
        : 'http://localhost:8080/api/resale-properties';
      
      const method = editingProperty ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setEditingProperty(null);
        alert(editingProperty ? 'Property updated successfully!' : 'Property created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save property: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Failed to save property');
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/resale-properties/${id}/status`, {
        method: 'PATCH'
      });

      if (response.ok) {
        await fetchData();
        alert('Property status updated successfully!');
      } else {
        alert('Failed to update property status');
      }
    } catch (error) {
      console.error('Error toggling property status:', error);
      alert('Failed to update property status');
    }
  };

  // Handle duplicate
  const handleDuplicate = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/resale-properties/${id}/duplicate`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchData();
        alert('Property duplicated successfully!');
      } else {
        alert('Failed to duplicate property');
      }
    } catch (error) {
      console.error('Error duplicating property:', error);
      alert('Failed to duplicate property');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/resale-properties/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Property deleted successfully!');
      } else {
        alert('Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  // Handle edit
  const handleEdit = (property: ResaleProperty) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingProperty(null);
  };

  if (showForm) {
    return (
      <div>
        <ResalePropertyForm
          property={editingProperty}
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
            <h1 className="text-2xl font-bold text-foreground">Resale Properties</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage resale, rent, and preleased properties
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties by name, building, owner, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Properties Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No properties found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new property.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b border-border transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Property</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Building</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Size</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rate</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {properties.map((property) => (
                  <tr key={property.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Property */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-medium">{property.propertyName}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Building2 className="mr-1 h-3 w-3" />
                          {property.propertyType}
                        </div>
                        {property.unitNo && (
                          <p className="text-xs text-muted-foreground">Unit: {property.unitNo}</p>
                        )}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        property.type === 'RESALE' ? 'bg-blue-100 text-blue-800' :
                        property.type === 'RENT' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {property.type}
                      </span>
                    </td>

                    {/* Building */}
                    <td className="p-4 align-middle">
                      <p className="text-sm">{property.building || '-'}</p>
                    </td>

                    {/* Size */}
                    <td className="p-4 align-middle">
                      <p className="font-medium">{property.size} sq ft</p>
                    </td>

                    {/* Rate */}
                    <td className="p-4 align-middle">
                      <p className="font-medium">₹{property.rate.toLocaleString()}</p>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <p className="font-semibold text-green-600">₹{property.amount.toLocaleString()}</p>
                    </td>

                    {/* Status */}
                    <td className="p-4 align-middle">
                      <button
                        onClick={() => handleToggleStatus(property.id)}
                        className="inline-flex items-center"
                      >
                        {property.status ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(property)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(property.id)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
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

// Resale Property Form Component
interface ResalePropertyFormProps {
  property?: ResaleProperty | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const ResalePropertyForm = ({ property, onSubmit, onCancel }: ResalePropertyFormProps) => {
  const [formData, setFormData] = useState({
    date: '',
    type: 'RESALE',
    building: '',
    propertyName: '',
    unitNo: '',
    propertyType: '',
    size: '',
    rate: '',
    ownerName: '',
    ownerMobile: '',
    refName: '',
    refMobile: '',
    additionalCharges: '',
    status: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [additionalCharges, setAdditionalCharges] = useState<Array<{name: string, type: string, rate: number}>>([]);
  const [files, setFiles] = useState<{
    documents: FileList | null;
  }>({
    documents: null
  });

  useEffect(() => {
    if (property) {
      setFormData({
        date: new Date(property.date).toISOString().split('T')[0],
        type: property.type,
        building: property.building || '',
        propertyName: property.propertyName,
        unitNo: property.unitNo || '',
        propertyType: property.propertyType,
        size: property.size.toString(),
        rate: property.rate.toString(),
        ownerName: property.ownerName,
        ownerMobile: property.ownerMobile,
        refName: property.refName || '',
        refMobile: property.refMobile || '',
        additionalCharges: '',
        status: property.status
      });
      setAdditionalCharges(property.additionalCharges || []);
    } else {
      // Set default date to today
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [property]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: files
    }));
  };

  const addAdditionalCharge = () => {
    setAdditionalCharges(prev => [...prev, { name: '', type: 'FIXED', rate: 0 }]);
  };

  const removeAdditionalCharge = (index: number) => {
    setAdditionalCharges(prev => prev.filter((_, i) => i !== index));
  };

  const updateAdditionalCharge = (index: number, field: string, value: string | number) => {
    setAdditionalCharges(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.propertyName.trim()) newErrors.propertyName = 'Property Name is required';
    if (!formData.propertyType.trim()) newErrors.propertyType = 'Property Type is required';
    if (!formData.size.trim()) newErrors.size = 'Size is required';
    if (!formData.rate.trim()) newErrors.rate = 'Rate is required';
    if (!formData.ownerName.trim()) newErrors.ownerName = 'Owner Name is required';
    if (!formData.ownerMobile.trim()) newErrors.ownerMobile = 'Owner Mobile is required';

    // Validate numbers
    const size = parseFloat(formData.size);
    const rate = parseFloat(formData.rate);
    
    if (formData.size.trim() && (isNaN(size) || size <= 0)) {
      newErrors.size = 'Size must be a positive number';
    }
    
    if (formData.rate.trim() && (isNaN(rate) || rate <= 0)) {
      newErrors.rate = 'Rate must be a positive number';
    }

    // Validate mobile number
    if (formData.ownerMobile.trim() && !/^\d{10}$/.test(formData.ownerMobile.trim())) {
      newErrors.ownerMobile = 'Mobile number must be 10 digits';
    }

    if (formData.refMobile.trim() && !/^\d{10}$/.test(formData.refMobile.trim())) {
      newErrors.refMobile = 'Reference mobile number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSend = new FormData();
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'status' && key !== 'additionalCharges') {
        formDataToSend.append(key, value.toString());
      } else if (key === 'status') {
        formDataToSend.append(key, value.toString());
      }
    });

    // Add additional charges
    if (additionalCharges.length > 0) {
      formDataToSend.append('additionalCharges', JSON.stringify(additionalCharges));
    }

    // Add files
    if (files.documents) {
      Array.from(files.documents).forEach(file => {
        formDataToSend.append('documents', file);
      });
    }

    onSubmit(formDataToSend);
  };

  const calculateAmount = () => {
    const size = parseFloat(formData.size);
    const rate = parseFloat(formData.rate);
    if (!isNaN(size) && !isNaN(rate) && size > 0 && rate > 0) {
      return size * rate;
    }
    return 0;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {property ? 'Edit Property' : 'Add New Property'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {property ? 'Update property information' : 'Enter property details'}
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
          {/* Date and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

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
                <option value="RESALE">Resale</option>
                <option value="RENT">Rent</option>
                <option value="PRELEASED">Preleased</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-destructive">{errors.type}</p>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Property Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="propertyName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Property Name *
                </label>
                <input
                  type="text"
                  id="propertyName"
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleChange}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.propertyName ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter property name"
                />
                {errors.propertyName && (
                  <p className="mt-1 text-sm text-destructive">{errors.propertyName}</p>
                )}
              </div>

              <div>
                <label htmlFor="building" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Building
                </label>
                <input
                  type="text"
                  id="building"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter building name"
                />
              </div>

              <div>
                <label htmlFor="unitNo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Unit No
                </label>
                <input
                  type="text"
                  id="unitNo"
                  name="unitNo"
                  value={formData.unitNo}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter unit number"
                />
              </div>

              <div>
                <label htmlFor="propertyType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Property Type *
                </label>
                <input
                  type="text"
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.propertyType ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="e.g., 2BHK, 3BHK, Commercial"
                />
                {errors.propertyType && (
                  <p className="mt-1 text-sm text-destructive">{errors.propertyType}</p>
                )}
              </div>
            </div>
          </div>

          {/* Owner Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Owner Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ownerName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Owner Name *
                </label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.ownerName ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter owner name"
                />
                {errors.ownerName && (
                  <p className="mt-1 text-sm text-destructive">{errors.ownerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="ownerMobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Owner Mobile *
                </label>
                <input
                  type="tel"
                  id="ownerMobile"
                  name="ownerMobile"
                  value={formData.ownerMobile}
                  onChange={handleChange}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.ownerMobile ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter owner mobile"
                />
                {errors.ownerMobile && (
                  <p className="mt-1 text-sm text-destructive">{errors.ownerMobile}</p>
                )}
              </div>

              <div>
                <label htmlFor="refName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Reference Name
                </label>
                <input
                  type="text"
                  id="refName"
                  name="refName"
                  value={formData.refName}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter reference name"
                />
              </div>

              <div>
                <label htmlFor="refMobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Reference Mobile
                </label>
                <input
                  type="tel"
                  id="refMobile"
                  name="refMobile"
                  value={formData.refMobile}
                  onChange={handleChange}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.refMobile ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter reference mobile"
                />
                {errors.refMobile && (
                  <p className="mt-1 text-sm text-destructive">{errors.refMobile}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Financial Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="size" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Size (sq ft) *
                </label>
                <input
                  type="number"
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.size ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter size"
                />
                {errors.size && (
                  <p className="mt-1 text-sm text-destructive">{errors.size}</p>
                )}
              </div>

              <div>
                <label htmlFor="rate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Rate *
                </label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.rate ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                  placeholder="Enter rate"
                />
                {errors.rate && (
                  <p className="mt-1 text-sm text-destructive">{errors.rate}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Amount (Auto)
                </label>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  ₹{calculateAmount().toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Charges */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Additional Charges</h4>
              <button
                type="button"
                onClick={addAdditionalCharge}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Charge
              </button>
            </div>
            
            {additionalCharges.map((charge, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={charge.name}
                    onChange={(e) => updateAdditionalCharge(index, 'name', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Charge name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={charge.type}
                    onChange={(e) => updateAdditionalCharge(index, 'type', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="PERCENTAGE">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Rate</label>
                  <input
                    type="number"
                    value={charge.rate}
                    onChange={(e) => updateAdditionalCharge(index, 'rate', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Rate"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeAdditionalCharge(index)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-3 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Document Upload */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Documents</h4>
            <div>
              <label htmlFor="documents" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Property Documents
              </label>
              <input
                type="file"
                id="documents"
                name="documents"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, MP4 (max 5MB each)</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={formData.status}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable this property
            </label>
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
              {property ? 'Update Property' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResaleProperties;
