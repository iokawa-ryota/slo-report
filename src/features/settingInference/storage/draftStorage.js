import {
  UMINEKO2_MACHINE_ID,
  UMINEKO2_PHASE1_DEFAULT_INPUT,
  UMINEKO2_SCHEMA_VERSION
} from '../config/umineko2.js';

export const getSettingInferenceDraftKey = (machineId) => `setting-inference-draft-v1:${machineId}`;

const DEFAULT_DRAFT = {
  machineId: UMINEKO2_MACHINE_ID,
  schemaVersion: UMINEKO2_SCHEMA_VERSION,
  sessionId: null,
  input: { ...UMINEKO2_PHASE1_DEFAULT_INPUT }
};

export const loadSettingInferenceDraft = (machineId = UMINEKO2_MACHINE_ID) => {
  try {
    const raw = localStorage.getItem(getSettingInferenceDraftKey(machineId));
    if (!raw) {
      return { ...DEFAULT_DRAFT };
    }

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DRAFT,
      ...parsed,
      input: {
        ...UMINEKO2_PHASE1_DEFAULT_INPUT,
        ...(parsed?.input || {})
      }
    };
  } catch (error) {
    console.error('Failed to load setting inference draft:', error);
    return { ...DEFAULT_DRAFT };
  }
};

export const saveSettingInferenceDraft = ({ machineId = UMINEKO2_MACHINE_ID, sessionId = null, input }) => {
  const payload = {
    machineId,
    schemaVersion: UMINEKO2_SCHEMA_VERSION,
    sessionId,
    input: {
      ...UMINEKO2_PHASE1_DEFAULT_INPUT,
      ...input
    }
  };
  localStorage.setItem(getSettingInferenceDraftKey(machineId), JSON.stringify(payload));
  return payload;
};

export const clearSettingInferenceDraft = (machineId = UMINEKO2_MACHINE_ID) => {
  localStorage.removeItem(getSettingInferenceDraftKey(machineId));
};
