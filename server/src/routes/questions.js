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

// GET /api/questions
router.get('/', async (req, res) => {
    try {
        // TODO: Implement database query
        const questions = [
            {
                id: 1,
                title: 'What size soccer ball should I get for my 8-year-old?',
                content: "My son is starting soccer and I'm not sure what size ball to get him. He's 8 years old and about 4'2\".",
                author: {
                    id: 'user1',
                    name: 'Parent User',
                    role: 'parent',
                },
                sport: 'soccer',
                createdAt: '2024-02-20T10:00:00Z',
                answers: [
                    {
                        id: 1,
                        content: 'For an 8-year-old, you should get a size 4 soccer ball. Size 4 is the standard for youth players aged 8-12.',
                        author: {
                            id: 'coach1',
                            name: 'John Smith',
                            role: 'coach',
                        },
                        createdAt: '2024-02-20T10:30:00Z',
                    },
                ],
            },
        ]

        res.json(questions)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch questions' })
    }
})

// POST /api/questions
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, content, sport } = req.body
        // TODO: Implement database query
        const question = {
            id: 2,
            title,
            content,
            sport,
            author: {
                id: req.user.uid,
                name: req.user.name,
                role: req.user.role,
            },
            createdAt: new Date().toISOString(),
            answers: [],
        }

        res.status(201).json(question)
    } catch (error) {
        res.status(500).json({ error: 'Failed to create question' })
    }
})

// POST /api/questions/:id/answers
router.post('/:id/answers', verifyToken, async (req, res) => {
    try {
        const { content } = req.body
        // TODO: Implement database query
        const answer = {
            id: 2,
            content,
            author: {
                id: req.user.uid,
                name: req.user.name,
                role: req.user.role,
            },
            createdAt: new Date().toISOString(),
        }

        res.status(201).json(answer)
    } catch (error) {
        res.status(500).json({ error: 'Failed to create answer' })
    }
})

export default router 