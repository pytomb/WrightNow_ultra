# AI Golf Coach App

A sophisticated AI-powered golf coaching application that provides personalized advice, swing analysis, and course-specific recommendations.

## Features

- **Personalized AI Coaching**: Uses OpenAI GPT-4o-mini for fast, intelligent golf advice
- **Multi-Modal Interaction**: Voice input, camera access, text chat, and visual feedback
- **Course Integration**: Personalized recommendations based on Chateau Elan course data with auto-populated distances
- **Smart Distance Auto-Population**: Automatically fills distance field based on selected course and hole
- **HeyGen Avatar**: AI avatar for voice/video coaching delivery
- **User Data Collection**: Secure collection of name, phone, and email with privacy consent
- **Mobile-First Design**: Optimized for mobile devices with high-end UI

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm
- Valid OpenAI API key
- Valid HeyGen API credentials

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd c:/Users/dnice/DJ Programs/WrightNow_ultra
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Ensure your `.env` file contains the required API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   HEYGEN_API_KEY=your_heygen_api_key_here
   HEYGEN_AVATAR_ID=your_avatar_id_here
   PORT=3001
   NODE_ENV=development
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Access the application**:
   - Open your browser and navigate to: `http://localhost:3001`
   - **Important**: Do NOT open the `index.html` file directly (file:// protocol) as this will cause CORS errors

## Testing & Debugging

### API Test Page
Access the dedicated test page at: `http://localhost:3001/test.html`

This page allows you to:
- Check API status and configuration
- Test caddie advice with custom parameters
- Test swing analysis functionality
- Use direct API test endpoints
- View detailed request/response data

### Manual API Testing
You can also test APIs directly using curl or any HTTP client:

```bash
# Check API status
curl http://localhost:3001/api/test

# Test caddie advice
curl -X POST http://localhost:3001/api/caddie-advice \
  -H "Content-Type: application/json" \
  -d '{"userName":"Test","course":"Chateau","hole":"6","distance":"145","club":"8-iron"}'

# Test swing analysis
curl -X POST http://localhost:3001/api/swing-analysis \
  -H "Content-Type: application/json" \
  -d '{"userName":"Test","course":"Chateau","hole":"6"}'
```

### Debug Logging
The server now includes comprehensive logging. Check the terminal where the server is running for:
- Course data parsing status
- API request details
- OpenAI response information
- Error messages with stack traces

## Troubleshooting

### Common Issues

1. **CORS Error: "Failed to fetch"**
   - **Cause**: Opening `index.html` directly in browser (file:// protocol)
   - **Solution**: Access via `http://localhost:3001` after starting the server

2. **Analysis Gets Stuck/Hangs**
   - **Cause**: OpenAI API timeout, invalid API key, or network issues
   - **Solution**:
     - Check server logs for detailed error messages
     - Use the test page (`/test.html`) to isolate the issue
     - Verify OpenAI API key is valid and has credits
     - Check network connectivity
     - Look for "OpenAI response received" in server logs
     - **New**: Requests now timeout after 15 seconds with user-friendly error messages
     - **New**: Using GPT-4o-mini for much faster responses (typically 2-5 seconds)
     - **New**: Individual API calls have their own timeouts (8s for OpenAI, 8s for HeyGen)

3. **Speech Recognition Errors**
   - **Cause**: Multiple voice input attempts without proper cleanup
   - **Solution**: Fixed in the latest version with proper state management

4. **Course Data Not Loading**
   - **Cause**: Parsing errors in course data file
   - **Solution**: Server logs will show parsing status; fallback data is provided if parsing fails

5. **Tailwind CSS Warning**
   - **Cause**: Using CDN in production
   - **Solution**: For production, install Tailwind CSS properly:
   ```bash
   npm install -D tailwindcss
   npx tailwindcss init
   ```

6. **Port Already in Use**
   - **Cause**: Another process using port 3001
   - **Solution**: Kill the process or change PORT in .env

### Browser Compatibility

- **Recommended**: Chrome/Edge (full Web Speech API support)
- **Camera Access**: Requires HTTPS in production or localhost
- **Voice Input**: Requires microphone permissions

## Architecture

### Frontend
- HTML/CSS/JavaScript with Tailwind CSS
- Mobile-responsive design
- WebRTC for camera access
- Web Speech API for voice input

### Backend
- Node.js with Express
- RESTful API endpoints
- OpenAI GPT-4 integration
- HeyGen avatar integration (placeholder)

### Data Flow
1. User provides name, phone, email
2. Selects course and hole
3. Chooses shot planning or swing analysis
4. AI processes request with course data
5. Receives personalized advice via avatar

## API Endpoints

- `GET /` - Serve main application
- `GET /test.html` - API testing interface
- `GET /api/test` - Check API status and configuration
- `POST /api/course-data` - Get distance/par data for specific hole
- `POST /api/caddie-advice` - Get shot recommendations
- `POST /api/swing-analysis` - Analyze swing
- `POST /api/test-caddie` - Test caddie advice with default data
- `POST /api/test-swing` - Test swing analysis with default data
- `POST /api/save-user` - Save user data

## File Structure

```
c:/Users/dnice/DJ Programs/WrightNow_ultra/
├── index.html              # Main application
├── test.html               # API testing interface
├── server.js               # Backend server
├── package.json            # Dependencies
├── .env                    # Environment variables
├── Chateau_Elan_Course.txt # Course data
├── Wright-Now-Solutions-Web-Logo-min.png # Company logo
└── README.md              # This file
```

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Production Deployment

1. Install Tailwind CSS properly
2. Set `NODE_ENV=production`
3. Use HTTPS for camera/microphone access
4. Configure proper HeyGen API integration
5. Add user data encryption and GDPR compliance

## License

This project is proprietary to Wright Now Solutions.

## Support

For issues or questions, please contact the development team.