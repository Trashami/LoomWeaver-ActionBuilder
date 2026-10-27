import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import {
  ActionStudioContext,
  ApplyCampaignRuleResponse,
  CampaignActionRule,
  EncounterAttackStepRequest,
  EncounterAttackStepResponse,
  EvaluateRuleLogicRequest,
  EvaluateRuleLogicResponse,
} from '../models/action-studio.models';
import { FALLBACK_STUDIO_CONTEXT } from '../models/action-studio.fallback';

@Injectable({ providedIn: 'root' })
export class ActionStudioApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api/v2/actions';

  loadStudioContext(campaignId?: number | null, accountId?: string | null): Observable<ActionStudioContext> {
    let params = new HttpParams();
    if (campaignId && campaignId > 0) {
      params = params.set('campaignId', String(campaignId));
    }
    if (accountId && accountId.trim().length > 0) {
      params = params.set('accountId', accountId.trim());
    }

    return this.http
      .get<ActionStudioContext>(`${this.apiBase}/context`, {
        params,
        headers: this.buildAuthHeaders(),
        withCredentials: true,
      })
      .pipe(catchError(() => of(FALLBACK_STUDIO_CONTEXT)));
  }

  applyRuleToCampaign(
    campaignId: number,
    rule: CampaignActionRule,
    accountId?: string | null
  ): Observable<ApplyCampaignRuleResponse> {
    let params = new HttpParams();
    if (accountId && accountId.trim().length > 0) {
      params = params.set('accountId', accountId.trim());
    }

    return this.http.post<ApplyCampaignRuleResponse>(
      `${this.apiBase}/campaigns/${campaignId}/apply-rule`,
      { campaignId, rule },
      {
        params,
        headers: this.buildAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  resetRuleToDefault(
    campaignId: number,
    ruleId: string,
    accountId?: string | null
  ): Observable<{ success: boolean; message: string; rules: CampaignActionRule[] }> {
    let params = new HttpParams();
    if (accountId && accountId.trim().length > 0) {
      params = params.set('accountId', accountId.trim());
    }

    return this.http.post<{ success: boolean; message: string; rules: CampaignActionRule[] }>(
      `${this.apiBase}/campaigns/${campaignId}/reset-rule`,
      { campaignId, ruleId },
      {
        params,
        headers: this.buildAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  createQuickDmCampaign(
    name: string,
    rulesetLabel: string,
    accountId?: string | null
  ): Observable<ActionStudioContext> {
    let params = new HttpParams();
    if (accountId && accountId.trim().length > 0) {
      params = params.set('accountId', accountId.trim());
    }

    return this.http.post<ActionStudioContext>(
      `${this.apiBase}/campaigns/create-dm-campaign`,
      { name, rulesetLabel },
      {
        params,
        headers: this.buildAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  evaluateRuleLogic(req: EvaluateRuleLogicRequest): Observable<EvaluateRuleLogicResponse> {
    return this.http.post<EvaluateRuleLogicResponse>(
      `${this.apiBase}/evaluate-logic`,
      req,
      {
        headers: this.buildAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  runEncounterAttackStep(req: EncounterAttackStepRequest): Observable<EncounterAttackStepResponse> {
    return this.http.post<EncounterAttackStepResponse>(
      `${this.apiBase}/encounter-step`,
      req,
      {
        headers: this.buildAuthHeaders(),
        withCredentials: true,
      }
    );
  }

  private buildAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    try {
      const token =
        localStorage.getItem('lw_auth_token') ||
        localStorage.getItem('mw_auth_token') ||
        this.readCookie('mw_auth_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Ignore storage access errors in SSR or restricted contexts
    }
    return headers;
  }

  private readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
}
