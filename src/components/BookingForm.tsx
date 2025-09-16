import { useState, useEffect } from 'react';
import { X, Building2, Home, User, Phone, DollarSign, Percent, FileText, Calculator } from 'lucide-react';

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
  status: boolean;
}

interface User {
  id: number;
  name: string;
  user_type: string;
}

interface Booking {
  id: number;
  projectId: number;
  inventoryId: number;
  unitNo: string;
  buyerName: string;
  buyerMobile: string;
  referenceName: string | null;
  rate: number;
  amount: number;
  brokeragePct: number;
  brokerageAmt: number;
  bookedBy: number;
  remarks: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  inventory?: Inventory;
  user?: User;
}

interface BookingFormProps {
  booking?: Booking | null;
  projects: Project[];
  users: User[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const BookingForm = ({ booking, projects, users, onSubmit, onCancel }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    projectId: '',
    inventoryId: '',
    unitNo: '',
    buyerName: '',
    buyerMobile: '',
    referenceName: '',
    rate: '',
    brokeragePct: '',
    bookedBy: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [calculatedBrokerage, setCalculatedBrokerage] = useState(0);

  useEffect(() => {
    if (booking) {
      setFormData({
        projectId: booking.projectId.toString(),
        inventoryId: booking.inventoryId.toString(),
        unitNo: booking.unitNo,
        buyerName: booking.buyerName,
        buyerMobile: booking.buyerMobile,
        referenceName: booking.referenceName || '',
        rate: booking.rate.toString(),
        brokeragePct: booking.brokeragePct.toString(),
        bookedBy: booking.bookedBy.toString(),
        remarks: booking.remarks || ''
      });
      setCalculatedAmount(booking.amount);
      setCalculatedBrokerage(booking.brokerageAmt);
    }
  }, [booking]);

  // Fetch inventory when project changes
  useEffect(() => {
    const fetchInventory = async () => {
      if (formData.projectId) {
        try {
          const response = await fetch(`http://localhost:8080/api/inventory`);
          if (response.ok) {
            const allInventory = await response.json();
            const projectInventory = allInventory.filter((item: Inventory) => 
              item.projectId === parseInt(formData.projectId) && item.status
            );
            setInventory(projectInventory);
          }
        } catch (error) {
          console.error('Error fetching inventory:', error);
        }
      } else {
        setInventory([]);
      }
    };
    fetchInventory();
  }, [formData.projectId]);

  // Update selected inventory when inventoryId changes
  useEffect(() => {
    if (formData.inventoryId) {
      const selected = inventory.find(item => item.id === parseInt(formData.inventoryId));
      setSelectedInventory(selected || null);
    } else {
      setSelectedInventory(null);
    }
  }, [formData.inventoryId, inventory]);

  // Calculate amount and brokerage when rate or brokerage percentage changes
  useEffect(() => {
    if (selectedInventory && formData.rate && formData.brokeragePct) {
      const rate = parseFloat(formData.rate) || 0;
      const brokeragePct = parseFloat(formData.brokeragePct) || 0;
      const amount = selectedInventory.size * rate;
      const brokerageAmt = amount * brokeragePct / 100;
      
      setCalculatedAmount(amount);
      setCalculatedBrokerage(brokerageAmt);
    }
  }, [selectedInventory, formData.rate, formData.brokeragePct]);

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

    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.inventoryId) newErrors.inventoryId = 'Unit is required';
    if (!formData.unitNo.trim()) newErrors.unitNo = 'Unit number is required';
    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer name is required';
    if (!formData.buyerMobile.trim()) newErrors.buyerMobile = 'Buyer mobile is required';
    if (!formData.rate.trim()) newErrors.rate = 'Rate is required';
    if (!formData.brokeragePct.trim()) newErrors.brokeragePct = 'Brokerage percentage is required';
    if (!formData.bookedBy) newErrors.bookedBy = 'Booked by is required';

    // Validate numeric values
    const rate = parseFloat(formData.rate);
    const brokeragePct = parseFloat(formData.brokeragePct);

    if (formData.rate.trim() && (isNaN(rate) || rate <= 0)) {
      newErrors.rate = 'Rate must be a number greater than 0';
    }

    if (formData.brokeragePct.trim() && (isNaN(brokeragePct) || brokeragePct < 0 || brokeragePct > 100)) {
      newErrors.brokeragePct = 'Brokerage percentage must be between 0 and 100';
    }

    // Validate mobile number
    if (formData.buyerMobile.trim() && !/^\d{10}$/.test(formData.buyerMobile.trim())) {
      newErrors.buyerMobile = 'Mobile number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const rate = parseFloat(formData.rate);
    const brokeragePct = parseFloat(formData.brokeragePct);
    const amount = selectedInventory ? selectedInventory.size * rate : 0;
    const brokerageAmt = amount * brokeragePct / 100;

    const bookingData = {
      projectId: parseInt(formData.projectId),
      inventoryId: parseInt(formData.inventoryId),
      unitNo: formData.unitNo.trim(),
      buyerName: formData.buyerName.trim(),
      buyerMobile: formData.buyerMobile.trim(),
      referenceName: formData.referenceName.trim() || null,
      rate: rate,
      amount: amount,
      brokeragePct: brokeragePct,
      brokerageAmt: brokerageAmt,
      bookedBy: parseInt(formData.bookedBy),
      remarks: formData.remarks.trim() || null
    };

    onSubmit(bookingData);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              {booking ? 'Edit Booking' : 'Add New Booking'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {booking ? 'Update booking information' : 'Enter booking details to create a new booking'}
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

          {/* Unit Selection */}
          <div>
            <label htmlFor="inventoryId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Home className="inline mr-2 h-4 w-4" />
              Unit *
            </label>
            <select
              id="inventoryId"
              name="inventoryId"
              value={formData.inventoryId}
              onChange={handleChange}
              disabled={!formData.projectId}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.inventoryId ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select a unit</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.unitType} - {item.size} {item.mou} - ₹{item.rate.toLocaleString()}/sqft
                </option>
              ))}
            </select>
            {errors.inventoryId && (
              <p className="mt-1 text-sm text-destructive">{errors.inventoryId}</p>
            )}
            {!formData.projectId && (
              <p className="mt-1 text-xs text-muted-foreground">Please select a project first</p>
            )}
          </div>

          {/* Unit Number */}
          <div>
            <label htmlFor="unitNo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Unit Number *
            </label>
            <input
              type="text"
              id="unitNo"
              name="unitNo"
              value={formData.unitNo}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.unitNo ? 'border-destructive focus:border-destructive' : 'border-input'}`}
              placeholder="Enter unit number"
            />
            {errors.unitNo && (
              <p className="mt-1 text-sm text-destructive">{errors.unitNo}</p>
            )}
          </div>

          {/* Buyer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyerName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <User className="inline mr-2 h-4 w-4" />
                Buyer Name *
              </label>
              <input
                type="text"
                id="buyerName"
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.buyerName ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter buyer name"
              />
              {errors.buyerName && (
                <p className="mt-1 text-sm text-destructive">{errors.buyerName}</p>
              )}
            </div>

            <div>
              <label htmlFor="buyerMobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Phone className="inline mr-2 h-4 w-4" />
                Buyer Mobile *
              </label>
              <input
                type="tel"
                id="buyerMobile"
                name="buyerMobile"
                value={formData.buyerMobile}
                onChange={handleChange}
                maxLength={10}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.buyerMobile ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter mobile number"
              />
              {errors.buyerMobile && (
                <p className="mt-1 text-sm text-destructive">{errors.buyerMobile}</p>
              )}
            </div>
          </div>

          {/* Reference Name */}
          <div>
            <label htmlFor="referenceName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Reference Name
            </label>
            <input
              type="text"
              id="referenceName"
              name="referenceName"
              value={formData.referenceName}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter reference name (optional)"
            />
          </div>

          {/* Rate and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <DollarSign className="inline mr-2 h-4 w-4" />
                Rate (per {selectedInventory?.mou || 'sqft'}) *
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
                <Calculator className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="font-medium">
                  ₹{calculatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedInventory ? `${selectedInventory.size} × ${formData.rate || 0}` : 'Select unit first'}
              </p>
            </div>
          </div>

          {/* Brokerage Percentage and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brokeragePct" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Percent className="inline mr-2 h-4 w-4" />
                Brokerage % *
              </label>
              <input
                type="number"
                id="brokeragePct"
                name="brokeragePct"
                value={formData.brokeragePct}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.brokeragePct ? 'border-destructive focus:border-destructive' : 'border-input'}`}
                placeholder="Enter brokerage percentage"
              />
              {errors.brokeragePct && (
                <p className="mt-1 text-sm text-destructive">{errors.brokeragePct}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Brokerage Amount
              </label>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="font-medium">
                  ₹{calculatedBrokerage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {calculatedAmount > 0 ? `${calculatedAmount.toLocaleString()} × ${formData.brokeragePct || 0}%` : 'Enter rate first'}
              </p>
            </div>
          </div>

          {/* Booked By */}
          <div>
            <label htmlFor="bookedBy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <User className="inline mr-2 h-4 w-4" />
              Booked By *
            </label>
            <select
              id="bookedBy"
              name="bookedBy"
              value={formData.bookedBy}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.bookedBy ? 'border-destructive focus:border-destructive' : 'border-input'}`}
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.user_type})
                </option>
              ))}
            </select>
            {errors.bookedBy && (
              <p className="mt-1 text-sm text-destructive">{errors.bookedBy}</p>
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
              {booking ? 'Update Booking' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
