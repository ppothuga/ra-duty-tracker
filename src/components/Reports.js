import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './Reports.css';

const Reports = () => {
  const [ras, setRAs] = useState([]);
  const [dayTypes, setDayTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    start_date: format(new Date(), 'yyyy-MM-01'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    ra_id: '',
    day_type_id: ''
  });

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Fetch RAs
        const rasResponse = await fetch('http://localhost:5000/api/ras');
        const rasData = await rasResponse.json();
        setRAs(rasData);
        
        // Fetch day types
        const dayTypesResponse = await fetch('http://localhost:5000/api/day_types');
        const dayTypesData = await dayTypesResponse.json();
        setDayTypes(dayTypesData);
      } catch (error) {
        console.error('Error fetching filters data:', error);
      }
    };
    
    fetchFiltersData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const generateReport = async () => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      
      // Fetch assignments based on filters
      const assignmentsResponse = await fetch(
        `http://localhost:5000/api/assignments?${queryParams}`
      );
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData);
      
      // Fetch stats based on filters
      const statsResponse = await fetch(
        `http://localhost:5000/api/stats?${queryParams}`
      );
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <div className="reports-container">
      <h2>Duty Assignment Reports</h2>
      
      <div className="filters-container">
        <div className="filter">
          <label htmlFor="start_date">Start Date:</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={filters.start_date}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter">
          <label htmlFor="end_date">End Date:</label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={filters.end_date}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter">
          <label htmlFor="ra_id">RA:</label>
          <select
            id="ra_id"
            name="ra_id"
            value={filters.ra_id}
            onChange={handleFilterChange}
          >
            <option value="">All RAs</option>
            {ras.map(ra => (
              <option key={ra.ra_id} value={ra.ra_id}>
                {ra.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter">
          <label htmlFor="day_type_id">Day Type:</label>
          <select
            id="day_type_id"
            name="day_type_id"
            value={filters.day_type_id}
            onChange={handleFilterChange}
          >
            <option value="">All Day Types</option>
            {dayTypes.map(type => (
              <option key={type.day_type_id} value={type.day_type_id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        
        <button className="generate-button" onClick={generateReport}>
          Generate Report
        </button>
      </div>
      
      {stats && (
        <div className="stats-container">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Assignments</h4>
              <p className="stat-value">{stats.total_assignments}</p>
            </div>
            
            <div className="stat-card">
              <h4>By Duty Type</h4>
              <ul>
                {stats.by_duty_type.map((item, index) => (
                  <li key={index}>
                    {item.name}: {item.count} assignments
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="stat-card">
              <h4>By Day Type</h4>
              <ul>
                {stats.by_day_type.map((item, index) => (
                  <li key={index}>
                    {item.name}: {item.count} assignments
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="stat-card">
              <h4>By RA</h4>
              <ul>
                {stats.by_ra.map((item, index) => (
                  <li key={index}>
                    {item.name}: {item.count} assignments
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {assignments.length > 0 ? (
        <div className="assignments-table-container">
          <h3>Assignments</h3>
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>RA</th>
                <th>Duty Type</th>
                <th>Day Type</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment.assignment_id}>
                  <td>{assignment.date}</td>
                  <td>{assignment.ra_name || 'Unassigned'}</td>
                  <td>{assignment.duty_type}</td>
                  <td>{assignment.day_type}</td>
                  <td>{assignment.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        assignments && <p>No assignments found matching the criteria.</p>
      )}
    </div>
  );
};

export default Reports;