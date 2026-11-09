import { LucideIcon } from 'lucide-react';

export type UserType = 'admin' | 'csd' | 'tsp' | 'investor' | 'regulator';
export type AccessLevel = 'inputter' | 'authoriser' | null;
export type InvestorCategory = 'retail' | 'qii' | 'non_qii';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    type: UserType;
    access_level: AccessLevel;
    role_label: string;
    investor_category: InvestorCategory | null;
    institution: { id: number; name: string; type: string; regulator_body: string | null } | null;
    tsp_full_access: boolean;
    avatar?: string;
    email_verified_at?: string | null;
    [key: string]: unknown;
}

/** Kept for the settings pages inherited from the starter kit. */
export type User = AuthUser;

export interface Auth {
    user: AuthUser;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface Flash {
    success?: string | null;
    error?: string | null;
}

export interface SharedData {
    name: string;
    auth: Auth;
    flash: Flash;
    notifications: { unread: number };
    idleTimeout: number;
    [key: string]: unknown;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export type Money = string | number;

export interface Institution {
    id: number;
    reference: string;
    type: 'tsp' | 'qii' | 'non_qii' | 'regulator';
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    registration_number: string | null;
    regulator_body: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    rejection_reason: string | null;
    reviewed_at: string | null;
    privacy_consent_at: string | null;
    registered_name: string | null;
    registered_address: string | null;
    contact_name: string | null;
    contact_role: string | null;
    contact_phone: string | null;
    registration_completed_at: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    fee_paid_until: string | null;
    suspended_at: string | null;
    created_at: string;
    users_count?: number;
    users?: { id: number; name: string; email: string; phone: string | null; access_level: AccessLevel; status: string; last_login_at: string | null }[];
}

export type OfferStatus = 'draft' | 'pending_authorisation' | 'pending_admin_review' | 'returned' | 'approved' | 'live' | 'cancelled';
export type AllotmentStatus = 'draft' | 'pending_authorisation' | 'returned' | 'sec_pending' | 'sec_rejected' | 'approved' | 'lodged' | 'cancelled';

export interface OfferDocument {
    id: number;
    offer_id: number;
    category: string;
    document_type: string;
    original_name: string;
    size: number;
    visible_to_investors: boolean;
    url: string;
    created_at: string;
    uploader?: { id: number; name: string } | null;
}

export interface ReceivingAgent {
    id?: number;
    name: string;
    bank_name: string | null;
    bank_account_name: string;
    bank_account_number: string;
}

export interface CoSponsor {
    id?: number;
    institution_id: number;
    can_view_order_book: boolean;
    can_confirm_payments: boolean;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    institution?: { id: number; name: string };
}

export interface Amendment {
    id: number;
    reason: string;
    changes: Record<string, { from: string | null; to: string | null }>;
    status: 'pending_authorisation' | 'pending_admin_review' | 'approved' | 'rejected';
    review_comment: string | null;
    reviewed_at: string | null;
    applied_at: string | null;
    created_at: string;
    requester?: { id: number; name: string };
    reviewer?: { id: number; name: string } | null;
}

export interface Allotment {
    id: number;
    offer_id: number;
    method: { method: string; pro_rata_option?: number | null; shares?: Record<string, string | number>; components?: string[]; guaranteed_bid_ids?: number[]; guaranteed_classes?: string[] };
    method_label: string;
    final_rate: string | null;
    issue_size: string;
    total_demand: string;
    valid_demand: string;
    total_allotted: string;
    subscription_level: string;
    subscription_status: 'oversubscribed' | 'fully_subscribed' | 'undersubscribed' | 'below_minimum' | null;
    notes: string[] | null;
    status: AllotmentStatus;
    return_reason: string | null;
    submitted_at: string | null;
    authorised_at: string | null;
    sec_reviewed_at: string | null;
    sec_reason: string | null;
    lodgement_reference: string | null;
    lodgement_status: string | null;
    lodged_at: string | null;
    documents?: OfferDocument[];
    offer?: Offer;
}

export interface Offer {
    id: number;
    reference: string;
    institution_id: number;
    issuer_name: string;
    issue_description: string;
    issue_series: string | null;
    offer_size: string;
    min_subscription_threshold: string;
    issuer_type: string;
    security_type: string;
    security_type_label: string;
    open_at: string;
    close_at: string;
    min_subscription_amount: string;
    subsequent_increment: string;
    tenor: string | null;
    day_count_fraction: string | null;
    price_discovery_method: 'fixed_rate' | 'competitive' | 'book_building';
    price_discovery_label: string;
    investor_universe: InvestorCategory[];
    rate: string | null;
    rate_min: string | null;
    rate_max: string | null;
    rate_label: string;
    implied_yield: string | null;
    issue_price: string | null;
    maturity_date: string | null;
    allotment_date: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    uses_receiving_agents: boolean;
    status: OfferStatus;
    phase: string;
    return_reason: string | null;
    submitted_at: string | null;
    launched_at: string | null;
    final_rate: string | null;
    created_at: string;
    subscribed?: string | number | null;
    bids_count?: number;
    institution?: { id: number; name: string; reference?: string };
    creator?: { id: number; name: string };
    documents?: OfferDocument[];
    receiving_agents?: ReceivingAgent[];
    co_sponsors?: CoSponsor[];
    amendments?: Amendment[];
    allotment?: Allotment | null;
}

export interface Bid {
    id: number;
    reference: string;
    offer_id: number;
    investor_category: InvestorCategory;
    investor_type: string;
    investor_type_label: string;
    investor_name: string;
    amount: string;
    rate: string | null;
    yield: string | null;
    csd_name: string | null;
    csd_account_number: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    payee_type: 'sponsor' | 'co_sponsor' | 'receiving_agent';
    payee_id: number | null;
    payee_name: string;
    payee_bank_name: string | null;
    payee_account_name: string | null;
    payee_account_number: string | null;
    payment_status: 'pending' | 'paid' | 'invalid';
    payment_reference: string | null;
    payment_comment: string | null;
    payment_uploaded_at: string | null;
    payment_reviewed_at: string | null;
    has_evidence: boolean;
    evidence_url?: string | null;
    placed_through?: string | null;
    reviewer?: string | null;
    status: 'active' | 'revoked';
    submitted_at: string;
    revoked_at: string | null;
    offer?: Offer;
    events?: { id: number; action: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null; comment: string | null; created_at: string; user?: { name: string } | null }[];
}

export interface PayeeOption {
    type: 'sponsor' | 'co_sponsor' | 'receiving_agent';
    id: number | null;
    name: string;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
}

export interface BookSummary {
    offer_size: number;
    total_subscription: number;
    valid_subscription: number;
    paid_subscription: number;
    bids_count: number;
    investors_count: number;
    paid_count: number;
    pending_count: number;
    invalid_count: number;
    subscription_level: number;
    oversubscription: number;
    status: 'oversubscribed' | 'fully_subscribed' | 'undersubscribed';
    weighted_average_rate: number | null;
    min_rate: number | null;
    max_rate: number | null;
    final_rate: number | null;
    close_at: string | null;
    by_category: Record<InvestorCategory, number>;
    by_investor_type: { type: string; amount: number }[];
    rate_distribution: { rate: number; amount: number }[];
    demand_curve: { rate: number; cumulative: number; amount: number }[];
}

export interface WorkflowAction {
    id: number;
    stage: 'inputter' | 'tsp_authoriser' | 'fmdq_admin' | 'sec';
    decision: 'submitted' | 'approved' | 'rejected' | 'cancelled';
    reason: string | null;
    user_name: string | null;
    created_at: string;
    offer_id: number | null;
    subject_type: string;
}

export interface AuditLog {
    id: number;
    user_id: number | null;
    actor_name: string | null;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    offer_id: number | null;
    description: string;
    properties: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
}

export interface FeeInvoice {
    id: number;
    reference: string;
    institution_id: number;
    period_start: string;
    period_end: string;
    due_date: string;
    amount: string;
    method: string | null;
    status: 'unpaid' | 'pending_review' | 'paid' | 'rejected';
    gateway_reference: string | null;
    paid_at: string | null;
    reviewed_at: string | null;
    review_comment: string | null;
    evidence_url?: string | null;
    institution?: Institution;
    reviewer?: { id: number; name: string } | null;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    url: string | null;
    read_at: string | null;
    created_at: string;
}
