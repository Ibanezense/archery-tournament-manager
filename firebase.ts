import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCwF9uvRw_hyEm2ZLZXUr78d63rZp9s2AQ",
  authDomain: "archery-tournament-f8a0d.firebaseapp.com",
  databaseURL: "https://archery-tournament-f8a0d-default-rtdb.firebaseio.com",
  projectId: "archery-tournament-f8a0d",
  storageBucket: "archery-tournament-f8a0d.firebasestorage.app",
  messagingSenderId: "352025470660",
  appId: "1:352025470660:web:b84be06ffde9241aa60b91",
  measurementId: "G-D1ZELF8JJF"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
