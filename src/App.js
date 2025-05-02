import React, { useState } from 'react';
import './App.css';
import Calendar from './components/Calendar';
import RAManagement from './components/RAManagement';

function App() {
  const [currentPage, setCurrentPage] = useState('calendar');
  const [raRefreshTrigger, setRaRefreshTrigger] = useState(0);

  const handleDutyAdded = () => {
    setRaRefreshTrigger(prev => prev + 1); // this will re-trigger RA list reload
  };

  const renderComponent = () => {
    switch (currentPage) {
      case 'calendar':
        return <Calendar onDutyAdded={handleDutyAdded} />;
      case 'ras':
        return <RAManagement refreshTrigger={raRefreshTrigger} />;
      default:
        return <Calendar onDutyAdded={handleDutyAdded} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>RA Duty Tracker</h1>
        <nav>
          <button
            onClick={() => setCurrentPage('calendar')}
            className={currentPage === 'calendar' ? 'active' : ''}
          >
            Calendar
          </button>
          <button
            onClick={() => setCurrentPage('ras')}
            className={currentPage === 'ras' ? 'active' : ''}
          >
            RAs
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
