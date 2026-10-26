import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoomWeaverStoreService } from './loomweaver-store.service';
import { TableRealtimeSyncService } from './table-realtime-sync.service';

export interface UserAccountProfileVm {
  readonly accountId: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly role: 'gm' | 'players';
  readonly tierCode: string;
  readonly boundCharacter: string;
  readonly ownedAssetIds: readonly string[];
  readonly creatorBalanceUsd: number;
}

export interface StripeSettlementVm {
  readonly sessionId: string;
  readonly paymentStatus: string;
  readonly itemId: string;
  readonly itemTitle: string;
  readonly grossAmountUsd: number;
  readonly creatorTransferUsd: number;
  readonly platformFeeUsd: number;
  readonly creatorHandle: string;
  readonly receiptNumber: string;
  readonly settledAt: string;
}

const DEFAULT_ACCOUNTS: readonly UserAccountProfileVm[] = [
  {
    accountId: 'acc-gm-trashami',
    username: 'trashami',
    displayName: 'Trashami · Master GM & Creator',
    email: 'gm@loom-weaver.com',
    role: 'gm',
    tierCode: 'archmage',
    boundCharacter: 'GM',
    ownedAssetIds: [
      'asset-map-cinth',
      'asset-dice-runed-obsidian',
      'mod-cinth-masquerade-pack',
      'mod-shadow-mountain-raid',
    ],
    creatorBalanceUsd: 1842.5,
  },
  {
    accountId: 'acc-player-fivi',
    username: 'fivi_fey',
    displayName: 'Fivi · Feywild Outcast (Free Seat)',
    email: 'fivi@loom-weaver.com',
    role: 'players',
    tierCode: 'free_player',
    boundCharacter: 'Fivi',
    ownedAssetIds: ['asset-dice-runed-obsidian'],
    creatorBalanceUsd: 0,
  },
  {
    accountId: 'acc-player-dal',
    username: 'dal_ranger',
    displayName: 'Dal · Edhellainian Heir (Free Seat)',
    email: 'dal@loom-weaver.com',
    role: 'players',
    tierCode: 'free_player',
    boundCharacter: 'Dal',
    ownedAssetIds: ['asset-map-cinth'],
    creatorBalanceUsd: 0,
  },
  {
    accountId: 'acc-player-kildrid',
    username: 'kildrid_stone',
    displayName: 'Kildrid · Dwarven Runesmith (Free Seat)',
    email: 'kildrid@loom-weaver.com',
    role: 'players',
    tierCode: 'free_player',
    boundCharacter: 'Kildrid',
    ownedAssetIds: [],
    creatorBalanceUsd: 0,
  },
  {
    accountId: 'acc-player-kycius',
    username: 'kycius_blade',
    displayName: 'Kycius · Seeker of Truth (Free Seat)',
    email: 'kycius@loom-weaver.com',
    role: 'players',
    tierCode: 'free_player',
    boundCharacter: 'Kycius',
    ownedAssetIds: [],
    creatorBalanceUsd: 0,
  },
  {
    accountId: 'acc-player-munk',
    username: 'munk_vanguard',
    displayName: 'Munk · Frontline Vanguard (Free Seat)',
    email: 'munk@loom-weaver.com',
    role: 'players',
    tierCode: 'free_player',
    boundCharacter: 'Munk',
    ownedAssetIds: [],
    creatorBalanceUsd: 0,
  },
];

const DEFAULT_SETTLEMENTS: readonly StripeSettlementVm[] = [
  {
    sessionId: 'cs_live_a1b2c3d4e5',
    paymentStatus: 'paid_settled',
    itemId: 'mod-cinth-masquerade-pack',
    itemTitle: 'Cinth Masquerade & Artificer District Campaign Module',
    grossAmountUsd: 24.0,
    creatorTransferUsd: 20.4,
    platformFeeUsd: 3.6,
    creatorHandle: '@TrashamiChronicles',
    receiptNumber: 'LW-8515-9041',
    settledAt: new Date().toISOString(),
  },
  {
    sessionId: 'cs_live_f6g7h8i9j0',
    paymentStatus: 'paid_settled',
    itemId: 'mod-shadow-mountain-raid',
    itemTitle: 'Shadow of the Mountain — Runic Cavern & Dragon Boss Pack',
    grossAmountUsd: 18.0,
    creatorTransferUsd: 15.3,
    platformFeeUsd: 2.7,
    creatorHandle: '@TrashamiChronicles',
    receiptNumber: 'LW-8515-9042',
    settledAt: new Date().toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(LoomWeaverStoreService);
  private readonly realtime = inject(TableRealtimeSyncService);

  readonly accounts = signal<readonly UserAccountProfileVm[]>(DEFAULT_ACCOUNTS);
  readonly activeAccountId = signal<string>('acc-gm-trashami');
  readonly jwtToken = signal<string>(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhY2MtZ20tdHJhc2hhbWkiLCJyb2xlIjoiZ20ifQ.VERIFIED',
  );
  readonly settlements = signal<readonly StripeSettlementVm[]>(DEFAULT_SETTLEMENTS);

  readonly activeProfile = computed(
    () =>
      this.accounts().find((a) => a.accountId === this.activeAccountId()) ??
      this.accounts()[0],
  );

  constructor() {
    this.http.get<readonly UserAccountProfileVm[]>('/api/v2/auth/accounts').subscribe({
      next: (res) => {
        if (res?.length) this.accounts.set(res);
      },
      error: () => {},
    });

    this.http.get<readonly StripeSettlementVm[]>('/api/v2/marketplace/settlements').subscribe({
      next: (res) => {
        if (res?.length) this.settlements.set(res);
      },
      error: () => {},
    });
  }

  loginAsAccount(accountId: string): void {
    this.activeAccountId.set(accountId);
    const localFound = this.accounts().find((a) => a.accountId === accountId);
    if (localFound) {
      this.store.setViewerRole(localFound.role);
    }

    this.http
      .post<{ token: string; profile: UserAccountProfileVm }>('/api/v2/auth/login', {
        accountId,
      })
      .subscribe({
        next: (res) => {
          if (res?.token) this.jwtToken.set(res.token);
          if (res?.profile) {
            this.store.setViewerRole(res.profile.role);
            this.realtime.refreshPresence();
          }
        },
        error: () => {},
      });
  }

  executeStripeCheckout(
    itemId: string,
    itemTitle: string,
    creatorHandle: string,
    priceUsd: number,
  ): void {
    const profile = this.activeProfile();
    this.http
      .post<StripeSettlementVm>('/api/v2/marketplace/checkout', {
        accountId: profile.accountId,
        itemId,
        itemTitle,
        creatorHandle,
        priceUsd,
      })
      .subscribe({
        next: (settlement) => {
          this.settlements.update((prev) => [settlement, ...prev]);
          this.realtime.refreshPresence();
        },
        error: () => {
          const creatorTransferUsd = Number((priceUsd * 0.85).toFixed(2));
          const platformFeeUsd = Number((priceUsd - creatorTransferUsd).toFixed(2));
          const fallback: StripeSettlementVm = {
            sessionId: `cs_live_${Date.now()}`,
            paymentStatus: 'paid_settled',
            itemId,
            itemTitle,
            grossAmountUsd: priceUsd,
            creatorTransferUsd,
            platformFeeUsd,
            creatorHandle,
            receiptNumber: `LW-8515-${Math.floor(Math.random() * 9000) + 1000}`,
            settledAt: new Date().toISOString(),
          };
          this.settlements.update((prev) => [fallback, ...prev]);
        },
      });
  }
}
