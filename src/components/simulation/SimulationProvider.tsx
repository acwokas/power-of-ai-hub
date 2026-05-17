import React, { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import type { SimulationPhase, SimulationState, ResultSection } from './types';

interface SimulationContextValue extends SimulationState {
  setPhase: (phase: SimulationPhase) => void;
  setFormValue: (key: string, value: string) => void;
  setFormData: (data: Record<string, string>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setResults: (results: ResultSection[]) => void;
  appendResult: (section: ResultSection) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

type Action =
  | { type: 'SET_PHASE'; phase: SimulationPhase }
  | { type: 'SET_FORM_VALUE'; key: string; value: string }
  | { type: 'SET_FORM_DATA'; data: Record<string, string> }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'SET_RESULTS'; results: ResultSection[] }
  | { type: 'APPEND_RESULT'; section: ResultSection }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET'; totalSteps: number };

function reducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SET_FORM_VALUE':
      return { ...state, formData: { ...state.formData, [action.key]: action.value } };
    case 'SET_FORM_DATA':
      return { ...state, formData: action.data };
    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1) };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case 'GO_TO_STEP':
      return { ...state, currentStep: Math.max(0, Math.min(action.step, state.totalSteps - 1)) };
    case 'SET_RESULTS':
      return { ...state, results: action.results };
    case 'APPEND_RESULT':
      return { ...state, results: [...state.results, action.section] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return {
        phase: 'setup',
        formData: {},
        currentStep: 0,
        totalSteps: action.totalSteps,
        results: [],
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

interface SimulationProviderProps {
  roomId: string;
  totalSteps: number;
  children: React.ReactNode;
}

function getStorageKey(roomId: string) {
  return `simulate-${roomId}-form-data`;
}

function loadSavedData(roomId: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(getStorageKey(roomId));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function SimulationProvider({ roomId, totalSteps, children }: SimulationProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    phase: 'setup',
    formData: loadSavedData(roomId),
    currentStep: 0,
    totalSteps,
    results: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (Object.keys(state.formData).length > 0) {
      try {
        localStorage.setItem(getStorageKey(roomId), JSON.stringify(state.formData));
      } catch {
        // silently fail
      }
    }
  }, [state.formData, roomId]);

  const setPhase = useCallback((phase: SimulationPhase) => dispatch({ type: 'SET_PHASE', phase }), []);
  const setFormValue = useCallback(
    (key: string, value: string) => dispatch({ type: 'SET_FORM_VALUE', key, value }),
    [],
  );
  const setFormData = useCallback((data: Record<string, string>) => dispatch({ type: 'SET_FORM_DATA', data }), []);
  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);
  const goToStep = useCallback((step: number) => dispatch({ type: 'GO_TO_STEP', step }), []);
  const setResults = useCallback((results: ResultSection[]) => dispatch({ type: 'SET_RESULTS', results }), []);
  const appendResult = useCallback((section: ResultSection) => dispatch({ type: 'APPEND_RESULT', section }), []);
  const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', loading }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', error }), []);
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(roomId));
    } catch {
      // ignore
    }
    dispatch({ type: 'RESET', totalSteps });
  }, [roomId, totalSteps]);

  return (
    <SimulationContext.Provider
      value={{
        ...state,
        setPhase,
        setFormValue,
        setFormData,
        nextStep,
        prevStep,
        goToStep,
        setResults,
        appendResult,
        setLoading,
        setError,
        reset,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
