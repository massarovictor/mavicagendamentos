import { useState, useCallback, useMemo, useEffect } from 'react';
import { z } from 'zod';

interface UseFormOptions<T> {
  initialValues: T;
  schema?: z.ZodSchema<T>;
  onSubmit: (values: T) => Promise<void> | void;
  persistenceKey?: string;
}

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  schema,
  onSubmit,
  persistenceKey
}: UseFormOptions<T>) {
  const getInitialState = useCallback(() => {
    if (persistenceKey) {
      try {
        const savedState = window.localStorage.getItem(persistenceKey);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          const initialStateKeys = Object.keys(initialValues);
          const savedStateKeys = Object.keys(parsedState);

          if (initialStateKeys.every(key => savedStateKeys.includes(key))) {
            return { ...initialValues, ...parsedState };
          }
        }
      } catch (error) {
        console.error('Erro ao carregar estado do formulário do localStorage:', error);
        window.localStorage.removeItem(persistenceKey);
      }
    }
    return initialValues;
  }, [initialValues, persistenceKey]);

  const [formState, setFormState] = useState<FormState<T>>({
    values: getInitialState(),
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true
  });

  const setValue = useCallback(<K extends keyof T>(
    field: K,
    value: T[K],
    shouldValidate = true
  ) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      touched: { ...prev.touched, [field]: true }
    }));

    if (shouldValidate && schema) {
      validateField(field, value);
    }
  }, [schema]);

  const setValues = useCallback((values: Partial<T>) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, ...values }
    }));
  }, []);

  const validateField = useCallback(<K extends keyof T>(
    field: K, 
    value: T[K]
  ) => {
    if (!schema || !(schema instanceof z.ZodObject)) return true;

    try {
      const fieldSchema = (schema as z.ZodObject<any>).shape[field as string];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, [field]: undefined }
        }));
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Campo inválido';
        setFormState(prev => ({
          ...prev,
          errors: { ...prev.errors, [field]: errorMessage }
        }));
        return false;
      }
    }
    return true;
  }, [schema]);

  const validateForm = useCallback(() => {
    if (!schema) return true;

    try {
      schema.parse(formState.values);
      setFormState(prev => ({ ...prev, errors: {} }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            const field = err.path[0] as keyof T;
            newErrors[field] = err.message;
          }
        });
        setFormState(prev => ({ ...prev, errors: newErrors }));
        return false;
      }
    }
    return false;
  }, [schema, formState.values]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) return;

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(formState.values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.values, onSubmit, validateForm]);

  const reset = useCallback((newValues?: Partial<T>) => {
    setFormState({
      values: { ...initialValues, ...newValues },
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true
    });
  }, [initialValues]);

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    value: formState.values[field],
    onChange: (value: T[K]) => setValue(field, value),
    error: formState.errors[field],
    touched: formState.touched[field]
  }), [formState, setValue]);

  const isValid = useMemo(() => {
    return Object.keys(formState.errors).length === 0;
  }, [formState.errors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formState.values) !== JSON.stringify(initialValues);
  }, [formState.values, initialValues]);

  const hasErrors = useMemo(() => {
    return Object.values(formState.errors).some(error => error);
  }, [formState.errors]);

  useEffect(() => {
    if (persistenceKey) {
      try {
        window.localStorage.setItem(persistenceKey, JSON.stringify(formState.values));
      } catch (error) {
        console.error('Erro ao salvar estado do formulário no localStorage:', error);
      }
    }
  }, [formState.values, persistenceKey]);

  const clearPersistence = useCallback(() => {
    if (persistenceKey) {
      window.localStorage.removeItem(persistenceKey);
    }
  }, [persistenceKey]);

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValid,
    isDirty,
    hasErrors,
    setValue,
    setValues,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
    clearPersistence
  };
} 