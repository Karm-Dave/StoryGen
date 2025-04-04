import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

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

function Statistics({ stories, favorites }) {
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

  // Calculate genre distribution
  const genreData = stories.reduce((acc, story) => {
    const genre = story.genre || 'general';
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const genreChartData = Object.entries(genreData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Calculate language distribution
  const languageData = stories.reduce((acc, story) => {
    const language = story.language || 'english';
    acc[language] = (acc[language] || 0) + 1;
    return acc;
  }, {});

  const languageChartData = Object.entries(languageData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Calculate stories per day
  const dailyData = stories.reduce((acc, story) => {
    const date = new Date(story.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dailyChartData = Object.entries(dailyData).map(([date, count]) => ({
    date,
    count
  }));

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
    <div className="statistics-container">
      <h2>Story Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Stories</h3>
          <p className="stat-number">{stories.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>Favorites</h3>
          <p className="stat-number">{favorites.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>Average Images per Story</h3>
          <p className="stat-number">
            {stories.length > 0
              ? (stories.reduce((sum, story) => sum + (story.imageUrls?.length || 0), 0) / stories.length).toFixed(1)
              : 0}
          </p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Stories by Genre</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {genreChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Stories by Language</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={languageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Stories per Day</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics; 