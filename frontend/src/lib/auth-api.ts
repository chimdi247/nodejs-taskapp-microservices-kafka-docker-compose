import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const response = await apiClient.post<{ data: { user: User } }>("/auth/register", payload);
    return response.data.data.user;
  },

  async login(payload: LoginPayload): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<{ data: { token: string; user: User } }>(
      "/auth/login",
      payload,
    );
    return response.data.data;
  },

  async me(): Promise<User> {
    const response = await apiClient.get<{ data: { user: User } }>("/auth/me");
    return response.data.data.user;
  },
};
