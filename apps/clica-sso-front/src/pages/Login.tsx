import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { redirectToCallback, getCallbackUrl } from '../utils/url';
import { authCookies } from '../utils/cookies';
import type { LoginData } from '../types/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica se o usuário já está autenticado
  useEffect(() => {
    const callbackUrl = getCallbackUrl();
    
    console.log('Login useEffect - Callback URL:', callbackUrl);
    console.log('Login useEffect - Já autenticado?', authCookies.isAuthenticated());
    
    if (authCookies.isAuthenticated()) {
      if (callbackUrl) {
        // Se há callback, redireciona com o token salvo
        const token = authCookies.getAuthToken();
        console.log('Redirecionando usuário já autenticado para callback:', callbackUrl);
        if (token) {
          redirectToCallback(token, callbackUrl);
        }
      } else {
        // Se não há callback, vai para o dashboard
        console.log('Redirecionando usuário já autenticado para dashboard');
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Iniciando processo de login...');
    const callbackUrl = getCallbackUrl();
    console.log('Callback URL encontrada:', callbackUrl);

    try {
      const response = await authService.login(formData);
      console.log('Login bem-sucedido, salvando dados de autenticação...');
      
      // Salva os dados de autenticação nos cookies
      authCookies.setAuthData(response);
      
      console.log('Redirecionando com token para callback...');
      // Redireciona para o callback com o token
      redirectToCallback(response.access_token);
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-google-gray-300 rounded-lg shadow-sm p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-google-blue">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <circle cx="12" cy="16" r="1"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="text-2xl font-normal text-google-gray-900 text-center mb-2">Acesse sua conta</h1>
        <p className="text-sm text-google-gray-600 text-center mb-6">Entre com sua conta para continuar</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-google-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="seu@email.com"
              disabled={loading}
              className="w-full px-3 py-2 border border-google-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-google-gray-700 mb-1">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Sua senha"
              disabled={loading}
              className="w-full px-3 py-2 border border-google-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-google-blue text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-google-gray-600">
            Não tem uma conta?{' '}
            <Link to={`/register${window.location.search}`} className="text-google-blue hover:underline">
              Registrar-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
