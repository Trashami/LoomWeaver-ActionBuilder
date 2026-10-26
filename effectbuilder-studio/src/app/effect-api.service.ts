import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EffectAssignment, EffectDefinition } from './effects/effect-definition';
export interface EffectListing { id: number; title: string; description: string; authorName: string; effectCount: number; }
@Injectable({ providedIn: 'root' })
export class EffectApiService {
  private http = inject(HttpClient);
  summonNpcs(cid:number) { return this.http.get<{id:number;name:string;tokenUrl:string}[]>(`/api/effects/campaigns/${cid}/summon-npcs`); }
  tokenAssets(search:string) { return this.http.get<{items:{name:string;tokenUrl:string}[];total:number}>("/api/assets/library",{params:{search,limit:36,pack:"project_all"}}); }
  uploadToken(file:File) { const data=new FormData();data.append("file",file);return this.http.post<{url:string}>("/api/summon-assets",data); }
  library() { return this.http.get<EffectDefinition[]>('/api/effects/library'); }
  save(d: EffectDefinition) { return this.http.put('/api/effects/library/' + d.id, d); }
  delete(id: string) { return this.http.delete('/api/effects/library/' + id); }
  assignments(id: number) { return this.http.get<EffectAssignment[]>(`/api/effects/campaigns/${id}/assignments`); }
  assign(id: number, a: EffectAssignment) { return this.http.put(`/api/effects/campaigns/${id}/assignments`, a); }
  unassign(id: number, a: EffectAssignment) { return this.http.delete(`/api/effects/campaigns/${id}/assignments`, { params: { spellName: a.spellName, characterId: a.characterId } }); }
  members(id: number) { return this.http.get<{ members: { character_id: number | null; character_name: string | null }[] }>(`/api/campaigns/${id}/members`); }
  listings() { return this.http.get<EffectListing[]>('/api/effects/marketplace'); }
  pack(id: number) { return this.http.get<{ effects: EffectDefinition[] }>(`/api/effects/marketplace/${id}`); }
  publish(title: string, description: string, effects: EffectDefinition[]) { return this.http.post('/api/effects/marketplace', { title, description, effects }); }
}
