import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDMF_n1aUsrAcZOmhDpw0pgYkM7mi_8Qd4",
    authDomain: "pastibot-a970c.firebaseapp.com",
    projectId: "pastibot-a970c",
    storageBucket: "pastibot-a970c.firebasestorage.app",
    messagingSenderId: "967662848926",
    appId: "1:967662848926:web:6317252d5daed46e28648f",
    measurementId: "G-6SY3P3RPW9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;
