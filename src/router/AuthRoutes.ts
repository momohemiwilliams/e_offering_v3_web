import { router } from '@/lib/app';
import { useAuthStore } from '@/stores/auth';
import type { AppRoute } from './index';

const fromQuery = (_params: unknown, search: URLSearchParams) => ({ token: search.get('token') ?? '', email: search.get('email') ?? '' });

const retailProps = () => {
    const stored = JSON.parse(sessionStorage.getItem('eoffering_retail_verification') ?? 'null');
    return { verified: stored?.verified ?? null };
};

const otpProps = () => {
    const pending = useAuthStore.getState().pending;
    return { email: pending?.email ?? '', ttl: pending?.ttl ?? 0 };
};

// React Router keeps navigation state under history.state.usr.
const submittedProps = () => window.history.state?.usr ?? { kind: 'request', reference: null };

const finishBvnConsent = (search: URLSearchParams, clearQuery: () => void) => {
    const code = search.get('code') ?? search.get('temp_code');
    if (!code) return;
    router.post('/register/retail/fetch', { code });
    clearQuery();
};

const AuthRoutes: AppRoute[] = [
    { path: '/', page: 'welcome', api: 'public/welcome', guest: true },
    { path: '/auth/login', page: 'auth/login', guest: true },
    { path: '/auth/otp', page: 'auth/otp', props: otpProps, guest: true },
    { path: '/auth/forgot-password', page: 'auth/forgot-password', guest: true },
    { path: '/auth/reset-password', page: 'auth/reset-password', props: fromQuery },
    { path: '/register', page: 'onboarding/choose', api: 'onboarding/account-types', guest: true },
    { path: '/register/submitted', page: 'onboarding/submitted', props: submittedProps, guest: true },
    { path: '/register/tsp', page: 'onboarding/tsp', guest: true },
    { path: '/register/institutional', page: 'onboarding/institutional', guest: true },
    { path: '/register/regulator', page: 'onboarding/regulator', guest: true },
    {
        path: '/register/retail',
        page: 'onboarding/retail',
        api: 'onboarding/account-types',
        props: retailProps,
        onArrive: finishBvnConsent,
        guest: true
    }
];

export default AuthRoutes;
