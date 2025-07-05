import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  async?: (value: any) => Promise<string | null>;
}

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox';
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  validation?: ValidationRule;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  showValidationIcon?: boolean;
  validateOnChange?: boolean;
  debounceMs?: number;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
  min?: number;
  max?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  validation,
  placeholder,
  helpText,
  disabled = false,
  required = false,
  options = [],
  rows = 3,
  showValidationIcon = true,
  validateOnChange = true,
  debounceMs = 300,
  className = '',
  inputClassName = '',
  autoComplete,
  min,
  max
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  // Debounce para validação
  useEffect(() => {
    if (!validateOnChange || !touched || !validation) return;

    const timeoutId = setTimeout(() => {
      validateField(value);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, validateOnChange, touched, validation, debounceMs]);

  const validateField = async (fieldValue: any) => {
    if (!validation) {
      setError(null);
      return true;
    }

    setIsValidating(true);

    try {
      // Validação required
      if (validation.required && (!fieldValue || fieldValue.toString().trim() === '')) {
        setError('Este campo é obrigatório');
        setIsValidating(false);
        return false;
      }

      // Se campo está vazio e não é obrigatório, não valida
      if (!fieldValue || fieldValue.toString().trim() === '') {
        setError(null);
        setIsValidating(false);
        return true;
      }

      const stringValue = fieldValue.toString();

      // Validação de comprimento mínimo
      if (validation.minLength && stringValue.length < validation.minLength) {
        setError(`Deve ter pelo menos ${validation.minLength} caracteres`);
        setIsValidating(false);
        return false;
      }

      // Validação de comprimento máximo
      if (validation.maxLength && stringValue.length > validation.maxLength) {
        setError(`Deve ter no máximo ${validation.maxLength} caracteres`);
        setIsValidating(false);
        return false;
      }

      // Validação de padrão (regex)
      if (validation.pattern && !validation.pattern.test(stringValue)) {
        if (type === 'email') {
          setError('Email inválido');
        } else {
          setError('Formato inválido');
        }
        setIsValidating(false);
        return false;
      }

      // Validação customizada
      if (validation.custom) {
        const customError = validation.custom(fieldValue);
        if (customError) {
          setError(customError);
          setIsValidating(false);
          return false;
        }
      }

      // Validação assíncrona
      if (validation.async) {
        const asyncError = await validation.async(fieldValue);
        if (asyncError) {
          setError(asyncError);
          setIsValidating(false);
          return false;
        }
      }

      setError(null);
      setIsValidating(false);
      return true;
    } catch (err) {
      setError('Erro na validação');
      setIsValidating(false);
      return false;
    }
  };

  const handleChange = (newValue: any) => {
    onChange(newValue);
    if (touched && validateOnChange) {
      // Reset error immediately on change, will be re-validated after debounce
      setError(null);
    }
  };

  const handleBlur = async () => {
    setTouched(true);
    if (validation) {
      await validateField(value);
    }
    onBlur?.();
  };

  const getValidationState = () => {
    if (isValidating) return 'validating';
    if (error) return 'error';
    if (touched && value && !error) return 'success';
    return 'default';
  };

  const validationState = getValidationState();

  const getInputClasses = () => {
    const baseClasses = cn(
      "transition-colors",
      inputClassName
    );

    switch (validationState) {
      case 'error':
        return cn(baseClasses, "border-red-500 focus:border-red-500 focus:ring-red-500");
      case 'success':
        return cn(baseClasses, "border-green-500 focus:border-green-500 focus:ring-green-500");
      default:
        return baseClasses;
    }
  };

  const getValidationIcon = () => {
    if (!showValidationIcon) return null;

    switch (validationState) {
      case 'validating':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        );
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleChange(e.target.value),
      onBlur: handleBlur,
      placeholder,
      disabled,
      className: getInputClasses(),
      autoComplete
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={rows}
            className='text-foreground'
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={getInputClasses()}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={name}
              checked={value || false}
              onCheckedChange={handleChange}
              disabled={disabled}
              className={validationState === 'error' ? 'border-red-500' : ''}
            />
            <Label 
              htmlFor={name}
              className="text-sm font-normal cursor-pointer text-foreground"
            >
              {label}
            </Label>
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              {...commonProps}
              type={showPassword ? 'text' : 'password'}
              className={cn(getInputClasses(), 'pr-10, text-foreground')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-popover-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-popover-foreground" />
              )}
            </button>
          </div>
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            min={min}
            className='text-foreground'
            max={max}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type={type}
            className='text-foreground'
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className={cn("space-y-2", className)}>
        {renderInput()}
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {helpText && !error && (
          <p className="text-sm text-foreground">{helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="relative">
        {renderInput()}
        {showValidationIcon && type !== 'select' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {type === 'password' ? (
              <div className="pr-7">
                {getValidationIcon()}
              </div>
            ) : (
              getValidationIcon()
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}

      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

// Hook para facilitar o uso de validações comuns
export const useFieldValidation = () => {
  const required = (): ValidationRule => ({
    required: true
  });

  const email = (): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    required: true
  });

  const minLength = (min: number): ValidationRule => ({
    minLength: min
  });

  const maxLength = (max: number): ValidationRule => ({
    maxLength: max
  });

  const password = (): ValidationRule => ({
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    custom: (value: string) => {
      if (!value) return null;
      if (value.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
      if (!/(?=.*[a-z])/.test(value)) return 'Senha deve conter ao menos uma letra minúscula';
      if (!/(?=.*[A-Z])/.test(value)) return 'Senha deve conter ao menos uma letra maiúscula';
      if (!/(?=.*\d)/.test(value)) return 'Senha deve conter ao menos um número';
      return null;
    }
  });

  const phone = (): ValidationRule => ({
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    custom: (value: string) => {
      if (!value) return null;
      return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value) ? null : 'Formato: (11) 99999-9999';
    }
  });

  return {
    required,
    email,
    minLength,
    maxLength,
    password,
    phone
  };
}; 