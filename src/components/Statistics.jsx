import React, { useMemo } from 'react';
import './Statistics.css';

function Statistics({ stories }) {
  const stats = useMemo(() => {
    const totalStories = stories.length;
    const completedStories = stories.filter(s => s.isComplete).length;
    const totalImages = stories.reduce((acc, story) => acc + (story.imageUrls?.length || 0), 0);
    
    const storiesByDate = stories.reduce((acc, story) => {
      const date = new Date(story.createdAt || story.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const averageImagesPerStory = totalStories ? (totalImages / totalStories).toFixed(1) : 0;

    return {
      totalStories,
      completedStories,
      totalImages,
      averageImagesPerStory,
      storiesByDate
    };
  }, [stories]);

  return (
    <div className="statistics-container">
      <h2>Story Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Stories</h3>
          <p className="stat-number">{stats.totalStories}</p>
        </div>
        
        <div className="stat-card">
          <h3>Completed Stories</h3>
          <p className="stat-number">{stats.completedStories}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total Images</h3>
          <p className="stat-number">{stats.totalImages}</p>
        </div>
        
        <div className="stat-card">
          <h3>Avg. Images per Story</h3>
          <p className="stat-number">{stats.averageImagesPerStory}</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Stories by Date</h3>
          <div className="date-stats">
            {Object.entries(stats.storiesByDate).map(([date, count]) => (
              <div key={date} className="date-stat-item">
                <span className="date">{date}</span>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      width: `${(count / Math.max(...Object.values(stats.storiesByDate))) * 100}%` 
                    }}
                  />
                  <span className="count">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics; 