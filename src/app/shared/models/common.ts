/**
 * Datos de usuario base - usado en múltiples contextos
 */
export interface Address {
  street: string;
  number: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

export interface User {
  publicId: string;
  name: string;
  lastName: string;
  address?: Address;
  email: string;
  birthDate?: string;
  phone?: string;
  createdAt: string | null;
  removedAt: string | null;
  role: string | null;
}

export interface Participant {
  publicId: string;
  user: User;
  nickname: string;
}

/**
 * Empleo/Rol de un usuario (para respuestas de auth)
 */
export interface Employment {
  publicId: string;
  role: string;
  foodVenueName?: string;
}
