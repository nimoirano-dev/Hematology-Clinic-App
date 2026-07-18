import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ====================================================================
// CONFIG — reemplazá con las credenciales de tu proyecto Firebase.
// Ver SETUP.md para el paso a paso.
// ====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBwOT_fzFooCW7Dl8EPtOwy-ZUOQNgtFMA",
  authDomain: "hematology-clinic-app.firebaseapp.com",
  projectId: "hematology-clinic-app",
  storageBucket: "hematology-clinic-app.firebasestorage.app",
  messagingSenderId: "787540987451",
  appId: "1:787540987451:web:65b3408a9ababbd518961e"
};

const fb = initializeApp(firebaseConfig);
export const auth = getAuth(fb);
export const db = getFirestore(fb);
