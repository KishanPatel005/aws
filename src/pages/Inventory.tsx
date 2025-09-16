import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Home, Ruler, DollarSign, FileText } from 'lucide-react';
import InventoryForm from '../components/InventoryForm';

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
  project: Project;
}

const Inventory = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch inventory and projects from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [inventoryResponse, projectsResponse] = await Promise.all([
        fetch('http://localhost:8080/api/inventory'),
        fetch('http://localhost:8080/api/projects')
      ]);

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData);
      } else {
        console.error('Failed to fetch inventory');
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
      const url = editingInventory 
        ? `http://localhost:8080/api/inventory/${editingInventory.id}`
        : 'http://localhost:8080/api/inventory';
      
      const method = editingInventory ? 'PUT' : 'POST';
      
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
        setEditingInventory(null);
      } else {
        const error = await response.json();
        console.error('Error saving inventory:', error);
        alert('Failed to save unit: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Failed to save unit');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/inventory/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      } else {
        console.error('Failed to delete unit');
        alert('Failed to delete unit');
      }
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Failed to delete unit');
    }
  };

  // Handle edit
  const handleEdit = (inventoryItem: Inventory) => {
    setEditingInventory(inventoryItem);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingInventory(null);
  };

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.unitType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.project.city && item.project.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.project.builder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <div>
        <InventoryForm
          inventory={editingInventory}
          projects={projects}
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
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage property units and their details
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No units found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new unit.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border">
                <tr className="border-b border-border transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Project</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Unit Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">MOU</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Size</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rate</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    {/* Project */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-3">
                        {item.project.builder.logo ? (
                          <img
                            src={`http://localhost:8080${item.project.builder.logo}`}
                            alt={item.project.builder.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.project.name}</p>
                          <p className="text-xs text-muted-foreground">{item.project.builder.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Unit Type */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                        {item.unitType}
                      </div>
                    </td>

                    {/* MOU */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <Ruler className="mr-2 h-4 w-4 text-muted-foreground" />
                        {item.mou}
                      </div>
                    </td>

                    {/* Size */}
                    <td className="p-4 align-middle">
                      <span className="text-sm text-foreground">
                        {item.size.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Rate */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center text-sm text-foreground">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 align-middle">
                      <span className="text-sm font-semibold text-foreground">
                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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

export default Inventory;
