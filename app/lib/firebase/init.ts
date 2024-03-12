// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDExsNdPzAxAEaG3Wo_k6VgnGwjJrCnLLQ",
  authDomain: "dna-rna-converter.firebaseapp.com",
  projectId: "dna-rna-converter",
  storageBucket: "dna-rna-converter.appspot.com",
  messagingSenderId: "787013798158",
  appId: "1:787013798158:web:aae4d425f5aa7498e0ef5f",
  measurementId: "G-TM7CWD9SMS"
};

// Initialize Firebase


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export default app;
export {db}
