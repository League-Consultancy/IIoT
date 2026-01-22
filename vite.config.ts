import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { apiPlugin } from './vite-api-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Set MongoDB URI for the API plugin
  process.env.MONGO_URI = env.MONGO_URI || 'mongodb://localhost:27017/iiot_platform';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
    plugins: [
      react(),
      apiPlugin(), // Integrate Express API into Vite
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
