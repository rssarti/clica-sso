export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ValidationRequest {
  token: string;
}

export interface ValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
