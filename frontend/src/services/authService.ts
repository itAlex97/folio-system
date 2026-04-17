import { apiPost } from '../api/client';
import type { LoginResponse } from '../types/auth';

interface LoginRequest {
  username: string;
  password: string;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  try {
    return await apiPost<LoginResponse, LoginRequest>('/auth/login', request);
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      throw new Error('Invalid user or password.');
    }

    throw error;
  }
}
