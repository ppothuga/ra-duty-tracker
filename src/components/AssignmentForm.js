import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './AssignmentForm.css';

const AssignmentForm = ({ 
  selectedDate, 
  assignment, 
  dutyTypes, 
  dayTypes, 
  ras,
  onClose, 
  onSave,
  onDelete 
}) => {
  const [formData, setFormData] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    ra_id: '',
    ra_name: '',
    duty_type_id: '',
    day_type_id: '',
    notes: ''
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        date: assignment.date,
        ra_id: assignment.ra_id || '',
        ra_name: assignment.ra_name || '',
        duty_type_id: assignment.duty_type_id,
        day_type_id: assignment.day_type_id,
        notes: assignment.notes || ''
      });
    } else {
      setFormData({
        date: format(selectedDate, 'yyyy-MM-dd'),
        ra_id: '',
        ra_name: '',
        duty_type_id: '',
        day_type_id: '',
        notes: ''
      });
    }
  }, [assignment, selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRASelect = (e) => {
    const selectedId = e.target.value;
    const selectedRA = ras.find((ra) => String(ra.id) === selectedId);
    setFormData({
      ...formData,
      ra_id: selectedId,
      ra_name: selectedRA ? selectedRA.name : ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Only send the necessary data to the backend
    const payload = {
      ra_name: formData.ra_name,
      date: formData.date,
      shift: formData.shift || 'Secondary', // fallback
      notes: formData.notes,
      duty_type_id: formData.duty_type_id,
      day_type_id: formData.day_type_id
    };

    onSave(payload);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{assignment ? 'Edit Assignment' : 'New Assignment'}</h2>
          <button type="button" className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ra_id">RA:</label>
            <select
              id="ra_id"
              name="ra_id"
              value={formData.ra_id}
              onChange={handleRASelect}
              required
            >
              <option value="">-- Select RA --</option>
              {ras.map(ra => (
                <option key={ra.id} value={ra.id}>
                  {ra.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duty_type_id">Duty Type:</label>
            <select
              id="duty_type_id"
              name="duty_type_id"
              value={formData.duty_type_id}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Select Duty Type --</option>
              {dutyTypes.map(type => (
                <option key={type.duty_type_id} value={type.duty_type_id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="day_type_id">Day Type:</label>
            <select
              id="day_type_id"
              name="day_type_id"
              value={formData.day_type_id}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Select Day Type --</option>
              {dayTypes.map(type => (
                <option key={type.day_type_id} value={type.day_type_id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes:</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
            ></textarea>
          </div>

          <div className="form-actions">
            {assignment && (
              <button type="button" className="delete-button" onClick={onDelete}>
                Delete
              </button>
            )}
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentForm;
