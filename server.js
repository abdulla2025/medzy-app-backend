import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import connectDB from './config/database.js';
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

// Load .env file from current backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Make upload middleware available globally
app.locals.upload = upload;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For SSL Commerce form data

// Connect to MongoDB
connectDB();

// Initialize email service
import './services/emailService.js';

// Initialize notification service (includes cron jobs)
import './services/notificationService.js';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Medsy Backend Server is running!', timestamp: new Date() });
});

// Enhanced server startup with port conflict handling
const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      console.log(`[0] Server running on port ${PORT}`);
    });

    // Handle port already in use error
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use. Please:`);
        console.log(`   1. Kill the process using port ${PORT}`);
        console.log(`   2. Or change the PORT in your .env file`);
        console.log(`   3. Current processes on port ${PORT}:`);
        
        // Show processes using the port (Windows/Unix compatible)
        if (process.platform === 'win32') {
          console.log(`   Run: netstat -ano | findstr :${PORT}`);
        } else {
          console.log(`   Run: lsof -i :${PORT}`);
        }
        
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Received SIGINT. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n👋 Received SIGTERM. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server only if not in production (Vercel will handle this)
if (process.env.NODE_ENV !== 'production') {
  startServer();
}

// Export the app for Vercel
export default app;