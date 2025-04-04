import React, { useState, useEffect } from 'react';
import { FiBook, FiPenTool, FiCheck, FiClock } from 'react-icons/fi';
import './Statistics.css';

function Statistics() {
  const [stats, setStats] = useState({
    totalStories: 0,
    completedStories: 0,
    totalWords: 0,
    averageWordsPerStory: 0,
    genreStats: {},
    languageStats: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, subtitle }) => (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="statistics loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="statistics">
      <h2>Story Statistics</h2>

      <div className="stats-grid">
        <StatCard
          icon={<FiBook />}
          title="Total Stories"
          value={stats.totalStories}
        />
        <StatCard
          icon={<FiCheck />}
          title="Completed Stories"
          value={stats.completedStories || 0}
        />
        <StatCard
          icon={<FiPenTool />}
          title="Total Words"
          value={stats.totalWords.toLocaleString()}
        />
        <StatCard
          icon={<FiClock />}
          title="Average Words"
          value={stats.averageWordsPerStory.toLocaleString()}
          subtitle="per story"
        />
      </div>

      <div className="stats-details">
        <div className="stats-section">
          <h3>Genre Distribution</h3>
          <div className="stats-chart">
            {Object.entries(stats.genreStats || {}).map(([genre, count]) => (
              <div key={genre} className="chart-bar">
                <div className="chart-label">
                  <span>{genre}</span>
                  <span>{count}</span>
                </div>
                <div 
                  className="chart-fill"
                  style={{
                    width: `${(count / stats.totalStories) * 100}%`
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section">
          <h3>Language Distribution</h3>
          <div className="stats-chart">
            {Object.entries(stats.languageStats || {}).map(([language, count]) => (
              <div key={language} className="chart-bar">
                <div className="chart-label">
                  <span>{language}</span>
                  <span>{count}</span>
                </div>
                <div 
                  className="chart-fill"
                  style={{
                    width: `${(count / stats.totalStories) * 100}%`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics; 