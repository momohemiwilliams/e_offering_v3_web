import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Link as RouterLink, useLocation, type NavigateFunction } from 'react-router-dom';
import { create } from 'zustand';
import { useAuthStore } from '@/stores/auth';

/**
 * The bridge between the screens and the JWT API: Link, Head, router, useForm and usePage.
 * Screens call one path for both the page and its action; this module turns those calls
 * into API requests and applies the result (sign-in, redirect, banner, data refresh).
 */

const rawBase = (import.meta.env.VITE_API_LINK as string | undefined) || 'http://127.0.0.1:8000/api/';
const baseUrl = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public errors: Record<string, string[]> = {},
        public data: any = {}
    ) {
        super(message);
    }
}

interface Flash {
    success: string | null;
    error: string | null;
    version: number;
    at: number;
}

/** A message set just before a redirect belongs to the page being opened. */
const FLASH_REDIRECT_MS = 1000;

/** Bumped after a successful action so the current page reloads its data. */
export const useAppState = create<{
    flash: Flash;
    reloads: number;
    setFlash: (kind: 'success' | 'error', message: string) => void;
    clearStaleFlash: () => void;
    reload: () => void;
}>((set) => ({
    flash: { success: null, error: null, version: 0, at: 0 },
    reloads: 0,
    setFlash: (kind, message) =>
        set((s) => ({
            flash: {
                success: kind === 'success' ? message : null,
                error: kind === 'error' ? message : null,
                version: s.flash.version + 1,
                at: Date.now()
            }
        })),
    // Runs on every page change, so a banner never follows the user to a later page.
    clearStaleFlash: () =>
        set((s) => {
            const empty = !s.flash.success && !s.flash.error;
            return empty || Date.now() - s.flash.at < FLASH_REDIRECT_MS
                ? s
                : { flash: { success: null, error: null, version: s.flash.version + 1, at: 0 } };
        }),
    reload: () => set((s) => ({ reloads: s.reloads + 1 }))
}));

let navigateTo: NavigateFunction = () => undefined;
export const setNavigate = (navigate: NavigateFunction) => {
    navigateTo = navigate;
};

/** "/register/..." is the screen address; the API serves those actions under "onboarding/...". */
export function apiPath(url: string): string {
    return url
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/^\/register(?=\/|$)/, '/onboarding')
        .replace(/^\//, '');
}

export async function api(method: string, path: string, body?: FormData | Record<string, unknown>): Promise<any> {
    const auth = useAuthStore.getState();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (auth.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;

    const options: RequestInit = { method, headers };
    if (body instanceof FormData) {
        options.body = body;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const cleanPath = path.replace(/^\//, '');
    let response: Response;
    try {
        response = await fetch(`${baseUrl}${cleanPath}`, options);
    } catch (err: any) {
        throw new ApiError(err?.message || 'Failed to connect to API server. Please ensure the backend is running.', 0, {}, {});
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = response.status === 204 ? {} : isJson ? await response.json().catch(() => ({})) : {};

    if (!isJson && response.status !== 204) {
        throw new ApiError('The server returned an invalid response format.', response.status, {}, {});
    }

    if (!response.ok) {
        const message = payload.message ?? 'Something went wrong. Please try again.';
        if (response.status === 401 && auth.accessToken) {
            auth.clear();
            useAppState.getState().setFlash('error', message);
            navigateTo('/auth/login');
        }
        throw new ApiError(message, response.status, payload.errors ?? payload.data?.errors ?? {}, payload.data ?? {});
    }

    return payload;
}

/**
 * Report and template links stay plain <a> tags in the screens. They need the bearer
 * token, which a browser link cannot send, so clicks are fetched and saved here instead.
 */
export function installDownloadLinks(): () => void {
    const isDownload = (url: URL) =>
        url.origin === window.location.origin &&
        (/\/(export|download|summary|agents-template)$/.test(url.pathname) || url.searchParams.has('export'));

    const onClick = async (event: MouseEvent) => {
        const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
        if (!anchor) return;
        const url = new URL(anchor.href);
        if (!isDownload(url)) return;
        event.preventDefault();

        try {
            const token = useAuthStore.getState().accessToken;
            const response = await fetch(`${baseUrl}${apiPath(url.pathname)}${url.search}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: '*/*' }
            });
            if (!response.ok) throw new Error('The file could not be downloaded. Please try again.');
            const name = /filename="?([^";]+)"?/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ?? 'download';
            const link = document.createElement('a');
            link.href = URL.createObjectURL(await response.blob());
            link.download = name;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (e) {
            useAppState.getState().setFlash('error', (e as Error).message);
        }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
}

function hasFile(value: unknown): boolean {
    if (value instanceof File) return true;
    if (Array.isArray(value)) return value.some(hasFile);
    if (value && typeof value === 'object') return Object.values(value).some(hasFile);
    return false;
}

/** Multipart body, including nested rows such as users[0][name]. */
function toFormData(values: Record<string, unknown>): FormData {
    const data = new FormData();
    const append = (key: string, value: unknown) => {
        if (value === null || value === undefined) return;
        if (value instanceof File) data.append(key, value);
        else if (Array.isArray(value)) value.forEach((item, i) => append(`${key}[${i}]`, item));
        else if (typeof value === 'object') Object.entries(value as object).forEach(([k, v]) => append(`${key}[${k}]`, v));
        else if (typeof value === 'boolean') data.append(key, value ? '1' : '0');
        else data.append(key, String(value));
    };
    Object.entries(values).forEach(([key, value]) => append(key, value));
    return data;
}

interface VisitOptions {
    forceFormData?: boolean;
    preserveScroll?: boolean;
    preserveState?: boolean;
    replace?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    onFinish?: () => void;
}

/** After a successful action: follow what the API said, otherwise refresh the page's data. */
function applyResult(path: string, result: any) {
    const app = useAppState.getState();
    const auth = useAuthStore.getState();
    const data = result?.data ?? {};

    if (data.accessToken) {
        auth.completeSignIn(data.accessToken, data.user);
        navigateTo(new URLSearchParams(window.location.search).get('returnUrl') ?? '/dashboard');
        return;
    }

    if (result?.message) app.setFlash('success', result.message);

    if (data.challenge) {
        auth.setPending({ challenge: data.challenge, email: data.email, ttl: data.ttl });
        navigateTo(`/auth/otp${window.location.search}`);
    } else if (data.kind) {
        navigateTo('/register/submitted', { state: data });
    } else if (data.verification) {
        sessionStorage.setItem('eoffering_retail_verification', JSON.stringify(data));
        app.reload();
    } else if (typeof data.redirect === 'string' && /^https?:/.test(data.redirect)) {
        window.location.assign(data.redirect);
    } else if (typeof data.redirect === 'string') {
        navigateTo(data.redirect);
    } else if (typeof data.url === 'string') {
        navigateTo(new URL(data.url).pathname);
    } else if (path === 'auth/reset-password') {
        navigateTo('/auth/login');
    } else {
        app.reload();
    }
}

async function send(method: string, url: string, values: Record<string, unknown>, options: VisitOptions = {}): Promise<void> {
    const auth = useAuthStore.getState();
    const path = apiPath(url);
    let payload = { ...values };

    if (path === 'auth/otp' || path === 'auth/otp/resend') payload.challenge = auth.pending?.challenge;
    if (path === 'onboarding/retail')
        payload.verification = JSON.parse(sessionStorage.getItem('eoffering_retail_verification') ?? '{}').verification;

    try {
        if (path === 'auth/logout') {
            await api('POST', path).catch(() => undefined);
            auth.clear();
            if (payload.inactive)
                useAppState.getState().setFlash('error', 'You were signed out because of inactivity. Please sign in again.');
            navigateTo('/auth/login');
            options.onSuccess?.();
            return;
        }

        let body: FormData | Record<string, unknown> = payload;
        let verb = method;
        if (options.forceFormData || hasFile(payload)) {
            if (method !== 'POST') payload = { ...payload, _method: method };
            body = toFormData(payload);
            verb = 'POST';
        }

        const result = await api(verb, path, body);
        if (path === 'onboarding/retail') sessionStorage.removeItem('eoffering_retail_verification');
        applyResult(path, result);
        options.onSuccess?.();
    } catch (e) {
        const error = e as ApiError;
        const errors = Object.fromEntries(Object.entries(error.errors ?? {}).map(([field, list]) => [field, list[0]]));
        if (Object.keys(errors).length) {
            options.onError?.(errors);
            throw errors;
        }
        if (error.status !== 401 || !auth.accessToken) useAppState.getState().setFlash('error', error.message);
        options.onError?.({});
        if (typeof error.data?.redirect === 'string') navigateTo(error.data.redirect);
    } finally {
        options.onFinish?.();
    }
}

function withQuery(url: string, query?: Record<string, unknown>): string {
    const params = new URLSearchParams();
    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });
    const search = params.toString();
    return search ? `${url}?${search}` : url;
}

const ignore = (e: unknown) => {
    if (e instanceof Error) throw e;
};

export const router = {
    get: (url: string, query?: Record<string, unknown>, options?: VisitOptions) =>
        navigateTo(withQuery(url, query), { replace: options?.replace }),
    visit: (url: string, options: VisitOptions & { method?: string; data?: Record<string, unknown> } = {}) => {
        const { method = 'get', data = {}, ...rest } = options;
        if (method.toLowerCase() === 'get') navigateTo(url);
        else void send(method.toUpperCase(), url, data, rest).catch(ignore);
    },
    reload: (_options?: Record<string, unknown>) => useAppState.getState().reload(),
    post: (url: string, data: Record<string, unknown> = {}, options?: VisitOptions) => void send('POST', url, data, options).catch(ignore),
    put: (url: string, data: Record<string, unknown> = {}, options?: VisitOptions) => void send('PUT', url, data, options).catch(ignore),
    patch: (url: string, data: Record<string, unknown> = {}, options?: VisitOptions) =>
        void send('PATCH', url, data, options).catch(ignore),
    delete: (url: string, options?: VisitOptions) => void send('DELETE', url, {}, options).catch(ignore)
};

type Errors = Record<string, string>;

export function useForm<T extends Record<string, any>>(initial: T) {
    const defaults = useRef(initial);
    const [data, setValues] = useState<T>(initial);
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const transformer = useRef<(values: T) => Record<string, unknown>>((values) => values);

    const setData = useCallback((key: any, value?: any) => {
        setValues((current) =>
            typeof key === 'string' ? { ...current, [key]: value } : typeof key === 'function' ? key(current) : { ...current, ...key }
        );
    }, []);

    const reset = useCallback((...fields: string[]) => {
        setValues((current) =>
            fields.length ? { ...current, ...Object.fromEntries(fields.map((f) => [f, defaults.current[f]])) } : defaults.current
        );
    }, []);

    const submit = async (method: string, url: string, options: VisitOptions = {}) => {
        setProcessing(true);
        setErrors({});
        try {
            await send(method, url, transformer.current(data), {
                ...options,
                onSuccess: () => {
                    setRecentlySuccessful(true);
                    window.setTimeout(() => setRecentlySuccessful(false), 2000);
                    options.onSuccess?.();
                }
            });
        } catch (fieldErrors) {
            if (fieldErrors instanceof Error) throw fieldErrors;
            setErrors(fieldErrors as Errors);
        } finally {
            setProcessing(false);
        }
    };

    return {
        data,
        setData: setData as {
            (updater: (current: T) => T): void;
            (values: Partial<T>): void;
            <K extends keyof T>(key: K, value: T[K]): void;
        },
        errors: errors as Partial<Record<keyof T, string>> & Errors,
        processing,
        recentlySuccessful,
        reset,
        clearErrors: () => setErrors({}),
        setError: (field: string, message: string) => setErrors((e) => ({ ...e, [field]: message })),
        transform: (fn: (values: T) => Record<string, unknown>) => {
            transformer.current = fn;
        },
        post: (url: string, options?: VisitOptions) => submit('POST', url, options),
        put: (url: string, options?: VisitOptions) => submit('PUT', url, options),
        patch: (url: string, options?: VisitOptions) => submit('PATCH', url, options),
        delete: (url: string, options?: VisitOptions) => submit('DELETE', url, options)
    };
}

/** Data for the current screen, set by the router's page loader. */
export const usePageProps = create<{ props: Record<string, unknown> }>(() => ({ props: {} }));

export function usePage<T = any>(): { props: T; url: string } {
    const location = useLocation();
    const auth = useAuthStore();
    const flash = useAppState((s) => s.flash);
    const pageProps = usePageProps((s) => s.props);

    const props = {
        ...pageProps,
        name: 'FMDQ e-Offering',
        auth: { user: auth.user },
        notifications: { unread: auth.unread },
        flash,
        idleTimeout: auth.idleTimeout
    };

    return { props: props as unknown as T, url: location.pathname + location.search };
}

export function Head({ title }: { title?: string; children?: ReactNode }) {
    useEffect(() => {
        document.title = title ? `${title} - FMDQ e-Offering` : 'FMDQ e-Offering';
    }, [title]);
    return null;
}

type LinkProps = Omit<ComponentProps<'a'>, 'href'> & {
    href: string;
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    as?: string;
    data?: Record<string, unknown>;
    prefetch?: boolean;
    preserveScroll?: boolean;
    preserveState?: boolean;
    replace?: boolean;
};

export function Link({
    href,
    method = 'get',
    as: _as,
    data,
    prefetch: _prefetch,
    preserveScroll: _scroll,
    preserveState: _state,
    replace,
    onClick,
    ...rest
}: LinkProps) {
    if (method !== 'get') {
        const { className, children } = rest;
        return (
            <button
                type="button"
                className={className}
                onClick={(e) => {
                    onClick?.(e as never);
                    void send(method.toUpperCase(), href, data ?? {}).catch(ignore);
                }}
            >
                {children}
            </button>
        );
    }

    // Pagination links arrive as API addresses; the screen address is the same path.
    const to = href.startsWith(baseUrl) ? `/${href.slice(baseUrl.length)}` : href;

    return <RouterLink to={to} replace={replace} onClick={onClick} {...rest} />;
}
