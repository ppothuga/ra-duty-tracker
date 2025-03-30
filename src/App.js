import React, { useState } from 'react';
import './App.css';
import Calendar from './components/Calendar';
import RAManagement from './components/RAManagement';
import Reports from './components/Reports';

function App() {
  const [currentPage, setCurrentPage] = useState('calendar');

  // Navigation handler
  const navigate = (page) => {
    setCurrentPage(page);
  };

  // Render the current component based on state
  const renderComponent = () => {
    switch (currentPage) {
      case 'calendar':
        return <Calendar />;
      case 'ras':
        return <RAManagement />;
      case 'reports':
        return <Reports />;
      default:
        return <Calendar />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>RA Duty Tracker</h1>
        <nav>
          <button
            onClick={() => navigate('calendar')}
            className={currentPage === 'calendar' ? 'active' : ''}
          >
            Calendar
          </button>
          <button
            onClick={() => navigate('ras')}
            className={currentPage === 'ras' ? 'active' : ''}
          >
            RAs
          </button>
          <button
            onClick={() => navigate('reports')}
            className={currentPage === 'reports' ? 'active' : ''}
          >
            Reports
          </button>
        </nav>
      </header>
      <main className="app-content">
        {renderComponent()}
      </main>
      <footer className="app-footer">
        <p>CS348 Project - RA Duty Tracker</p>
      </footer>
    </div>
  );
}

export default App;