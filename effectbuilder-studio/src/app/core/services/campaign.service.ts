import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  dm_user_id: number;
  cover_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  my_role: 'dm' | 'player';
  my_character_id: number | null;
  my_character_name: string | null;
}

export interface CampaignMember {
  id: number;
  campaign_id: number;
  user_id: number;
  role: 'dm' | 'player';
  character_id: number | null;
  character_name: string | null;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const ACTIVE_CAMPAIGN_KEY = 'mw_active_campaign';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly _myCampaigns = signal<Campaign[]>([]);
  private readonly _activeCampaign = signal<Campaign | null>(null);
  private readonly _campaignMembers = signal<CampaignMember[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  readonly myCampaigns = this._myCampaigns.asReadonly();
  readonly activeCampaign = this._activeCampaign.asReadonly();
  readonly campaignMembers = this._campaignMembers.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly isDm = computed(() => {
    const camp = this._activeCampaign();
    const user = this.auth.currentUser();
    if (!camp || !user) return false;
    return camp.my_role === 'dm' || camp.dm_user_id === user.id || user.role === 'admin' || user.isAdmin === true;
  });

  readonly isPlayer = computed(() => {
    const camp = this._activeCampaign();
    if (!camp) return false;
    return camp.my_role === 'player' && !this.isDm();
  });

  readonly activeCampaignId = computed(() => this._activeCampaign()?.id ?? null);

  constructor() {
    this.restoreSavedCampaign();
  }

  private restoreSavedCampaign(): void {
    try {
      const saved = localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
      if (saved) {
        this._activeCampaign.set(JSON.parse(saved) as Campaign);
      }
    } catch {
      localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    }
  }

  loadMyCampaigns(): Observable<Campaign[]> {
    this._isLoading.set(true);
    return this.http.get<Campaign[]>('/api/campaigns').pipe(
      tap({
        next: (campaigns) => {
          const list = Array.isArray(campaigns) ? campaigns : [];
          this._myCampaigns.set(list);
          this._isLoading.set(false);

          const current = this._activeCampaign();
          if (current) {
            const refreshed = list.find((c) => c.id === current.id);
            if (refreshed) {
              this.setActiveCampaign(refreshed);
            } else if (list.length > 0) {
              this.setActiveCampaign(list[0]);
            }
          } else if (list.length > 0) {
            this.setActiveCampaign(list[0]);
          }
        },
        error: () => this._isLoading.set(false),
      })
    );
  }

  setActiveCampaign(campaign: Campaign): void {
    this._activeCampaign.set(campaign);
    localStorage.setItem(ACTIVE_CAMPAIGN_KEY, JSON.stringify(campaign));
    this.loadMembers(campaign.id).subscribe({ error: () => {} });
  }

  clearActiveCampaign(): void {
    this._activeCampaign.set(null);
    this._campaignMembers.set([]);
    localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
  }

  loadMembers(campaignId: number): Observable<{ members: CampaignMember[] }> {
    return this.http.get<{ members: CampaignMember[] }>(`/api/campaigns/${campaignId}/members`).pipe(
      tap((res) => this._campaignMembers.set(res?.members || []))
    );
  }
}
