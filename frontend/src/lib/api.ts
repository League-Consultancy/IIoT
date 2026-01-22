import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

class ApiClient {
    private client: AxiosInstance;
    private accessToken: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use((config) => {
            const token = this.accessToken || this.getStoredToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expired, try to refresh
                    const refreshed = await this.tryRefreshToken();
                    if (refreshed && error.config) {
                        return this.client.request(error.config);
                    }
                    // Redirect to login
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    setAccessToken(token: string): void {
        this.accessToken = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token);
        }
    }

    private getStoredToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('accessToken');
        }
        return null;
    }

    private getRefreshToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('refreshToken');
        }
        return null;
    }

    setRefreshToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('refreshToken', token);
        }
    }

    clearTokens(): void {
        this.accessToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }

    private async tryRefreshToken(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refresh_token: refreshToken,
            });

            if (response.data.success) {
                this.setAccessToken(response.data.data.accessToken);
                this.setRefreshToken(response.data.data.refreshToken);
                return true;
            }
        } catch {
            this.clearTokens();
        }
        return false;
    }

    // Auth endpoints
    async login(email: string, password: string, tenantSlug?: string) {
        const response = await this.client.post('/auth/login', {
            email,
            password,
            tenant_slug: tenantSlug,
        });
        if (response.data.success) {
            this.setAccessToken(response.data.data.accessToken);
            this.setRefreshToken(response.data.data.refreshToken);
        }
        return response.data;
    }

    async logout() {
        try {
            await this.client.post('/auth/logout');
        } finally {
            this.clearTokens();
        }
    }

    async getMe() {
        const response = await this.client.get('/auth/me');
        return response.data;
    }

    // Device endpoints
    async getDevices(page = 1, limit = 50, factoryId?: string) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (factoryId) params.append('factory_id', factoryId);
        const response = await this.client.get(`/devices?${params}`);
        return response.data;
    }

    async getDevice(deviceId: string) {
        const response = await this.client.get(`/devices/${deviceId}`);
        return response.data;
    }

    // Session endpoints
    async getDeviceSessions(deviceId: string, dateFrom?: string, dateTo?: string, page = 1, limit = 100) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const response = await this.client.get(`/devices/${deviceId}/sessions?${params}`);
        return response.data;
    }

    // Analytics endpoints
    async getDailyAnalytics(deviceId: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const response = await this.client.get(`/devices/${deviceId}/analytics/daily?${params}`);
        return response.data;
    }

    async getWeeklyAnalytics(deviceId: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const response = await this.client.get(`/devices/${deviceId}/analytics/weekly?${params}`);
        return response.data;
    }

    async getMonthlyAnalytics(deviceId: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const response = await this.client.get(`/devices/${deviceId}/analytics/monthly?${params}`);
        return response.data;
    }

    async getAnalyticsSummary(deviceId: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const response = await this.client.get(`/devices/${deviceId}/analytics/summary?${params}`);
        return response.data;
    }

    // Export endpoints
    async createExport(deviceId: string, format: 'csv' | 'xlsx' | 'json', dateFrom: string, dateTo: string) {
        const response = await this.client.post(`/devices/${deviceId}/sessions/export`, {
            format,
            date_from: dateFrom,
            date_to: dateTo,
        });
        return response.data;
    }

    async getExportStatus(exportId: string) {
        const response = await this.client.get(`/exports/${exportId}`);
        return response.data;
    }

    async getExports(page = 1, limit = 20) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const response = await this.client.get(`/exports?${params}`);
        return response.data;
    }

    getExportDownloadUrl(exportId: string): string {
        return `${API_BASE_URL}/exports/${exportId}/download`;
    }

    // Factory endpoints
    async getFactories(page = 1, limit = 50) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const response = await this.client.get(`/factories?${params}`);
        return response.data;
    }
}

export const api = new ApiClient();
export default api;
