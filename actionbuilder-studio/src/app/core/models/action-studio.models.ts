export type RuleLogicClauseKeyword =
  | 'When'
  | 'If'
  | 'Contains'
  | 'Has'
  | 'Has Not'
  | 'Where'
  | 'And'
  | 'Or'
  | 'With'
  | 'Then'
  | 'Else';

export interface RuleEngineMethodDescriptor {
  methodName: string;
  signature: string;
  returnType: string;
  summary: string;
  defaultTokens: string[];
}

export interface RuleEngineSymbolDescriptor {
  className: string;
  filePath: string;
  layerLabel: string;
  summary: string;
  methods: RuleEngineMethodDescriptor[];
}

export interface RuleLogicClause {
  id: string;
  keyword: RuleLogicClauseKeyword | string;
  tokens: string[];
  boundClass: string;
  boundMethod: string;
  notes: string;
}

export interface ActionScalingTier {
  levelRange: string;
  diceOrValue: string;
  label: string;
  summary: string;
}

export interface CampaignActionRule {
  id: string;
  ruleCode: string;
  name: string;
  category: string;
  sourceLabel: string;
  rulesetCode: string;
  summary: string;
  actionCost: string;
  actionType: string;
  rangeLabel: string;
  targetLabel: string;
  attackOrSaveLabel: string;
  damageOrEffectFormula: string;
  saveDc: number;
  acBonus: number;
  durationLabel: string;
  requiresConcentration: boolean;
  PrimaryClassName?: string;
  primaryClassName: string;
  primaryMethodName: string;
  sourceFilePath: string;
  clauses: RuleLogicClause[];
  scalingTiers: ActionScalingTier[];
  worksWith: string[];
  conflictsWith: string[];
  tags: string[];
  isCustomizedForCampaign: boolean;
  updatedByUsername: string;
  updatedAt: string;
}

export interface DmCampaignOption {
  id: number;
  slug: string;
  name: string;
  systemCode: string;
  rulesetLabel: string;
  dmUserId: number;
  dmUsername: string;
  myRole: string;
  customizedRuleCount: number;
}

export interface ActionStudioAccountOption {
  userId: number;
  accountId: string;
  username: string;
  displayName: string;
  email: string;
  roleSummary: string;
  ownsDmCampaign: boolean;
  defaultDmCampaignId: number;
}

export interface ActionStudioContext {
  userId: number;
  username: string;
  displayName: string;
  accountRole: 'dm' | 'player' | string;
  canAccessActionBuilder: boolean;
  accessDeniedReason: string | null;
  switchedFromPlayerCampaignNotice: string | null;
  activeCampaign: DmCampaignOption | null;
  dmCampaigns: DmCampaignOption[];
  playerOnlyCampaignNames: string[];
  rules: CampaignActionRule[];
  engineSymbols: RuleEngineSymbolDescriptor[];
  clauseKeywords: string[];
  tokenSuggestionsByKeyword: Record<string, string[]>;
  demoAccounts: ActionStudioAccountOption[];
}

export interface ApplyCampaignRuleResponse {
  success: boolean;
  message: string;
  campaignId: number;
  campaignName: string;
  rule: CampaignActionRule;
  customizedRuleCount: number;
}

export interface RuleClauseTraceStep {
  stepNumber: number;
  keyword: string;
  expressionText: string;
  boundSymbol: string;
  passed: boolean;
  outcomeDetail: string;
}

export interface EvaluateRuleLogicRequest {
  campaignId: number;
  ruleId: string;
  ruleName: string;
  primaryClassName: string;
  primaryMethodName: string;
  clauses: RuleLogicClause[];
  actionCost: string;
  damageOrEffectFormula: string;
  saveDc: number;
  acBonus: number;
  attackerName: string;
  defenderName: string;
  attackRollTotal: number;
  targetAc: number;
  distanceFeet: number;
  reactionAvailable: boolean;
  hasSpellSlot: boolean;
  damageRolled: number;
}

export interface EvaluateRuleLogicResponse {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  conditionsPassed: boolean;
  finalResolutionSummary: string;
  combatLogPreview: string;
  computedAcAfterRule: number;
  computedDamageAfterRule: number;
  traceSteps: RuleClauseTraceStep[];
  timestamp: string;
}
