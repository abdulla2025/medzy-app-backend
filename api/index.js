// Minimal Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(cors({
  origin: ['https://medzy-app-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Medzy Healthcare API', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Medzy Backend Server is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
