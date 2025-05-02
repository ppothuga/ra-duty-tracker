import React, { useState, useEffect } from 'react';
import './RAManagement.css';

const API_URL = 'http://127.0.0.1:5001/api/ras';

const RAManagement = ({ refreshTrigger, onRaUpdated }) => {
  const [ras, setRAs] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [editingRA, setEditingRA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');

  const fetchRAs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      console.log("Fetched RAs:", data);
      setRAs(data);
    } catch (err) {
      console.error('Failed to fetch RAs:', err);
      setError(`Failed to load RAs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRAs();
  }, [refreshTrigger]); // refetch if refreshTrigger changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRA) {
        const res = await fetch(`${API_URL}/${editingRA.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Server responded with ${res.status}`);
        }
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Server responded with ${res.status}`);
        }
      }
      setFormData({ name: '', email: '' });
      setEditingRA(null);
      await fetchRAs();
      
      // Notify parent component that RAs have been updated
      if (onRaUpdated) onRaUpdated();
    } catch (err) {
      console.error('Failed to save RA:', err);
      setError(`Failed to save RA: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this RA?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }
      await fetchRAs();
      
      // Notify parent component that RAs have been updated
      if (onRaUpdated) onRaUpdated();
    } catch (err) {
      console.error('Failed to delete RA:', err);
      setError(`Failed to delete RA: ${err.message}`);
    }
  };

  const handleEdit = (ra) => {
    setFormData({
      name: ra.name || '',
      email: ra.email || ''
    });
    setEditingRA(ra);
  };
  
  const filteredRAs = filterText.trim() === '' 
    ? ras
    : ras.filter(ra => 
        ra.name?.toLowerCase().includes(filterText.toLowerCase()) ||
        ra.email?.toLowerCase().includes(filterText.toLowerCase())
      );

  return (
    <div className="ra-management">
      <h2>RA Management</h2>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ra-form">
        <div className="form-group">
          <label htmlFor="raName">Name:</label>
          <input
            id="raName"
            type="text"
            name="name"
            placeholder="RA Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="raEmail">Email:</label>
          <input
            id="raEmail"
            type="email"
            name="email"
            placeholder="RA Email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {editingRA ? 'Update RA' : 'Add RA'}
          </button>
          
          {editingRA && (
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => {
                setEditingRA(null);
                setFormData({ name: '', email: '' });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="ra-filter">
        <input
          type="text"
          placeholder="Filter RAs..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading RAs...</div>
      ) : filteredRAs.length > 0 ? (
        <table className="ra-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRAs.map((ra) => (
              <tr key={ra.id}>
                <td>{ra.id}</td>
                <td>{ra.name}</td>
                <td>{ra.email || '—'}</td>
                <td className="action-buttons">
                  <button className="edit-btn" onClick={() => handleEdit(ra)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(ra.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-data">No RAs found</div>
      )}
    </div>
  );
};

export default RAManagement;