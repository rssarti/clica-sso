import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { redirectToCallback, getCallbackUrl } from '../utils/url';
import { authCookies } from '../utils/cookies';
import type { RegisterData } from '../types/auth';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authCookies.isAuthenticated()) {
      const callbackUrl = getCallbackUrl();
      if (callbackUrl) {
        const token = authCookies.getAuthToken();
        if (token) {
          redirectToCallback(token, callbackUrl);
        }
      } else {
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

  const validateForm = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const response = await authService.register(formData);
      
      // Redireciona para página de sucesso com os dados do usuário
      navigate('/register-success', {
        state: {
          user: response.user,
          message: response.message,
        },
        replace: true,
      });
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-google-gray-300 rounded-lg shadow-sm p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-google-blue">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h1 className="text-2xl font-normal text-google-gray-900 text-center mb-2">Registrar-se</h1>
        <p className="text-sm text-google-gray-600 text-center mb-6">Crie sua conta para continuar</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-google-gray-700 mb-1">Nome</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Seu nome completo"
              disabled={loading}
              className="w-full px-3 py-2 border border-google-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
          
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
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              className="w-full px-3 py-2 border border-google-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-google-gray-700 mb-1">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirme sua senha"
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
            {loading ? 'Criando conta...' : 'Registrar-se'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-google-gray-600">
            Já tem uma conta?{' '}
            <Link to={`/login${window.location.search}`} className="text-google-blue hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
