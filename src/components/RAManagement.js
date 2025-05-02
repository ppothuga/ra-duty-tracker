// src/components/RAManagement.js
import React, { useState, useEffect } from 'react';
import './RAManagement.css';

const RAManagement = () => {
  const [ras, setRAs] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [editingRA, setEditingRA] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRAs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/ras');
      if (!response.ok) throw new Error('Failed to fetch RAs');
      const data = await response.json();
      setRAs(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchRAs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddNew = () => {
    setFormData({ name: '', email: '', phone: '' });
    setEditingRA(null);
    setShowForm(true);
  };

  const handleEdit = (ra) => {
    setFormData({ name: ra.name, email: ra.email, phone: ra.phone });
    setEditingRA(ra);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this RA and their duties?')) return;
    try {
      await fetch(`http://localhost:5001/api/ras/${id}`, { method: 'DELETE' });
  
      fetchRAs();
  
      // Optional: force-refresh the calendar if it's mounted
      const calendarReloadEvent = new Event('calendarDataChanged');
      window.dispatchEvent(calendarReloadEvent);
    } catch (err) {
      alert('Failed to delete RA');
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingRA ? 'PUT' : 'POST';
    const url = editingRA
      ? `http://localhost:5001/api/ras/${editingRA.id}`
      : 'http://localhost:5001/api/ras';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '' });
      setEditingRA(null);
      fetchRAs();
    } catch (err) {
      alert('Failed to save RA');
    }
  };

  return (
    <div className="ra-management">
      <div className="ra-header">
        <h2>Resident Assistants</h2>
        <button className="add-button" onClick={handleAddNew}>Add New RA</button>
      </div>

      {showForm && (
        <div className="ra-form-container">
          <form className="ra-form" onSubmit={handleSubmit}>
            <h3>{editingRA ? 'Edit RA' : 'Add RA'}</h3>
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-button">Save</button>
              <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="ra-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ras.map((ra) => (
              <tr key={ra.id}>
                <td>{ra.id}</td>
                <td>{ra.name}</td>
                <td>{ra.email}</td>
                <td>{ra.phone}</td>
                <td>
                  <button className="edit-button" onClick={() => handleEdit(ra)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(ra.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RAManagement;
