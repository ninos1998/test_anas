export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'editor' | 'writer';
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}