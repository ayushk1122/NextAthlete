import express from 'express'
import { getAuth } from 'firebase-admin/auth'

const router = express.Router()

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1]
        if (!token) {
            return res.status(401).json({ error: 'No token provided' })
        }

        const decodedToken = await getAuth().verifyIdToken(token)
        req.user = decodedToken
        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
    }
}

// GET /api/coaches
router.get('/', async (req, res) => {
    try {
        // TODO: Implement database query
        const coaches = [
            {
                id: 1,
                name: 'John Smith',
                sport: 'soccer',
                experience: '10 years',
                rating: 4.8,
                hourlyRate: 50,
                availability: ['Monday', 'Wednesday', 'Friday'],
                specialties: ['Youth Development', 'Technical Skills', 'Team Strategy'],
            },
            {
                id: 2,
                name: 'Sarah Johnson',
                sport: 'basketball',
                experience: '8 years',
                rating: 4.9,
                hourlyRate: 45,
                availability: ['Tuesday', 'Thursday', 'Saturday'],
                specialties: ['Shooting', 'Ball Handling', 'Defense'],
            },
        ]

        res.json(coaches)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch coaches' })
    }
})

// GET /api/coaches/:id
router.get('/:id', async (req, res) => {
    try {
        // TODO: Implement database query
        const coach = {
            id: parseInt(req.params.id),
            name: 'John Smith',
            sport: 'soccer',
            experience: '10 years',
            rating: 4.8,
            hourlyRate: 50,
            availability: ['Monday', 'Wednesday', 'Friday'],
            specialties: ['Youth Development', 'Technical Skills', 'Team Strategy'],
            bio: 'Certified soccer coach with extensive experience in youth development. Former professional player with a passion for teaching the fundamentals of the game.',
            certifications: ['USSF B License', 'First Aid Certified', 'CPR Certified'],
        }

        res.json(coach)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch coach' })
    }
})

// POST /api/coaches/:id/book
router.post('/:id/book', verifyToken, async (req, res) => {
    try {
        const { date, time, duration } = req.body
        // TODO: Implement booking logic with Stripe
        res.json({
            message: 'Booking request received',
            bookingId: '123',
            status: 'pending',
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to book coach' })
    }
})

export default router 