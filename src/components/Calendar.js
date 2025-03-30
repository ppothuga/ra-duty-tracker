import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [duties, setDuties] = useState([]);
  const [newDuty, setNewDuty] = useState({
    raName: '',
    date: '',
    shift: 'evening',
    notes: ''
  });
  const [editingDuty, setEditingDuty] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterRA, setFilterRA] = useState('');

  // Load sample data for demonstration
  useEffect(() => {
    const sampleDuties = [
      { id: 1, raName: 'Alex Smith', date: '2025-03-28', shift: 'evening', notes: 'Main entrance duty' },
      { id: 2, raName: 'Jordan Lee', date: '2025-03-29', shift: 'overnight', notes: 'Weekend patrol' },
      { id: 3, raName: 'Taylor Wong', date: '2025-03-30', shift: 'morning', notes: 'Mail room coverage' },
      { id: 4, raName: 'Casey Johnson', date: '2025-04-01', shift: 'evening', notes: 'Front desk' }
    ];
    setDuties(sampleDuties);
  }, []);

  // Handle input changes for new duty
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDuty({
      ...newDuty,
      [name]: value
    });
  };

  // Handle input changes when editing
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingDuty({
      ...editingDuty,
      [name]: value
    });
  };

  // Add new duty
  const addDuty = (e) => {
    e.preventDefault();
    if (!newDuty.raName || !newDuty.date) {
      alert('RA name and date are required!');
      return;
    }
    
    const duty = {
      ...newDuty,
      id: Date.now() // simple id generation
    };
    
    setDuties([...duties, duty]);
    setNewDuty({
      raName: '',
      date: '',
      shift: 'evening',
      notes: ''
    });
  };

  // Start editing a duty
  const startEdit = (duty) => {
    setEditingDuty({ ...duty });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingDuty(null);
  };

  // Save edited duty
  const saveEdit = () => {
    if (!editingDuty.raName || !editingDuty.date) {
      alert('RA name and date are required!');
      return;
    }
    
    setDuties(duties.map(duty => 
      duty.id === editingDuty.id ? editingDuty : duty
    ));
    
    setEditingDuty(null);
  };

  // Delete a duty
  const deleteDuty = (id) => {
    if (window.confirm('Are you sure you want to delete this duty?')) {
      setDuties(duties.filter(duty => duty.id !== id));
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Get sorted and filtered duties
  const getSortedDuties = () => {
    // First filter
    let filteredDuties = duties;
    if (filterRA) {
      filteredDuties = duties.filter(duty => 
        duty.raName.toLowerCase().includes(filterRA.toLowerCase())
      );
    }
    
    // Then sort
    return filteredDuties.sort((a, b) => {
      if (a[sortField] < b[sortField]) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (a[sortField] > b[sortField]) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };
  
  return (
    <div className="calendar-container">
      <h2>RA Duty Calendar</h2>
      
      {/* Filter controls */}
      <div className="filter-controls">
        <input 
          type="text" 
          placeholder="Filter by RA name" 
          value={filterRA} 
          onChange={(e) => setFilterRA(e.target.value)}
          className="filter-input"
        />
      </div>
      
      {/* Add new duty form */}
      <form onSubmit={addDuty} className="duty-form">
        <h3>Add New Duty</h3>
        <div className="form-group">
          <label>RA Name:</label>
          <input
            type="text"
            name="raName"
            value={newDuty.raName}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={newDuty.date}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Shift:</label>
          <select
            name="shift"
            value={newDuty.shift}
            onChange={handleInputChange}
          >
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="overnight">Overnight</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Notes:</label>
          <textarea
            name="notes"
            value={newDuty.notes}
            onChange={handleInputChange}
          ></textarea>
        </div>
        
        <button type="submit" className="btn-add">Add Duty</button>
      </form>
      
      {/* Duties table */}
      <div className="duties-table-container">
        <h3>Scheduled Duties</h3>
        <table className="duties-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('raName')}>
                RA Name {getSortIndicator('raName')}
              </th>
              <th onClick={() => handleSort('date')}>
                Date {getSortIndicator('date')}
              </th>
              <th onClick={() => handleSort('shift')}>
                Shift {getSortIndicator('shift')}
              </th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {getSortedDuties().map(duty => (
              <tr key={duty.id}>
                {editingDuty && editingDuty.id === duty.id ? (
                  // Edit mode
                  <>
                    <td>
                      <input
                        type="text"
                        name="raName"
                        value={editingDuty.raName}
                        onChange={handleEditChange}
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="date"
                        value={editingDuty.date}
                        onChange={handleEditChange}
                        required
                      />
                    </td>
                    <td>
                      <select
                        name="shift"
                        value={editingDuty.shift}
                        onChange={handleEditChange}
                      >
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                        <option value="overnight">Overnight</option>
                      </select>
                    </td>
                    <td>
                      <textarea
                        name="notes"
                        value={editingDuty.notes}
                        onChange={handleEditChange}
                      ></textarea>
                    </td>
                    <td>
                      <button onClick={saveEdit} className="btn-save">Save</button>
                      <button onClick={cancelEdit} className="btn-cancel">Cancel</button>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td>{duty.raName}</td>
                    <td>{new Date(duty.date).toLocaleDateString()}</td>
                    <td>{duty.shift.charAt(0).toUpperCase() + duty.shift.slice(1)}</td>
                    <td>{duty.notes}</td>
                    <td>
                      <button onClick={() => startEdit(duty)} className="btn-edit">Edit</button>
                      <button onClick={() => deleteDuty(duty.id)} className="btn-delete">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Calendar;