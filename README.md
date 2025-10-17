# ByteMentor - AI-Powered Mini-Course Generator

ByteMentor is an intelligent learning platform that generates personalized mini-courses from a single keyword or topic. It combines curated YouTube videos, AI-generated quizzes, and study summaries to create a comprehensive learning experience.

## 🚀 Features

- **ChatGPT-like Interface**: Clean, conversational user experience
- **AI-Generated Quizzes**: 3-5 interactive questions per topic
- **Curated Video Content**: Relevant YouTube tutorials and lessons
- **Study Summaries**: Key points, tips, and learning guidance
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Generation**: Fast, AI-powered content creation

## 🛠️ Tech Stack

### Frontend
- **React 19.2.0** - Modern UI framework
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client for API calls
- **CSS3** - Modern styling with gradients and animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Google Gemini API** - AI-powered quiz and summary generation
- **YouTube Data API** - Video content aggregation
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before running ByteMentor, make sure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **YouTube Data API Key** - Get from [Google Cloud Console](https://console.cloud.google.com/)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd GENAI-BOOTCAMP
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:
```bash
cp env.example .env
```

Edit the `.env` file with your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=5000
NODE_ENV=development
```

### 4. Start the Backend Server
```bash
npm start
```
The backend will run on `http://localhost:3001`

### 5. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

### 6. Start the Frontend Development Server
```bash
npm start
```
The frontend will run on `http://localhost:3000`

## 🎯 How to Use

1. **Open ByteMentor** in your browser at `http://localhost:3000`
2. **Enter a topic** in the chat input (e.g., "Machine Learning", "React Hooks", "Python Basics")
3. **Press Enter** or click the send button
4. **Explore your mini-course** with:
   - 📺 Curated YouTube videos
   - 🧠 Interactive quizzes
   - 📝 Study summaries and tips

## 🔧 API Endpoints

### POST `/api/generate-course`
Generates a complete mini-course from a keyword.

**Request:**
```json
{
  "keyword": "Machine Learning"
}
```

**Response:**
```json
{
  "keyword": "Machine Learning",
  "videos": [
    {
      "title": "Machine Learning Tutorial",
      "url": "https://www.youtube.com/watch?v=...",
      "thumbnail": "https://img.youtube.com/...",
      "channel": "Tech Channel"
    }
  ],
  "quiz": {
    "questions": [
      {
        "question": "What is machine learning?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "..."
      }
    ]
  },
  "summary": {
    "overview": "Machine learning overview...",
    "keyPoints": ["Point 1", "Point 2"],
    "tips": ["Tip 1", "Tip 2"]
  }
}
```

### GET `/health`
Health check endpoint.

## 🎨 Project Structure

```
GENAI-BOOTCAMP/
├── backend/
│   ├── index.js          # Express server
│   ├── package.json      # Backend dependencies
│   └── env.example       # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Styling
│   │   └── index.js      # React entry point
│   └── package.json      # Frontend dependencies
└── README.md
```

## DEPLOYMENT LINKS
1. Backend deployment link - https://bytementor.onrender.com
2. Frontend deployment link - https://bytementor.netlify.app/

## 🔑 API Keys Setup

### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file

### YouTube Data API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Restrict the key to YouTube Data API
6. Add it to your `.env` file

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure the backend is running on port 5000
   - Check that CORS is properly configured

2. **API Key Issues**
   - Verify your API keys are correct in the `.env` file
   - Check API key permissions and quotas

3. **Port Conflicts**
   - Backend runs on port 5000 by default
   - Frontend runs on port 3000 by default
   - Change ports in package.json if needed

4. **Dependencies Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

## 🔮 Future Enhancements

- [ ] User authentication and course history
- [ ] PDF export functionality
- [ ] Bookmarking and favorites
- [ ] Progress tracking
- [ ] Multiple language support
- [ ] Advanced quiz types (multiple choice, true/false, etc.)
- [ ] Integration with more learning platforms
- [ ] Offline mode support

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Happy Learning with ByteMentor! 🎓**