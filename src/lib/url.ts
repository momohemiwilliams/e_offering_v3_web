import { routes } from '@/router/routes';

/** Sign-in screens live under /auth, as in the API. */
const overrides: Record<string, string> = {
    login: '/auth/login',
    'login.otp': '/auth/otp',
    'login.otp.verify': '/auth/otp',
    'login.otp.resend': '/auth/otp/resend',
    logout: '/auth/logout',
    'password.request': '/auth/forgot-password',
    'password.email': '/auth/forgot-password',
    'password.reset': '/auth/reset-password',
    'password.store': '/auth/reset-password'
};

type RouteParams = string | number | Array<string | number> | Record<string, unknown> | undefined;

/** Path for a named route, e.g. route('tsp.offers.show', 12) gives "/tsp/offers/12". */
export function route(name: string, params?: RouteParams): string {
    const pattern = overrides[name] ?? routes[name];
    if (!pattern) throw new Error(`Unknown route: ${name}`);

    const placeholders = pattern.match(/\{[^}]+\}/g) ?? [];
    const named: Record<string, unknown> = params && typeof params === 'object' && !Array.isArray(params) ? { ...params } : {};
    const positional = Array.isArray(params) ? [...params] : params !== undefined && typeof params !== 'object' ? [params] : [];

    let path = pattern;
    placeholders.forEach((token) => {
        const key = token.replace(/[{}?]/g, '');
        let value = key in named ? named[key] : positional.shift();
        delete named[key];
        if (value === undefined && 'id' in named) {
            value = named.id;
            delete named.id;
        }
        path = path.replace(token, value === undefined || value === null ? '' : encodeURIComponent(String(value)));
    });

    const query = new URLSearchParams();
    Object.entries(named).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query.set(key, String(value));
    });
    const search = query.toString();

    return search ? `${path}?${search}` : path;
}

export function routePath(name: string, params?: RouteParams): string {
    return route(name, params).split('?')[0];
}

/** Path of a file in the public directory, e.g. asset('images/fm_logo.png'). */
export function asset(path: string): string {
    return `/${path.replace(/^\/+/, '')}`;
}

declare global {
    // Screens call route() without importing it.
    // eslint-disable-next-line no-var
    var route: (name: string, params?: RouteParams) => string;
}

globalThis.route = route;
