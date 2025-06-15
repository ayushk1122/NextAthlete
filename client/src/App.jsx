import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages
const Home = lazy(() => import('./pages/Home'))
const StarterKit = lazy(() => import('./pages/StarterKit'))
const Coaches = lazy(() => import('./pages/Coaches'))
const AskQuestion = lazy(() => import('./pages/AskQuestion'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/starter-kits" element={<StarterKit />} />
                            <Route path="/coaches" element={<Coaches />} />
                            <Route path="/ask" element={<AskQuestion />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </Routes>
                    </Suspense>
                </main>
                <Footer />
            </div>
        </AuthProvider>
    )
}

export default App 