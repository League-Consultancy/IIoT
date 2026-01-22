import axios, { AxiosInstance, AxiosError } from 'axios';

// Use relative URL for Vercel deployment (same origin)
const API_BASE_URL = '/api/v1';

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
                    // Token expired or invalid
                    this.clearTokens();
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
        this.clearTokens();
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
        const response = await this.client.get(`/devices/${deviceId}/analytics/daily?${params}`);
        return response.data;
    }

    async getMonthlyAnalytics(deviceId: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const response = await this.client.get(`/devices/${deviceId}/analytics/daily?${params}`);
        return response.data;
    }

    async getAnalyticsSummary(deviceId: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        const response = await this.client.get(`/devices/${deviceId}/analytics/summary?${params}`);
        return response.data;
    }

    // Factory endpoints
    async getFactories(page = 1, limit = 50) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const response = await this.client.get(`/factories?${params}`);
        return response.data;
    }

    // Export - simplified for Vercel (no file system)
    async createExport(deviceId: string, format: 'csv' | 'xlsx' | 'json', dateFrom: string, dateTo: string) {
        // For Vercel, exports will need to be handled differently
        return { success: false, error: 'Exports not available in serverless mode' };
    }

    async getExportStatus(exportId: string) {
        return { success: false, error: 'Exports not available in serverless mode' };
    }

    async getExports(page = 1, limit = 20) {
        return { success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    getExportDownloadUrl(exportId: string): string {
        return '#';
    }
}

export const api = new ApiClient();
export default api;
