import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from './config';

/**
 * ユーザーのメールアドレスを取得（providerData から確実に取得）
 * @returns {string|null} メールアドレス
 */
const getUserEmail = () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  // 優先順位: user.email → providerData から Google プロバイダ → null
  if (user.email) return user.email;
  
  const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
  return googleProvider?.email || null;
};

/**
 * メールアドレスからローカルパート（@前の部分）を抽出
 * @param {string} email - メールアドレス
 * @returns {string} ローカルパート
 */
const getEmailLocalPart = (email) => {
  if (!email) return null;
  return email.split('@')[0];
};

/**
 * 現在のユーザーの識別子を取得（メールのローカルパート）
 * @returns {string} ユーザー識別子
 */
const getCurrentUserIdentifier = () => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }
  const email = getUserEmail();
  if (!email) {
    throw new Error('User email not available');
  }
  return getEmailLocalPart(email);
};

/**
 * ユーザーごとのサブコレクションパスを取得
 * @param {string} userIdentifier - ユーザー識別子（メールのローカルパート）
 * @returns {string} サブコレクションパス
 */
const getUserRecordsCollection = (userIdentifier) => {
  return collection(db, 'users', userIdentifier, 'records');
};

/**
 * ユーザーの記録をリアルタイムで取得（リスナー設定）
 * @param {Function} callback - データ更新時のコールバック関数
 * @returns {Function} リスナー削除関数
 */
export const subscribeToRecords = (callback) => {
  if (!auth.currentUser) {
    console.warn('User not authenticated');
    return () => {};
  }

  const userIdentifier = getCurrentUserIdentifier();
  const q = query(
    getUserRecordsCollection(userIdentifier),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(records);
  }, (error) => {
    console.error('❌ Firestore query error:', error.code, error.message);
  });

  return unsubscribe;
};

/**
 * 新規記録を作成
 * @param {Object} recordData - 記録データ
 * @returns {Promise<string>} 作成されたドキュメントID
 */
export const createRecord = async (recordData) => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const userIdentifier = getCurrentUserIdentifier();
  const docRef = await addDoc(getUserRecordsCollection(userIdentifier), {
    ...recordData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
};

/**
 * 既存の記録を更新
 * @param {string} recordId - 記録ID
 * @param {Object} recordData - 更新するデータ
 */
export const updateRecord = async (recordId, recordData) => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const userIdentifier = getCurrentUserIdentifier();
  const recordRef = doc(db, 'users', userIdentifier, 'records', recordId);
  await updateDoc(recordRef, {
    ...recordData,
    updatedAt: serverTimestamp()
  });
};

/**
 * 記録を削除
 * @param {string} recordId - 記録ID
 */
export const deleteRecord = async (recordId) => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const userIdentifier = getCurrentUserIdentifier();
  await deleteDoc(doc(db, 'users', userIdentifier, 'records', recordId));
};

/**
 * ローカルストレージから Firebase へデータを移行
 * @param {Array} records - 移行するレコード配列
 */
export const migrateFromLocalStorage = async (records) => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const migratedIds = [];
  for (const record of records) {
    const { id, ...recordData } = record;
    try {
      const newId = await createRecord(recordData);
      migratedIds.push(newId);
    } catch (error) {
      console.error('Error migrating record:', error);
    }
  }

  return migratedIds;
};
