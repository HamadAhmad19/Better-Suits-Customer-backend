
// import { initializeApp } from 'firebase/app'; // add
// import { getAuth } from 'firebase/auth'; // add
// import { getFirestore } from 'firebase/firestore'; 


// const firebaseConfig = {
//   apiKey: "AIzaSyAdZKz0JPcCh0Akeaz_KyFFJ1yaQe1FBpM",
//   authDomain: "rideapp-f5723.firebaseapp.com",
//   projectId: "rideapp-f5723",
//   storageBucket: "rideapp-f5723.firebasestorage.app",
//   messagingSenderId: "480629874276",
//   appId: "1:480629874276:web:6011d4045d96db19050971"
// };


// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app); 
// const database = getFirestore(app); 
// export { auth, database }; 




import { initializeApp } from 'firebase/app'; // add
// import { getAuth } from 'firebase/auth'; // add
import { getFirestore } from 'firebase/firestore'; 


const firebaseConfig = {
  apiKey: "AIzaSyAdZKz0JPcCh0Akeaz_KyFFJ1yaQe1FBpM",
  authDomain: "rideapp-f5723.firebaseapp.com",
  projectId: "rideapp-f5723",
  storageBucket: "rideapp-f5723.firebasestorage.app",
  messagingSenderId: "480629874276",
  appId: "1:480629874276:web:6011d4045d96db19050971"
};


const app = initializeApp(firebaseConfig);
// const auth = getAuth(app); 
const database = getFirestore(app); 

export { database }; 