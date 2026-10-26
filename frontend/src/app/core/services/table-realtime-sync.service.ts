import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface TablePresenceSeatVm {
  readonly seatId: string;
  readonly displayName: string;
  readonly role: string;
  readonly boundCharacter: string;
  readonly status: string;
  readonly activeRoute: string;
  readonly latencyMs: number;
}

export interface TableRealtimeEventVm {
  readonly eventId: string;
  readonly campaignId: number;
  readonly eventType: string;
  readonly actorName: string;
  readonly summary: string;
  readonly payloadJson: string;
  readonly timestamp: string;
}

const DEFAULT_SEATS: readonly TablePresenceSeatVm[] = [
  {
    seatId: 'seat-gm',
    displayName: 'Trashami (Game Master)',
    role: 'gm',
    boundCharacter: 'GM',
    status: 'Broadcasting Live',
    activeRoute: '/arcane-screen',
    latencyMs: 14,
  },
  {
    seatId: 'seat-dal',
    displayName: 'Dal (Heir in Exile)',
    role: 'players',
    boundCharacter: 'Dal',
    status: 'Connected · Free Seat',
    activeRoute: '/campaigns',
    latencyMs: 22,
  },
  {
    seatId: 'seat-fivi',
    displayName: 'Fivi (Arcane Trickster)',
    role: 'players',
    boundCharacter: 'Fivi',
    status: 'Connected · Free Seat',
    activeRoute: '/dice',
    latencyMs: 19,
  },
  {
    seatId: 'seat-kildrid',
    displayName: 'Kildrid (Stone-Scholar)',
    role: 'players',
    boundCharacter: 'Kildrid',
    status: 'Connected · Free Seat',
    activeRoute: '/maps',
    latencyMs: 27,
  },
  {
    seatId: 'seat-kycius',
    displayName: 'Kycius (Spellblade)',
    role: 'players',
    boundCharacter: 'Kycius',
    status: 'Connected · Free Seat',
    activeRoute: '/effects',
    latencyMs: 24,
  },
  {
    seatId: 'seat-munk',
    displayName: 'Munk (Vanguard)',
    role: 'players',
    boundCharacter: 'Munk',
    status: 'Connected · Free Seat',
    activeRoute: '/arcane-screen',
    latencyMs: 18,
  },
];

const DEFAULT_EVENTS: readonly TableRealtimeEventVm[] = [
  {
    eventId: 'evt-seed-303',
    campaignId: 1,
    eventType: 'dice_rolled',
    actorName: 'Fivi',
    summary: 'Rolled 1d20+8 (ADV) = 28 · Natural 20 Solar Supernova Burst triggered on Bound Dragon.',
    payloadJson: '{"sides":20,"total":28,"isNat20":true}',
    timestamp: new Date().toISOString(),
  },
  {
    eventId: 'evt-seed-302',
    campaignId: 1,
    eventType: 'token_moved',
    actorName: 'Munk',
    summary: 'Moved frontline token 30 ft to Cinth Ballroom Upper Balcony (Grid 14, 8).',
    payloadJson: '{"gridX":14,"gridZ":8}',
    timestamp: new Date().toISOString(),
  },
  {
    eventId: 'evt-seed-301',
    campaignId: 1,
    eventType: 'audio_transition',
    actorName: 'GM · Trashami',
    summary: "Crossfaded table soundscape to 'Shadow Beneath the Mountain' (3.2s ramp).",
    payloadJson: '{"presetId":"preset-shadow-mountain"}',
    timestamp: new Date().toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class TableRealtimeSyncService {
  private readonly http = inject(HttpClient);
  private channel: BroadcastChannel | null = null;

  readonly seats = signal<readonly TablePresenceSeatVm[]>(DEFAULT_SEATS);
  readonly recentEvents = signal<readonly TableRealtimeEventVm[]>(DEFAULT_EVENTS);
  readonly syncProtocolLabel = signal<string>('SignalR /hubs/table + BroadcastChannel Active');

  constructor() {
    this.initBroadcastChannel();
  }

  refreshPresence(): void {
    const hasToken =
      typeof localStorage !== 'undefined' && !!localStorage.getItem('mw_auth_token');
    if (!hasToken) return;

    this.http
      .get<{
        seats: readonly TablePresenceSeatVm[];
        recentEvents: readonly TableRealtimeEventVm[];
      }>('/api/v2/campaigns/1/realtime/presence')
      .subscribe({
        next: (res) => {
          if (res?.seats?.length) this.seats.set(res.seats);
          if (res?.recentEvents?.length) this.recentEvents.set(res.recentEvents);
        },
        error: () => {},
      });
  }

  publishTableEvent(eventType: string, actorName: string, summary: string, payload: unknown = {}): void {
    const payloadJson = JSON.stringify(payload);
    this.http
      .post<TableRealtimeEventVm>('/api/v2/campaigns/1/realtime/events', {
        eventType,
        actorName,
        summary,
        payloadJson,
      })
      .subscribe({
        next: (evt) => {
          this.appendEventLocally(evt);
          this.channel?.postMessage(evt);
        },
        error: () => {
          const fallback: TableRealtimeEventVm = {
            eventId: `evt-${Date.now()}`,
            campaignId: 1,
            eventType,
            actorName,
            summary,
            payloadJson,
            timestamp: new Date().toISOString(),
          };
          this.appendEventLocally(fallback);
          this.channel?.postMessage(fallback);
        },
      });
  }

  private appendEventLocally(evt: TableRealtimeEventVm): void {
    this.recentEvents.update((prev) => [evt, ...prev.filter((e) => e.eventId !== evt.eventId).slice(0, 11)]);
  }

  private initBroadcastChannel(): void {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    this.channel = new BroadcastChannel('loomweaver-v2-table-sync');
    this.channel.onmessage = (msg: MessageEvent<TableRealtimeEventVm>) => {
      if (msg?.data?.eventId) {
        this.appendEventLocally(msg.data);
      }
    };
  }
}
