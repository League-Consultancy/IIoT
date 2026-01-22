import app, { connectDB } from './app';
import { exit } from 'process';

const PORT = process.env.PORT || 4000;

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}).catch((error) => {
    console.error('Failed to start server:', error);
    exit(1);
});
