const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/stories', express.static(path.join(__dirname, 'stories')));

// Create stories directory if it doesn't exist
const storiesDir = path.join(__dirname, 'stories');
if (!fs.existsSync(storiesDir)) {
  fs.mkdirSync(storiesDir, { recursive: true });
}

// Load stories from disk on startup
const loadStories = () => {
  try {
    const storiesPath = path.join(__dirname, 'stories');
    if (!fs.existsSync(storiesPath)) {
      fs.mkdirSync(storiesPath, { recursive: true });
    }
    
    const storyFolders = fs.readdirSync(storiesPath)
      .filter(folder => fs.statSync(path.join(storiesPath, folder)).isDirectory());
    
    console.log('Found story folders:', storyFolders);
    
    const stories = storyFolders.map(folderId => {
      try {
        const storyPath = path.join(storiesPath, folderId, 'story.json');
        if (fs.existsSync(storyPath)) {
          const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
          return {
            ...storyData,
            id: folderId,
            imageUrls: fs.readdirSync(path.join(storiesPath, folderId))
              .filter(file => file !== 'story.json')
              .map(file => `/stories/${folderId}/${file}`)
          };
        }
        return null;
      } catch (error) {
        console.error(`Error loading story ${folderId}:`, error);
        return null;
      }
    }).filter(story => story !== null);
    
    console.log('Loaded stories:', stories.length);
    return stories;
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
};

// Initialize stories array
let stories = loadStories();

// Get all stories
app.get('/api/stories', (req, res) => {
  try {
    // Reload stories from disk to ensure we have the latest
    stories = loadStories();
    console.log('Returning stories:', stories.length);
    res.json(stories);
  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
});

// Generate story from images
app.post('/api/generate', upload.array('images'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Create a new story folder
    const storyId = Date.now().toString();
    const storyDir = path.join(storiesDir, storyId);
    fs.mkdirSync(storyDir, { recursive: true });

    // Move files to story directory
    const imageUrls = files.map(file => {
      const newPath = path.join(storyDir, file.filename);
      fs.renameSync(file.path, newPath);
      return `/stories/${storyId}/${file.filename}`;
    });

    // Create initial story
    const story = {
      id: storyId,
      title: `Story ${storyId}`,
      story: `A fascinating tale begins with these ${files.length} images...`,
      imageUrls,
      isComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save story data
    fs.writeFileSync(
      path.join(storyDir, 'story.json'),
      JSON.stringify(story, null, 2)
    );

    // Update stories array
    stories.push(story);

    res.json(story);
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

// Continue story
app.post('/api/stories/:id/continue', async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;
    const storyDir = path.join(storiesDir, id);
    const storyPath = path.join(storyDir, 'story.json');

    if (!fs.existsSync(storyPath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
    
    // Add continuation to the story
    story.story += `\n\n${prompt || 'The story continues...'}\nAnd so the tale unfolds further...`;
    story.updatedAt = new Date().toISOString();

    // Save updated story
    fs.writeFileSync(storyPath, JSON.stringify(story, null, 2));

    // Update in memory
    stories = stories.map(s => s.id === id ? story : s);

    res.json(story);
  } catch (error) {
    console.error('Error continuing story:', error);
    res.status(500).json({ error: 'Failed to continue story' });
  }
});

// End story
app.post('/api/stories/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;
    const storyDir = path.join(storiesDir, id);
    const storyPath = path.join(storyDir, 'story.json');

    if (!fs.existsSync(storyPath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
    
    // Add conclusion to the story
    story.story += `\n\n${prompt || 'And finally...'}\nThe story reaches its conclusion.`;
    story.isComplete = true;
    story.updatedAt = new Date().toISOString();
    story.completedAt = new Date().toISOString();

    // Save updated story
    fs.writeFileSync(storyPath, JSON.stringify(story, null, 2));

    // Update in memory
    stories = stories.map(s => s.id === id ? story : s);

    res.json(story);
  } catch (error) {
    console.error('Error ending story:', error);
    res.status(500).json({ error: 'Failed to end story' });
  }
});

// Delete story
app.delete('/api/stories/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log('Attempting to delete story:', id);
    const storyDir = path.join(storiesDir, id);

    if (fs.existsSync(storyDir)) {
      fs.rmSync(storyDir, { recursive: true, force: true });
      stories = stories.filter(story => story.id !== id);
      res.json({ message: 'Story deleted successfully' });
    } else {
      console.log('Story not found:', id);
      res.status(404).json({ error: 'Story not found' });
    }
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 