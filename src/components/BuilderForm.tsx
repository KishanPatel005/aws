import { useState, useEffect } from 'react';
import { X, Building2, MapPin, Users, Upload, Image } from 'lucide-react';

interface Builder {
  id: number;
  name: string;
  address: string | null;
  logo: string | null;
  pocs: Array<{name: string, phone: string}> | null;
  date: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BuilderFormProps {
  builder?: Builder | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const BuilderForm = ({ builder, onSubmit, onCancel }: BuilderFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    date: '',
    status: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pocList, setPocList] = useState<Array<{name: string, phone: string}>>([]);
  const [newPoc, setNewPoc] = useState({ name: '', phone: '' });
  const [logo, setLogo] = useState<File | null>(null);

  useEffect(() => {
    if (builder) {
      setFormData({
        name: builder.name,
        address: builder.address || '',
        date: builder.date ? new Date(builder.date).toISOString().split('T')[0] : '',
        status: builder.status
      });
      
      setPocList(builder.pocs || []);
    } else {
      // Set default date to today
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [builder]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'File size must be less than 5MB'
        }));
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          logo: 'Only JPEG, PNG, and PDF files are allowed'
        }));
        return;
      }
      
      setLogo(file);
      
      if (errors.logo) {
        setErrors(prev => ({
          ...prev,
          logo: ''
        }));
      }
    }
  };

  const addPoc = () => {
    if (newPoc.name && newPoc.phone) {
      if (pocList.length >= 3) {
        setErrors(prev => ({
          ...prev,
          pocs: 'Maximum 3 POCs allowed'
        }));
        return;
      }
      setPocList(prev => [...prev, newPoc]);
      setNewPoc({ name: '', phone: '' });
    }
  };

  const removePoc = (index: number) => {
    setPocList(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Builder name is required';
    if (pocList.length === 0) newErrors.pocs = 'At least one POC is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('name', formData.name.trim());
    formDataToSubmit.append('address', formData.address.trim());
    formDataToSubmit.append('pocs', JSON.stringify(pocList));
    formDataToSubmit.append('date', formData.date);
    formDataToSubmit.append('status', formData.status.toString());
    
    if (logo) {
      formDataToSubmit.append('logo', logo);
    }

    onSubmit(formDataToSubmit);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {builder ? 'Edit Builder' : 'Add New Builder'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {builder ? 'Update builder information' : 'Enter builder details to add them to the system'}
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
          {/* Builder Name */}
          <div>
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Building2 className="inline mr-2 h-4 w-4" />
              Builder Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.name ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              placeholder="Enter builder name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <MapPin className="inline mr-2 h-4 w-4" />
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter builder address"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Date *
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

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="status"
              name="status"
              checked={formData.status}
              onChange={handleChange}
              className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
            />
            <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable Builder
            </label>
          </div>

          {/* Logo Upload */}
          <div>
            <label htmlFor="logo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Upload className="inline mr-2 h-4 w-4" />
              Logo (Optional)
            </label>
            <input
              type="file"
              id="logo"
              name="logo"
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.logo ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Only JPEG, PNG, and PDF files allowed. Maximum size: 5MB
            </p>
            {errors.logo && (
              <p className="mt-1 text-sm text-destructive">{errors.logo}</p>
            )}
            {logo && (
              <p className="mt-1 text-sm text-green-600">
                Selected: {logo.name}
              </p>
            )}
          </div>

          {/* POCs Section */}
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Users className="inline mr-2 h-4 w-4" />
              Points of Contact *
            </label>
            
            {/* Add POC Form */}
            <div className="mt-2 p-4 border border-border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    type="text"
                    value={newPoc.name}
                    onChange={(e) => setNewPoc(prev => ({ ...prev, name: e.target.value }))}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    placeholder="POC Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <input
                    type="tel"
                    value={newPoc.phone}
                    onChange={(e) => setNewPoc(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    placeholder="Phone Number"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addPoc}
                className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Add POC
              </button>
            </div>

            {/* POC List */}
            {pocList.length > 0 && (
              <div className="mt-2 space-y-2">
                {pocList.map((poc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-card border border-border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{poc.name}</p>
                      <p className="text-xs text-muted-foreground">{poc.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePoc(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.pocs && (
              <p className="mt-1 text-sm text-destructive">{errors.pocs}</p>
            )}
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
              {builder ? 'Update Builder' : 'Add Builder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuilderForm;
