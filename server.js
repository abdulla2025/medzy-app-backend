import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';
import supportRoutes from './routes/support.js';
import medicineRoutes from './routes/medicines.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import medicineRequestRoutes from './routes/medicineRequests.js';
import dailyUpdateRoutes from './routes/dailyUpdates.js';
import donationRoutes from './routes/donations.js';
import reviewRoutes from './routes/reviews.js';
import serviceReviewRoutes from './routes/serviceReviews.js';
import paymentRoutes from './routes/payments.js';
import disputeRoutes from './routes/disputes.js';
import smartDoctorRoutes from './routes/smartDoctor.js';
import medicineReminderRoutes from './routes/medicineReminders.js';
import medicalProfileRoutes from './routes/medicalProfile.js';
import customerPointRoutes from './routes/customerPoints.js';
import revenueAdjustmentRoutes from './routes/revenueAdjustments.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Detect if running in Vercel
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://medzy-app-frontend.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
connectDB();

// Initialize services only in local environment (skip in Vercel)
if (!isVercel) {
  try {
    // Initialize email service
    await import('./services/emailService.js');
    
    // Initialize notification service (includes cron jobs)
    await import('./services/notificationService.js');
  } catch (error) {
    console.log('Service initialization skipped in serverless environment');
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/medicine-requests', medicineRequestRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service-reviews', serviceReviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/smart-doctor', smartDoctorRoutes);
app.use('/api/medicine-reminders', medicineReminderRoutes);
app.use('/api/medical-profile', medicalProfileRoutes);
app.use('/api/customer-points', customerPointRoutes);
app.use('/api/revenue-adjustments', revenueAdjustmentRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Medzy Healthcare & Medicine Tracker API', 
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Medzy Backend Server is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path
  });
});

// Enhanced server startup with port conflict handling
const startServer = async () => {
  try {
    // Only start server in local environment, Vercel handles this
    if (!isVercel) {
      const server = app.listen(PORT, () => {
        console.log(`[0] Server running on port ${PORT}`);
      });

      // Handle port already in use error
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`❌ Port ${PORT} is already in use. Please:`);
          console.log(`1. Stop any other server running on port ${PORT}`);
          console.log(`2. Use a different port by setting PORT environment variable`);
          process.exit(1);
        } else {
          console.error('Server error:', error);
          process.exit(1);
        }
      });

      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\\n👋 Received SIGINT. Shutting down gracefully...');
        server.close(() => {
          console.log('Process terminated');
          process.exit(0);
        });
      });

      process.on('SIGTERM', () => {
        console.log('\\n👋 Received SIGTERM. Shutting down gracefully...');
        server.close(() => {
          console.log('Process terminated');
          process.exit(0);
        });
      });
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server only in local environment
if (!isVercel) {
  startServer();
}

// Export app for Vercel
export default app;