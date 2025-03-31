import React, { useState, useEffect } from 'react';
import './RAManagement.css';

const RAManagement = () => {
  const [ras, setRAs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [editingRA, setEditingRA] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRAs();
  }, []);

  const fetchRAs = async () => {
    try {
      console.log('Fetching RAs from server...');
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/ras');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server returned error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Successfully fetched RAs:', data);
      setRAs(data);
    } catch (error) {
      console.error('Error fetching RAs:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      setError('Failed to load resident assistants. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddNew = () => {
    console.log('Initializing new RA form');
    setFormData({
      name: '',
      email: '',
      phone: ''
    });
    setEditingRA(null);
    setShowForm(true);
  };

  const handleEdit = (ra) => {
    console.log('Editing RA:', ra);
    setFormData({
      name: ra.name,
      email: ra.email,
      phone: ra.phone || ''
    });
    setEditingRA(ra);
    setShowForm(true);
  };

  const handleDelete = async (raId) => {
    if (window.confirm('Are you sure you want to delete this RA?')) {
      try {
        console.log(`Deleting RA with ID: ${raId}`);
        setLoading(true);
        
        const response = await fetch(`http://localhost:5000/api/ras/${raId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete operation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          throw new Error(errorData.error || `Failed to delete RA (${response.status})`);
        }
        
        console.log(`Successfully deleted RA with ID: ${raId}`);
        // Refresh the RA list
        fetchRAs();
      } catch (error) {
        const errorMessage = `Error deleting RA: ${error.message}`;
        console.error(errorMessage, {
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        alert(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      let url = 'http://localhost:5000/api/ras';
      let method = 'POST';
      
      if (editingRA) {
        url = `${url}/${editingRA.ra_id}`;
        method = 'PUT';
      }
      
      console.log(`${editingRA ? 'Updating' : 'Creating'} RA with data:`, formData);
      console.log(`Making ${method} request to: ${url}`);
      
      setLoading(true);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      // Log the raw response for debugging
      console.log('Server response status:', response.status);
      console.log('Server response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        let errorMessage = `${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Server returned error data:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response as JSON', parseError);
        }
        
        throw new Error(`Failed to ${editingRA ? 'update' : 'create'} RA: ${errorMessage}`);
      }
      
      const responseData = await response.json().catch(() => null);
      console.log(`RA ${editingRA ? 'updated' : 'created'} successfully:`, responseData);
      
      // Reset form and refresh RA list
      setFormData({
        name: '',
        email: '',
        phone: ''
      });
      setEditingRA(null);
      setShowForm(false);
      fetchRAs();
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred';
      console.error('Error saving RA:', {
        message: errorMessage,
        formData,
        editingId: editingRA?.ra_id,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    setShowForm(false);
    setEditingRA(null);
    setError(null);
  };

  return (
    <div className="ra-management">
      <div className="ra-header">
        <h2>Resident Assistants</h2>
        <button 
          className="add-button" 
          onClick={handleAddNew}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Add New RA'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {showForm && (
        <div className="ra-form-container">
          <form onSubmit={handleSubmit} className="ra-form">
            <h3>{editingRA ? 'Edit RA' : 'Add New RA'}</h3>
            
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone:</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="ra-list">
        {loading && !showForm && <p>Loading...</p>}
        
        {!loading && ras.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ras.map(ra => (
                <tr key={ra.ra_id}>
                  <td>{ra.name}</td>
                  <td>{ra.email}</td>
                  <td>{ra.phone}</td>
                  <td>
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(ra)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(ra.ra_id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p>No resident assistants found.</p>
        )}
      </div>
    </div>
  );
};

export default RAManagement;