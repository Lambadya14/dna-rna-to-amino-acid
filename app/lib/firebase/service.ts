import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import app from "./init"
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// membuat user baru
export const createUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  await createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;

      // Gunakan metode updateProfile untuk mengubah displayName
      return updateProfile(user, {
        displayName: fullName,
      });
    })
    .then(() => {
      // UpdateProfile berhasil dilakukan
      console.log("User profile updated successfully");
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // Tangani kesalahan
      console.error(errorCode, errorMessage);
    });
};

// login user
export const loginUser = async (email: string, password: string) => {
  try {
    // Lakukan proses login dengan Firebase Authentication
    await signInWithEmailAndPassword(auth, email, password).then((user) => {
      // console.log("user", user);
    });
    // Pengguna berhasil login
    console.log("User logged in successfully");
    return true;
  } catch (error: any) {
    console.error("Error during login:", error.message);
    // Login gagal
    throw new Error("Invalid login credentials");
  }
};

// logout user
export const logoutUser = async () => {
  await auth.signOut();
};

// user check user is login
export const checkUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      // console.log("user");
      console.log("user services", user?.email);

      resolve(user);
    });
  });
};

