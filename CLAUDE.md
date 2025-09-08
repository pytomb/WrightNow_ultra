# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Golf Coach application that provides personalized golf coaching advice using OpenAI GPT-4o-mini and HeyGen avatar integration. The application features voice input, camera access, and course-specific recommendations for Chateau Elan golf courses.

## Core Architecture

### Tech Stack
- **Frontend**: Vanilla HTML/JavaScript with Tailwind CSS (CDN)
- **Backend**: Node.js/Express server
- **AI Integration**: OpenAI GPT-4o-mini API for coaching advice
- **Avatar**: HeyGen API integration (placeholder implementation)
- **Data Storage**: In-memory storage (demo purposes)

### Key Components
- **index.html**: Multi-screen mobile-first UI with camera/voice input capabilities
- **server.js**: Express API server handling OpenAI integration and course data parsing
- **test.html**: API testing interface for debugging and development
- **Chateau_Elan_Course.txt**: Course data file with hole-by-hole information

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with auto-restart
npm run dev

# Start production server
npm start

# Server runs on http://localhost:3001 (or PORT from .env)
```

## API Endpoints

- `POST /api/caddie-advice` - Generate personalized shot recommendations
- `POST /api/swing-analysis` - Analyze swing and provide feedback
- `POST /api/course-data` - Get distance/par data for specific hole
- `POST /api/save-user` - Store user information
- `GET /api/test` - Check API status and configuration
- `POST /api/test-caddie` - Test caddie advice with default data
- `POST /api/test-swing` - Test swing analysis with default data

## Environment Configuration

Required `.env` variables:
```
OPENAI_API_KEY=<your_openai_api_key>
HEYGEN_API_KEY=<your_heygen_api_key>
HEYGEN_AVATAR_ID=<your_avatar_id>
PORT=3001
NODE_ENV=development
```

## Course Data Structure

The application parses `Chateau_Elan_Course.txt` to extract:
- Course names (Chateau, Woodlands)
- Hole numbers with par values
- Yardages for different tees (gold, green, white)
- Hole-specific notes

Fallback data is provided if parsing fails.

## Key Implementation Details

### API Response Timeouts
- Individual API calls have 8-second timeouts
- Overall request timeout is 15 seconds
- User-friendly error messages on timeout

### Mobile UI Screens
1. Welcome screen - User data collection
2. Game Setup screen - Course/hole selection
3. Analysis screen - Shot planning or swing analysis options
4. Results screen - AI-generated advice display

### Voice/Camera Integration
- **Voice Output**: Text-to-speech with professional voices, automatic speech delivery
- **Voice Input**: Speech recognition for distance input (enhanced version) 
- Web Speech API for both input and output
- WebRTC for camera access
- Requires HTTPS in production or localhost

## Testing & Debugging

Access test interface at `http://localhost:3001/test.html` to:
- Check API configuration status
- Test individual API endpoints
- View detailed request/response data
- Debug OpenAI and HeyGen integrations

## Important Notes

- **NEVER** open index.html directly (file:// protocol) - causes CORS errors
- Always access via `http://localhost:3001` after starting server
- GPT-4o-mini provides fast responses (2-5 seconds typical)
- Course data auto-populates distance field based on selected hole