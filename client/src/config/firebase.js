import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// TODO: Replace these placeholder values with your actual Firebase project credentials
// You can find these in your Firebase Console:
// 1. Go to https://console.firebase.google.com/
// 2. Select your project
// 3. Click on the gear icon (⚙️) next to "Project Overview"
// 4. Go to Project settings
// 5. Scroll down to "Your apps" section
// 6. Under the web app configuration, you'll find these values
const firebaseConfig = {
    apiKey: "AIzaSyB0Neu0OaJoePfIfaii-DkQDDPpYiCAypE",
    authDomain: "next-ed59e.firebaseapp.com",
    projectId: "next-ed59e",
    storageBucket: "next-ed59e.firebasestorage.app",
    messagingSenderId: "1015895672952",
    appId: "1:1015895672952:web:1c3368bbde355f3e41c58d"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { auth, db }

export default app 