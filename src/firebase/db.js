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

const COLLECTION_NAME = 'pachislo_records';

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

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', auth.currentUser.uid),
    orderBy('date', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(records);
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

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...recordData,
    userId: auth.currentUser.uid,
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

  const recordRef = doc(db, COLLECTION_NAME, recordId);
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

  await deleteDoc(doc(db, COLLECTION_NAME, recordId));
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
