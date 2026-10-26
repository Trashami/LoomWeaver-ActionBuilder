import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RuleEngineMethodDescriptor,
  RuleEngineSymbolDescriptor,
  RuleLogicClause,
} from '../../../core/models/action-studio.models';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';
import { LwPanelComponent } from '../panel/panel.component';

@Component({
  selector: 'lw-clause-sentence-editor',
  standalone: true,
  imports: [FormsModule, LwPanelComponent, LwButtonComponent, LwBadgeComponent, LwIconComponent],
  templateUrl: './clause-sentence-editor.component.html',
  styleUrl: './clause-sentence-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwClauseSentenceEditorComponent {
  readonly clauses = input<RuleLogicClause[]>([]);
  readonly keywords = input<string[]>([
    'When',
    'If',
    'Contains',
    'Has',
    'Has Not',
    'Where',
    'And',
    'Or',
    'With',
    'Then',
    'Else',
  ]);
  readonly tokenSuggestions = input<Record<string, string[]>>({});
  readonly engineSymbols = input<RuleEngineSymbolDescriptor[]>([]);
  readonly defaultClassName = input<string>('CombatRuleInterpreter');
  readonly defaultMethodName = input<string>('ResolveShieldReactionWindow');

  readonly clausesChange = output<RuleLogicClause[]>();

  readonly customTokenDrafts = signal<Record<string, string>>({});

  keywordTone(keyword: string): LwBadgeTone {
    switch ((keyword || '').toLowerCase()) {
      case 'when':
        return 'gold';
      case 'if':
      case 'where':
      case 'and':
      case 'or':
        return 'cyan';
      case 'contains':
      case 'has':
      case 'has not':
        return 'violet';
      case 'then':
      case 'with':
        return 'emerald';
      case 'else':
        return 'crimson';
      default:
        return 'neutral';
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

  onKeywordChange(index: number, newKeyword: string): void {
    const next = this.clauses().map((c, idx) =>
      idx === index ? { ...c, keyword: newKeyword } : c
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

  addSuggestedToken(index: number, token: string): void {
    if (!token) return;
    const next = this.clauses().map((c, idx) => {
      if (idx !== index) return c;
      if (c.tokens.includes(token)) return c;
      return { ...c, tokens: [...c.tokens, token] };
    });
    this.clausesChange.emit(next);
  }

  updateDraft(clauseId: string, text: string): void {
    this.customTokenDrafts.update((curr) => ({ ...curr, [clauseId]: text }));
  }

  addCustomToken(index: number, clauseId: string): void {
    const raw = (this.customTokenDrafts()[clauseId] || '').trim();
    if (!raw) return;
    this.addSuggestedToken(index, raw);
    this.updateDraft(clauseId, '');
  }

  removeToken(index: number, tokenIndex: number): void {
    const next = this.clauses().map((c, idx) => {
      if (idx !== index) return c;
      return { ...c, tokens: c.tokens.filter((_, tIdx) => tIdx !== tokenIndex) };
    });
    this.clausesChange.emit(next);
  }

  addClause(keyword: string): void {
    const defaultSug = this.suggestionsForKeyword(keyword)[0] || 'Custom Condition';
    const created: RuleLogicClause = {
      id: `clause-${Date.now()}-${this.clauses().length + 1}`,
      keyword,
      tokens: [defaultSug],
      boundClass: this.defaultClassName() || 'CombatRuleInterpreter',
      boundMethod: this.defaultMethodName() || 'ResolveShieldReactionWindow',
      notes: `Evaluates ${keyword} clause in rules engine.`,
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
