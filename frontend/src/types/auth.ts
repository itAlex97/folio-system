export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: string;
  isAdmin: boolean;
  programCode: string;
  programName: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}
