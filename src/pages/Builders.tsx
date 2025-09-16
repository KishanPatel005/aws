import { useState, useEffect } from 'react';
import { Plus, Building2, Search, Edit, Trash2, Image, Users, MapPin } from 'lucide-react';
import BuilderForm from '../components/BuilderForm';

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
  projects: Array<{
    id: number;
    name: string;
    city: string | null;
    status: string;
    isEnabled: boolean;
  }>;
}

const Builders = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBuilder, setEditingBuilder] = useState<Builder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch builders from API
  const fetchBuilders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/builders');
      if (response.ok) {
        const data = await response.json();
        setBuilders(data);
      } else {
        console.error('Failed to fetch builders');
      }
    } catch (error) {
      console.error('Error fetching builders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    try {
      const url = editingBuilder 
        ? `http://localhost:8080/api/builders/${editingBuilder.id}`
        : 'http://localhost:8080/api/builders';
      
      const method = editingBuilder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        await fetchBuilders();
        setShowForm(false);
        setEditingBuilder(null);
      } else {
        const error = await response.json();
        console.error('Error saving builder:', error);
        alert('Failed to save builder: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving builder:', error);
      alert('Failed to save builder');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this builder?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/builders/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchBuilders();
      } else {
        console.error('Failed to delete builder');
        alert('Failed to delete builder');
      }
    } catch (error) {
      console.error('Error deleting builder:', error);
      alert('Failed to delete builder');
    }
  };

  // Handle edit
  const handleEdit = (builder: Builder) => {
    setEditingBuilder(builder);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingBuilder(null);
  };

  // Filter builders based on search term
  const filteredBuilders = builders.filter(builder =>
    builder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (builder.address && builder.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (showForm) {
    return (
      <div>
        <BuilderForm
          builder={editingBuilder}
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
            <h1 className="text-2xl font-bold text-foreground">Builders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage real estate builders and their information
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Builder
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search builders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Builders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading builders...</p>
          </div>
        </div>
      ) : filteredBuilders.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No builders found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new builder.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuilders.map((builder) => {
            const pocs = builder.pocs || [];
            return (
              <div key={builder.id} className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Logo and Name */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {builder.logo ? (
                        <img
                          src={`http://localhost:8080${builder.logo}`}
                          alt={builder.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {builder.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">
                          {builder.projects.length} project{builder.projects.length !== 1 ? 's' : ''}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          builder.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {builder.status ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {builder.address && (
                    <div className="mt-4">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {builder.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* POCs */}
                  {pocs.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-start space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Points of Contact:
                          </p>
                          {pocs.slice(0, 2).map((poc: any, index: number) => (
                            <p key={index} className="text-xs text-muted-foreground truncate">
                              {poc.name} • {poc.phone}
                            </p>
                          ))}
                          {pocs.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{pocs.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(builder)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(builder.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Builders;
