import React from 'react';
import axios from 'axios';
import './History.css';

function History({ stories, onDelete }) {
  const handleContinueStory = async (storyId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/stories/${storyId}/continue`);
      window.location.reload(); // Refresh to show updates
    } catch (error) {
      console.error('Error continuing story:', error);
      alert('Failed to continue story');
    }
  };

  const handleEndStory = async (storyId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/stories/${storyId}/end`);
      window.location.reload(); // Refresh to show updates
    } catch (error) {
      console.error('Error ending story:', error);
      alert('Failed to end story');
    }
  };

  if (!stories || stories.length === 0) {
    return <div className="no-stories">No stories found</div>;
  }

  return (
    <div className="stories-grid">
      {stories.map((story) => (
        <div key={story.id} className="story-card">
          <div className="story-header">
            <h3>{story.title || `Story #${story.id}`}</h3>
            <span className="story-date">
              {new Date(story.createdAt || story.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <div className="story-images">
            {story.imageUrls && story.imageUrls.map((url, index) => (
              <div key={index} className="image-container">
                <img
                  src={`http://localhost:5000${url}`}
                  alt={`Story image ${index + 1}`}
                  onError={(e) => {
                    console.error(`Failed to load image: ${url}`);
                    e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="story-content">
            {story.story && (
              <p className="story-text">{story.story}</p>
            )}
          </div>

          <div className="story-actions">
            {!story.isComplete && (
              <>
                <button
                  onClick={() => handleContinueStory(story.id)}
                  className="continue-btn"
                >
                  Continue Story
                </button>
                <button
                  onClick={() => handleEndStory(story.id)}
                  className="end-btn"
                >
                  End Story
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(story.id)}
              className="delete-btn"
            >
              Delete Story
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default History; 