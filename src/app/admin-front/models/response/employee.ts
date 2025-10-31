import Address from "../request/address";

// Enum de roles
export enum RoleType {
  ROLE_GUEST = 'ROLE_GUEST',
  ROLE_CLIENT = 'ROLE_CLIENT',
  ROLE_STAFF = 'ROLE_STAFF',
  ROLE_MANAGER = 'ROLE_MANAGER',
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_ROOT = 'ROLE_ROOT'
}


export interface PaginatedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}


export type EmployeeResponse = PaginatedResponse<EmploymentContent>;

export interface EmploymentContent {
  publicId: string;
  user: UserDetail;
  role: RoleType;
  foodVenue: string;
}

export interface UserDetail {
  publicId: string;
  name: string;
  lastName: string;
  address: Address;
  email: string;
  birthDate: string;
  phone: string;
}



export interface EmployeeRequest {
  userEmail: string;
  role: RoleType;
}


export const RoleLabels: Record<RoleType, string> = {
  [RoleType.ROLE_GUEST]: 'Invitado',
  [RoleType.ROLE_CLIENT]: 'Cliente',
  [RoleType.ROLE_STAFF]: 'Mesero',
  [RoleType.ROLE_MANAGER]: 'Encargado',
  [RoleType.ROLE_ADMIN]: 'Administrador',
  [RoleType.ROLE_ROOT]: 'Root'
};
