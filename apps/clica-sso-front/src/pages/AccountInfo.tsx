import { useState, useEffect } from 'react';
import { profileService } from '../services/profileService';
import { authCookies } from '../utils/cookies';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import ValidatedInput from '../components/ValidatedInput';
import AddressForm from '../components/AddressForm';
import type { UserProfile, UpdateUserProfileDto, AddressData } from '../types/profile';

const AccountInfo = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateUserProfileDto>({});
  const [addressData, setAddressData] = useState<AddressData>({
    cep: '',
    street: '',
    neighborhood: '',
    number: '',
    complement: '',
    city: '',
    state: '',
  });

  // Verifica se há token válido no início
  useEffect(() => {
    const token = authCookies.getAuthToken();
    const userData = authCookies.getUserData();

    console.log('chegou aqui', userData);
    
    if (!token || !userData) {
      setError('Você precisa estar logado para acessar esta página. Redirecionando...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    loadProfile();
  }, []);

  // Carrega o perfil ao montar o componente
  useEffect(() => {
    // Este useEffect foi removido pois agora carregamos no useEffect acima
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = authCookies.getAuthToken();
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }
      
      console.log('Fazendo requisição para buscar perfil...');
      const data = await profileService.getProfile();
      console.log('Dados do perfil recebidos:', data);
      
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email,
        document: data.document,
        phone: data.phone,
        address: data.address,
        metadata: data.metadata,
      });
      
      // Inicializa dados de endereço estruturado - prioriza address_json
      if (data.address_json) {
        setAddressData(data.address_json);
      } else if (data.addressData) {
        setAddressData(data.addressData);
      } else {
        // Se não tem dados estruturados, tenta parsear do campo address (compatibilidade)
        setAddressData({
          cep: '',
          street: data.address || '',
          neighborhood: '',
          number: '',
          complement: '',
          city: '',
          state: '',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar informações do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateUserProfileDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMetadataChange = (field: string, value: boolean | number | string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const handlePreferencesChange = (field: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        preferences: {
          ...prev.metadata?.preferences,
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Combina o endereço estruturado em uma string para compatibilidade
      const combinedAddress = `${addressData.street}${addressData.number ? ', ' + addressData.number : ''}${addressData.complement ? ' - ' + addressData.complement : ''}, ${addressData.neighborhood}, ${addressData.city}/${addressData.state} - ${addressData.cep}`.trim();
      
      const updateData = {
        ...formData,
        address: combinedAddress,
        address_json: addressData, // Salva dados estruturados no campo JSON
        addressData: addressData, // Mantém compatibilidade
      };
      
      const updatedProfile = await profileService.updateProfile(updateData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Informações atualizadas com sucesso!');
      
      // Atualiza os dados do usuário nos cookies se necessário
      if (formData.name || formData.email) {
        const currentUserData = authCookies.getUserData();
        if (currentUserData) {
          authCookies.updateUserData({
            ...currentUserData,
            name: formData.name || currentUserData.name,
            email: formData.email || currentUserData.email,
          });
        }
      }
    } catch (err) {
      setError('Erro ao atualizar informações');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        document: profile.document,
        phone: profile.phone,
        address: profile.address,
        metadata: profile.metadata,
      });
      
      // Reseta dados de endereço - prioriza address_json
      if (profile.address_json) {
        setAddressData(profile.address_json);
      } else if (profile.addressData) {
        setAddressData(profile.addressData);
      } else {
        setAddressData({
          cep: '',
          street: profile.address || '',
          neighborhood: '',
          number: '',
          complement: '',
          city: '',
          state: '',
        });
      }
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-google-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-google-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-google-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-google-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar perfil</p>
          <button 
            onClick={loadProfile}
            className="bg-google-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout user={profile ? { id: profile.id.toString(), name: profile.name, email: profile.email } : null}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-google-gray-900 mb-2">Informações da Conta</h1>
          <p className="text-google-gray-600">Gerencie suas informações pessoais e configurações de conta</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-google-gray-300 rounded-lg p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-medium text-3xl mx-auto mb-4">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-medium text-google-gray-900 mb-1">{profile.name}</h3>
              <p className="text-sm text-google-gray-600 mb-4">{profile.email}</p>
              <button className="bg-google-gray-100 text-google-gray-700 px-4 py-2 rounded-md text-sm hover:bg-google-gray-200 transition-colors">
                Alterar foto
              </button>
            </div>
          </div>

          {/* Account Information */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-google-gray-300 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-normal text-google-gray-900">Informações Pessoais</h2>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-google-blue hover:text-google-blue-hover transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 text-google-gray-700 border border-google-gray-300 rounded-md hover:bg-google-gray-100 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-google-blue text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      Salvar
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">Nome completo</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue"
                    />
                  ) : (
                    <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">{profile.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">E-mail</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue"
                    />
                  ) : (
                    <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">{profile.email}</p>
                  )}
                </div>

                {/* Document */}
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">CPF/CNPJ</label>
                  {isEditing ? (
                    <ValidatedInput
                      type="document"
                      value={formData.document || ''}
                      onChange={(value) => handleInputChange('document', value)}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      showValidation={true}
                    />
                  ) : (
                    <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">{profile.document || 'Não informado'}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">Telefone</label>
                  {isEditing ? (
                    <ValidatedInput
                      type="phone"
                      value={formData.phone || ''}
                      onChange={(value) => handleInputChange('phone', value)}
                      placeholder="(00) 00000-0000"
                      showValidation={true}
                    />
                  ) : (
                    <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">{profile.phone || 'Não informado'}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-google-gray-700 mb-2">Endereço</label>
                  {isEditing ? (
                    <AddressForm
                      value={addressData}
                      onChange={setAddressData}
                      showLabels={false}
                    />
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const addressInfo = profile.address_json || profile.addressData;
                        return addressInfo ? (
                          <>
                            <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">
                              {addressInfo.street} {addressInfo.number}
                              {addressInfo.complement && ` - ${addressInfo.complement}`}
                            </p>
                            <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">
                              {addressInfo.neighborhood}, {addressInfo.city}/{addressInfo.state}
                            </p>
                            <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">
                              CEP: {addressInfo.cep}
                            </p>
                          </>
                        ) : (
                          <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">
                            {profile.address || 'Não informado'}
                          </p>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="border-t border-google-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-google-gray-900 mb-4">Configurações</h3>
                  
                  <div className="space-y-4">
                    

                    {/* Newsletter */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="newsletter"
                        checked={formData.metadata?.newsletterSubscribed ?? false}
                        onChange={(e) => handleMetadataChange('newsletterSubscribed', e.target.checked)}
                        disabled={!isEditing}
                        className="w-4 h-4 text-google-blue bg-gray-100 border-gray-300 rounded focus:ring-google-blue focus:ring-2"
                      />
                      <label htmlFor="newsletter" className="text-sm text-google-gray-700">
                        Receber newsletter por e-mail
                      </label>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="notifications"
                        checked={formData.metadata?.preferences?.notifications ?? false}
                        onChange={(e) => handlePreferencesChange('notifications', e.target.checked)}
                        disabled={!isEditing}
                        className="w-4 h-4 text-google-blue bg-gray-100 border-gray-300 rounded focus:ring-google-blue focus:ring-2"
                      />
                      <label htmlFor="notifications" className="text-sm text-google-gray-700">
                        Receber notificações push
                      </label>
                    </div>

                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-google-gray-700 mb-2">Tema</label>
                      {isEditing ? (
                        <select
                          value={formData.metadata?.preferences?.theme || 'light'}
                          onChange={(e) => handlePreferencesChange('theme', e.target.value)}
                          className="px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue"
                        >
                          <option value="light">Claro</option>
                          <option value="dark">Escuro</option>
                          <option value="auto">Automático</option>
                        </select>
                      ) : (
                        <p className="text-google-gray-900 bg-google-gray-50 px-3 py-2 rounded-md">
                          {profile.metadata?.preferences?.theme === 'light' ? 'Claro' : 
                           profile.metadata?.preferences?.theme === 'dark' ? 'Escuro' : 'Automático'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="border-t border-google-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-google-gray-900 mb-4">Informações da Conta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-google-gray-600">ID da conta:</span>
                      <p className="text-google-gray-900 font-mono">{profile.id}</p>
                    </div>
                    <div>
                      <span className="text-google-gray-600">Criada em:</span>
                      <p className="text-google-gray-900">{new Date(profile.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-google-gray-600">Última atualização:</span>
                      <p className="text-google-gray-900">{new Date(profile.updatedAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default AccountInfo;
