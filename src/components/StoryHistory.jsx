import React from 'react';
import PropTypes from 'prop-types';

const StoryHistory = ({ stories, onStorySelect, favorites, onToggleFavorite }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!stories || stories.length === 0) {
    return (
      <div className="empty-state">
        <p>No stories found. Create your first story!</p>
      </div>
    );
  }

  return (
    <div className="story-grid">
      {stories.map((story) => (
        <div key={story.id} className="story-card">
          <div className="story-card-header">
            <h3>{story.title || 'Untitled Story'}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(story);
              }}
              className={`favorite-btn ${favorites.some(f => f.id === story.id) ? 'active' : ''}`}
            >
              {favorites.some(f => f.id === story.id) ? '★' : '☆'}
            </button>
          </div>
          
          <div className="story-card-content" onClick={() => onStorySelect(story)}>
            {story.imageUrls && story.imageUrls.length > 0 && (
              <div className="story-card-images">
                {story.imageUrls.slice(0, 4).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Story image ${index + 1}`}
                    className="story-thumbnail"
                  />
                ))}
              </div>
            )}
            
            <div className="story-card-details">
              {story.prompt && (
                <p className="story-prompt">"{story.prompt}"</p>
              )}
              <p className="story-preview">
                {story.story.substring(0, 150)}...
              </p>
              <div className="story-metadata">
                <span className="story-genre">{story.genre || 'General'}</span>
                <span className="story-language">{story.language || 'English'}</span>
                <span className="story-date">{formatDate(story.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

StoryHistory.propTypes = {
  stories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    story: PropTypes.string.isRequired,
    prompt: PropTypes.string,
    genre: PropTypes.string,
    language: PropTypes.string,
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    timestamp: PropTypes.string.isRequired
  })).isRequired,
  onStorySelect: PropTypes.func.isRequired,
  favorites: PropTypes.array.isRequired,
  onToggleFavorite: PropTypes.func.isRequired
};

export default StoryHistory; 