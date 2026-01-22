import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDatabase, initializeCollections } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for correct IP detection
app.set('trust proxy', 1);

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        name: 'Enterprise Device Session Analytics Platform',
        version: '1.0.0',
        status: 'running',
        docs: '/api/v1/health',
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
    try {
        // Connect to database
        await connectDatabase();

        // Initialize collections (creates time-series if needed)
        await initializeCollections();

        // Start listening
        app.listen(env.PORT, () => {
            console.log(`🚀 Server running on port ${env.PORT}`);
            console.log(`📊 Environment: ${env.NODE_ENV}`);
            console.log(`🔗 API: http://localhost:${env.PORT}/api/v1`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();

export default app;
