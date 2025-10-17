#!/bin/bash

echo "🚀 Starting ByteMentor Servers..."

# Function to start backend
start_backend() {
    echo "📡 Starting Backend Server..."
    cd backend
    node index.js &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "💻 Starting Frontend Server..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
    cd ..
}

# Start both servers
start_backend
sleep 3
start_frontend

echo ""
echo "✅ Both servers are starting..."
echo "📡 Backend: http://localhost:5000"
echo "💻 Frontend: http://localhost:3000"
echo ""
echo "🎯 Open http://localhost:3000 in your browser to use ByteMentor!"
echo ""
echo "To stop the servers, press Ctrl+C or run:"
echo "pkill -f 'node index.js' && pkill -f 'npm start'"

# Wait for user input to stop
read -p "Press Enter to stop all servers..."
echo "🛑 Stopping servers..."
pkill -f 'node index.js'
pkill -f 'npm start'
echo "✅ Servers stopped"
