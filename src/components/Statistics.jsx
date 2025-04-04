import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const colorPalette = [
  '#2aa198', // cyan
  '#268bd2', // blue
  '#6c71c4', // violet
  '#d33682', // magenta
  '#dc322f', // red
  '#cb4b16', // orange
  '#b58900', // yellow
  '#859900'  // green
];

function Statistics() {
  const [stats, setStats] = useState({
    genreStats: {},
    languageStats: {},
    totalStories: 0,
    totalWords: 0,
    averageWordsPerStory: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/statistics');
        setStats(response.data);
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const genreChartData = {
    labels: Object.keys(stats.genreStats),
    datasets: [{
      data: Object.values(stats.genreStats),
      backgroundColor: colorPalette,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1
    }]
  };

  const languageChartData = {
    labels: Object.keys(stats.languageStats),
    datasets: [{
      data: Object.values(stats.languageStats),
      backgroundColor: colorPalette,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--text)',
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="statistics">
      <div className="stat-card">
        <h3>Story Overview</h3>
        <div className="stat-grid">
          <div className="stat-item">
            <h4>Total Stories</h4>
            <p>{stats.totalStories}</p>
          </div>
          <div className="stat-item">
            <h4>Average Words</h4>
            <p>{Math.round(stats.averageWordsPerStory)}</p>
          </div>
          <div className="stat-item">
            <h4>Languages Used</h4>
            <p>{Object.keys(stats.languageStats).length}</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3>Stories by Genre</h3>
        <div className="chart-container" style={{ height: '300px' }}>
          <Pie data={genreChartData} options={chartOptions} />
        </div>
      </div>

      <div className="stat-card">
        <h3>Stories by Language</h3>
        <div className="chart-container" style={{ height: '300px' }}>
          <Pie data={languageChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default Statistics; 