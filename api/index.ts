import app, { connectDB } from '../backend/src/app';

export default async function handler(req: any, res: any) {
  // Ensure DB is connected before handling the request
  await connectDB();
  
  // Pass the request to the Express app
  app(req, res);
}
