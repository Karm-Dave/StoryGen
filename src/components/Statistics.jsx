import React, { useState, useEffect } from 'react';
import { FaBook, FaImage, FaClock, FaChartPie } from 'react-icons/fa';
import './Statistics.css';

function Statistics() {
  const [stats, setStats] = useState({
    totalStories: 0,
    totalImages: 0,
    averageLength: 0,
    genreDistribution: {},
    languageDistribution: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPieChart = (data, title) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="pie-chart">
          <h3>{title}</h3>
          <p>No data available</p>
        </div>
      );
    }

    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;
    const colors = ['#268bd2', '#2aa198', '#859900', '#b58900', '#cb4b16', '#d33682', '#6c71c4', '#93a1a1'];

    return (
      <div className="pie-chart">
        <h3>{title}</h3>
        <div className="pie-chart-container">
          <svg viewBox="0 0 100 100">
            {Object.entries(data).map(([key, value], index) => {
              const percentage = (value / total) * 100;
              const angle = (percentage / 100) * 360;
              const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
              currentAngle += angle;
              const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);

              return (
                <path
                  key={key}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                />
              );
            })}
          </svg>
          <div className="pie-chart-legend">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="legend-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="legend-value">{((value / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
          icon={<FaBook />}
          title="Total Stories"
          value={stats.totalStories}
        />
        <StatCard
          icon={<FaImage />}
          title="Total Images"
          value={stats.totalImages}
        />
        <StatCard
          icon={<FaClock />}
          title="Average Length"
          value={stats.averageLength}
          subtitle="words per story"
        />
      </div>

      <div className="charts-grid">
        {renderPieChart(stats.genreDistribution, 'Genre Distribution')}
        {renderPieChart(stats.languageDistribution, 'Language Distribution')}
      </div>
    </div>
  );
}

export default Statistics; 