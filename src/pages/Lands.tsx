import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, MapPin, User, Phone, FileText, ExternalLink, Eye } from 'lucide-react';

interface Land {
  id: number;
  name: string;
  date: string;
  address: string | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
  googleLink: string | null;
  mouUnit: string;
  size: number;
  rate: number;
  amount: number;
  ownerName: string;
  ownerMobile: string;
  refName: string | null;
  refMobile: string | null;
  fpNo: string | null;
  status: boolean;
  mapDocs: string[] | null;
  villageMapDocs: string[] | null;
  sevenTwelveDocs: string[] | null;
  fpDocs: string[] | null;
  createdAt: string;
  updatedAt: string;
}

const Lands = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLand, setEditingLand] = useState<Land | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/api/lands?search=${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const landsData = await response.json();
        setLands(landsData);
      } else {
        console.error('Failed to fetch lands');
      }
    } catch (error) {
      console.error('Error fetching lands:', error);
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
      const url = editingLand 
        ? `http://localhost:8080/api/lands/${editingLand.id}`
        : 'http://localhost:8080/api/lands';
      
      const method = editingLand ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setEditingLand(null);
        alert(editingLand ? 'Land updated successfully!' : 'Land created successfully!');
      } else {
        const error = await response.json();
        alert('Failed to save land: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving land:', error);
      alert('Failed to save land');
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/lands/${id}/status`, {
        method: 'PATCH'
      });

      if (response.ok) {
        await fetchData();
        alert('Land status updated successfully!');
      } else {
        alert('Failed to update land status');
      }
    } catch (error) {
      console.error('Error toggling land status:', error);
      alert('Failed to update land status');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this land?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/lands/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
        alert('Land deleted successfully!');
      } else {
        alert('Failed to delete land');
      }
    } catch (error) {
      console.error('Error deleting land:', error);
      alert('Failed to delete land');
    }
  };

  // Handle edit
  const handleEdit = (land: Land) => {
    setEditingLand(land);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingLand(null);
  };

  if (showForm) {
    return (
      <div>
        <LandForm
          land={editingLand}
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
            <h1 className="text-2xl font-bold text-foreground">Lands</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage land properties and their details
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Land
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search lands by name, FP No, owner, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Lands Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading lands...</p>
          </div>
        </div>
      ) : lands.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No lands found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new land.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b border-border transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">MOU</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Size</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rate</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">FP No</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {lands.map((land) => (
                  <tr key={land.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Name */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-medium">{land.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="mr-1 h-3 w-3" />
                          {land.ownerName}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="mr-1 h-3 w-3" />
                          {land.ownerMobile}
                        </div>
                      </div>
                    </td>

                    {/* MOU */}
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                        {land.mouUnit}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="p-4 align-middle">
                      <p className="font-medium">{land.size}</p>
                    </td>

                    {/* Rate */}
                    <td className="p-4 align-middle">
                      <p className="font-medium">₹{land.rate.toLocaleString()}</p>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <p className="font-semibold text-green-600">₹{land.amount.toLocaleString()}</p>
                    </td>

                    {/* Location */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        {land.village && <p className="text-sm">{land.village}</p>}
                        {land.taluka && <p className="text-xs text-muted-foreground">{land.taluka}</p>}
                        {land.district && <p className="text-xs text-muted-foreground">{land.district}</p>}
                        {land.googleLink && (
                          <a
                            href={land.googleLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            View Map
                          </a>
                        )}
                      </div>
                    </td>

                    {/* FP No */}
                    <td className="p-4 align-middle">
                      <p className="text-sm">{land.fpNo || '-'}</p>
                    </td>

                    {/* Status */}
                    <td className="p-4 align-middle">
                      <button
                        onClick={() => handleToggleStatus(land.id)}
                        className="inline-flex items-center"
                      >
                        {land.status ? (
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
                          onClick={() => handleEdit(land)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(land.id)}
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

// Land Form Component
interface LandFormProps {
  land?: Land | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const LandForm = ({ land, onSubmit, onCancel }: LandFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    address: '',
    village: '',
    taluka: '',
    district: '',
    googleLink: '',
    mouUnit: 'Vigha',
    size: '',
    rate: '',
    ownerName: '',
    ownerMobile: '',
    refName: '',
    refMobile: '',
    fpNo: '',
    status: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<{
    mapDocs: FileList | null;
    villageMapDocs: FileList | null;
    sevenTwelveDocs: FileList | null;
    fpDocs: FileList | null;
  }>({
    mapDocs: null,
    villageMapDocs: null,
    sevenTwelveDocs: null,
    fpDocs: null
  });

  useEffect(() => {
    if (land) {
      setFormData({
        name: land.name,
        date: new Date(land.date).toISOString().split('T')[0],
        address: land.address || '',
        village: land.village || '',
        taluka: land.taluka || '',
        district: land.district || '',
        googleLink: land.googleLink || '',
        mouUnit: land.mouUnit,
        size: land.size.toString(),
        rate: land.rate.toString(),
        ownerName: land.ownerName,
        ownerMobile: land.ownerMobile,
        refName: land.refName || '',
        refMobile: land.refMobile || '',
        fpNo: land.fpNo || '',
        status: land.status
      });
    } else {
      // Set default date to today
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [land]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.mouUnit) newErrors.mouUnit = 'MOU Unit is required';
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
      if (key !== 'status') {
        formDataToSend.append(key, value.toString());
      } else {
        formDataToSend.append(key, value.toString());
      }
    });

    // Add files
    Object.entries(files).forEach(([key, fileList]) => {
      if (fileList) {
        Array.from(fileList).forEach(file => {
          formDataToSend.append(key, file);
        });
      }
    });

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
              {land ? 'Edit Land' : 'Add New Land'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {land ? 'Update land information' : 'Enter land property details'}
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
          {/* Name and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.name ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter land name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name}</p>
              )}
            </div>

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
          </div>

          {/* Owner Details */}
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
          </div>

          {/* Reference Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Location Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Location Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label htmlFor="googleLink" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Google Map Link
                </label>
                <input
                  type="url"
                  id="googleLink"
                  name="googleLink"
                  value={formData.googleLink}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter Google Maps link"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="village" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Village
                </label>
                <input
                  type="text"
                  id="village"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter village"
                />
              </div>

              <div>
                <label htmlFor="taluka" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Taluka
                </label>
                <input
                  type="text"
                  id="taluka"
                  name="taluka"
                  value={formData.taluka}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter taluka"
                />
              </div>

              <div>
                <label htmlFor="district" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  District
                </label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter district"
                />
              </div>
            </div>
          </div>

          {/* Land Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Land Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="mouUnit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  MOU Unit *
                </label>
                <select
                  id="mouUnit"
                  name="mouUnit"
                  value={formData.mouUnit}
                  onChange={handleChange}
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.mouUnit ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                >
                  <option value="Vigha">Vigha</option>
                  <option value="Vaar">Vaar</option>
                </select>
                {errors.mouUnit && (
                  <p className="mt-1 text-sm text-destructive">{errors.mouUnit}</p>
                )}
              </div>

              <div>
                <label htmlFor="size" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Size *
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
                  ₹{calculateAmount().toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="fpNo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                FP No
              </label>
              <input
                type="text"
                id="fpNo"
                name="fpNo"
                value={formData.fpNo}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter FP number"
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mapDocs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Map Documents
                </label>
                <input
                  type="file"
                  id="mapDocs"
                  name="mapDocs"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, MP4 (max 5MB each)</p>
              </div>

              <div>
                <label htmlFor="villageMapDocs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Village Map Documents
                </label>
                <input
                  type="file"
                  id="villageMapDocs"
                  name="villageMapDocs"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, MP4 (max 5MB each)</p>
              </div>

              <div>
                <label htmlFor="sevenTwelveDocs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  7/12 Documents
                </label>
                <input
                  type="file"
                  id="sevenTwelveDocs"
                  name="sevenTwelveDocs"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, MP4 (max 5MB each)</p>
              </div>

              <div>
                <label htmlFor="fpDocs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  FP Documents
                </label>
                <input
                  type="file"
                  id="fpDocs"
                  name="fpDocs"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4"
                  onChange={handleFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, MP4 (max 5MB each)</p>
              </div>
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
              Enable this land
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
              {land ? 'Update Land' : 'Add Land'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Lands;
