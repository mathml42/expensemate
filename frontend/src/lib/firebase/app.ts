import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { env } from "../../config/env";

export const firebaseApp = initializeApp(env.firebase);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
