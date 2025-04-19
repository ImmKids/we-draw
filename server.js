import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add route for the canvas page
app.get('/canvas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'canvas.html'));
});

// Root route serves canvas directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'canvas.html'));
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store canvas for each room
const rooms = {};

// Canvas dimensions
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

// Create a new canvas for a room
function createRoomCanvas(roomName) {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Fill with background color
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  return {
    canvas,
    ctx,
    users: new Set(),
    syncTimeout: null
  };
}

// Draw a line on the canvas
function drawLine(ctx, x1, y1, x2, y2, color, brushSize) {
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize || 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Clear the canvas
function clearCanvas(ctx) {
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Get canvas as data URL
function getCanvasDataURL(canvas) {
  return canvas.toDataURL('image/png');
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join a drawing room
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`${socket.id} joined room: ${roomName}`);
    
    // Initialize room if it doesn't exist
    if (!rooms[roomName]) {
      rooms[roomName] = createRoomCanvas(roomName);
    }
    
    // Add user to room
    rooms[roomName].users.add(socket.id);
    
    // Send current canvas state to new user
    const canvasDataURL = getCanvasDataURL(rooms[roomName].canvas);
    socket.emit('canvasState', canvasDataURL);
  });
  
  // Handle drawing actions
  socket.on('drawAction', (data) => {
    const roomName = Array.from(socket.rooms)[1]; // First room is socket.id, second is the actual room
    if (!roomName || !rooms[roomName]) return;
    
    const room = rooms[roomName];
    
    if (data.type === "draw") {
      // Draw on the server canvas
      drawLine(
        room.ctx, 
        data.x1, 
        data.y1, 
        data.x2, 
        data.y2, 
        data.color,
        data.brushSize
      );
      
      // Broadcast draw action to other clients
      socket.to(roomName).emit('drawAction', data);
      
    } else if (data.type === "clear") {
      // Clear the server canvas
      clearCanvas(room.ctx);
      
      // Broadcast clear action
      socket.to(roomName).emit('drawAction', data);
    }
    
    // After any drawing action, periodically send the full canvas state
    if (room.syncTimeout) {
      clearTimeout(room.syncTimeout);
    }
    
    room.syncTimeout = setTimeout(() => {
      const canvasDataURL = getCanvasDataURL(room.canvas);
      io.to(roomName).emit('canvasState', canvasDataURL);
      room.syncTimeout = null;
    }, 1000); // Sync every 1 second after drawing activities
  });
  
  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Remove user from all rooms they were in
    for (const roomName in rooms) {
      if (rooms[roomName].users.has(socket.id)) {
        rooms[roomName].users.delete(socket.id);
        
        // Clean up empty rooms
        if (rooms[roomName].users.size === 0) {
          if (rooms[roomName].syncTimeout) {
            clearTimeout(rooms[roomName].syncTimeout);
          }
          delete rooms[roomName];
          console.log(`Room deleted: ${roomName}`);
        }
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}/canvas in your browser`);
}); 