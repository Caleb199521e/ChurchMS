#!/bin/bash
# Church CMS Development Script - Start both backend and frontend

echo ""
echo "========================================"
echo "   Church CMS - Development Environment"
echo "========================================"
echo ""

# Start backend in background
echo "Starting Backend Server (Port 3000)..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend in background
echo "Starting Frontend Server (Port 5173)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "   Both servers are starting..."
echo "========================================"
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
