import React, { useState, useEffect } from 'react';
import './Calendar.css';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5001/api';

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
  const [viewMode, setViewMode] = useState('calendar');
  const [dayDetailView, setDayDetailView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch duties from the API
  useEffect(() => {
    fetchDuties();
  }, [filterRA]);

  const fetchDuties = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/duties`;
      
      if (filterRA) {
        url += `?ra=${filterRA}`;
      }
      
      const response = await axios.get(url);
      setDuties(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching duties:', err);
      setError('Failed to load duties. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
  const addDuty = async (e) => {
    e.preventDefault();
    if (!newDuty.raName || !newDuty.date) {
      alert('RA name and date are required!');
      return;
    }
    
    try {
      // Convert from camelCase to snake_case for the API
      const dutyForApi = {
        ra_name: newDuty.raName,
        date: newDuty.date,
        shift: newDuty.shift,
        notes: newDuty.notes
      };
      
      const response = await axios.post(`${API_BASE_URL}/duties`, dutyForApi);
      
      // Update local state with new duty including the ID from server
      const addedDuty = {
        ra_name: newDuty.raName,
        date: newDuty.date,
        shift: newDuty.shift,
        notes: newDuty.notes,
        id: response.data.id
      };
      
      setDuties([...duties, addedDuty]);
      setNewDuty({
        raName: '',
        date: '',
        shift: 'Secondary',
        notes: ''
      });
      setShowAddForm(false);
      setSelectedDay(null);
    } catch (err) {
      console.error('Error adding duty:', err);
      alert('Failed to add duty. Please try again.');
    }
  };

  // Start editing a duty
  const startEdit = (duty) => {
    // Convert from snake_case to camelCase for the form
    setEditingDuty({
      ...duty,
      raName: duty.ra_name
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingDuty(null);
  };

  // Save edited duty
  const saveEdit = async () => {
    if (!editingDuty.raName && !editingDuty.ra_name) {
      alert('RA name is required!');
      return;
    }
    
    if (!editingDuty.date) {
      alert('Date is required!');
      return;
    }
    
    try {
      // Convert from mixed case to snake_case for the API
      const dutyForApi = {
        ra_name: editingDuty.raName || editingDuty.ra_name,
        date: editingDuty.date,
        shift: editingDuty.shift,
        notes: editingDuty.notes
      };
      
      await axios.put(`${API_BASE_URL}/duties/${editingDuty.id}`, dutyForApi);
      
      // Update local state
      const updatedDuty = {
        id: editingDuty.id,
        ra_name: editingDuty.raName || editingDuty.ra_name,
        date: editingDuty.date,
        shift: editingDuty.shift,
        notes: editingDuty.notes
      };
      
      setDuties(duties.map(duty => 
        duty.id === editingDuty.id ? updatedDuty : duty
      ));
      
      setEditingDuty(null);
      
      // Refresh day detail view if active
      if (dayDetailView) {
        const dayDuties = getDutiesForDay(dayDetailView.day);
        if (dayDuties.length === 0) {
          setDayDetailView(null);
        }
      }
    } catch (err) {
      console.error('Error updating duty:', err);
      alert('Failed to update duty. Please try again.');
    }
  };

  // Delete a duty
  const deleteDuty = async (id) => {
    if (window.confirm('Are you sure you want to delete this duty?')) {
      try {
        await axios.delete(`${API_BASE_URL}/duties/${id}`);
        
        // Update local state
        setDuties(duties.filter(duty => duty.id !== id));
        
        // Close day detail view if needed
        if (dayDetailView) {
          const updatedDuties = duties.filter(duty => duty.id !== id);
          const remainingDayDuties = getDutiesForDay(dayDetailView.day, updatedDuties);
          if (remainingDayDuties.length === 0) {
            setDayDetailView(null);
          }
        }
      } catch (err) {
        console.error('Error deleting duty:', err);
        alert('Failed to delete duty. Please try again.');
      }
    }
  };

  // Calendar navigation functions
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setDayDetailView(null);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setDayDetailView(null);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setDayDetailView(null);
    setSelectedDay(null);
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
      duty.ra_name.toLowerCase().includes(filterRA.toLowerCase())
    );
  };

  // Get duties for a specific day
  const getDutiesForDay = (day, dutyList = duties) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed, database uses 1-indexed
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    
    return dutyList.filter(duty => duty.date === dateStr);
  };

  // Handle day click
  const handleDayClick = (day, e) => {
    e.stopPropagation(); // Prevent bubbling
    
    const dailyDuties = getDutiesForDay(day);
    
    if (dailyDuties.length > 0) {
      // If there are duties for this day, show detail view
      setDayDetailView({
        day,
        month: currentMonth.getMonth(),
        year: currentMonth.getFullYear()
      });
      setSelectedDay(day);
    } else {
      // If no duties, open add form
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      setSelectedDay(day);
      setNewDuty({
        ...newDuty,
        date: formattedDate
      });
      setShowAddForm(true);
    }
  };

  // Handle duty click
  const handleDutyClick = (duty, e) => {
    e.stopPropagation(); // Prevent triggering day click
    startEdit(duty);
  };

  // Add new duty for specific day
  const handleAddForDay = (day) => {
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

  // Get shift class name
  const getShiftClassName = (shift) => {
    switch(shift.toLowerCase()) {
      case 'primary':
        return 'primary';
      case 'secondary': 
        return 'secondary';
      case 'tertiary':
        return 'tertiary';
      default:
        return 'primary';
    }
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
      const isSelected = (selectedDay === day && 
                         currentMonth.getMonth() === month && 
                         currentMonth.getFullYear() === year);
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={(e) => handleDayClick(day, e)}
        >
          <div className="day-number">{day}</div>
          {dailyDuties.map(duty => (
            <div 
              key={duty.id} 
              className={`duty-tag ${getShiftClassName(duty.shift)}`}
              title={`${duty.ra_name} - ${duty.shift} - ${duty.notes}`}
              onClick={(e) => handleDutyClick(duty, e)}
            >
              {duty.ra_name}
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

  // Render list view
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
            {filteredDuties.length === 0 ? (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                  No duties found. {filterRA ? 'Try adjusting your filter.' : 'Click the + button to add a duty.'}
                </td>
              </tr>
            ) : (
              filteredDuties.map(duty => (
                <tr key={duty.id}>
                  {editingDuty && editingDuty.id === duty.id ? (
                    <>
                      <td>
                        <div className="form-group">
                          <input
                            type="text"
                            name="raName"
                            value={editingDuty.raName || editingDuty.ra_name}
                            onChange={handleEditChange}
                            required
                            className="filter-input"
                          />
                        </div>
                      </td>
                      <td>
                        <div className="form-group">
                          <input
                            type="date"
                            name="date"
                            value={editingDuty.date}
                            onChange={handleEditChange}
                            required
                            className="filter-input"
                          />
                        </div>
                      </td>
                      <td>
                        <div className="form-group">
                          <select
                            name="shift"
                            value={editingDuty.shift}
                            onChange={handleEditChange}
                            className="filter-input"
                          >
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                            <option value="Tertiary">Tertiary</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="form-group">
                          <input
                            type="text"
                            name="notes"
                            value={editingDuty.notes || ''}
                            onChange={handleEditChange}
                            className="filter-input"
                          />
                        </div>
                      </td>
                      <td>
                        <div className="duty-actions">
                          <button onClick={saveEdit} className="save-btn">Save</button>
                          <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{duty.ra_name}</td>
                      <td>{duty.date}</td>
                      <td>
                        <span className={`duty-shift ${getShiftClassName(duty.shift)}`}>
                          {duty.shift}
                        </span>
                      </td>
                      <td>{duty.notes}</td>
                      <td>
                        <div className="duty-actions">
                          <button onClick={() => startEdit(duty)} className="edit-btn">Edit</button>
                          <button onClick={() => deleteDuty(duty.id)} className="delete-btn">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render day detail view
  const renderDayDetailView = () => {
    if (!dayDetailView) return null;
    
    const { day, month, year } = dayDetailView;
    const date = new Date(year, month, day);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const dayDuties = getDutiesForDay(day);
    
    return (
      <div className="day-detail-container">
        <div className="day-detail-header">
          <h3>{formattedDate}</h3>
          <button onClick={() => {
            setDayDetailView(null);
            setSelectedDay(null);
          }} className="close-btn">×</button>
        </div>
        <div className="day-duties">
          {dayDuties.map(duty => (
            <div key={duty.id} className="duty-card">
              {editingDuty && editingDuty.id === duty.id ? (
                <div className="duty-edit-form">
                  <div className="form-group">
                    <label>RA Name:</label>
                    <input
                      type="text"
                      name="raName"
                      value={editingDuty.raName || editingDuty.ra_name}
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
                      value={editingDuty.notes || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="duty-actions">
                    <button onClick={saveEdit} className="save-btn">Save</button>
                    <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h4>{duty.ra_name}</h4>
                  <div className={`duty-shift ${getShiftClassName(duty.shift)}`}>{duty.shift}</div>
                  {duty.notes && <div className="duty-notes">{duty.notes}</div>}
                  <div className="duty-actions">
                    <button onClick={() => startEdit(duty)} className="edit-btn">Edit</button>
                    <button onClick={() => deleteDuty(duty.id)} className="delete-btn">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
          <button 
            onClick={() => handleAddForDay(day)} 
            className="add-duty-btn"
          >
            Add Duty
          </button>
        </div>
      </div>
    );
  };

  // Render the add duty form
  const renderAddDutyForm = () => {
    if (!showAddForm) return null;
    
    return (
      <div className="add-form-container">
        <div className="add-form-header">
          <h3>{selectedDay ? `Add Duty for ${currentMonth.toLocaleString('default', { month: 'long' })} ${selectedDay}` : 'Add New Duty'}</h3>
          <button onClick={() => {
            setShowAddForm(false);
            setSelectedDay(null);
          }} className="close-btn">×</button>
        </div>
        <form onSubmit={addDuty}>
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
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">Add Duty</button>
            <button type="button" onClick={() => {
              setShowAddForm(false);
              setSelectedDay(null);
            }} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => {
    return (
      <div className="loading">
        <div>Loading duties...</div>
      </div>
    );
  };

  // Render error state
  const renderError = () => {
    return (
      <div className="error-message">{error}</div>
    );
  };

  return (
    <div className="calendar-container" onClick={() => {
      setDayDetailView(null);
      setSelectedDay(null);
    }}>
      <h1>RA Duty Calendar</h1>
      
      <div className="controls">
        <input
          type="text"
          placeholder="Filter by RA name..."
          value={filterRA}
          onChange={(e) => setFilterRA(e.target.value)}
          className="filter-input"
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowAddForm(true);
            setSelectedDay(null);
          }}
          className="add-btn"
        >
          +
        </button>
      </div>
      
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <div onClick={(e) => e.stopPropagation()}>
          {viewMode === 'calendar' ? renderCalendar() : renderListView()}
        </div>
      )}
      
      {dayDetailView && (
        <div className="overlay" onClick={(e) => e.stopPropagation()}>
          {renderDayDetailView()}
        </div>
      )}
      
      {showAddForm && (
        <div className="overlay" onClick={() => {
          setShowAddForm(false);
          setSelectedDay(null);
        }}>
          <div onClick={(e) => e.stopPropagation()}>
            {renderAddDutyForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;