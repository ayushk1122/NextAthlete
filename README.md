# NextAthlete

NextAthlete is a full-stack web application designed to help parents and youth athletes get started with sports by connecting them with starter kits, coaching advice, equipment recommendations, and local league guidance.

## Project Structure

```
nextathlete/
├── client/          # React frontend
└── server/          # Node.js/Express backend
```

## Features

- User authentication (Parents, Players, Coaches)
- Starter kits browsing and recommendations
- Coach discovery and booking
- Equipment recommendations
- Local league information
- Q&A platform for sports-related questions

## Tech Stack

- **Frontend**: React.js, React Router, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Firebase (with PostgreSQL option)
- **Authentication**: Firebase Auth
- **Payments**: Stripe (optional)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- (Optional) PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both client and server directories
   - Fill in your Firebase configuration and other environment variables

4. Start the development servers:
   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend server (from client directory)
   npm run dev
   ```

## Environment Variables

### Client (.env)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Server (.env)
```
PORT=5000
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
STRIPE_SECRET_KEY=
```

## License

MIT 