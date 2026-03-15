import { useState, useEffect } from 'react';
import { 
  documentMask, 
  phoneMask, 
  validateDocument, 
  validatePhone, 
  getValidationClass,
  type ValidationStatus 
} from '../utils/masks';

interface ValidatedInputProps {
  type: 'document' | 'phone' | 'text' | 'email';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  showValidation?: boolean;
}

const ValidatedInput = ({
  type,
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  label,
  showValidation = true
}: ValidatedInputProps) => {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [displayValue, setDisplayValue] = useState(value);

  // Aplica máscara e valida o input
  const handleChange = (inputValue: string) => {
    let maskedValue = inputValue;
    let isValid = true;

    switch (type) {
      case 'document':
        maskedValue = documentMask(inputValue);
        isValid = validateDocument(maskedValue);
        break;
      case 'phone':
        maskedValue = phoneMask(inputValue);
        isValid = validatePhone(maskedValue);
        break;
      default:
        maskedValue = inputValue;
        isValid = inputValue.length > 0;
    }

    setDisplayValue(maskedValue);
    onChange(maskedValue);

    // Atualiza status de validação apenas se há conteúdo
    if (showValidation && maskedValue.trim()) {
      setValidationStatus(isValid ? 'valid' : 'invalid');
    } else {
      setValidationStatus('idle');
    }
  };

  // Sincroniza valor externo
  useEffect(() => {
    setDisplayValue(value);
    
    if (showValidation && value.trim()) {
      let isValid = true;
      switch (type) {
        case 'document':
          isValid = validateDocument(value);
          break;
        case 'phone':
          isValid = validatePhone(value);
          break;
        default:
          isValid = value.length > 0;
      }
      setValidationStatus(isValid ? 'valid' : 'invalid');
    } else {
      setValidationStatus('idle');
    }
  }, [value, type, showValidation]);

  const validationClass = getValidationClass(validationStatus);
  const baseClass = `w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue ${validationClass}`;

  // Ícone de validação
  const ValidationIcon = () => {
    if (!showValidation) return null;

    switch (validationStatus) {
      case 'valid':
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 opacity-0 animate-fadeIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
        );
      case 'invalid':
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 opacity-0 animate-fadeIn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-google-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseClass} ${className} ${showValidation && validationStatus !== 'idle' ? 'pr-10' : ''}`}
        />
        <ValidationIcon />
      </div>
      {showValidation && validationStatus === 'invalid' && (
        <p className="mt-1 text-sm text-red-600 opacity-0 animate-fadeIn">
          {type === 'document' && 'CPF ou CNPJ inválido'}
          {type === 'phone' && 'Telefone inválido'}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;
