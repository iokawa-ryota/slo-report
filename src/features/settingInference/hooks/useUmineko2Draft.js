import { useEffect, useMemo, useState } from 'react';
import { calculateUmineko2Inference } from '../calculation/umineko2Inference.js';
import { UMINEKO2_PHASE1_DEFAULT_INPUT } from '../config/umineko2.js';
import {
  clearSettingInferenceDraft,
  loadSettingInferenceDraft,
  saveSettingInferenceDraft
} from '../storage/draftStorage.js';

const clampNonNegative = (value) => Math.max(0, value);

const normalizeTextValue = (value) => {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export const useUmineko2Draft = () => {
  const initialDraft = loadSettingInferenceDraft();
  const [input, setInput] = useState({
    ...UMINEKO2_PHASE1_DEFAULT_INPUT,
    ...initialDraft.input
  });
  const [sessionId, setSessionId] = useState(initialDraft.sessionId || null);

  useEffect(() => {
    saveSettingInferenceDraft({ sessionId, input });
  }, [input, sessionId]);

  const inference = useMemo(() => calculateUmineko2Inference(input), [input]);

  const setFieldValue = (name, value) => {
    setInput((prev) => ({
      ...prev,
      [name]: normalizeTextValue(value)
    }));
  };

  const handleFieldChange = (event) => {
    setFieldValue(event.target.name, event.target.value);
  };

  const clearField = (name) => {
    setFieldValue(name, '');
  };

  const adjustField = (name, delta) => {
    setInput((prev) => {
      const current = prev[name] === '' ? 0 : Number(prev[name]);
      const safeCurrent = Number.isFinite(current) ? current : 0;
      return {
        ...prev,
        [name]: String(clampNonNegative(safeCurrent + delta))
      };
    });
  };

  const resetDraft = () => {
    setInput({ ...UMINEKO2_PHASE1_DEFAULT_INPUT });
    setSessionId(null);
    clearSettingInferenceDraft();
  };

  return {
    input,
    sessionId,
    setSessionId,
    inference,
    handleFieldChange,
    setFieldValue,
    clearField,
    adjustField,
    resetDraft
  };
};
