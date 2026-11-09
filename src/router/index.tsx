import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { api, ApiError, apiPath, installDownloadLinks, setNavigate, useAppState, usePageProps } from '@/lib/app';
import '@/lib/url';
import { useAuthStore } from '@/stores/auth';
import type { AuthUser } from '@/types';
import AuthRoutes from './AuthRoutes';
import MainRoutes from './MainRoutes';
import ScreenRoutes from './ScreenRoutes';

export interface AppRoute {
    path: string;
    /** Screen file under src/views, without the extension. */
    page: string;
    /** API path for the screen's data; true means the path matching the address. */
    api?: string | true;
    /** Extra props worked out in the browser. */
    props?: (params: Record<string, string | undefined>, search: URLSearchParams) => Record<string, unknown>;
    auth?: boolean;
    /** Runs once on arrival, e.g. to finish a return from BVN consent or a payment gateway. */
    onArrive?: (search: URLSearchParams, clearQuery: () => void) => void;
    /** Signed-in users are sent to their own area instead. */
    guest?: boolean;
}

const screens = import.meta.glob('../views/**/*.tsx') as Record<string, () => Promise<{ default: ComponentType<any> }>>;
const lazyScreens: Record<string, ComponentType<any>> = {};

function screen(page: string): ComponentType<any> {
    lazyScreens[page] ??= lazy(screens[`../views/${page}.tsx`]);
    return lazyScreens[page];
}

function homeFor(user: AuthUser | null): string {
    switch (user?.type) {
        case 'admin':
            return '/admin';
        case 'csd':
            return '/csd/lodgements';
        case 'investor':
            return '/investor';
        case 'regulator':
            return '/regulator';
        case 'tsp':
            return user.tsp_full_access ? '/tsp' : '/tsp/registration';
        default:
            return '/auth/login';
    }
}

function Loading() {
    return (
        <div role="status" className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
            Loading…
        </div>
    );
}

function Screen({ route }: { route: AppRoute }) {
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();
    const reloads = useAppState((s) => s.reloads);
    const signedIn = useAuthStore((s) => !!s.accessToken);
    const [ready, setReady] = useState(!route.api);
    const [failure, setFailure] = useState('');

    useEffect(() => {
        route.onArrive?.(new URLSearchParams(location.search), () => navigate(location.pathname, { replace: true }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let active = true;
        const local = route.props?.(params, new URLSearchParams(location.search)) ?? {};

        if (!route.api) {
            usePageProps.setState({ props: local });
            setReady(true);
        } else {
            const path = route.api === true ? apiPath(location.pathname) + location.search : route.api;
            api('GET', path)
                .then((result) => {
                    if (!active) return;
                    usePageProps.setState({ props: { ...(Array.isArray(result.data) ? {} : result.data), ...local } });
                    setFailure('');
                    setReady(true);
                })
                .catch((e: ApiError) => {
                    if (!active) return;
                    if (typeof e.data?.redirect === 'string') navigate(e.data.redirect, { replace: true });
                    else setFailure(e.message);
                });
        }

        // Keeps the notification bell, role and menus current.
        if (signedIn) {
            api('GET', 'auth/me')
                .then((result) => active && useAuthStore.getState().applyUser(result.data))
                .catch(() => undefined);
        }

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, location.search, reloads]);

    if (failure) return <NotAvailable message={failure} />;
    if (!ready) return <Loading />;

    const Component = screen(route.page);
    return (
        <Suspense fallback={<Loading />}>
            <Component {...usePageProps.getState().props} />
        </Suspense>
    );
}

function Guarded({ route }: { route: AppRoute }) {
    const location = useLocation();
    const { accessToken, user, pending } = useAuthStore();

    if (route.path === '/auth/otp' && !pending && !accessToken) {
        return <Navigate to="/auth/login" replace />;
    }
    if (route.auth && !accessToken) {
        return <Navigate to={`/auth/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }
    if (route.guest && accessToken) {
        return <Navigate to={homeFor(user)} replace />;
    }
    return <Screen key={route.path} route={route} />;
}

function NotAvailable({ message }: { message: string }) {
    const { accessToken } = useAuthStore();

    if (!accessToken) {
        return (
            <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="max-w-md space-y-2">
                    <h1 className="text-xl font-semibold tracking-tight">Service Temporarily Unavailable</h1>
                    <p className="text-muted-foreground text-sm">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow"
                    >
                        Retry
                    </button>
                    <a
                        href="/auth/login"
                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm"
                    >
                        Sign in
                    </a>
                </div>
            </div>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
                <p className="font-medium">This page is not available</p>
                <p className="text-muted-foreground max-w-sm text-sm">{message}</p>
            </div>
        </AppLayout>
    );
}

function Fallback() {
    const { accessToken } = useAuthStore();
    if (!accessToken) return <Navigate to="/auth/login" replace />;
    return <NotAvailable message="We could not find that page." />;
}

function Dashboard() {
    const { accessToken, user } = useAuthStore();
    return <Navigate to={accessToken ? homeFor(user) : '/auth/login'} replace />;
}

function NavigationBridge() {
    const navigate = useNavigate();
    useEffect(() => setNavigate(navigate), [navigate]);
    useEffect(() => installDownloadLinks(), []);
    // Before paint, so an old banner is never visible on the new page.
    const { pathname } = useLocation();
    useLayoutEffect(() => useAppState.getState().clearStaleFlash(), [pathname]);
    return null;
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <NavigationBridge />
            <Routes>
                {[...AuthRoutes, ...MainRoutes, ...ScreenRoutes].map((route) => (
                    <Route key={route.path} path={route.path} element={<Guarded route={route} />} />
                ))}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Fallback />} />
            </Routes>
        </BrowserRouter>
    );
}
