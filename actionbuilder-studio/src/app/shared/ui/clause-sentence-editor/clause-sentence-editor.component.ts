import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import {
  CampaignActionRule,
  ClauseCombiner,
  RuleEngineMethodDescriptor,
  RuleEngineSymbolDescriptor,
  RuleLogicClause,
} from '../../../core/models/action-studio.models';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-clause-sentence-editor',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwButtonComponent, LwIconComponent],
  templateUrl: './clause-sentence-editor.component.html',
  styleUrl: './clause-sentence-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwClauseSentenceEditorComponent {
  readonly rule = input<CampaignActionRule | null>(null);
  readonly clauses = input<RuleLogicClause[]>([]);
  readonly keywords = input<string[]>([
    'When',
    'If',
    'Contains',
    'Has',
    'Has Not',
    'Where',
    'With',
    'Then',
    'Else',
  ]);
  readonly tokenSuggestions = input<Record<string, string[]>>({});
  readonly engineSymbols = input<RuleEngineSymbolDescriptor[]>([]);
  readonly defaultClassName = input<string>('CombatRuleInterpreter');
  readonly defaultMethodName = input<string>('ResolveShieldReactionWindow');

  readonly clausesChange = output<RuleLogicClause[]>();
  readonly primaryBindingChange = output<{
    primaryClassName: string;
    primaryMethodName: string;
    sourceFilePath: string;
  }>();

  readonly activePickerClauseId = signal<string | null>(null);
  readonly customDraftText = signal<string>('');
  readonly engineInspectorOpen = signal<boolean>(false);

  readonly diagnostics = computed(() => {
    const list: string[] = [];
    for (const c of this.clauses()) {
      for (const t of c.tokens) {
        if (t.toLowerCase().includes('unsupported')) {
          list.push(
            `Clause '${this.plainHeadingForKeyword(c.keyword)}' contains an unsupported check ("${t}") which will report "Not evaluated" in automated tests.`
          );
        }
      }
    }
    return list;
  });

  plainHeadingForKeyword(keyword: string): string {
    switch ((keyword || '').toLowerCase()) {
      case 'when':
        return 'Trigger Event (When)';
      case 'has':
        return 'Required Resources (Has)';
      case 'contains':
        return 'Casting & Tag Requirements (Contains)';
      case 'has not':
        return 'Blocker Guard (Has Not)';
      case 'where':
        return 'Range & Spatial Constraint (Where)';
      case 'if':
        return 'Roll or Save Comparison (If)';
      case 'with':
        return 'Prepared Modifier (With)';
      case 'then':
        return 'Resolved Effects (Then)';
      case 'else':
        return 'Fallback Resolution (Else)';
      default:
        return `Condition Branch (${keyword})`;
    }
  }

  suggestionsForKeyword(keyword: string): string[] {
    const map = this.tokenSuggestions();
    return map[keyword] || map['If'] || [];
  }

  methodsForClass(className: string): RuleEngineMethodDescriptor[] {
    const found = this.engineSymbols().find((s) => s.className === className);
    return found ? found.methods : this.engineSymbols()[0]?.methods || [];
  }

  togglePicker(clauseId: string): void {
    this.activePickerClauseId.update((cur) => (cur === clauseId ? null : clauseId));
    this.customDraftText.set('');
  }

  onKeywordChange(index: number, newKeyword: string): void {
    const next = this.clauses().map((c, idx) =>
      idx === index ? { ...c, keyword: newKeyword } : c
    );
    this.clausesChange.emit(next);
  }

  onCombinerChange(index: number, combiner: ClauseCombiner): void {
    const next = this.clauses().map((c, idx) =>
      idx === index ? { ...c, combiner } : c
    );
    this.clausesChange.emit(next);
  }

  onClassChange(index: number, newClass: string): void {
    const methods = this.methodsForClass(newClass);
    const firstMethod = methods[0]?.methodName || '';
    const next = this.clauses().map((c, idx) =>
      idx === index ? { ...c, boundClass: newClass, boundMethod: firstMethod } : c
    );
    this.clausesChange.emit(next);
  }

  onMethodChange(index: number, newMethod: string): void {
    const next = this.clauses().map((c, idx) =>
      idx === index ? { ...c, boundMethod: newMethod } : c
    );
    this.clausesChange.emit(next);
  }

  onPrimaryClassChange(newClass: string): void {
    const methods = this.methodsForClass(newClass);
    const firstMethod = methods[0]?.methodName || '';
    const sym = this.engineSymbols().find((s) => s.className === newClass);
    this.primaryBindingChange.emit({
      primaryClassName: newClass,
      primaryMethodName: firstMethod,
      sourceFilePath: sym?.filePath || '',
    });
  }

  onPrimaryMethodChange(newMethod: string): void {
    const cls = this.rule()?.primaryClassName || this.defaultClassName();
    const sym = this.engineSymbols().find((s) => s.className === cls);
    this.primaryBindingChange.emit({
      primaryClassName: cls,
      primaryMethodName: newMethod,
      sourceFilePath: sym?.filePath || '',
    });
  }

  addTokenToClause(index: number, rawToken: string): void {
    const clean = (rawToken || '').trim();
    if (!clean) return;
    const next = this.clauses().map((c, idx) => {
      if (idx !== index) return c;
      if (c.tokens.includes(clean)) return c;
      return { ...c, tokens: [...c.tokens, clean] };
    });
    this.clausesChange.emit(next);
    this.customDraftText.set('');
    this.activePickerClauseId.set(null);
  }

  removeToken(index: number, tokenIndex: number): void {
    const next = this.clauses().map((c, idx) => {
      if (idx !== index) return c;
      return { ...c, tokens: c.tokens.filter((_, tIdx) => tIdx !== tokenIndex) };
    });
    this.clausesChange.emit(next);
  }

  addClause(keyword: string): void {
    const defaultSug = this.suggestionsForKeyword(keyword)[0] || 'Custom condition';
    const created: RuleLogicClause = {
      id: `clause-${Date.now()}-${this.clauses().length + 1}`,
      keyword,
      combiner: keyword.toLowerCase() === 'when' ? 'ANY' : 'ALL',
      tokens: [defaultSug],
      boundClass: this.defaultClassName() || 'CombatRuleInterpreter',
      boundMethod: this.defaultMethodName() || 'ResolveShieldReactionWindow',
      notes: `Evaluates ${keyword} branch.`,
    };
    this.clausesChange.emit([...this.clauses(), created]);
  }

  moveClause(index: number, delta: -1 | 1): void {
    const target = index + delta;
    const list = [...this.clauses()];
    if (target < 0 || target >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(target, 0, moved);
    this.clausesChange.emit(list);
  }

  removeClause(index: number): void {
    const next = this.clauses().filter((_, idx) => idx !== index);
    this.clausesChange.emit(next);
  }
}
