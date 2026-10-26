export interface User {
  id: number;
  accountId?: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: 'admin' | 'dm' | 'gm' | 'player' | 'players' | 'user';
  tier: string;
  billingCycle: 'monthly' | 'annual';
  subscriptionStatus: string;
  subscriptionExpiresAt?: string;
  subscriptionAiCredits: number;
  purchasedAiCredits: number;
  totalAiCredits: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  activeCampaignsLimit: number;
  createdAt?: string;
  patreonId?: string;
  patreonStatus?: string;
  patreonTierId?: string;
  hideAiContent?: boolean;
  enableWeave?: boolean;
  isAdmin?: boolean;
  boundCharacter?: string;
  token?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt?: string;
  user?: User;
  profile?: {
    accountId: string;
    username: string;
    displayName: string;
    email: string;
    role: string;
    tierCode: string;
    boundCharacter?: string;
  };
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
  role?: string;
}
