export enum UserRole {
  POLICE = 'police',
  VILLAGE_CHIEF = 'village_chief',
}

export enum ViolationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  RETURNED = 'returned',
}

export enum MessageStatus {
  UNREAD = 'unread',
  READ = 'read',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  TIMEOUT = 'timeout',
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
