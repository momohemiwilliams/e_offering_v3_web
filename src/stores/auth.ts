import { create } from 'zustand';
import type { AuthUser } from '@/types';

interface PendingSignIn {
    challenge: string;
    email: string;
    ttl: number;
}

/** Shape returned by the API's auth/login, auth/otp and auth/me. */
export interface ApiUser {
    id: number;
    name: string;
    email: string;
    type: AuthUser['type'];
    accessLevel: AuthUser['access_level'];
    roleLabel: string;
    investorCategory: AuthUser['investor_category'];
    institution: { id: number; name: string; type: string; regulatorBody: string | null } | null;
    tspFullAccess: boolean;
    unreadNotifications: number;
    idleTimeout: number;
}

const TOKEN_KEY = 'eoffering_token';
const USER_KEY = 'eoffering_user';
const PENDING_KEY = 'eoffering_pending_signin';

function readJson<T>(storage: Storage, key: string): T | null {
    try {
        return JSON.parse(storage.getItem(key) ?? 'null') as T | null;
    } catch {
        return null;
    }
}

function toAuthUser(user: ApiUser): AuthUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        access_level: user.accessLevel,
        role_label: user.roleLabel,
        investor_category: user.investorCategory,
        institution: user.institution ? { id: user.institution.id, name: user.institution.name, type: user.institution.type, regulator_body: user.institution.regulatorBody } : null,
        tsp_full_access: user.tspFullAccess
    };
}

interface AuthState {
    accessToken: string | null;
    user: AuthUser | null;
    unread: number;
    idleTimeout: number;
    pending: PendingSignIn | null;
    setPending: (pending: PendingSignIn) => void;
    completeSignIn: (token: string, user: ApiUser) => void;
    applyUser: (user: ApiUser) => void;
    clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: localStorage.getItem(TOKEN_KEY),
    user: readJson<AuthUser>(localStorage, USER_KEY),
    unread: 0,
    idleTimeout: 0,
    pending: readJson<PendingSignIn>(sessionStorage, PENDING_KEY),
    setPending: (pending) => {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
        set({ pending });
    },
    completeSignIn: (token, user) => {
        const authUser = toAuthUser(user);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        sessionStorage.removeItem(PENDING_KEY);
        set({ accessToken: token, user: authUser, unread: user.unreadNotifications, idleTimeout: user.idleTimeout, pending: null });
    },
    applyUser: (user) => {
        const authUser = toAuthUser(user);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        set({ user: authUser, unread: user.unreadNotifications, idleTimeout: user.idleTimeout });
    },
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        set({ accessToken: null, user: null, unread: 0, idleTimeout: 0 });
    }
}));
