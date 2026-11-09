import type { AppRoute } from './index';

// Generated from the Laravel route table: every screen and the address that shows it.
const ScreenRoutes: AppRoute[] = [
    { path: '/admin/audit-trail', page: 'audit/index', api: true, auth: true },
    { path: '/admin/offers', page: 'admin/offers/index', api: true, auth: true },
    { path: '/admin/offers/:offer', page: 'admin/offers/show', api: true, auth: true },
    { path: '/csd/lodgements', page: 'csd/lodgements/index', api: true, auth: true },
    { path: '/csd/lodgements/:allotment', page: 'csd/lodgements/show', api: true, auth: true },
    { path: '/investor', page: 'investor/dashboard', api: true, auth: true },
    { path: '/investor/bids/:bid', page: 'investor/bids/show', api: true, auth: true },
    { path: '/investor/bids/:bid/edit', page: 'investor/bids/form', api: true, auth: true },
    { path: '/investor/history', page: 'investor/bids/index', api: true, auth: true },
    { path: '/investor/offers', page: 'investor/offers/index', api: true, auth: true },
    { path: '/investor/offers/:offer', page: 'investor/offers/show', api: true, auth: true },
    { path: '/investor/offers/:offer/bid', page: 'investor/bids/form', api: true, auth: true },
    { path: '/regulator', page: 'regulator/dashboard', api: true, auth: true },
    { path: '/regulator/allotments/:allotment', page: 'regulator/allotments/show', api: true, auth: true },
    { path: '/tsp', page: 'tsp/dashboard', api: true, auth: true },
    { path: '/tsp/allotments', page: 'tsp/allotments/index', api: true, auth: true },
    { path: '/tsp/allotments/:offer', page: 'tsp/allotments/show', api: true, auth: true },
    { path: '/tsp/offers', page: 'tsp/offers/index', api: true, auth: true },
    { path: '/tsp/offers/create', page: 'tsp/offers/form', api: true, auth: true },
    { path: '/tsp/offers/:offer', page: 'tsp/offers/show', api: true, auth: true },
    { path: '/tsp/offers/:offer/amend', page: 'tsp/offers/amend', api: true, auth: true },
    { path: '/tsp/offers/:offer/edit', page: 'tsp/offers/form', api: true, auth: true },
    { path: '/tsp/order-book', page: 'tsp/order-book/index', api: true, auth: true },
    { path: '/tsp/order-book/:offer', page: 'tsp/order-book/show', api: true, auth: true },
    { path: '/tsp/reports', page: 'tsp/reports/index', api: true, auth: true },
    { path: '/tsp/reports/exceptions', page: 'tsp/reports/exceptions', api: true, auth: true },
    { path: '/tsp/reports/:offer', page: 'tsp/reports/show', api: true, auth: true },
];

export default ScreenRoutes;
