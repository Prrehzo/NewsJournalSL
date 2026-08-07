import { db } from './src/firebase.js';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function checkData() {
    const q = await getDocs(collection(db, 'users'));
    q.forEach(d => console.log(d.id, d.data().role, d.data().email));
}
checkData();
