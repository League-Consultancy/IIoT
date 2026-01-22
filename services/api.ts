// API Service for connecting to the backend

const API_BASE_URL = '/api/v1';
const AUTH_BASE_URL = '/api/auth';
const TOKEN_KEY = 'iiot_auth_token';

// ==========================================
// TYPES
// ==========================================

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
    tenantId: string;
    factoryIds: string[];
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export interface Device {
    id: string;
    serialNumber: string;
    factoryId: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'DISABLED';
    firmwareVersion: string;
    lastSeen: string;
    totalRunningHours: number;
    metadata: Record<string, any>;
}

export interface Factory {
    id: string;
    tenantId: string;
    name: string;
    timezone: string;
    location: string;
    image?: string;
}

export interface DashboardStats {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
}

export interface TelemetryPoint {
    timestamp: string;
    value: number;
    type: 'STATE' | 'CURRENT' | 'RUNTIME';
}

export interface MachineSession {
    id: string;
    deviceId: string;
    startTime: string;
    stopTime: string;
    duration: number;
}

// ==========================================
// AUTH SERVICE
// ==========================================

class AuthService {
    private token: string | null = null;

    constructor() {
        // Load token from localStorage on init
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem(TOKEN_KEY);
        }
    }

    getToken(): string | null {
        return this.token;
    }

    setToken(token: string): void {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
        }
    }

    clearToken(): void {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    async signup(email: string, password: string, name: string): Promise<AuthResponse> {
        const response = await fetch(`${AUTH_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signup failed');
        }

        const data = await response.json();
        this.setToken(data.token);
        return data;
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${AUTH_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        this.setToken(data.token);
        return data;
    }

    async ssoLogin(): Promise<AuthResponse> {
        const response = await fetch(`${AUTH_BASE_URL}/sso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'SSO login failed');
        }

        const data = await response.json();
        this.setToken(data.token);
        return data;
    }

    async getMe(): Promise<AuthUser> {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${AUTH_BASE_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });

        if (!response.ok) {
            this.clearToken();
            throw new Error('Session expired');
        }

        return response.json();
    }

    logout(): void {
        this.clearToken();
    }
}

// ==========================================
// API SERVICE
// ==========================================

class ApiService {
    private getAuthHeaders(): Record<string, string> {
        const token = auth.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(),
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // Devices
    async getDevices(factoryId?: string): Promise<Device[]> {
        const params = factoryId && factoryId !== 'all' ? `?factoryId=${factoryId}` : '';
        return this.request<Device[]>(`/devices${params}`);
    }

    async getDevice(id: string): Promise<Device> {
        return this.request<Device>(`/devices/${id}`);
    }

    async createDevice(device: Omit<Device, 'id'>): Promise<Device> {
        return this.request<Device>('/devices', {
            method: 'POST',
            body: JSON.stringify(device),
        });
    }

    async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
        return this.request<Device>(`/devices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteDevice(id: string): Promise<void> {
        await this.request(`/devices/${id}`, { method: 'DELETE' });
    }

    // Factories
    async getFactories(): Promise<Factory[]> {
        return this.request<Factory[]>('/factories');
    }

    async getFactory(id: string): Promise<Factory> {
        return this.request<Factory>(`/factories/${id}`);
    }

    async createFactory(factory: Omit<Factory, 'id'>): Promise<Factory> {
        return this.request<Factory>('/factories', {
            method: 'POST',
            body: JSON.stringify(factory),
        });
    }

    // Stats
    async getStats(factoryId?: string): Promise<DashboardStats> {
        const params = factoryId && factoryId !== 'all' ? `?factoryId=${factoryId}` : '';
        return this.request<DashboardStats>(`/stats${params}`);
    }

    // Telemetry
    async getTelemetry(deviceId: string, hours: number = 24, type?: string): Promise<TelemetryPoint[]> {
        let params = `?hours=${hours}`;
        if (type) params += `&type=${type}`;
        return this.request<TelemetryPoint[]>(`/telemetry/${deviceId}${params}`);
    }

    // Sessions
    async getSessions(deviceId: string, days: number = 7): Promise<MachineSession[]> {
        return this.request<MachineSession[]>(`/sessions/${deviceId}?days=${days}`);
    }

    // Ingest data
    async ingestData(payload: {
        deviceId: string;
        startTime: string;
        stopTime: string;
        duration?: number;
    }): Promise<void> {
        await this.request('/ingest', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
}

// ==========================================
// WEBSOCKET SERVICE (Real-time updates)
// ==========================================

export interface WebSocketMessage {
    type: 'NEW_SESSION';
    data: {
        session: MachineSession & { factoryId: string };
        device: {
            id: string;
            name: string;
            status: string;
            totalRunningHours: number;
            lastSeen: string;
        } | null;
    };
}

type WebSocketCallback = (message: WebSocketMessage) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private callbacks: Set<WebSocketCallback> = new Set();
    private reconnectTimer: number | null = null;
    private isConnecting = false;

    private getWsUrl(): string {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        // WebSocket runs on port 3002
        return `${protocol}//${host}:3002`;
    }

    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            this.ws = new WebSocket(this.getWsUrl());

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnecting = false;
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    this.callbacks.forEach(callback => callback(message));
                } catch (e) {
                    console.error('Failed to parse WebSocket message:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnecting = false;
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;

        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000);
    }

    disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    subscribe(callback: WebSocketCallback): () => void {
        this.callbacks.add(callback);
        // Auto-connect when first subscriber
        if (this.callbacks.size === 1) {
            this.connect();
        }

        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
            // Auto-disconnect when no subscribers
            if (this.callbacks.size === 0) {
                this.disconnect();
            }
        };
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const auth = new AuthService();
export const api = new ApiService();
export const wsService = new WebSocketService();

