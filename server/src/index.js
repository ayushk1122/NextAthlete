import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { initializeApp, cert } from 'firebase-admin/app'

// Import routes
import starterKitsRoutes from './routes/starterKits.js'
import coachesRoutes from './routes/coaches.js'
import questionsRoutes from './routes/questions.js'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

// Initialize Firebase Admin
initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
})

const app = express()

// Middleware
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())

// Routes
app.use('/api/starter-kits', starterKitsRoutes)
app.use('/api/coaches', coachesRoutes)
app.use('/api/questions', questionsRoutes)
app.use('/api/auth', authRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}) 