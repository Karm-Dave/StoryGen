const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Enable CORS
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the stories directory
app.use('/stories', express.static(path.join(__dirname, 'stories')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize stories array
let stories = [];

// Load existing stories on startup
const loadStories = () => {
  const storiesDir = path.join(__dirname, 'stories');
  const uploadsDir = path.join(__dirname, 'uploads');
  
  // Create directories if they don't exist
  [storiesDir, uploadsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  try {
    const storyFolders = fs.readdirSync(storiesDir);
    console.log('Found story folders:', storyFolders);

    const loadedStories = storyFolders
      .map(folderId => {
        const storyPath = path.join(storiesDir, folderId, 'story.json');
        if (fs.existsSync(storyPath)) {
          try {
            const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
            return { ...storyData, id: folderId };
          } catch (err) {
            console.error(`Error reading story ${folderId}:`, err);
            return null;
          }
        }
        return null;
      })
      .filter(story => story !== null);

    console.log('Loaded stories:', loadedStories.length);
    return loadedStories;
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
};

// Initialize stories array
stories = loadStories();

// Helper function to generate image description
async function generateImageDescription(imagePath) {
  try {
    const imageData = fs.readFileSync(imagePath);
    const imageBase64 = imageData.toString('base64');
    
    const imagePrompt = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg',
      },
    };

    const result = await model.generateContent([
      'Describe the main elements in this image in a few words (e.g., objects, scenes, themes).',
      imagePrompt,
    ]);
    
    return result.response.text();
  } catch (error) {
    console.error('Error generating image description:', error);
    return 'Unable to describe image';
  }
}

// Helper function to generate story
async function generateStory(prompt, genre = 'general', language = 'english', branching = false) {
  try {
    let genrePrompt = '';
    
    // Add genre-specific instructions
    switch(genre) {
      case 'fantasy':
        genrePrompt = 'Create a fantasy story with magical elements, mythical creatures, and epic adventures.';
        break;
      case 'scifi':
        genrePrompt = 'Create a science fiction story with futuristic technology, space exploration, and scientific concepts.';
        break;
      case 'mystery':
        genrePrompt = 'Create a mystery story with suspense, clues, and a surprising revelation at the end.';
        break;
      case 'romance':
        genrePrompt = 'Create a romantic story focusing on relationships, emotions, and character connections.';
        break;
      case 'horror':
        genrePrompt = 'Create a horror story with suspense, tension, and elements of fear and surprise.';
        break;
      default:
        genrePrompt = 'Create a general story with engaging characters and plot.';
    }
    
    // Add branching instructions if requested
    const branchingPrompt = branching ? 
      'Include at least two possible branching points in the story where the narrative could take different directions. Mark these with [BRANCH POINT] followed by a brief description of the alternative path.' : 
      '';
    
    // Add language instruction
    const languagePrompt = language !== 'english' ? 
      `Write the story in ${language}.` : 
      '';
    
    const fullPrompt = `${genrePrompt} ${prompt} ${branchingPrompt} ${languagePrompt}`;
    
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating story:', error);
    throw error;
  }
}

// Helper function to generate title
async function generateTitle(prompt) {
  try {
    const titlePrompt = `Generate a creative, concise title (3-5 words) for a story with these elements: ${prompt}. 
    The title should be catchy and memorable, but not start with phrases like "Here are" or similar. 
    Just return the title itself, nothing else.`;
    
    const result = await model.generateContent(titlePrompt);
    let title = result.response.text().trim();
    
    // Remove any quotes or extra formatting
    title = title.replace(/["']/g, '');
    
    // Remove common prefixes
    const prefixesToRemove = [
      'here are',
      'here is',
      'these are',
      'this is',
      'some',
      'a few',
      'title:',
      'suggested title:'
    ];
    
    for (const prefix of prefixesToRemove) {
      if (title.toLowerCase().startsWith(prefix)) {
        title = title.substring(prefix.length).trim();
      }
    }
    
    // Ensure proper capitalization
    title = title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Limit to 5 words
    const words = title.split(' ');
    if (words.length > 5) {
      title = words.slice(0, 5).join(' ');
    }
    
    return title || 'Untitled Story';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'Untitled Story';
  }
}

// Route to handle image uploads
app.post('/api/upload', upload.array('images'), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const fileUrls = files.map(file => `/uploads/${file.filename}`);
    res.json({ files: fileUrls });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Route to handle story generation
app.post('/api/generate', upload.array('images'), async (req, res) => {
  try {
    const files = req.files;
    const prompt = req.body.prompt || '';
    const storyId = req.body.storyId;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Generate image descriptions
    const imageDescriptions = await Promise.all(
      files.map(file => generateImageDescription(file.path))
    );

    // Combine image descriptions with prompt
    const fullPrompt = `${prompt}\n\nImages show: ${imageDescriptions.join(', ')}`;

    // Generate story and title
    const [story, title] = await Promise.all([
      generateStory(fullPrompt),
      generateTitle(fullPrompt)
    ]);

    // Create story object
    const newStory = {
      id: storyId || Date.now().toString(),
      title,
      story,
      imageUrls: files.map(file => `/uploads/${file.filename}`),
      isComplete: false,
      createdAt: new Date().toISOString()
    };

    // Save story
    saveStory(newStory);

    res.json(newStory);
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

// Route to continue story
app.post('/api/stories/:id/continue', upload.array('images'), async (req, res) => {
  try {
    const storyId = req.params.id;
    const files = req.files;
    const prompt = req.body.prompt || '';

    // Load existing story
    const storyPath = path.join(__dirname, 'stories', storyId, 'story.json');
    if (!fs.existsSync(storyPath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const existingStory = JSON.parse(fs.readFileSync(storyPath, 'utf8'));

    // Generate image descriptions for new images
    const imageDescriptions = files ? await Promise.all(
      files.map(file => generateImageDescription(file.path))
    ) : [];

    // Combine existing story with new prompt and image descriptions
    const fullPrompt = `${existingStory.story}\n\n${prompt}\n\nNew images show: ${imageDescriptions.join(', ')}`;

    // Generate continuation
    const continuation = await generateStory(fullPrompt);

    // Update story
    const updatedStory = {
      ...existingStory,
      story: `${existingStory.story}\n\n${continuation}`,
      imageUrls: [
        ...existingStory.imageUrls,
        ...(files ? files.map(file => `/uploads/${file.filename}`) : [])
      ]
    };

    // Save updated story
    saveStory(updatedStory);

    res.json(updatedStory);
  } catch (error) {
    console.error('Error continuing story:', error);
    res.status(500).json({ error: 'Failed to continue story' });
  }
});

// Route to end story
app.post('/api/stories/:id/end', async (req, res) => {
  try {
    const storyId = req.params.id;

    // Load existing story
    const storyPath = path.join(__dirname, 'stories', storyId, 'story.json');
    if (!fs.existsSync(storyPath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const existingStory = JSON.parse(fs.readFileSync(storyPath, 'utf8'));

    // Generate ending
    const endingPrompt = `Write a satisfying conclusion to this story: ${existingStory.story}`;
    const ending = await generateStory(endingPrompt);

    // Update story
    const updatedStory = {
      ...existingStory,
      story: `${existingStory.story}\n\n${ending}`,
      isComplete: true
    };

    // Save updated story
    saveStory(updatedStory);

    res.json(updatedStory);
  } catch (error) {
    console.error('Error ending story:', error);
    res.status(500).json({ error: 'Failed to end story' });
  }
});

// Route to get all stories
app.get('/api/stories', (req, res) => {
  try {
    console.log('Returning stories:', stories.length);
    res.json(stories);
  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
});

// Route to delete a story
app.delete('/api/stories/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log('Attempting to delete story:', id);
    const storyDir = path.join(__dirname, 'stories', id);

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

// Route to get available genres
app.get('/api/genres', (req, res) => {
  const genres = [
    { id: 'general', name: 'General' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'scifi', name: 'Science Fiction' },
    { id: 'mystery', name: 'Mystery' },
    { id: 'romance', name: 'Romance' },
    { id: 'horror', name: 'Horror' }
  ];
  res.json(genres);
});

// Route to get available languages
app.get('/api/languages', (req, res) => {
  const languages = [
    { id: 'english', name: 'English' },
    { id: 'spanish', name: 'Spanish' },
    { id: 'french', name: 'French' },
    { id: 'german', name: 'German' },
    { id: 'italian', name: 'Italian' }
  ];
  res.json(languages);
});

// Route to get statistics
app.get('/api/statistics', (req, res) => {
  try {
    const storiesDir = path.join(__dirname, 'stories');
    if (!fs.existsSync(storiesDir)) {
      return res.json({
        genreStats: {},
        languageStats: {},
        totalWords: 0,
        totalStories: 0,
        averageWordsPerStory: 0
      });
    }
    
    const storyFolders = fs.readdirSync(storiesDir);
    const stats = {
      genreStats: {},
      languageStats: {},
      totalWords: 0,
      totalStories: 0
    };
    
    storyFolders.forEach(folder => {
      const metadataPath = path.join(storiesDir, folder, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          if (metadata && metadata.story) {
            // Count genres
            const genre = metadata.genre || 'general';
            stats.genreStats[genre] = (stats.genreStats[genre] || 0) + 1;
            
            // Count languages
            const language = metadata.language || 'english';
            stats.languageStats[language] = (stats.languageStats[language] || 0) + 1;
            
            // Count words
            const words = metadata.story.split(/\s+/).filter(word => word.length > 0);
            stats.totalWords += words.length;
            stats.totalStories++;
          }
        } catch (err) {
          console.error(`Error processing metadata for folder ${folder}:`, err);
        }
      }
    });
    
    res.json({
      ...stats,
      averageWordsPerStory: Math.round(stats.totalWords / stats.totalStories) || 0
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Continue story endpoint
app.post('/api/continue-story', async (req, res) => {
  try {
    const { previousParts } = req.body;
    
    const prompt = `Continue the following story in a creative and engaging way. The story so far:\n\n${previousParts.join('\n\n')}\n\nContinue the story:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const story = response.text();
    
    res.json({ story });
  } catch (error) {
    console.error('Error continuing story:', error);
    res.status(500).json({ error: 'Failed to continue story' });
  }
});

// End story endpoint
app.post('/api/end-story', async (req, res) => {
  try {
    const { previousParts } = req.body;
    
    const prompt = `Write a satisfying conclusion to the following story. The story so far:\n\n${previousParts.join('\n\n')}\n\nWrite a conclusion that wraps up the story:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const conclusion = response.text();
    
    res.json({ conclusion });
  } catch (error) {
    console.error('Error ending story:', error);
    res.status(500).json({ error: 'Failed to end story' });
  }
});

// Save story endpoint
app.post('/api/save-story', async (req, res) => {
  try {
    const { title, story, images } = req.body;
    
    // Create a unique folder for the story
    const storyFolder = path.join(storiesDir, Date.now().toString());
    await fs.mkdir(storyFolder, { recursive: true });
    
    // Save story metadata
    const metadata = {
      title,
      story,
      images,
      createdAt: new Date().toISOString(),
      isComplete: true
    };
    
    await fs.writeFile(
      path.join(storyFolder, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ error: 'Failed to save story' });
  }
});

// Helper function to save story
const saveStory = (story) => {
  const storyDir = path.join(__dirname, 'stories', story.id);
  if (!fs.existsSync(storyDir)) {
    fs.mkdirSync(storyDir, { recursive: true });
  }

  // Save story data
  fs.writeFileSync(
    path.join(storyDir, 'story.json'),
    JSON.stringify(story, null, 2)
  );

  // Update in-memory stories array
  const index = stories.findIndex(s => s.id === story.id);
  if (index === -1) {
    stories.push(story);
  } else {
    stories[index] = story;
  }
};

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  
  // Create required directories if they don't exist
  const dirs = ['uploads', 'stories'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
});