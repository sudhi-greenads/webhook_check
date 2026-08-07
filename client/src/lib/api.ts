// client/src/lib/api.ts
export const API_BASE_URL = import.meta.env.VITE_FRONTEND_PUBLIC_URL ? `${import.meta.env.VITE_FRONTEND_PUBLIC_URL}/api` : '/api';

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const accessToken = localStorage.getItem('accessToken');
    
    const headers = new Headers(options.headers || {});
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    // Default to JSON if body is present and no content-type is set
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        if (endpoint.endsWith('/auth/regenerate-accesstoken') || endpoint.endsWith('/auth/login')) {
            window.dispatchEvent(new Event('auth:expired'));
            return response;
        }

        const data = await response.clone().json().catch(() => ({}));
        if (data.code === 'TOKEN_EXPIRED') {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                console.log("apiFetch: Missing refresh token, logging out");
                window.dispatchEvent(new Event('auth:expired'));
                return response;
            }

            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = fetch(`${API_BASE_URL}/auth/regenerate-accesstoken`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                })
                .then(async (res) => {
                    if (!res.ok) throw new Error('Refresh failed');
                    const refreshData = await res.json();
                    if (refreshData.success && refreshData.accessToken) {
                        localStorage.setItem('accessToken', refreshData.accessToken);
                        isRefreshing = false;
                        return refreshData.accessToken;
                    } else {
                        throw new Error('Invalid refresh response');
                    }
                })
                .catch((err) => {
                    console.error("apiFetch: Refresh token request failed", err);
                    isRefreshing = false;
                    window.dispatchEvent(new Event('auth:expired'));
                    throw err;
                });
            }

            try {
                // Wait for the single refresh promise to resolve
                const newToken = await refreshPromise;
                headers.set('Authorization', `Bearer ${newToken}`);
                
                // Retry the original request
                return await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers,
                });
            } catch (e) {
                return response; // Return original 401 if refresh failed entirely
            }
        } else {
            // General 401 (e.g. invalid credentials)
            console.error("apiFetch: General 401 received (not TOKEN_EXPIRED), logging out. Data:", data);
            window.dispatchEvent(new Event('auth:expired'));
        }
    }

    return response;
}
