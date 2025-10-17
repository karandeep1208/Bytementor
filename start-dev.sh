#!/bin/bash

# ByteMentor Development Setup Script
echo "🚀 Starting ByteMentor Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found in backend directory."
    echo "📋 Please create a .env file with your API keys:"
    echo "   cp backend/env.example backend/.env"
    echo "   Then edit backend/.env with your GEMINI_API_KEY and YOUTUBE_API_KEY"
    echo ""
    echo "🔑 Get your Gemini API key from: https://makersuite.google.com/app/apikey"
    echo "🔑 Get your YouTube API key from: https://console.cloud.google.com/"
    echo ""
    read -p "Press Enter to continue without API keys (will use sample data) or Ctrl+C to exit..."
fi

echo ""
echo "🔧 Installing dependencies..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🎯 To start ByteMentor:"
echo "   1. Open terminal 1: cd backend && npm start"
echo "   2. Open terminal 2: cd frontend && npm start"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo ""
echo "🎉 ByteMentor is ready for development!"
