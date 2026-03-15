// Utilitários para máscaras e validações

// Remove todos os caracteres não numéricos
export const removeNonNumbers = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Máscara para CPF: 000.000.000-00
export const cpfMask = (value: string): string => {
  const numbers = removeNonNumbers(value);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// Máscara para CNPJ: 00.000.000/0000-00
export const cnpjMask = (value: string): string => {
  const numbers = removeNonNumbers(value);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// Máscara automática para CPF ou CNPJ baseada no tamanho
export const documentMask = (value: string): string => {
  const numbers = removeNonNumbers(value);
  
  if (numbers.length <= 11) {
    return cpfMask(value);
  } else {
    return cnpjMask(value);
  }
};

// Máscara para telefone: (00) 0000-0000 ou (00) 00000-0000
export const phoneMask = (value: string): string => {
  const numbers = removeNonNumbers(value);
  
  if (numbers.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    // Celular: (00) 00000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  const numbers = removeNonNumbers(cpf);
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

// Validação de CNPJ
export const validateCNPJ = (cnpj: string): boolean => {
  const numbers = removeNonNumbers(cnpj);
  
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(numbers.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(numbers.charAt(13))) return false;
  
  return true;
};

// Validação automática de documento (CPF ou CNPJ)
export const validateDocument = (document: string): boolean => {
  const numbers = removeNonNumbers(document);
  
  if (numbers.length === 11) {
    return validateCPF(document);
  } else if (numbers.length === 14) {
    return validateCNPJ(document);
  }
  
  return false;
};

// Validação de telefone
export const validatePhone = (phone: string): boolean => {
  const numbers = removeNonNumbers(phone);
  
  // Aceita telefones com 10 ou 11 dígitos (com DDD)
  if (numbers.length < 10 || numbers.length > 11) return false;
  
  // Verifica se o DDD é válido (11-99)
  const ddd = parseInt(numbers.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Para celular (11 dígitos), o primeiro dígito após o DDD deve ser 9
  if (numbers.length === 11 && numbers.charAt(2) !== '9') return false;
  
  return true;
};

// Tipos de validação
export type ValidationStatus = 'idle' | 'valid' | 'invalid';

// Hook para gerenciar estado de validação com animação
export const getValidationClass = (status: ValidationStatus): string => {
  switch (status) {
    case 'valid':
      return 'border-green-500 bg-green-50 transition-all duration-300 ease-in-out';
    case 'invalid':
      return 'border-red-500 bg-red-50 transition-all duration-300 ease-in-out';
    default:
      return 'border-google-gray-300 transition-all duration-300 ease-in-out';
  }
};
