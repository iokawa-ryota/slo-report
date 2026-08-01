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

const createEntryId = () => `entry-${crypto.randomUUID()}`;

export const useUmineko2Draft = (initialOverride = null) => {
  const initialDraft = loadSettingInferenceDraft();
  const baseDraft = initialOverride ? {
    ...initialDraft,
    sessionId: initialOverride.sessionId ?? initialDraft.sessionId,
    input: {
      ...initialDraft.input,
      ...(initialOverride.input || {})
    }
  } : initialDraft;
  const migratedInput = {
    ...baseDraft.input,
    regDiagonalBlue7Count: baseDraft.input.regDiagonalBlue7Count || baseDraft.input.rbDiagonalBlue7Count || ''
  };
  const [input, setInput] = useState({
    ...UMINEKO2_PHASE1_DEFAULT_INPUT,
    ...migratedInput
  });
  const [sessionId, setSessionId] = useState(baseDraft.sessionId || null);

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

  const addListEntry = (key, entry) => {
    const nextEntry = {
      id: createEntryId(),
      createdAt: new Date().toISOString(),
      ...entry
    };
    setInput((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), nextEntry]
    }));
    return nextEntry.id;
  };

  const updateListEntry = (key, id, patch) => {
    setInput((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((item) => (
        item.id === id ? { ...item, ...patch } : item
      ))
    }));
  };

  const removeListEntry = (key, id) => {
    setInput((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((item) => item.id !== id)
    }));
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
    addListEntry,
    updateListEntry,
    removeListEntry,
    resetDraft
  };
};
