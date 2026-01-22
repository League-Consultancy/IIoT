## Run Locally

**Prerequisites:**  Node.js, MongoDB Atlas (or a compatible MongoDB instance)

1. Install dependencies:
   `npm install`
2. Configure environment variables in [.env.local](.env.local):
   - Set `GEMINI_API_KEY` to your Gemini API key.
   - Set `MONGO_URL` to your MongoDB Atlas connection string.
3. Seed the database with minimal data:
   `npm run seed:db`
4. Run the app:
   `npm run dev:all` (starts both frontend and backend)

## Backend Details

- **Server:** Node.js/Express on port 4000.
- **Database:** MongoDB (Connected via Atlas).
- **Seeding:** The `npm run seed:db` command populates the database with:
  - 1 Admin User (`admin@tesla.com` / `password123`)
  - 1 Factory (Austin Giga)
  - 1 Device (CNC Milling Unit A)
  - 3 Sample Machine Sessions
