import { RequestOptions, AuthHeaders, ApiResponse, TokenRefreshResponse } from "../types";
import { RWorkListRoute } from "../constants/RConstants";

class ApiService {
    private static instance: ApiService;

    private constructor() { }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    private getCookieValue(cookieName: string): string | null {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === cookieName) {
                return decodeURIComponent(value);
            }
        }
        return null;
    }

    private getAuthHeaders(isFormData: boolean = false): AuthHeaders {
        const authToken = this.getCookieValue('auth_token');
        const studyID = this.getCookieValue('studyID');
        const studyInstanceUID = this.getCookieValue('studyInstanceUID');

        const headers: AuthHeaders = {
            'Authorization': `Bearer ${authToken}`,
        };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        if (studyID) headers['X-Study-ID'] = studyID;
        if (studyInstanceUID) headers['X-Study-UID'] = studyInstanceUID;

        return headers;
    }

    private async handleTokenExpiration(): Promise<boolean> {
        try {
            const refreshToken = this.getCookieValue('refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data: TokenRefreshResponse = await response.json();

            // Update cookies with new tokens
            const cookieOptions = 'path=/; secure; samesite=strict';
            document.cookie = `auth_token=${data.authToken}; ${cookieOptions}`;
            document.cookie = `refresh_token=${data.refreshToken}; ${cookieOptions}`;

            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            window.location.href = RWorkListRoute;
            return false;
        }
    }

    public async fetchWithAuth<T>(url: string, options: RequestOptions = {}, retryCount: number = 0): Promise<ApiResponse<T>> {
        try {
            const maxRetries = 1; // Only try to refresh the token once
            const isFormData = options.body instanceof FormData;

            const headers = {
                ...this.getAuthHeaders(),
                ...options.headers,
            };

            if (isFormData) {
                delete headers['Content-Type'];
            }

            const config: RequestOptions = {
                ...options,
                headers,
                credentials: 'include',
            };

            if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
                config.body = JSON.stringify(config.body);
            }

            const response = await fetch(url, config);

            if (response.status === 401 && retryCount < maxRetries) {
                const refreshSuccess = await this.handleTokenExpiration();
                if (refreshSuccess) {
                    return this.fetchWithAuth<T>(url, options, retryCount + 1);
                } else {
                    throw new Error('Authentication failed after token refresh');
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: T = await response.json();
            return {
                data,
                status: response.status,
                message: response.statusText,
            };

        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    public async get<T>(url: string, options: Omit<RequestOptions, 'method'> = {}) {
        return this.fetchWithAuth<T>(url, { ...options, method: 'GET' });
    }

    public async post<T>(url: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
        return this.fetchWithAuth<T>(url, { ...options, method: 'POST', body: data });
    }

    public async put<T>(url: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
        return this.fetchWithAuth<T>(url, { ...options, method: 'PUT', body: data });
    }

    public async delete<T>(url: string, options: Omit<RequestOptions, 'method'> = {}) {
        return this.fetchWithAuth<T>(url, { ...options, method: 'DELETE' });
    }
}

export const apiService = ApiService.getInstance();
export default apiService;