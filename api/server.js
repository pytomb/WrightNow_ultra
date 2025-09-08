require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load course data
let courseData = {};
try {
  console.log('Loading course data from Chateau_Elan_Course.txt...');
  const courseText = fs.readFileSync('Chateau_Elan_Course.txt', 'utf8');
  console.log('Course file loaded, length:', courseText.length);

  // Parse the course data (improved parsing)
  const lines = courseText.split('\n');
  let currentCourse = '';
  let parsedHoles = 0;

  lines.forEach((line, index) => {
    // Look for course headers
    if (line.includes('Course: Hole-by-Hole Analysis')) {
      currentCourse = line.split('### **')[1].split('**')[0];
      courseData[currentCourse] = {};
      console.log(`Found course: ${currentCourse}`);
    }
    // Look for hole data lines
    else if (line.startsWith('| **') && line.includes('** |') && currentCourse) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 8) {
        try {
          const hole = parts[1].replace(/\*\*/g, '');
          const par = parseInt(parts[2]);
          const goldYards = parseInt(parts[3]);
          const greenYards = parseInt(parts[4]);
          const whiteYards = parseInt(parts[5]);
          const notes = parts[6];

          if (!isNaN(par) && !isNaN(whiteYards)) {
            courseData[currentCourse][hole] = {
              par: par,
              yards: {
                gold: isNaN(goldYards) ? whiteYards : goldYards,
                green: isNaN(greenYards) ? whiteYards : greenYards,
                white: whiteYards
              },
              notes: notes || 'Standard hole'
            };
            parsedHoles++;
          }
        } catch (parseError) {
          console.warn(`Error parsing line ${index}:`, line, parseError.message);
        }
      }
    }
  });

  console.log(`Course data parsing complete. Found ${Object.keys(courseData).length} courses with ${parsedHoles} holes total.`);
  console.log('Available courses:', Object.keys(courseData));
} catch (error) {
  console.error('Error loading course data:', error);
  // Provide fallback data
  courseData = {
    'Chateau': {
      '6': { par: 3, yards: { white: 136 }, notes: 'Excellent Option. A classic Par 3.' },
      '8': { par: 3, yards: { white: 155 }, notes: 'Excellent Option. A longer Par 3.' },
      '12': { par: 3, yards: { white: 149 }, notes: 'Excellent Option. Another great Par 3.' }
    },
    'Woodlands': {
      '2': { par: 3, yards: { white: 172 }, notes: 'Excellent Option. A Par 3 early in the round.' },
      '6': { par: 3, yards: { white: 171 }, notes: 'Excellent Option. A long Par 3.' },
      '13': { par: 3, yards: { white: 134 }, notes: 'Excellent Option. Another perfectly placed Par 3.' }
    }
  };
  console.log('Using fallback course data');
}

// In-memory storage for user data (for demo purposes)
let userSessions = {};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Static file serving (must come after API routes to avoid conflicts)
app.use(express.static(path.join(__dirname)));

// API endpoint for caddie advice
app.post('/api/caddie-advice', async (req, res) => {
  // Set timeout for the entire request
  const timeout = setTimeout(() => {
    console.error('Caddie advice request timed out');
    if (!res.headersSent) {
      res.status(504).json({
        error: 'Request timed out',
        message: 'The analysis took too long to complete. Please try again.'
      });
    }
  }, 15000); // 15 second timeout (much faster with gpt-4o-mini)

  try {
    console.log('Caddie advice request received:', req.body);
    const { userName, course, hole, distance, club } = req.body;

    // Validate input
    if (!userName || !course || !hole || !distance || !club) {
      clearTimeout(timeout);
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide all required information: name, course, hole, distance, and club.'
      });
    }

    // Get course-specific data
    const holeData = courseData[course]?.[hole];
    console.log('Course data found:', holeData);
    const courseContext = holeData ? `Hole ${hole}: Par ${holeData.par}, ${holeData.yards.white} yards (white tees), Notes: ${holeData.notes}` : 'Standard hole';

    const prompt = `You are an AI golf caddie. Based on the following:
Course: ${course}
${courseContext}
Player: ${userName}
Shot: ${distance} yards with ${club}
Provide personalized club recommendation and key tips. Keep it concise and professional.`;

    console.log('Sending prompt to OpenAI:', prompt.substring(0, 100) + '...');

    // Add timeout wrapper to OpenAI call
    const completionPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini', // Much faster than gpt-4
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150 // Reduced for faster response
    });

    const completion = await completionPromise;
    const advice = completion.choices[0].message.content;
    console.log('OpenAI response received:', advice.substring(0, 100) + '...');

    // Generate HeyGen avatar video with timeout
    console.log('Starting HeyGen avatar generation...');
    const avatarPromise = generateHeyGenAvatar(advice);
    const avatarTimeout = setTimeout(() => {
      console.log('HeyGen avatar generation timed out, skipping...');
    }, 8000); // 8 second timeout for HeyGen

    let avatarResponse;
    try {
      avatarResponse = await Promise.race([
        avatarPromise,
        new Promise(resolve => setTimeout(() => resolve({ video_url: null }), 8000))
      ]);
    } catch (heygenError) {
      console.error('HeyGen error (continuing without avatar):', heygenError.message);
      avatarResponse = { video_url: null };
    }
    clearTimeout(avatarTimeout);

    const response = {
      advice,
      recommendation: advice.split('.')[0], // Extract first sentence as recommendation
      keyThought: advice.split('.')[1] || 'Focus on your setup.',
      avatarVideoUrl: avatarResponse?.video_url || null
    };

    clearTimeout(timeout);
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    clearTimeout(timeout);
    console.error('Error in caddie advice:', error);
    res.status(500).json({
      error: 'Failed to get caddie advice',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API endpoint for swing analysis
app.post('/api/swing-analysis', async (req, res) => {
  // Set timeout for the entire request
  const timeout = setTimeout(() => {
    console.error('Swing analysis request timed out');
    if (!res.headersSent) {
      res.status(504).json({
        error: 'Request timed out',
        message: 'The swing analysis took too long to complete. Please try again.'
      });
    }
  }, 15000); // 15 second timeout (much faster with gpt-4o-mini)

  try {
    console.log('Swing analysis request received:', req.body);
    const { userName, course, hole } = req.body;

    // Validate input
    if (!userName || !course || !hole) {
      clearTimeout(timeout);
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide your name, course, and hole number.'
      });
    }

    // In a real implementation, you'd process the video here
    // For now, simulate analysis with OpenAI
    const prompt = `You are an AI golf swing coach. Analyze a practice swing for ${userName} on ${course} Hole ${hole}.
Provide feedback on tempo, posture, and common issues. Keep it encouraging and actionable.`;

    console.log('Sending swing analysis prompt to OpenAI:', prompt.substring(0, 100) + '...');

    // Add timeout wrapper to OpenAI call
    const completionPromise = openai.chat.completions.create({
      model: 'gpt-4o-mini', // Much faster than gpt-4
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150 // Reduced for faster response
    });

    const completion = await completionPromise;
    const feedback = completion.choices[0].message.content;
    console.log('Swing analysis response received:', feedback.substring(0, 100) + '...');

    // Generate HeyGen avatar video with timeout
    console.log('Starting HeyGen avatar generation for swing feedback...');
    const avatarPromise = generateHeyGenAvatar(feedback);
    const avatarTimeout = setTimeout(() => {
      console.log('HeyGen avatar generation timed out, skipping...');
    }, 8000); // 8 second timeout for HeyGen

    let avatarResponse;
    try {
      avatarResponse = await Promise.race([
        avatarPromise,
        new Promise(resolve => setTimeout(() => resolve({ video_url: null }), 8000))
      ]);
    } catch (heygenError) {
      console.error('HeyGen error (continuing without avatar):', heygenError.message);
      avatarResponse = { video_url: null };
    }
    clearTimeout(avatarTimeout);

    const response = {
      feedback,
      avatarVideoUrl: avatarResponse?.video_url || null
    };

    clearTimeout(timeout);
    console.log('Sending swing analysis response:', response);
    res.json(response);
  } catch (error) {
    clearTimeout(timeout);
    console.error('Error in swing analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze swing',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// HeyGen avatar generation
async function generateHeyGenAvatar(text) {
  try {
    console.log('Generating HeyGen avatar for text length:', text.length);

    if (!process.env.HEYGEN_API_KEY || !process.env.HEYGEN_AVATAR_ID) {
      console.log('HeyGen API key or avatar ID not configured, skipping avatar generation');
      return { video_url: null, status: 'not_configured' };
    }

    // For demo purposes, return null to use text-to-speech or static avatar
    // HeyGen v2 API requires webhook callbacks for video retrieval
    // which is complex for this demo environment
    console.log('HeyGen integration is available but disabled for demo simplicity');
    return { 
      video_url: null, 
      status: 'disabled_for_demo',
      message: 'Avatar video generation disabled - using text response instead'
    };

    // Full HeyGen implementation would look like:
    /*
    const heygenUrl = 'https://api.heygen.com/v2/video/generate';
    
    const requestBody = {
      test: false, // Set to true for testing without consuming credits
      caption: false,
      title: 'Golf Advice',
      input_text: text,
      avatar_id: process.env.HEYGEN_AVATAR_ID,
      voice_id: '1bd001e7e50f421d891986aad5158bc8',
      background: {
        type: 'color',
        value: '#ffffff'
      }
    };

    const response = await axios.post(heygenUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.HEYGEN_API_KEY
      },
      timeout: 10000
    });

    if (response.data && response.data.data) {
      const videoId = response.data.data.video_id;
      // Would need to poll for video status or use webhook
      // Video generation takes 1-3 minutes typically
      return {
        video_id: videoId,
        status: 'processing',
        message: 'Video is being generated, check back in 1-2 minutes'
      };
    }
    */

  } catch (error) {
    console.error('Error in HeyGen avatar function:', error.message);
    return {
      video_url: null,
      status: 'error',
      error: error.message
    };
  }
}

// API endpoint to get course data for a specific hole
app.post('/api/course-data', (req, res) => {
  try {
    const { course, hole, tee } = req.body;

    if (!course || !hole) {
      return res.status(400).json({
        error: 'Missing course or hole parameter'
      });
    }

    // Find the course data (handle both parsed and fallback data)
    let courseDataToUse = courseData[course];

    // If not found with full name, try partial match
    if (!courseDataToUse) {
      const courseKey = Object.keys(courseData).find(key =>
        key.toLowerCase().includes(course.toLowerCase()) ||
        course.toLowerCase().includes(key.toLowerCase())
      );
      courseDataToUse = courseData[courseKey];
    }

    if (!courseDataToUse) {
      return res.status(404).json({
        error: 'Course not found',
        availableCourses: Object.keys(courseData)
      });
    }

    const holeData = courseDataToUse[hole.toString()];

    if (!holeData) {
      return res.status(404).json({
        error: 'Hole not found',
        availableHoles: Object.keys(courseDataToUse)
      });
    }

    // Validate tee selection and default to white if not provided
    const validTees = ['gold', 'green', 'white'];
    const selectedTee = tee && validTees.includes(tee.toLowerCase()) ? tee.toLowerCase() : 'white';
    
    // Get distance for selected tee
    const distance = holeData.yards[selectedTee] || holeData.yards.white;
    
    // Return the distance from selected tee
    res.json({
      course: course,
      hole: hole,
      par: holeData.par,
      distance: distance,
      teeColor: selectedTee,
      notes: holeData.notes,
      allDistances: holeData.yards
    });

  } catch (error) {
    console.error('Error fetching course data:', error);
    res.status(500).json({
      error: 'Failed to fetch course data',
      details: error.message
    });
  }
});

// API endpoint to save user data
app.post('/api/save-user', (req, res) => {
  const { userName, phone, email, course, hole } = req.body;
  const sessionId = Date.now().toString();
  userSessions[sessionId] = { userName, phone, email, course, hole, timestamp: new Date() };
  res.json({ sessionId, message: 'User data saved' });
});

// Test endpoint for API testing
app.get('/api/test', (req, res) => {
  res.json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    courseDataLoaded: Object.keys(courseData).length > 0,
    availableCourses: Object.keys(courseData),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    heygenConfigured: !!process.env.HEYGEN_API_KEY
  });
});

// Test endpoint for caddie advice
app.post('/api/test-caddie', async (req, res) => {
  try {
    const testData = {
      userName: 'Test Player',
      course: 'Chateau',
      hole: '6',
      distance: '145',
      club: '8-iron'
    };

    console.log('Testing caddie advice with:', testData);

    const response = await fetch('http://localhost:' + PORT + '/api/caddie-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Test caddie error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for swing analysis
app.post('/api/test-swing', async (req, res) => {
  try {
    const testData = {
      userName: 'Test Player',
      course: 'Chateau',
      hole: '6'
    };

    console.log('Testing swing analysis with:', testData);

    const response = await fetch('http://localhost:' + PORT + '/api/swing-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Test swing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Cloud Text-to-Speech API endpoint
app.post('/api/text-to-speech', async (req, res) => {
  const timeout = setTimeout(() => {
    console.error('Google TTS request timed out');
    if (!res.headersSent) {
      res.status(504).json({
        error: 'Request timed out',
        fallback: true,
        message: 'Google TTS took too long, use browser fallback'
      });
    }
  }, 10000); // 10 second timeout

  try {
    console.log('Google TTS request received:', req.body);
    const { text, voice, speed, pitch } = req.body;

    // Validate input
    if (!text || typeof text !== 'string' || text.length === 0) {
      clearTimeout(timeout);
      return res.status(400).json({
        error: 'Invalid text input',
        fallback: true,
        message: 'Text is required for speech synthesis'
      });
    }

    // Check if Google API key is configured
    if (!process.env.Google_Text_2_Audio) {
      console.log('Google TTS API key not configured, using fallback');
      clearTimeout(timeout);
      return res.json({
        fallback: true,
        message: 'Google TTS not configured, use browser fallback'
      });
    }

    // Configure voice settings (prioritize Neural2 female voices)
    const voiceConfig = {
      languageCode: 'en-US',
      name: voice || 'en-US-Neural2-F', // Default to high-quality female voice
      ssmlGender: 'FEMALE'
    };

    // Configure audio settings
    const audioConfig = {
      audioEncoding: 'MP3',
      speakingRate: speed || 1.0,
      pitch: pitch || 0.0,
      volumeGainDb: 0.0,
      sampleRateHertz: 22050
    };

    // Prepare request to Google TTS API
    const googleTTSRequest = {
      input: { text: text },
      voice: voiceConfig,
      audioConfig: audioConfig
    };

    console.log('Sending request to Google TTS API with voice:', voiceConfig.name);

    // Make request to Google Cloud TTS API
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.Google_Text_2_Audio}`,
      googleTTSRequest,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    if (response.data && response.data.audioContent) {
      console.log('Google TTS synthesis successful');
      
      clearTimeout(timeout);
      res.json({
        success: true,
        audioContent: response.data.audioContent, // Base64 encoded audio
        voice: voiceConfig.name,
        format: 'mp3',
        message: 'Google TTS synthesis complete'
      });
    } else {
      console.log('Google TTS returned no audio content');
      clearTimeout(timeout);
      res.json({
        fallback: true,
        message: 'Google TTS returned no audio, use browser fallback'
      });
    }

  } catch (error) {
    clearTimeout(timeout);
    console.error('Google TTS error:', error.message);

    // Handle different error types
    if (error.response) {
      console.error('Google TTS API error:', error.response.status, error.response.data);
    }

    // Return fallback indication instead of error
    res.json({
      fallback: true,
      message: 'Google TTS unavailable, use browser fallback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Golf Coach server running on port ${PORT}`);
});