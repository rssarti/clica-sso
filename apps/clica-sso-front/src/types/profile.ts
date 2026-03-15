export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  complement: string;
  city: string;
  state: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  document: string;
  phone: string;
  address: string;
  address_json?: AddressData; // Campo JSON com dados estruturados do endereço
  addressData?: AddressData; // Novo campo para endereço estruturado (compatibilidade)
  metadata: {
    age: number;
    newsletterSubscribed: boolean;
    preferences: {
      theme: string;
      notifications: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileDto {
  name?: string;
  email?: string;
  password?: string;
  document?: string;
  phone?: string;
  address?: string;
  address_json?: AddressData; // Campo JSON com dados estruturados do endereço
  addressData?: AddressData; // Novo campo para endereço estruturado (compatibilidade)
  metadata?: {
    age?: number;
    newsletterSubscribed?: boolean;
    preferences?: {
      theme?: string;
      notifications?: boolean;
    };
  };
}
