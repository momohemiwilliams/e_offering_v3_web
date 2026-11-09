import { router } from '@/lib/app';
import type { AppRoute } from './index';

/** Paystack / Flutterwave send the browser back here with a reference to confirm. */
const finishGatewayPayment = (search: URLSearchParams, clearQuery: () => void) => {
    const invoice = search.get('invoice');
    const reference = search.get('reference') ?? search.get('tx_ref');
    if (!invoice || !reference) return;
    router.post(`/tsp/registration/fee/${invoice}/confirm`, { reference, transaction_id: search.get('transaction_id') });
    clearQuery();
};

// `api: true` loads the page's data from the API path matching the screen address.
const MainRoutes: AppRoute[] = [
    { path: '/settings/profile', page: 'settings/profile', auth: true },
    { path: '/settings/password', page: 'settings/password', auth: true },
    { path: '/settings/appearance', page: 'settings/appearance', auth: true },
    { path: '/notifications', page: 'notifications/index', api: true, auth: true },

    { path: '/offers/:reference', page: 'public/offer', api: true },
    { path: '/investor/audit-trail', page: 'audit/index', api: true, auth: true },

    { path: '/admin', page: 'admin/dashboard', api: true, auth: true },
    { path: '/admin/onboarding', page: 'admin/onboarding/index', api: true, auth: true },
    { path: '/admin/onboarding/:institution', page: 'admin/onboarding/show', api: true, auth: true },
    { path: '/admin/users', page: 'admin/users/index', api: true, auth: true },
    { path: '/admin/fees', page: 'admin/fees/index', api: true, auth: true },
    { path: '/admin/settings', page: 'admin/settings', api: true, auth: true },

    { path: '/tsp/registration', page: 'tsp/registration', api: true, auth: true, onArrive: finishGatewayPayment },
    { path: '/tsp/registration/fee/:invoice/receipt', page: 'tsp/receipt', api: true, auth: true }
];

export default MainRoutes;
