import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCt6RfZ-fYUfE8NyaetcCza8rjIzkltjGg",
  authDomain: "classcode-30977.firebaseapp.com",
  projectId: "classcode-30977",
  storageBucket: "classcode-30977.appspot.com",
  messagingSenderId: "1035597733596",
  appId: "1:1035597733596:web:d75cd8bc6f9c998d53de19",
  measurementId: "G-Y0437EN3QQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
