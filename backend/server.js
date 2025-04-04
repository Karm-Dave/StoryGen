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
app.post('/api/generate-story', upload.array('images'), async (req, res) => {
  try {
    const files = req.files;
    const prompt = req.body.prompt || '';
    const shouldGenerate = req.body.shouldGenerate === 'true';
    const genre = req.body.genre || 'general';
    const language = req.body.language || 'english';
    const branching = req.body.branching === 'true';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Create a unique story ID and directory
    const storyId = Date.now().toString();
    const storyDir = path.join(__dirname, 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });

    // Copy images to story directory and get descriptions
    const imagePromises = files.map(async (file) => {
      const newPath = path.join(storyDir, file.filename);
      fs.copyFileSync(file.path, newPath);
      const description = await generateImageDescription(file.path);
      return {
        url: `/stories/${storyId}/${file.filename}`,
        description
      };
    });

    const imageResults = await Promise.all(imagePromises);
    const imageDescriptions = imageResults.map(img => img.description).join('\n');
    const imageUrls = imageResults.map(img => img.url);

    // Generate the story
    const storyPrompt = `Based on these images:\n${imageDescriptions}\n${prompt}`;
    const storyContent = await generateStory(storyPrompt, genre, language, branching);
    const title = await generateTitle(storyPrompt);

    // Save story data
    const storyData = {
      id: storyId,
      title,
      story: storyContent,
      imageUrls,
      imageDescriptions,
      genre,
      language,
      branching,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(storyDir, 'story.json'),
      JSON.stringify(storyData, null, 2)
    );

    res.json(storyData);
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

// Route to handle story continuation
app.post('/api/continue-story', async (req, res) => {
  try {
    const { storyId, prompt } = req.body;
    
    if (!storyId) {
      return res.status(400).json({ error: 'Story ID is required' });
    }

    // Read the existing story
    const storyPath = path.join(__dirname, 'stories', storyId, 'story.json');
    if (!fs.existsSync(storyPath)) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const storyData = JSON.parse(fs.readFileSync(storyPath));
    const continuationPrompt = `Continue this story:\n\n${storyData.story}\n\nContinuation prompt: ${prompt || 'Continue the story'}`;
    
    const continuation = await generateStory(continuationPrompt, storyData.genre, storyData.language, storyData.branching);
    
    // Update the story data
    storyData.story += '\n\n' + continuation;
    storyData.timestamp = new Date().toISOString();
    
    // Save the updated story
    fs.writeFileSync(storyPath, JSON.stringify(storyData, null, 2));
    
    res.json({
      continuation,
      fullStory: storyData
    });
  } catch (error) {
    console.error('Error continuing story:', error);
    res.status(500).json({ error: 'Failed to continue story' });
  }
});

// Route to get all stories
app.get('/api/stories', (req, res) => {
  try {
    // Reload stories from disk to ensure we have the latest
    stories = loadStories();
    console.log('Returning stories:', stories.length); // Debug log
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
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

// Route to end story with a conclusion
app.post('/api/end-story', async (req, res) => {
  try {
    const { storyId, currentStory } = req.body;
    
    const conclusionPrompt = `Please provide a satisfying conclusion to this story in 2-3 sentences: ${currentStory}`;
    
    const result = await model.generateContent(conclusionPrompt);
    const conclusion = result.response.text();
    
    // Update the story file with the conclusion
    const storyDir = path.join(__dirname, 'stories', storyId);
    const metadataPath = path.join(storyDir, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      metadata.story = currentStory + '\n\n' + conclusion;
      metadata.isCompleted = true;
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      res.json({
        success: true,
        conclusion,
        story: metadata
      });
    } else {
      res.status(404).json({ error: 'Story not found' });
    }
  } catch (error) {
    console.error('Error ending story:', error);
    res.status(500).json({ error: 'Failed to end story' });
  }
});

// Route to delete a story
app.delete('/api/stories/:storyId', (req, res) => {
  try {
    const { storyId } = req.params;
    const storyDir = path.join(__dirname, 'stories', storyId);
    
    if (fs.existsSync(storyDir)) {
      fs.rmSync(storyDir, { recursive: true, force: true });
      res.json({ success: true, message: 'Story deleted successfully' });
    } else {
      res.status(404).json({ error: 'Story not found' });
    }
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

// Route to delete all stories
app.delete('/api/stories', (req, res) => {
  try {
    const storiesDir = path.join(__dirname, 'stories');
    if (fs.existsSync(storiesDir)) {
      fs.rmSync(storiesDir, { recursive: true, force: true });
      fs.mkdirSync(storiesDir);
      res.json({ success: true, message: 'All stories deleted successfully' });
    } else {
      fs.mkdirSync(storiesDir);
      res.json({ success: true, message: 'Stories directory was empty' });
    }
  } catch (error) {
    console.error('Error deleting all stories:', error);
    res.status(500).json({ error: 'Failed to delete all stories' });
  }
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

// Load stories from disk on startup
const loadStories = () => {
  try {
    const storiesPath = path.join(__dirname, 'stories');
    if (!fs.existsSync(storiesPath)) {
      fs.mkdirSync(storiesPath, { recursive: true });
    }
    
    const storyFolders = fs.readdirSync(storiesPath)
      .filter(folder => fs.statSync(path.join(storiesPath, folder)).isDirectory());
    
    console.log('Found story folders:', storyFolders); // Debug log
    
    return storyFolders.map(folder => {
      try {
        const storyPath = path.join(storiesPath, folder, 'story.json');
        if (fs.existsSync(storyPath)) {
          const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf8'));
          return {
            ...storyData,
            id: folder
          };
        }
        return null;
      } catch (error) {
        console.error(`Error loading story folder ${folder}:`, error);
        return null;
      }
    }).filter(story => story !== null);
  } catch (error) {
    console.error('Error loading stories:', error);
    return [];
  }
};

// Initialize stories array with existing stories
let stories = loadStories();
console.log('Loaded stories:', stories.length); // Debug log

// Save story to disk
const saveStory = (story) => {
  try {
    const storiesPath = path.join(__dirname, 'stories');
    if (!fs.existsSync(storiesPath)) {
      fs.mkdirSync(storiesPath, { recursive: true });
    }
    
    const storyDir = path.join(storiesPath, story.id);
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }
    
    const storyPath = path.join(storyDir, 'story.json');
    fs.writeFileSync(storyPath, JSON.stringify(story, null, 2));
    console.log('Saved story:', story.id); // Debug log
    return true;
  } catch (error) {
    console.error('Error saving story:', error);
    return false;
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