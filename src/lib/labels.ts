/**
 * One place for every status label and colour (the legacy screens mixed three badge systems).
 */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'navy' | 'gold';

type StatusMap = Record<string, { label: string; tone: Tone }>;

export const offerStatus: StatusMap = {
    draft: { label: 'Draft', tone: 'neutral' },
    pending_authorisation: { label: 'Awaiting Authoriser', tone: 'warning' },
    pending_admin_review: { label: 'Awaiting FMDQ Review', tone: 'warning' },
    returned: { label: 'Returned for Update', tone: 'danger' },
    approved: { label: 'Approved – Ready to Launch', tone: 'info' },
    live: { label: 'Launched', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
    upcoming: { label: 'Upcoming', tone: 'info' },
    open: { label: 'Open', tone: 'success' },
    closed: { label: 'Closed', tone: 'neutral' },
    allotment_draft: { label: 'Allotment in Progress', tone: 'gold' },
    allotment_pending_authorisation: { label: 'Allotment Awaiting Authoriser', tone: 'warning' },
    allotment_returned: { label: 'Allotment Returned', tone: 'danger' },
    allotment_sec_pending: { label: 'SEC Pending', tone: 'warning' },
    allotment_sec_rejected: { label: 'SEC Rejected', tone: 'danger' },
    allotment_approved: { label: 'Allotment Approved', tone: 'success' },
    allotment_lodged: { label: 'Lodged with CSD', tone: 'navy' },
    allotment_cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const allotmentStatus: StatusMap = {
    draft: { label: 'Draft', tone: 'gold' },
    pending_authorisation: { label: 'Awaiting Authoriser', tone: 'warning' },
    returned: { label: 'Returned', tone: 'danger' },
    sec_pending: { label: 'SEC Pending', tone: 'warning' },
    sec_rejected: { label: 'Rejected by SEC', tone: 'danger' },
    approved: { label: 'Approved', tone: 'success' },
    lodged: { label: 'Lodged', tone: 'navy' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
    none: { label: 'Not Initiated', tone: 'neutral' },
};

export const paymentStatus: StatusMap = {
    pending: { label: 'Pending', tone: 'warning' },
    paid: { label: 'Paid', tone: 'success' },
    invalid: { label: 'Invalid', tone: 'danger' },
};

export const bidStatus: StatusMap = {
    active: { label: 'Active', tone: 'success' },
    revoked: { label: 'Revoked', tone: 'neutral' },
};

export const subscriptionStatus: StatusMap = {
    oversubscribed: { label: 'Oversubscribed', tone: 'success' },
    fully_subscribed: { label: 'Fully Subscribed', tone: 'info' },
    undersubscribed: { label: 'Undersubscribed', tone: 'warning' },
    below_minimum: { label: 'Below Minimum Threshold', tone: 'danger' },
};

export const institutionStatus: StatusMap = {
    pending: { label: 'Pending Review', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
    suspended: { label: 'Suspended', tone: 'danger' },
};

export const feeStatus: StatusMap = {
    unpaid: { label: 'Unpaid', tone: 'warning' },
    pending_review: { label: 'Awaiting FMDQ Confirmation', tone: 'info' },
    paid: { label: 'Paid', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
};

export const amendmentStatus: StatusMap = {
    pending_authorisation: { label: 'Awaiting Authoriser', tone: 'warning' },
    pending_admin_review: { label: 'Awaiting FMDQ Review', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
};

export const outcomeStatus: StatusMap = {
    pending: { label: 'Pending', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
};

export const categoryLabel: Record<string, string> = {
    retail: 'Retail',
    qii: 'QII',
    non_qii: 'Non-QII',
};

export const institutionTypeLabel: Record<string, string> = {
    tsp: 'TSP/RM',
    qii: 'QII',
    non_qii: 'Non-QII',
    regulator: 'Regulator',
};

export const stageLabel: Record<string, string> = {
    inputter: 'TSP/RM Inputter',
    tsp_authoriser: 'TSP Authoriser',
    fmdq_admin: 'FMDQ Admin',
    sec: 'SEC',
};

export const amendableLabels: Record<string, string> = {
    open_at: 'Offer open date',
    close_at: 'Offer close date',
    offer_size: 'Offer size',
    min_subscription_threshold: 'Minimum subscription threshold (%)',
    min_subscription_amount: 'Minimum subscription amount',
    subsequent_increment: 'Subsequent increments',
    rate: 'Rate / price',
    rate_min: 'Range minimum',
    rate_max: 'Range maximum',
    implied_yield: 'Implied yield',
    issue_price: 'Issue price per unit',
    maturity_date: 'Indicative maturity date',
    allotment_date: 'Indicative allotment date',
    tenor: 'Tenor',
    day_count_fraction: 'Day count fraction',
    issue_description: 'Issue description',
    bank_name: 'Payment bank name',
    bank_account_name: 'Payment account name',
    bank_account_number: 'Payment account number',
};
