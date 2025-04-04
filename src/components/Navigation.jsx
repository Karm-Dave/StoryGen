import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, onTabChange, darkMode, onToggleDarkMode }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Story Generator</h1>
        <button className="theme-toggle" onClick={onToggleDarkMode}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
      
      <nav className="nav-links">
        <button
          className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => onTabChange('create')}
        >
          ✏️ Create Story
        </button>
        <button
          className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          📚 History
        </button>
        <button
          className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => onTabChange('statistics')}
        >
          📊 Statistics
        </button>
      </nav>
    </div>
  );
};

export default Navigation; 