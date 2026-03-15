import { useState } from 'react';
import { useViaCEP, type AddressData } from '../hooks/useViaCEP';

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

const AddressForm = ({ 
  value, 
  onChange, 
  disabled = false, 
  showLabels = true 
}: AddressFormProps) => {
  const { searchCEP, formatCEP, validateCEP, loading, error } = useViaCEP();
  const [cepStatus, setCepStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');

  const handleCEPChange = async (cep: string) => {
    const formattedCEP = formatCEP(cep);
    
    onChange({
      ...value,
      cep: formattedCEP,
    });

    // Se o CEP estiver completo, busca automaticamente
    if (validateCEP(formattedCEP)) {
      setCepStatus('searching');
      const addressData = await searchCEP(formattedCEP);
      
      if (addressData) {
        onChange({
          ...value,
          ...addressData,
          number: value.number, // Preserva o número se já foi preenchido
        });
        setCepStatus('found');
      } else {
        setCepStatus('error');
      }
    } else {
      setCepStatus('idle');
    }
  };

  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <div className="space-y-4">
      {/* CEP */}
      <div className="relative">
        {showLabels && (
          <label className="block text-sm font-medium text-google-gray-700 mb-2">
            CEP *
          </label>
        )}
        <div className="relative">
          <input
            type="text"
            value={value.cep}
            onChange={(e) => handleCEPChange(e.target.value)}
            placeholder="00000-000"
            disabled={disabled}
            maxLength={9}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-all duration-300 ${
              cepStatus === 'found' 
                ? 'border-green-500 bg-green-50' 
                : cepStatus === 'error' 
                ? 'border-red-500 bg-red-50' 
                : 'border-google-gray-300'
            } ${loading ? 'pr-10' : ''}`}
          />
          
          {/* Ícone de status */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-google-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {cepStatus === 'found' && !loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
          )}
          
          {cepStatus === 'error' && !loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        
        {cepStatus === 'found' && (
          <p className="mt-1 text-sm text-green-600">Endereço encontrado automaticamente</p>
        )}
      </div>

      {/* Rua e Número */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          {showLabels && (
            <label className="block text-sm font-medium text-google-gray-700 mb-2">
              Endereço *
            </label>
          )}
          <input
            type="text"
            value={value.street}
            onChange={(e) => handleFieldChange('street', e.target.value)}
            placeholder="Rua, Avenida, etc."
            disabled={disabled}
            className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors"
          />
        </div>
        
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-google-gray-700 mb-2">
              Número *
            </label>
          )}
          <input
            type="text"
            value={value.number}
            onChange={(e) => handleFieldChange('number', e.target.value)}
            placeholder="123"
            disabled={disabled}
            className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors"
          />
        </div>
      </div>

      {/* Bairro e Complemento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-google-gray-700 mb-2">
              Bairro
            </label>
          )}
          <input
            type="text"
            value={value.neighborhood}
            onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
            placeholder="Bairro"
            disabled={disabled}
            className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors"
          />
        </div>
        
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-google-gray-700 mb-2">
              Complemento
            </label>
          )}
          <input
            type="text"
            value={value.complement}
            onChange={(e) => handleFieldChange('complement', e.target.value)}
            placeholder="Apt, Bloco, etc."
            disabled={disabled}
            className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors"
          />
        </div>
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {showLabels && (
            <label className="block text-sm font-medium text-google-gray-700 mb-2">
              Cidade
            </label>
          )}
          <input
            type="text"
            value={value.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder="Cidade"
            disabled={disabled}
            className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors"
          />
        </div>
        
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-google-gray-700 mb-2">
              Estado
            </label>
          )}
          <input
            type="text"
            value={value.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            placeholder="UF"
            disabled={disabled}
            maxLength={2}
            className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-colors uppercase"
          />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
