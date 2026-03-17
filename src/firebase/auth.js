import {
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

const LOCAL_ANONYMOUS_USER = {
  uid: 'local-anonymous-user',
  email: null,
  displayName: 'ローカルユーザー',
  isAnonymous: true
};

/**
 * 匿名ユーザーとしてログイン
 * @returns {Promise<void>}
 */
export const loginAnonymously = async () => {
  if (!isFirebaseConfigured || !auth) {
    return LOCAL_ANONYMOUS_USER;
  }
  try {
    await signInAnonymously(auth);
    console.log('Anonymous user logged in');
  } catch (error) {
    console.error('Error logging in anonymously:', error);
    throw error;
  }
};

/**
 * 認証状態の変更を監視
 * @param {Function} callback - ユーザー情報が変更された時のコールバック
 * @returns {Function} リスナー削除関数
 */
export const subscribeToAuthState = (callback) => {
  if (!isFirebaseConfigured || !auth) {
    callback(LOCAL_ANONYMOUS_USER);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ User authenticated:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerData: user.providerData
      });
    } else {
      console.log('❌ User not authenticated');
    }
    callback(user);
  });
};

/**
 * ログアウト
 * @returns {Promise<void>}
 */
export const logout = async () => {
  if (!isFirebaseConfigured || !auth) {
    return;
  }
  try {
    await signOut(auth);
    console.log('User logged out');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * 現在のユーザーを取得
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  if (!isFirebaseConfigured || !auth) {
    return LOCAL_ANONYMOUS_USER;
  }
  return auth.currentUser;
};

/**
 * Google でサインイン
 * @returns {Promise<void>}
 */
export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured');
  }
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    console.log('Google user logged in');
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};
