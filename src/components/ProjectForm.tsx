import { useState, useEffect } from 'react';
import { X, Building2, MapPin, FileText, Upload, Trash2 } from 'lucide-react';

interface Builder {
  id: number;
  name: string;
  logo: string | null;
}

interface Project {
  id: number;
  builderId: number;
  name: string;
  address: string | null;
  area: string | null;
  city: string | null;
  status: string;
  possessionDate: string | null;
  documents: string[] | null;
  date: string;
  isEnabled: boolean;
  otherCharges: Array<{name: string, type: string, rate: number}> | null;
  createdAt: string;
  updatedAt: string;
  builder?: Builder;
}

interface ProjectFormProps {
  project?: Project | null;
  builders: Builder[];
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const ProjectForm = ({ project, builders, onSubmit, onCancel }: ProjectFormProps) => {
  const [formData, setFormData] = useState({
    builderId: '',
    name: '',
    address: '',
    area: '',
    city: '',
    status: 'UNDER_CONSTRUCTION',
    possessionDate: '',
    date: '',
    isEnabled: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [otherCharges, setOtherCharges] = useState<Array<{name: string, type: string, rate: number}>>([]);
  const [newCharge, setNewCharge] = useState({ name: '', type: 'MOU', rate: 0 });

  const statusOptions = [
    { value: 'UNDER_CONSTRUCTION', label: 'Under Construction' },
    { value: 'READY_POSSESSION', label: 'Ready for Possession' }
  ];

  const chargeTypeOptions = [
    { value: 'MOU', label: 'MOU' },
    { value: 'Lumpsum', label: 'Lumpsum' }
  ];

  useEffect(() => {
    if (project) {
      setFormData({
        builderId: project.builderId.toString(),
        name: project.name,
        address: project.address || '',
        area: project.area || '',
        city: project.city || '',
        status: project.status,
        possessionDate: project.possessionDate ? new Date(project.possessionDate).toISOString().split('T')[0] : '',
        date: project.date ? new Date(project.date).toISOString().split('T')[0] : '',
        isEnabled: project.isEnabled
      });
      
      setExistingDocuments(project.documents || []);
      setOtherCharges(project.otherCharges || []);
    } else {
      // Set default date to today
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    
    files.forEach(file => {
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        newErrors.push(`${file.name}: File size must be less than 5MB`);
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        newErrors.push(`${file.name}: Only JPEG, PNG, and PDF files are allowed`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (newErrors.length > 0) {
      setErrors(prev => ({
        ...prev,
        documents: newErrors.join('; ')
      }));
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    if (errors.documents) {
      setErrors(prev => ({
        ...prev,
        documents: ''
      }));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = (index: number) => {
    setExistingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const addCharge = () => {
    if (newCharge.name && newCharge.rate > 0) {
      setOtherCharges(prev => [...prev, newCharge]);
      setNewCharge({ name: '', type: 'MOU', rate: 0 });
    }
  };

  const removeCharge = (index: number) => {
    setOtherCharges(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.builderId) newErrors.builderId = 'Builder is required';
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.status) newErrors.status = 'Status is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSubmit = new FormData();
    formDataToSubmit.append('builderId', formData.builderId);
    formDataToSubmit.append('name', formData.name.trim());
    formDataToSubmit.append('address', formData.address.trim());
    formDataToSubmit.append('area', formData.area.trim());
    formDataToSubmit.append('city', formData.city.trim());
    formDataToSubmit.append('status', formData.status);
    formDataToSubmit.append('possessionDate', formData.possessionDate);
    formDataToSubmit.append('date', formData.date);
    formDataToSubmit.append('isEnabled', formData.isEnabled.toString());
    formDataToSubmit.append('otherCharges', JSON.stringify(otherCharges));
    
    // Add existing documents (for updates) - always send, even if empty
    if (project) {
      formDataToSubmit.append('existingDocuments', JSON.stringify(existingDocuments));
    }
    
    // Add selected files
    selectedFiles.forEach(file => {
      formDataToSubmit.append('documents', file);
    });

    onSubmit(formDataToSubmit);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {project ? 'Edit Project' : 'Add New Project'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {project ? 'Update project information' : 'Enter project details to add them to the system'}
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
          {/* Builder Selection */}
          <div>
            <label htmlFor="builderId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Building2 className="inline mr-2 h-4 w-4" />
              Builder *
            </label>
            <select
              id="builderId"
              name="builderId"
              value={formData.builderId}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.builderId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a builder</option>
              {builders.map(builder => (
                <option key={builder.id} value={builder.id}>
                  {builder.name}
                </option>
              ))}
            </select>
            {errors.builderId && (
              <p className="mt-1 text-sm text-destructive">{errors.builderId}</p>
            )}
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <FileText className="inline mr-2 h-4 w-4" />
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.name ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              placeholder="Enter project name"
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
              placeholder="Enter project address"
            />
          </div>

          {/* Area */}
          <div>
            <label htmlFor="area" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Area
            </label>
            <input
              type="text"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter area"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter city"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.status ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-destructive">{errors.status}</p>
            )}
          </div>

          {/* Possession Date */}
          {formData.status === 'UNDER_CONSTRUCTION' && (
            <div>
              <label htmlFor="possessionDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Possession Date
              </label>
              <input
                type="date"
                id="possessionDate"
                name="possessionDate"
                value={formData.possessionDate}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

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

          {/* Enable/Disable */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isEnabled"
              name="isEnabled"
              checked={formData.isEnabled}
              onChange={handleChange}
              className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
            />
            <label htmlFor="isEnabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable Project
            </label>
          </div>

          {/* Document Upload */}
          <div>
            <label htmlFor="documents" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Upload className="inline mr-2 h-4 w-4" />
              Documents (Optional)
            </label>
            <input
              type="file"
              id="documents"
              name="documents"
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              multiple
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.documents ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Only JPEG, PNG, and PDF files allowed. Maximum size: 5MB per file. Maximum 10 files.
            </p>
            {errors.documents && (
              <p className="mt-1 text-sm text-destructive">{errors.documents}</p>
            )}
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Files:</p>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Existing Documents:</p>
              {existingDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-card border border-border rounded">
                  <a
                    href={`http://localhost:8080${doc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {doc.split('/').pop()}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeExistingDocument(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Other Charges */}
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Other Charges
            </label>
            
            {/* Add Charge Form */}
            <div className="mt-2 p-4 border border-border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    type="text"
                    value={newCharge.name}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, name: e.target.value }))}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    placeholder="Charge Name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={newCharge.type}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, type: e.target.value }))}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    {chargeTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Rate</label>
                  <input
                    type="number"
                    value={newCharge.rate}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    placeholder="Rate"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addCharge}
                className="mt-2 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Add Charge
              </button>
            </div>

            {/* Charges List */}
            {otherCharges.length > 0 && (
              <div className="mt-2 space-y-2">
                {otherCharges.map((charge, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-card border border-border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{charge.name}</p>
                      <p className="text-xs text-muted-foreground">{charge.type} - ₹{charge.rate.toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCharge(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
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
              {project ? 'Update Project' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
