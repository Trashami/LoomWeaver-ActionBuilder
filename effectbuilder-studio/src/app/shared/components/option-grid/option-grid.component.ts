import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';
export interface GridOption { id: string; title: string; description: string; category: string; icon: IconName; imageUrl?: string; disabled?: boolean; disabledReason?: string; }
@Component({selector:'mw-option-grid',standalone:true,imports:[IconComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./option-grid.component.html',styleUrl:'./option-grid.component.scss'})
export class OptionGridComponent {
 readonly options=input.required<readonly GridOption[]>();
 readonly chosen=output<string>();
 readonly query=signal(''); readonly category=signal('All');
 readonly categories=computed(()=>['All',...new Set(this.options().map(o=>o.category))]);
 readonly filtered=computed(()=>{const words=this.query().toLowerCase().trim().split(/\s+/).filter(Boolean);return this.options().filter(o=>(this.category()==='All'||o.category===this.category())&&words.every(word=>(o.title+' '+o.description+' '+o.category).toLowerCase().includes(word)));});
 count(category:string):number{return category==='All'?this.options().length:this.options().filter(o=>o.category===category).length;}
}
