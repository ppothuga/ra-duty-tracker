import React, { useState, useEffect } from 'react';
import './RAManagement.css';

const API_URL = 'http://127.0.0.1:5001/api/ras';

const RAManagement = ({ refreshTrigger }) => {
  const [ras, setRAs] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [editingRA, setEditingRA] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRAs = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setRAs(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch RAs:', err);
    }
  };

  useEffect(() => {
    fetchRAs();
  }, [refreshTrigger]); // also refetch if refreshTrigger changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRA) {
        await fetch(`${API_URL}/${editingRA.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setFormData({ name: '', email: '' });
      setEditingRA(null);
      fetchRAs();
    } catch (err) {
      console.error('Failed to save RA:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this RA?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchRAs();
    } catch (err) {
      console.error('Failed to delete RA:', err);
    }
  };

  const handleEdit = (ra) => {
    setFormData({ name: ra.name, email: ra.email });
    setEditingRA(ra);
  };

  return (
    <div className="ra-management">
      <h2>RA Management</h2>

      <form onSubmit={handleSubmit} className="ra-form">
        <input
          type="text"
          name="name"
          placeholder="RA Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="RA Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <button type="submit">{editingRA ? 'Update RA' : 'Add RA'}</button>
        {editingRA && (
          <button type="button" onClick={() => {
            setEditingRA(null);
            setFormData({ name: '', email: '' });
          }}>Cancel</button>
        )}
      </form>

      <hr />

      {loading ? <p>Loading RAs...</p> : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ras.map((ra) => (
              <tr key={ra.id}>
                <td>{ra.id}</td>
                <td>{ra.name}</td>
                <td>{ra.email}</td>
                <td>
                  <button onClick={() => handleEdit(ra)}>Edit</button>
                  <button onClick={() => handleDelete(ra.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RAManagement;
