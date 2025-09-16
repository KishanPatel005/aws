import { useState, useEffect } from 'react';
import { X, Building2, Home, Ruler, DollarSign, FileText, ToggleLeft, ToggleRight } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  city: string | null;
  builder: {
    id: number;
    name: string;
    logo: string | null;
  };
}

interface Inventory {
  id: number;
  projectId: number;
  unitType: string;
  mou: string;
  size: number;
  rate: number;
  amount: number;
  remarks: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  project?: Project;
}

interface InventoryFormProps {
  inventory?: Inventory | null;
  projects: Project[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const InventoryForm = ({ inventory, projects, onSubmit, onCancel }: InventoryFormProps) => {
  const [formData, setFormData] = useState({
    projectId: '',
    unitType: '',
    mou: 'Sq.ft',
    size: '',
    rate: '',
    remarks: '',
    status: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  const mouOptions = [
    { value: 'Sq.ft', label: 'Sq.ft' },
    { value: 'Vaar', label: 'Vaar' },
    { value: 'Sq.mtr', label: 'Sq.mtr' }
  ];

  const unitTypeOptions = [
    '1BHK', '2BHK', '3BHK', '4BHK', '5BHK',
    'Commercial', 'Office', 'Shop', 'Warehouse',
    'Plot', 'Villa', 'Penthouse', 'Studio'
  ];

  useEffect(() => {
    if (inventory) {
      setFormData({
        projectId: inventory.projectId.toString(),
        unitType: inventory.unitType,
        mou: inventory.mou,
        size: inventory.size.toString(),
        rate: inventory.rate.toString(),
        remarks: inventory.remarks || '',
        status: inventory.status
      });
      setCalculatedAmount(inventory.amount);
    }
  }, [inventory]);

  // Calculate amount when size or rate changes
  useEffect(() => {
    const size = parseFloat(formData.size) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const amount = size * rate;
    setCalculatedAmount(amount);
  }, [formData.size, formData.rate]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.unitType.trim()) newErrors.unitType = 'Unit type is required';
    if (!formData.mou) newErrors.mou = 'MOU is required';
    if (!formData.size.trim()) newErrors.size = 'Size is required';
    if (!formData.rate.trim()) newErrors.rate = 'Rate is required';

    // Validate numeric values
    const size = parseFloat(formData.size);
    const rate = parseFloat(formData.rate);

    if (formData.size.trim() && (isNaN(size) || size <= 0)) {
      newErrors.size = 'Size must be a number greater than 0';
    }

    if (formData.rate.trim() && (isNaN(rate) || rate <= 0)) {
      newErrors.rate = 'Rate must be a number greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const size = parseFloat(formData.size);
    const rate = parseFloat(formData.rate);
    const amount = size * rate;

    const inventoryData = {
      projectId: parseInt(formData.projectId),
      unitType: formData.unitType.trim(),
      mou: formData.mou,
      size: size,
      rate: rate,
      amount: amount,
      remarks: formData.remarks.trim() || null,
      status: formData.status
    };

    onSubmit(inventoryData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {inventory ? 'Edit Unit' : 'Add New Unit'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {inventory ? 'Update unit information' : 'Enter unit details to add to inventory'}
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
          {/* Project Selection */}
          <div>
            <label htmlFor="projectId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Building2 className="inline mr-2 h-4 w-4" />
              Project *
            </label>
            <select
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.projectId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.city && `(${project.city})`}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-destructive">{errors.projectId}</p>
            )}
          </div>

          {/* Unit Type */}
          <div>
            <label htmlFor="unitType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Home className="inline mr-2 h-4 w-4" />
              Unit Type *
            </label>
            <div className="flex space-x-2">
              <select
                id="unitType"
                name="unitType"
                value={formData.unitType}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.unitType ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                <option value="">Select unit type</option>
                {unitTypeOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Or enter custom type"
                value={formData.unitType}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.unitType ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              />
            </div>
            {errors.unitType && (
              <p className="mt-1 text-sm text-destructive">{errors.unitType}</p>
            )}
          </div>

          {/* MOU and Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mou" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Ruler className="inline mr-2 h-4 w-4" />
                MOU *
              </label>
              <select
                id="mou"
                name="mou"
                value={formData.mou}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.mou ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              >
                {mouOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.mou && (
                <p className="mt-1 text-sm text-destructive">{errors.mou}</p>
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
          </div>

          {/* Rate and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <DollarSign className="inline mr-2 h-4 w-4" />
                Rate (per {formData.mou}) *
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
                Total Amount
              </label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="font-medium">
                  ₹{calculatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-calculated: {formData.size || 0} × {formData.rate || 0}
              </p>
            </div>
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

          {/* Status Toggle */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
              className="flex items-center space-x-2"
            >
              {formData.status ? (
                <ToggleRight className="h-6 w-6 text-primary" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {formData.status ? 'Unit is Active' : 'Unit is Inactive'}
              </span>
            </button>
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
              {inventory ? 'Update Unit' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;
