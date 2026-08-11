import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDhPPSrjTNX8BgMsHsuRgel4pbey500GF8',
  authDomain: 'chaikitapri-fe92e.firebaseapp.com',
  databaseURL: 'https://chaikitapri-fe92e-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'chaikitapri-fe92e',
  storageBucket: 'chaikitapri-fe92e.firebasestorage.app',
  messagingSenderId: '523886591197',
  appId: '1:523886591197:web:4328f8de93d2cc45042f34',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getDatabase(firebaseApp);
