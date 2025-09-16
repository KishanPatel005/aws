import { useState, useEffect } from 'react';
import { Plus, Building2, Search, Edit, Trash2, FileText, MapPin, Download, Eye } from 'lucide-react';
import ProjectForm from '../components/ProjectForm';

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

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch projects and builders from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, buildersResponse] = await Promise.all([
        fetch('http://localhost:8080/api/projects'),
        fetch('http://localhost:8080/api/builders')
      ]);

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      } else {
        console.error('Failed to fetch projects');
      }

      if (buildersResponse.ok) {
        const buildersData = await buildersResponse.json();
        setBuilders(buildersData);
      } else {
        console.error('Failed to fetch builders');
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
  const handleSubmit = async (formData: FormData) => {
    try {
      const url = editingProject 
        ? `http://localhost:8080/api/projects/${editingProject.id}`
        : 'http://localhost:8080/api/projects';
      
      const method = editingProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setEditingProject(null);
      } else {
        const error = await response.json();
        console.error('Error saving project:', error);
        alert('Failed to save project: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`http://localhost:8080/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      } else {
        console.error('Failed to delete project');
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  // Handle edit
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.city && project.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    project.builder?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'UNDER_CONSTRUCTION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'READY_POSSESSION':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (showForm) {
    return (
      <div>
        <ProjectForm
          project={editingProject}
          builders={builders}
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
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage real estate projects and their documents
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">No projects found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new project.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const documents = project.documents || [];
            return (
              <div key={project.id} className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Builder and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {project.builder?.logo ? (
                        <img
                          src={`http://localhost:8080${project.builder.logo}`}
                          alt={project.builder.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {project.builder?.name}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Project Name */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {project.name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {[project.city, project.area].filter(Boolean).join(', ') || 'No location specified'}
                    </p>
                  </div>

                  {/* Possession Date */}
                  {project.possessionDate && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">Possession Date:</p>
                      <p className="text-sm font-medium">
                        {new Date(project.possessionDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Other Charges */}
                  {project.otherCharges && project.otherCharges.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Other Charges ({project.otherCharges.length}):
                      </p>
                      <div className="space-y-1">
                        {project.otherCharges.slice(0, 2).map((charge, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{charge.name}</span>
                            <span className="font-medium">{charge.type} - ₹{charge.rate.toLocaleString()}</span>
                          </div>
                        ))}
                        {project.otherCharges.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{project.otherCharges.length - 2} more charges
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {documents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Documents ({documents.length}):
                      </p>
                      <div className="space-y-1">
                        {documents.slice(0, 3).map((doc: string, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <a
                              href={`http://localhost:8080${doc}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate flex-1"
                            >
                              {doc.split('/').pop()}
                            </a>
                            <div className="flex space-x-1">
                              <a
                                href={`http://localhost:8080${doc}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-3 w-3" />
                              </a>
                              <a
                                href={`http://localhost:8080${doc}`}
                                download
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                        {documents.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{documents.length - 3} more documents
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        project.isEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

export default Projects;