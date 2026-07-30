import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../../../firebase/config';
import { getCurrentUser } from '../../../firebase/auth';
import {
  UMINEKO2_CALCULATION_VERSION,
  UMINEKO2_MACHINE_ID,
  UMINEKO2_SCHEMA_VERSION
} from '../config/umineko2.js';

const getUserEmail = () => {
  const user = getCurrentUser();
  if (!user) return null;
  if (user.email) return user.email;
  const googleProvider = user.providerData?.find((provider) => provider.providerId === 'google.com');
  return googleProvider?.email || null;
};

const getCurrentUserIdentifier = () => {
  const email = getUserEmail();
  if (!email) {
    throw new Error('Googleログイン済みユーザーのみ保存できます');
  }
  return email.split('@')[0];
};

export const canSyncSettingInference = () => {
  const user = getCurrentUser();
  return Boolean(isFirebaseConfigured && db && auth && user && getUserEmail());
};

export const saveSettingInferenceSession = async ({ sessionId, input, result }) => {
  if (!canSyncSettingInference()) {
    throw new Error('同期保存にはGoogleログインが必要です');
  }

  const userIdentifier = getCurrentUserIdentifier();
  const targetId = sessionId || crypto.randomUUID();
  const ref = doc(collection(db, 'users', userIdentifier, 'settingInferences'), targetId);
  const timestamps = sessionId
    ? { updatedAt: serverTimestamp() }
    : { createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

  await setDoc(ref, {
    machineId: UMINEKO2_MACHINE_ID,
    schemaVersion: UMINEKO2_SCHEMA_VERSION,
    calculationVersion: UMINEKO2_CALCULATION_VERSION,
    input,
    result,
    ...timestamps
  }, { merge: true });

  return targetId;
};

export const getSettingInferenceSaveErrorMessage = (error) => {
  if (error?.code === 'permission-denied') {
    return 'Firestoreルールに settingInferences の保存権限がありません。Firebase コンソールでルール更新後に再度保存してください。';
  }

  return error?.message || '保存に失敗しました';
};
