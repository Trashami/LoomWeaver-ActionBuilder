import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export interface CatalogSpell { id: number; name: string; level: number; school: string; source_book?: string | null; }
interface SpellPage { items: CatalogSpell[]; total: number; }

/** Searches every catalog page, independently of character spell lists. */
@Component({ selector: 'mw-spell-picker', standalone: true, imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>Search the spell catalog<input aria-label="Search the spell catalog" placeholder="Spell name, school, or description" [ngModel]="query()" (ngModelChange)="search($event)" /></label>
    <p class="selection" aria-live="polite">{{ selected() ? 'Selected: '+selected()!.name : 'Choose a spell below.' }}</p>
    @if (loading()) { <p role="status">Searching catalog…</p> }
    @if (error()) { <p role="alert">{{error()}}</p><button type="button" (click)="retry.update(n=>n+1)">Retry catalog</button> }
    @if (!loading() && !error()) {
      <div class="results" role="group" aria-label="Catalog spell results">
        @for (spell of items(); track spell.id) {
          <button type="button" [attr.aria-pressed]="selected()?.id===spell.id" (click)="choose(spell)">
            <mw-icon name="book-open" /><span><strong>{{spell.name}}</strong><small>{{spell.level===0 ? 'Cantrip' : 'Level '+spell.level}} · {{spell.school}}@if(spell.source_book){ · {{spell.source_book}} }</small></span>
          </button>
        } @empty { <p>No spells found. Try another search.</p> }
      </div>
      <nav aria-label="Spell catalog pages"><button type="button" [disabled]="offset()===0" (click)="offset.update(n=>Math.max(0,n-pageSize))">Previous</button><span>{{total() ? offset()+1 : 0}}–{{Math.min(offset()+items().length,total())}} of {{total()}}</span><button type="button" [disabled]="offset()+items().length>=total()" (click)="offset.update(n=>n+pageSize)">Next</button></nav>
    }
  `,
  styles: [`:host{display:block}label{display:grid;gap:8px;font-size:13px}input{width:100%;box-sizing:border-box;padding:10px;background:#0b111a;color:#e4eef3;border:1px solid #334155;border-radius:5px}.selection{color:#58deb4;font-size:13px}.results{max-height:260px;overflow:auto;display:grid;gap:4px}button{font:inherit;color:inherit;border:1px solid #293544;background:#141d28;border-radius:4px;padding:9px;cursor:pointer}.results button{display:flex;gap:10px;text-align:left;align-items:center}.results button[aria-pressed=true]{border-color:#00d398;background:#073329}.results span{display:grid;gap:4px}.results small{font-size:11px;color:#94a9b8}nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0;font-size:12px}button:disabled{opacity:.4;cursor:default}button:focus-visible{outline:2px solid #00d398;outline-offset:2px}`]
})
export class SpellPickerComponent {
  private http=inject(HttpClient);
  readonly Math=Math; readonly pageSize=50;
  readonly query=signal(''); readonly offset=signal(0); readonly retry=signal(0);
  readonly items=signal<CatalogSpell[]>([]); readonly total=signal(0); readonly selected=signal<CatalogSpell|null>(null);
  readonly loading=signal(false); readonly error=signal('');
  @Input() set initialSearch(value:string){this.search(value ?? '');}
  @Output() spellSelected=new EventEmitter<CatalogSpell|null>();
  constructor(){effect(cleanup=>{
    const search=this.query(),offset=this.offset();this.retry();this.loading.set(true);this.error.set('');
    let subscription:Subscription|undefined;
    const timer=setTimeout(()=>{
      subscription=this.http.get<SpellPage>('/api/spells',{params:{search,offset,limit:this.pageSize}}).subscribe({
        next:page=>{this.items.set(page.items);this.total.set(page.total);this.loading.set(false);},
        error:()=>{this.items.set([]);this.total.set(0);this.loading.set(false);this.error.set('Could not load the spell catalog. Retry to continue.');}
      });
    },200);
    cleanup(()=>{clearTimeout(timer);subscription?.unsubscribe();});
  });}
  search(value:string):void{this.query.set(value);this.offset.set(0);}
  choose(spell:CatalogSpell):void{this.selected.set(spell);this.spellSelected.emit(spell);}
}
