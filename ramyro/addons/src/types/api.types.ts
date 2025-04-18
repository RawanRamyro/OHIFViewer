export interface AuthHeaders {
    Authorization: string;
    'Content-Type'?: string;
    'X-Study-ID'?: string;
    'X-Study-UID'?: string;
    [key: string]: string | undefined;
}

export interface ApiResponse<T = any> {
    data: T;
    status: number;
    message?: string;
}

export interface TokenRefreshResponse {
    authToken: string;
    refreshToken: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions extends RequestInit {
    headers?: HeadersInit;
    body?: any;
}