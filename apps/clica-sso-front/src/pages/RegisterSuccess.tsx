import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface RegisterSuccessState {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
}

const RegisterSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as RegisterSuccessState;

  // Se não há dados do usuário no state, redireciona para registro
  useEffect(() => {
    if (!state?.user) {
      navigate('/register', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-google-gray-300 rounded-lg shadow-sm p-8 w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-normal text-google-gray-900 mb-2">Seja bem-vindo!</h1>
          <h2 className="text-lg font-medium text-green-600 mb-4">Conta criada com sucesso</h2>
        </div>

        {/* User Info */}
        <div className="bg-google-gray-100 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-medium text-google-gray-700 mb-3">Dados da sua conta:</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-google-gray-600">Nome:</span>
              <span className="text-sm font-medium text-google-gray-900">{state.user.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-google-gray-600">Email:</span>
              <span className="text-sm font-medium text-google-gray-900">{state.user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-google-gray-600">ID:</span>
              <span className="text-sm font-mono text-google-gray-700">#{state.user.id}</span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-700 leading-relaxed">
            {state.message || 'Sua conta foi criada com sucesso! Agora você pode fazer seu primeiro login.'}
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-google-gray-700 mb-2">Próximos passos:</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-google-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <p className="text-sm text-blue-700">
                Clique no botão abaixo para ir à página de login
              </p>
            </div>
            <div className="flex items-start gap-3 mt-3">
              <div className="w-5 h-5 bg-google-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <p className="text-sm text-blue-700">
                Use seu email e senha para fazer o primeiro login
              </p>
            </div>
            <div className="flex items-start gap-3 mt-3">
              <div className="w-5 h-5 bg-google-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">3</span>
              </div>
              <p className="text-sm text-blue-700">
                Acesse seu dashboard e explore as funcionalidades
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/login"
            className="w-full bg-google-blue text-white rounded px-4 py-3 text-sm font-medium hover:bg-google-blue-hover transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
            </svg>
            Fazer meu primeiro login
          </Link>
          
          <Link
            to="/register"
            className="w-full bg-google-gray-200 text-google-gray-700 rounded px-4 py-2.5 text-sm font-medium hover:bg-google-gray-300 transition-colors"
          >
            Criar outra conta
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-4 border-t border-google-gray-200">
          <p className="text-xs text-google-gray-500 leading-relaxed">
            Caso tenha problemas para fazer login, verifique se está usando o email e senha corretos.
            Em caso de dúvidas, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess;
