import { useState, useEffect } from 'react';
import { privacyService } from '../services/privacyService';
import { authCookies } from '../utils/cookies';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import Icon from '../components/Icon';
import type { 
  PrivacySettings, 
  PrivacyHistoryEntry, 
  DataExportRequest, 
  AccountDeletionRequest,
  UpdatePrivacySettingsDto 
} from '../types/privacy';

const Privacy = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [history, setHistory] = useState<{
    data: PrivacyHistoryEntry[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'export' | 'deletion'>('settings');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  const user = authCookies.getUserData();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = authCookies.getAuthToken();
        const userData = authCookies.getUserData();
        
        if (!token || !userData) {
          setError('Você precisa estar logado para acessar esta página. Redirecionando...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        // Carrega apenas as configurações inicialmente
        const settingsData = await privacyService.getPrivacySettings();
        setSettings(settingsData);
      } catch (err) {
        console.error('Erro ao carregar dados de privacidade:', err);
        setError('Erro ao carregar informações de privacidade');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Array vazio - executa apenas uma vez

  // useEffect para recarregar dados específicos quando a aba mudar
  useEffect(() => {
    const loadTabData = async () => {
      try {
        if (activeTab === 'history' && !history) {
          const historyData = await privacyService.getPrivacyHistory();
          setHistory(historyData);
        } else if (activeTab === 'export' && exportRequests.length === 0) {
          const exportsData = await privacyService.getDataExportRequests();
          setExportRequests(exportsData);
        } else if (activeTab === 'deletion' && deletionRequests.length === 0) {
          const deletionData = await privacyService.getAccountDeletionRequests();
          setDeletionRequests(deletionData);
        }
      } catch (err) {
        console.error('Erro ao carregar dados da aba:', err);
      }
    };

    loadTabData();
  }, [activeTab, history, exportRequests.length, deletionRequests.length]);

  const reloadData = async () => {
    try {
      setLoading(true);
      const settingsData = await privacyService.getPrivacySettings();
      setSettings(settingsData);
      
      if (activeTab === 'history') {
        const historyData = await privacyService.getPrivacyHistory();
        setHistory(historyData);
      } else if (activeTab === 'export') {
        const exportsData = await privacyService.getDataExportRequests();
        setExportRequests(exportsData);
      } else if (activeTab === 'deletion') {
        const deletionData = await privacyService.getAccountDeletionRequests();
        setDeletionRequests(deletionData);
      }
    } catch (err) {
      console.error('Erro ao recarregar dados:', err);
      setError('Erro ao recarregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = async (section: string, field: string, value: boolean | number) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: UpdatePrivacySettingsDto = {};

      // Map sections to DTO structure - only send the specific field that changed
      if (section === 'dataProcessing') {
        updateData.dataSharingSettings = {};
        if (field === 'thirdPartySharing') {
          updateData.dataSharingSettings.partners = value as boolean;
        } else if (field === 'analytics') {
          updateData.dataSharingSettings.analytics = value as boolean;
        } else if (field === 'marketing') {
          updateData.dataSharingSettings.productImprovement = value as boolean;
        } else if (field === 'personalization') {
          updateData.dataSharingSettings.personalization = value as boolean;
        }
      } else if (section === 'communications') {
        updateData.communicationSettings = {};
        if (field === 'emailMarketing') {
          updateData.communicationSettings.email = value as boolean;
        } else if (field === 'smsMarketing') {
          updateData.communicationSettings.sms = value as boolean;
        } else if (field === 'pushNotifications') {
          updateData.communicationSettings.push = value as boolean;
        } else if (field === 'newsletter') {
          updateData.communicationSettings.marketing = value as boolean;
        } else if (field === 'securityAlerts') {
          updateData.communicationSettings.securityAlerts = value as boolean;
        }
      } else if (section === 'visibility') {
        updateData.visibilitySettings = {};
        if (field === 'profilePublic') {
          updateData.visibilitySettings.profilePublic = value as boolean;
        } else if (field === 'showEmail') {
          updateData.visibilitySettings.showEmail = value as boolean;
        } else if (field === 'showPhone') {
          updateData.visibilitySettings.showPhone = value as boolean;
        } else if (field === 'showAddress') {
          updateData.visibilitySettings.showAddress = value as boolean;
        } else if (field === 'activityVisible') {
          updateData.visibilitySettings.activityVisible = value as boolean;
        }
      }

      const updatedSettings = await privacyService.updatePrivacySettings(updateData);
      setSettings(updatedSettings);
      setSuccess('Configurações atualizadas com sucesso!');
      
      // Recarrega o histórico apenas se a aba de histórico estiver ativa
      if (activeTab === 'history') {
        const updatedHistory = await privacyService.getPrivacyHistory();
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
      setError('Erro ao atualizar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleDataExport = async (requestReason?: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await privacyService.requestDataExport(requestReason);
      setSuccess('Solicitação de exportação criada com sucesso! Você receberá um email quando estiver pronta.');
      
      // Recarrega as solicitações
      const updatedExports = await privacyService.getDataExportRequests();
      setExportRequests(updatedExports);
    } catch (err) {
      console.error('Erro ao solicitar exportação:', err);
      setError('Erro ao solicitar exportação de dados');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await privacyService.requestAccountDeletion(deletionReason);
      setSuccess('Solicitação de exclusão de conta enviada. Nossa equipe analisará sua solicitação.');
      setShowDeletionModal(false);
      setDeletionReason('');
      
      // Recarrega dados
      const updatedDeletion = await privacyService.getAccountDeletionRequests();
      setDeletionRequests(updatedDeletion);
    } catch (err) {
      console.error('Erro ao solicitar exclusão:', err);
      setError('Erro ao solicitar exclusão de conta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-google-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-google-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-google-gray-600">Carregando configurações de privacidade...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-google-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar configurações</p>
          <button 
            onClick={reloadData}
            className="bg-google-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout user={user ? { id: user.id, name: user.name, email: user.email } : null}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-google-gray-900 mb-2">Privacidade e Dados</h1>
          <p className="text-google-gray-600">Gerencie suas configurações de privacidade e controle seus dados pessoais</p>
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

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-google-gray-200">
            {[
              { key: 'settings', label: 'Configurações', icon: 'settings' as const },
              { key: 'history', label: 'Histórico', icon: 'history' as const },
              { key: 'export', label: 'Exportar Dados', icon: 'download' as const },
              { key: 'deletion', label: 'Exclusão de Conta', icon: 'delete' as const },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-google-blue text-google-blue'
                    : 'border-transparent text-google-gray-500 hover:text-google-gray-700 hover:border-google-gray-300'
                }`}
              >
                <span className="mr-2">
                  <Icon name={tab.icon} className="text-base" />
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-google-gray-300 rounded-lg p-6">
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-normal text-google-gray-900 mb-6">Configurações de Privacidade</h2>
              
              {/* Processamento de Dados */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-google-gray-900 mb-4 flex items-center">
                  <span className="mr-2">
                    <Icon name="search" className="text-base" />
                  </span>
                  Processamento de Dados
                </h3>
                <div className="space-y-4 pl-8">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Análise e Métricas</h4>
                      <p className="text-sm text-google-gray-600">Usar seus dados para análises internas e melhorias</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.dataProcessing.analytics}
                        onChange={(e) => handleSettingsChange('dataProcessing', 'analytics', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Marketing e Publicidade</h4>
                      <p className="text-sm text-google-gray-600">Usar seus dados para campanhas de marketing direcionadas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.dataProcessing.marketing}
                        onChange={(e) => handleSettingsChange('dataProcessing', 'marketing', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Personalização</h4>
                      <p className="text-sm text-google-gray-600">Personalizar sua experiência com base em seus dados</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.dataProcessing.personalization}
                        onChange={(e) => handleSettingsChange('dataProcessing', 'personalization', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Compartilhamento com Terceiros</h4>
                      <p className="text-sm text-google-gray-600">Permitir compartilhamento de dados com parceiros</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.dataProcessing.thirdPartySharing}
                        onChange={(e) => handleSettingsChange('dataProcessing', 'thirdPartySharing', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Comunicações */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-google-gray-900 mb-4 flex items-center">
                  <span className="mr-2">
                    <Icon name="email" className="text-base" />
                  </span>
                  Comunicações
                </h3>
                <div className="space-y-4 pl-8">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Marketing por E-mail</h4>
                      <p className="text-sm text-google-gray-600">Receber ofertas e promoções por e-mail</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.communications.emailMarketing}
                        onChange={(e) => handleSettingsChange('communications', 'emailMarketing', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Newsletter</h4>
                      <p className="text-sm text-google-gray-600">Receber newsletter com novidades e atualizações</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.communications.newsletter}
                        onChange={(e) => handleSettingsChange('communications', 'newsletter', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Notificações Push</h4>
                      <p className="text-sm text-google-gray-600">Receber notificações push no navegador</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.communications.pushNotifications}
                        onChange={(e) => handleSettingsChange('communications', 'pushNotifications', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t pt-4">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Alertas de Segurança</h4>
                      <p className="text-sm text-google-gray-600">Notificações importantes sobre segurança</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.communications.securityAlerts}
                        onChange={(e) => handleSettingsChange('communications', 'securityAlerts', e.target.checked)}
                        disabled={true}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Visibilidade */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-google-gray-900 mb-4 flex items-center">
                  <span className="mr-2">
                    <Icon name="visibility" className="text-base" />
                  </span>
                  Visibilidade do Perfil
                </h3>
                <div className="space-y-4 pl-8">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Perfil Público</h4>
                      <p className="text-sm text-google-gray-600">Tornar seu perfil visível para outros usuários</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.visibility.profilePublic}
                        onChange={(e) => handleSettingsChange('visibility', 'profilePublic', e.target.checked)}
                        disabled={saving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <h4 className="font-medium text-google-gray-900">Mostrar E-mail</h4>
                      <p className="text-sm text-google-gray-600">Exibir seu e-mail no perfil público</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.visibility.showEmail}
                        onChange={(e) => handleSettingsChange('visibility', 'showEmail', e.target.checked)}
                        disabled={saving || !settings.visibility.profilePublic}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!settings.visibility.profilePublic ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div>
              <h2 className="text-xl font-normal text-google-gray-900 mb-6">Histórico de Atividades</h2>
              
              <div className="space-y-4">
                {!history || history.data.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">
                      <Icon name="history" className="text-6xl text-google-gray-400" />
                    </div>
                    <p className="text-google-gray-600">Nenhuma atividade registrada ainda</p>
                  </div>
                ) : (
                  history.data.map((entry: PrivacyHistoryEntry) => (
                    <div key={entry.id} className="border border-google-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {entry.action === 'SETTINGS_CHANGED' && <Icon name="settings" className="text-base" />}
                              {entry.action === 'DATA_EXPORTED' && <Icon name="download" className="text-base" />}
                              {entry.action === 'DELETION_REQUESTED' && <Icon name="delete" className="text-base" />}
                              {entry.action === 'DELETION_CANCELLED' && <Icon name="cancel" className="text-base" />}
                              {entry.action === 'PRIVACY_UPDATED' && <Icon name="privacy" className="text-base" />}
                              {entry.action === 'ACCOUNT_ACCESSED' && <Icon name="account" className="text-base" />}
                              {entry.action === 'PASSWORD_CHANGED' && <Icon name="security" className="text-base" />}
                              {entry.action === 'LOGIN_SUCCESSFUL' && <Icon name="success" className="text-base" />}
                              {entry.action === 'LOGIN_FAILED' && <Icon name="error" className="text-base" />}
                              {entry.action === 'LOGOUT' && <Icon name="logout" className="text-base" />}
                            </span>
                            <h3 className="font-medium text-google-gray-900">
                              {entry.action === 'SETTINGS_CHANGED' && 'Configurações Alteradas'}
                              {entry.action === 'DATA_EXPORTED' && 'Dados Exportados'}
                              {entry.action === 'DELETION_REQUESTED' && 'Exclusão Solicitada'}
                              {entry.action === 'DELETION_CANCELLED' && 'Exclusão Cancelada'}
                              {entry.action === 'PRIVACY_UPDATED' && 'Privacidade Atualizada'}
                              {entry.action === 'ACCOUNT_ACCESSED' && 'Conta Acessada'}
                              {entry.action === 'PASSWORD_CHANGED' && 'Senha Alterada'}
                              {entry.action === 'LOGIN_SUCCESSFUL' && 'Login Realizado'}
                              {entry.action === 'LOGIN_FAILED' && 'Tentativa de Login'}
                              {entry.action === 'LOGOUT' && 'Logout Realizado'}
                            </h3>
                          </div>
                          <p className="text-google-gray-600 mb-2">{entry.description}</p>
                          <div className="text-sm text-google-gray-500">
                            {entry.ipAddress && <p>IP: {entry.ipAddress}</p>}
                            <p>Data: {new Date(entry.timestamp).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'export' && (
            <div>
              <h2 className="text-xl font-normal text-google-gray-900 mb-6">Exportar Seus Dados</h2>
              
              <div className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="text-blue-600 mr-3 text-xl">
                      <Icon name="info" className="text-xl" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900 mb-1">Sobre a Exportação de Dados</h3>
                      <p className="text-blue-800 text-sm">
                        Você pode solicitar uma cópia de todos os seus dados pessoais. O arquivo será preparado em até 30 dias 
                        e você receberá um link por e-mail para download.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { key: 'profile', label: 'Dados do Perfil', description: 'Nome, e-mail, telefone, endereço' },
                    { key: 'activity', label: 'Histórico de Atividades', description: 'Logs de acesso e ações realizadas' },
                    { key: 'preferences', label: 'Preferências', description: 'Configurações de privacidade e notificações' },
                    { key: 'communications', label: 'Comunicações', description: 'Histórico de e-mails e mensagens' },
                  ].map((dataType) => (
                    <div key={dataType.key} className="border border-google-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`export-${dataType.key}`}
                          defaultChecked
                          className="w-4 h-4 text-google-blue bg-gray-100 border-gray-300 rounded focus:ring-google-blue focus:ring-2"
                        />
                        <div>
                          <label htmlFor={`export-${dataType.key}`} className="font-medium text-google-gray-900 cursor-pointer">
                            {dataType.label}
                          </label>
                          <p className="text-sm text-google-gray-600">{dataType.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleDataExport('Solicitação de exportação de dados conforme LGPD')}
                  disabled={saving}
                  className="bg-google-blue text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <Icon name="download" className="text-base mr-1" />
                  Solicitar Exportação
                </button>
              </div>

              {/* Solicitações Anteriores */}
              {exportRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-google-gray-900 mb-4">Solicitações Anteriores</h3>
                  <div className="space-y-3">
                    {exportRequests.map((request) => (
                      <div key={request.id} className="border border-google-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                request.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                request.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {request.status === 'completed' && (
                                  <>
                                    <Icon name="success" className="text-xs mr-1" />
                                    Concluído
                                  </>
                                )}
                                {request.status === 'processing' && (
                                  <>
                                    <Icon name="refresh" className="text-xs mr-1" />
                                    Processando
                                  </>
                                )}
                                {request.status === 'failed' && (
                                  <>
                                    <Icon name="error" className="text-xs mr-1" />
                                    Falhou
                                  </>
                                )}
                                {request.status === 'pending' && (
                                  <>
                                    <Icon name="info" className="text-xs mr-1" />
                                    Pendente
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-google-gray-600">
                              Solicitado em: {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                            </p>
                            {request.completedAt && (
                              <p className="text-sm text-google-gray-600">
                                Concluído em: {new Date(request.completedAt).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          {request.status === 'completed' && request.downloadUrl && (
                            <button
                              onClick={() => privacyService.downloadDataExport(request.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                            >
                              <Icon name="download" className="text-xs mr-1" />
                              Baixar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'deletion' && (
            <div>
              <h2 className="text-xl font-normal text-google-gray-900 mb-6">Exclusão de Conta</h2>
              
              {deletionRequests.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {deletionRequests.map((request) => (
                    <div key={request.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start">
                        <div className="text-yellow-600 mr-3 text-xl">
                          <Icon name="warning" className="text-xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-yellow-900 mb-2">Solicitação de Exclusão</h3>
                          <p className="text-yellow-800 mb-4">
                            Solicitação enviada em {' '}
                            {new Date(request.requestedAt).toLocaleDateString('pt-BR')} 
                            {request.reason && ` - Motivo: ${request.reason}`}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              request.status === 'approved' ? 'bg-red-100 text-red-800' :
                              request.status === 'rejected' ? 'bg-gray-100 text-gray-800' :
                              request.status === 'cancelled' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {request.status === 'pending' && (
                                <>
                                  <Icon name="info" className="text-xs mr-1" />
                                  Pendente
                                </>
                              )}
                              {request.status === 'approved' && (
                                <>
                                  <Icon name="success" className="text-xs mr-1" />
                                  Aprovada
                                </>
                              )}
                              {request.status === 'rejected' && (
                                <>
                                  <Icon name="error" className="text-xs mr-1" />
                                  Rejeitada
                                </>
                              )}
                              {request.status === 'cancelled' && (
                                <>
                                  <Icon name="cancel" className="text-xs mr-1" />
                                  Cancelada
                                </>
                              )}
                              {request.status === 'completed' && (
                                <>
                                  <Icon name="success" className="text-xs mr-1" />
                                  Concluída
                                </>
                              )}
                            </span>
                          </div>
                          {request.status === 'pending' && (
                            <button
                              onClick={async () => {
                                try {
                                  await privacyService.cancelAccountDeletionRequest(request.id);
                                  const updatedRequests = await privacyService.getAccountDeletionRequests();
                                  setDeletionRequests(updatedRequests);
                                  setSuccess('Solicitação de exclusão cancelada com sucesso!');
                                } catch (error) {
                                  console.error('Erro ao cancelar solicitação:', error);
                                  setError('Erro ao cancelar solicitação');
                                }
                              }}
                              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-transparent"
                            >
                              Cancelar Solicitação
                            </button>
                          )}
                          {request.rejectionReason && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm text-red-800">
                                <strong>Motivo da rejeição:</strong> {request.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              
              {deletionRequests.filter(r => r.status === 'pending').length === 0 && (
                <div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start">
                      <div className="text-red-600 mr-3 text-xl">
                        <Icon name="warning" className="text-xl" />
                      </div>
                      <div>
                        <h3 className="font-medium text-red-900 mb-2">Atenção: Exclusão Permanente</h3>
                        <div className="text-red-800 text-sm space-y-2">
                          <p>A exclusão da conta é uma ação irreversível que resultará em:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Remoção permanente de todos os seus dados pessoais</li>
                            <li>Cancelamento de todos os serviços ativos</li>
                            <li>Perda de acesso a todas as funcionalidades</li>
                            <li>Impossibilidade de recuperar dados após a exclusão</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-google-gray-700 mb-2">
                        Motivo da exclusão (opcional)
                      </label>
                      <textarea
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        rows={3}
                        placeholder="Nos ajude a melhorar: conte-nos por que está excluindo sua conta..."
                        className="w-full px-3 py-2 border border-google-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowDeletionModal(true)}
                        disabled={saving}
                        className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        <Icon name="delete" className="text-base mr-1" />
                        Solicitar Exclusão da Conta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {showDeletionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar Exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza de que deseja solicitar a exclusão de sua conta? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeletionModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAccountDeletion}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Enviando...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};

export default Privacy;
