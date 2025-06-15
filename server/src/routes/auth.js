import express from 'express'
import { getAuth } from 'firebase-admin/auth'

const router = express.Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body

        // Create user in Firebase Auth
        const userRecord = await getAuth().createUser({
            email,
            password,
            displayName: name,
        })

        // Set custom claims for role-based access
        await getAuth().setCustomUserClaims(userRecord.uid, { role })

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName,
                role,
            },
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to register user' })
    }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { idToken } = req.body

        // Verify the ID token
        const decodedToken = await getAuth().verifyIdToken(idToken)

        // Get user data
        const userRecord = await getAuth().getUser(decodedToken.uid)

        res.json({
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName,
                role: decodedToken.role,
            },
        })
    } catch (error) {
        res.status(401).json({ error: 'Invalid credentials' })
    }
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1]
        if (!token) {
            return res.status(401).json({ error: 'No token provided' })
        }

        const decodedToken = await getAuth().verifyIdToken(token)
        const userRecord = await getAuth().getUser(decodedToken.uid)

        res.json({
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName,
                role: decodedToken.role,
            },
        })
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
    }
})

export default router 