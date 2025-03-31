import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [duties, setDuties] = useState([]);
  const [newDuty, setNewDuty] = useState({
    raName: '',
    date: '',
    shift: 'Secondary',
    notes: ''
  });
  const [editingDuty, setEditingDuty] = useState(null);
  const [filterRA, setFilterRA] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Load sample data for demonstration
  useEffect(() => {
    const sampleDuties = [
      { id: 1, raName: 'Alex Smith', date: '2025-03-28', shift: 'Secondary', notes: 'Main entrance duty' },
      { id: 2, raName: 'Jordan Lee', date: '2025-03-29', shift: 'Tertiary', notes: 'Weekend patrol' },
      { id: 3, raName: 'Taylor Wong', date: '2025-03-30', shift: 'Primary', notes: 'Mail room coverage' },
      { id: 4, raName: 'Casey Johnson', date: '2025-04-01', shift: 'Secondary', notes: 'Front desk' }
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
      shift: 'Secondary',
      notes: ''
    });
    setShowAddForm(false);
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

  // Calendar navigation functions
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Generate calendar days
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Filter duties by RA name
  const getFilteredDuties = () => {
    if (!filterRA) return duties;
    return duties.filter(duty => 
      duty.raName.toLowerCase().includes(filterRA.toLowerCase())
    );
  };

  // Get duties for a specific day
  const getDutiesForDay = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return getFilteredDuties().filter(duty => {
      const dutyDate = new Date(duty.date);
      return dutyDate.getFullYear() === year && 
             dutyDate.getMonth() === month && 
             dutyDate.getDate() === day;
    });
  };

  // Handle day click
  const handleDayClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDay(day);
    setNewDuty({
      ...newDuty,
      date: formattedDate
    });
    setShowAddForm(true);
  };

  // Render calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(month, year);
    const firstDayOfMonth = getFirstDayOfMonth(month, year);
    
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dailyDuties = getDutiesForDay(day);
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === month && 
                      new Date().getFullYear() === year;
      const isSelected = selectedDay === day;
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => handleDayClick(day)}
        >
          <div className="day-number">{day}</div>
          {dailyDuties.map(duty => (
            <div 
              key={duty.id} 
              className={`duty-tag ${duty.shift.toLowerCase()}`}
              title={`${duty.raName} - ${duty.shift} - ${duty.notes}`}
            >
              {duty.raName}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="calendar-wrapper">
        <div className="calendar-header">
          <button onClick={prevMonth} className="nav-btn">&lt;</button>
          <h2>{monthName} {year}</h2>
          <button onClick={nextMonth} className="nav-btn">&gt;</button>
          <button onClick={goToToday} className="today-btn">Today</button>
          <button 
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="view-toggle-btn"
          >
            {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
          </button>
        </div>
        <div className="weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  // Render list view (original implementation)
  const renderListView = () => {
    const filteredDuties = getFilteredDuties();
    
    return (
      <div className="duties-table-container">
        <div className="list-header">
          <h3>Scheduled Duties</h3>
          <button 
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="view-toggle-btn"
          >
            {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
          </button>
        </div>
        <table className="duties-table">
          <thead>
            <tr>
              <th>RA Name</th>
              <th>Date</th>
              <th>Shift</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDuties.map(duty => (
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
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Tertiary">Tertiary</option>
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
                    <td>{duty.shift}</td>
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
    );
  };

  return (
    <div className="calendar-container">
      <h1>RA Duty Calendar</h1>
      
      {/* Filter controls */}
      <div className="filter-controls">
        <input 
          type="text" 
          placeholder="Filter by RA name" 
          value={filterRA} 
          onChange={(e) => setFilterRA(e.target.value)}
          className="filter-input"
        />
        <button 
          onClick={() => {setShowAddForm(true); setSelectedDay(null);}}
          className="btn-add-new"
        >
          Add New Duty
        </button>
      </div>
      
      {/* Main view (calendar or list) */}
      {viewMode === 'calendar' ? renderCalendar() : renderListView()}
      
      {/* Add/Edit duty form */}
      {showAddForm && (
        <div className="modal-backdrop">
          <div className="duty-form-modal">
            <div className="modal-header">
              <h3>{selectedDay ? `Add Duty for ${currentMonth.toLocaleString('default', { month: 'long' })} ${selectedDay}` : 'Add New Duty'}</h3>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form onSubmit={addDuty} className="duty-form">
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
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Tertiary">Tertiary</option>
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
              
              <div className="form-buttons">
                <button type="submit" className="btn-add">Add Duty</button>
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit duty modal */}
      {editingDuty && (
        <div className="modal-backdrop">
          <div className="duty-form-modal">
            <div className="modal-header">
              <h3>Edit Duty</h3>
              <button className="close-btn" onClick={cancelEdit}>×</button>
            </div>
            <form className="duty-form">
              <div className="form-group">
                <label>RA Name:</label>
                <input
                  type="text"
                  name="raName"
                  value={editingDuty.raName}
                  onChange={handleEditChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={editingDuty.date}
                  onChange={handleEditChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Shift:</label>
                <select
                  name="shift"
                  value={editingDuty.shift}
                  onChange={handleEditChange}
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Tertiary">Tertiary</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  name="notes"
                  value={editingDuty.notes}
                  onChange={handleEditChange}
                ></textarea>
              </div>
              
              <div className="form-buttons">
                <button type="button" className="btn-save" onClick={saveEdit}>Save Changes</button>
                <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;