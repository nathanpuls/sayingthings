// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General -> "Your apps" section
const firebaseConfig = {
    apiKey: "AIzaSyApNSFQwh3xFaVo8MVqJaH4DUG6xT1dHV8",
    authDomain: "sayingthings-5027f.firebaseapp.com",
    projectId: "sayingthings-5027f",
    storageBucket: "sayingthings-5027f.firebasestorage.app",
    messagingSenderId: "473897322768",
    appId: "1:473897322768:web:d636709e0c30e03e0d7d95",
    measurementId: "G-5WRT02J883"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
    }
}
