import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { deleteApp, initializeApp } from "firebase/app";
import {
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth } from "./app";
import { usersCollection } from "./collections";
import { env } from "../../config/env";
import { assertValidUserCreate } from "./validation";
import type { UserCreate, UserRead, UserUpdate } from "../../types/domain";

function toUserRead(id: string, data: Omit<UserRead, "id">): UserRead {
  return {
    id,
    email: data.email,
    full_name: data.full_name ?? null,
    role: data.role ?? "user",
    is_active: data.is_active ?? true,
  };
}

export async function getUserById(userId: string): Promise<UserRead | null> {
  const snapshot = await getDoc(doc(usersCollection, userId));
  return snapshot.exists() ? toUserRead(snapshot.id, snapshot.data()) : null;
}

export async function getUserByEmail(email: string): Promise<UserRead | null> {
  const snapshot = await getDocs(query(usersCollection, where("email", "==", email), limit(1)));
  const user = snapshot.docs[0];
  return user ? toUserRead(user.id, user.data()) : null;
}

export async function listUsers(options: { limitCount?: number } = {}): Promise<UserRead[]> {
  const snapshot = await getDocs(
    query(usersCollection, orderBy("email"), limit(options.limitCount ?? 100)),
  );
  return snapshot.docs.map((user) => toUserRead(user.id, user.data()));
}

export async function createUser(userIn: UserCreate): Promise<UserRead> {
  assertValidUserCreate(userIn);

  const secondaryApp = initializeApp(env.firebase, `user-create-${crypto.randomUUID()}`);
  const secondaryAuth = getAuth(secondaryApp);
  const credential = await createUserWithEmailAndPassword(secondaryAuth, userIn.email, userIn.password);
  const user: Omit<UserRead, "id"> = {
    email: userIn.email,
    full_name: userIn.full_name ?? null,
    role: userIn.role ?? "user",
    is_active: true,
  };

  await setDoc(doc(usersCollection, credential.user.uid), {
    ...user,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await signOut(secondaryAuth);
  await deleteApp(secondaryApp);

  return toUserRead(credential.user.uid, user);
}

export async function updateUser(userId: string, userIn: UserUpdate): Promise<UserRead> {
  await updateDoc(doc(usersCollection, userId), {
    ...userIn,
    updated_at: serverTimestamp(),
  });

  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User was updated but could not be read back.");
  }
  return user;
}

export async function login(email: string, password: string): Promise<UserRead> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = await getUserById(credential.user.uid);

  if (!user || !user.is_active) {
    await signOut(auth);
    throw new Error("User account is inactive or missing.");
  }

  return user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getCurrentUser(): Promise<UserRead | null> {
  return auth.currentUser ? getUserById(auth.currentUser.uid) : null;
}

export async function changeCurrentUserPassword(currentPassword: string, newPassword: string) {
  if (!auth.currentUser?.email) {
    throw new Error("No authenticated user.");
  }

  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, newPassword);
}

export async function sendAdminPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}
