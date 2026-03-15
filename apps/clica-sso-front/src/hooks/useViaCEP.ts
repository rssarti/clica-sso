import { useState } from 'react';

export interface ViaCEPAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  complement: string;
  city: string;
  state: string;
}

export const useViaCEP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCEP = (cep: string): string => {
    const numbers = cep.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validateCEP = (cep: string): boolean => {
    const numbers = cep.replace(/\D/g, '');
    return numbers.length === 8 && /^\d{8}$/.test(numbers);
  };

  const searchCEP = async (cep: string): Promise<AddressData | null> => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (!validateCEP(cleanCEP)) {
      setError('CEP inválido');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }

      const data: ViaCEPAddress = await response.json();

      if (data.cep && !('erro' in data)) {
        return {
          cep: formatCEP(data.cep),
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          number: '',
          complement: data.complemento || '',
          city: data.localidade || '',
          state: data.uf || '',
        };
      } else {
        setError('CEP não encontrado');
        return null;
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setError('Erro ao consultar CEP. Verifique sua conexão.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    searchCEP,
    formatCEP,
    validateCEP,
    loading,
    error,
  };
};
