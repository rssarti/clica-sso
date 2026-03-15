/**
 * Extrai o parâmetro callback da URL atual
 */
export const getCallbackUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('callback') || urlParams.get('redirect_uri');
};

/**
 * Valida se a URL de callback é segura
 */
export const isValidCallbackUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    
    // Lista de domínios permitidos - adicione aqui os domínios das suas aplicações
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'clicatecnologia.com.br',
      'app.clicatecnologia.com.br',
      'sistema.clicatecnologia.com.br',
      'dev.clicazap.com.br'
      // Adicione outros domínios conforme necessário
    ];
    
    // Verifica se o protocolo é HTTPS (ou HTTP para desenvolvimento local)
    const isSecureProtocol = parsed.protocol === 'https:' || 
      (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'));
    
    // Verifica se o domínio está na lista permitida
    const isDomainAllowed = allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
    
    return isSecureProtocol && isDomainAllowed;
  } catch {
    return false;
  }
};

/**
 * Redireciona para a URL de callback com o token
 */
export const redirectToCallback = (token: string, callbackUrl?: string): void => {
  const callback = callbackUrl || getCallbackUrl();
  
  if (callback) {
    // Valida se a URL de callback é segura
    if (!isValidCallbackUrl(callback)) {
      console.error('URL de callback não é válida ou não está permitida:', callback);
      window.location.href = '/dashboard';
      return;
    }
    
    // Adiciona o token como parâmetro na URL de callback
    const url = new URL(callback);
    url.searchParams.set('token', token);
    url.searchParams.set('expires_in', '3600'); // Token expira em 1 hora
    
    console.log('Redirecionando para:', url.toString());
    window.location.href = url.toString();
  } else {
    // Se não há callback, redireciona para o dashboard
    window.location.href = '/dashboard';
  }
};

/**
 * Obtém o token da URL (usado na aplicação de destino)
 */
export const getTokenFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
};

/**
 * Obtém informações completas do token da URL
 */
export const getTokenDataFromUrl = (): { token: string | null; expiresIn: string | null } => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    token: urlParams.get('token'),
    expiresIn: urlParams.get('expires_in')
  };
};

/**
 * Remove o token da URL após processamento
 */
export const cleanUrlFromToken = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete('token');
  url.searchParams.delete('expires_in');
  window.history.replaceState({}, '', url.toString());
};
