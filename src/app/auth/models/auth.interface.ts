export interface Auth {
  authResponse: AuthResponse;
}

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
}

