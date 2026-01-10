import {
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './config';

/**
 * 匿名ユーザーとしてログイン
 * @returns {Promise<void>}
 */
export const loginAnonymously = async () => {
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
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

/**
 * ログアウト
 * @returns {Promise<void>}
 */
export const logout = async () => {
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
  return auth.currentUser;
};

/**
 * Google でサインイン
 * @returns {Promise<void>}
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    console.log('Google user logged in');
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};
