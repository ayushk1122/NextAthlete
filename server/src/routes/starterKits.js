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

// GET /api/starter-kits
router.get('/', async (req, res) => {
    try {
        // TODO: Implement database query
        const starterKits = [
            {
                id: 1,
                name: 'Soccer Starter Kit',
                description: 'Perfect for beginners, includes ball, cleats, and shin guards',
                price: 89.99,
                sport: 'soccer',
                ageRange: '5-12',
                items: ['Soccer Ball', 'Cleats', 'Shin Guards', 'Practice Cones'],
            },
            {
                id: 2,
                name: 'Basketball Starter Kit',
                description: 'Everything you need to start playing basketball',
                price: 79.99,
                sport: 'basketball',
                ageRange: '8-14',
                items: ['Basketball', 'Basketball Shoes', 'Practice Jersey', 'Water Bottle'],
            },
        ]

        res.json(starterKits)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch starter kits' })
    }
})

// GET /api/starter-kits/:id
router.get('/:id', async (req, res) => {
    try {
        // TODO: Implement database query
        const starterKit = {
            id: parseInt(req.params.id),
            name: 'Soccer Starter Kit',
            description: 'Perfect for beginners, includes ball, cleats, and shin guards',
            price: 89.99,
            sport: 'soccer',
            ageRange: '5-12',
            items: ['Soccer Ball', 'Cleats', 'Shin Guards', 'Practice Cones'],
        }

        res.json(starterKit)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch starter kit' })
    }
})

export default router 