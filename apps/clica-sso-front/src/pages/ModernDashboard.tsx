import { useState, useEffect } from 'react';
import TokenValidator from '../components/TokenValidator';
import { authCookies } from '../utils/cookies';
import type { ValidationResponse } from '../types/auth';

const Dashboard = () => {
  const [user, setUser] = useState<ValidationResponse['user'] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleValidToken = (userData: ValidationResponse['user']) => {
    setUser(userData);
    setIsAuthenticated(true);
    console.log(userData);
  };

  const handleInvalidToken = () => {
    setIsAuthenticated(false);
    // Redireciona para login se não autenticado
    window.location.href = '/logout';
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Limpa os cookies de autenticação
    authCookies.clearAuthData();
    window.location.href = '/login';
  };

  // Se não há token na URL, verifica se há um usuário logado nos cookies
  useEffect(() => {


    if (!isAuthenticated && !window.location.search.includes('token')) {
      const savedUser = authCookies.getUserData();
      if (savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
    }
  }, [isAuthenticated]);

  // Renova os cookies quando autenticado
  useEffect(() => {
    if (user && isAuthenticated) {
      // Os dados já estão salvos nos cookies pelo login/register
      // Aqui apenas renovamos os cookies para estender a expiração
      authCookies.refreshCookies();
    }
  }, [user, isAuthenticated]);

  const DashboardContent = () => (
    <div className="modern-dashboard">
      {/* Header */}
      <header className="dashboard-header-modern">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">Sistema SSO</h1>
          </div>
          <div className="user-menu">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="user-profile">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <h2>Bem-vindo, {user?.name || 'Usuário'}!</h2>
              <p>Gerencie suas informações, privacidade e segurança para que o Sistema funcione melhor para você.</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Pesquisar no Sistema SSO"
              className="search-input"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-chip">Minha senha</button>
          <button className="action-chip">Dispositivos</button>
          <button className="action-chip">Gerenciador de senhas</button>
          <button className="action-chip">Minha atividade</button>
          <button className="action-chip">E-mail</button>
        </div>

        {/* Cards Grid */}
        <div className="cards-grid">
          {/* Account Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon account-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Informações da Conta</h3>
            </div>
            <div className="card-content">
              <p>Como membro do Sistema SSO, você tem acesso completo às funcionalidades.</p>
              <div className="card-details">
                <div className="detail-item">
                  <span className="detail-label">ID do usuário:</span>
                  <span className="detail-value">{user?.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{user?.email}</span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="card-action-btn">
                Gerenciar conta
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Privacy Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon privacy-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Privacidade e personalização</h3>
            </div>
            <div className="card-content">
              <p>Veja os dados na sua Conta do Sistema e escolha qual atividade será salva para personalizar sua experiência.</p>
            </div>
            <div className="card-footer">
              <button className="card-action-btn">
                Gerenciar seus dados e sua privacidade
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Security Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon security-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Segurança</h3>
            </div>
            <div className="card-content">
              <p>Configurações e recomendações para ajudar a manter sua conta segura.</p>
              <div className="security-status">
                <div className="status-indicator secure">
                  <div className="status-dot"></div>
                  <span>Conta protegida</span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="card-action-btn">
                Revisar configurações de segurança
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Apps Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon apps-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <h3>Aplicações conectadas</h3>
            </div>
            <div className="card-content">
              <p>Gerencie as aplicações que têm acesso à sua conta SSO.</p>
              <div className="apps-count">
                <span className="count-number">3</span>
                <span className="count-label">aplicações conectadas</span>
              </div>
            </div>
            <div className="card-footer">
              <button className="card-action-btn">
                Gerenciar aplicações
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M7 17L17 7"/>
                  <path d="M7 7h10v10"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-links">
          <a href="#privacy">Privacidade</a>
          <a href="#terms">Termos</a>
          <a href="#help">Ajuda</a>
          <a href="#about">Sobre</a>
        </div>
      </footer>
    </div>
  );

  // Se não há token na URL e não está autenticado, redireciona para login
  if (!window.location.search.includes('token') && !isAuthenticated) {
    return (
      <div className="auth-required-modern">
        <div className="auth-required-content">
          <div className="auth-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2>Autenticação Necessária</h2>
          <p>Você precisa estar logado para acessar esta página.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="auth-required-btn"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <TokenValidator 
      onValidToken={handleValidToken}
      onInvalidToken={handleInvalidToken}
    >
      <DashboardContent />
    </TokenValidator>
  );
};

export default Dashboard;
