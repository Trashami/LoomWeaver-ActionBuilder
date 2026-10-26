import { EffectDefinition, newId, parseEffect } from './effect-definition';

export interface StandaloneEffectEnvelope extends EffectDefinition {
  format: 'loomweaver-effect';
  exportedAt: string;
  portable: true;
  effect: EffectDefinition;
}

export function adaptEffectForCampaign(
  effect: EffectDefinition,
  targetCampaignId?: number | null
): EffectDefinition {
  const cloned = structuredClone(effect);
  if (cloned.summon) {
    const cid =
      typeof targetCampaignId === 'number' && Number.isSafeInteger(targetCampaignId) && targetCampaignId >= 1
        ? targetCampaignId
        : Number.isSafeInteger(cloned.summon.campaignId) && cloned.summon.campaignId >= 1
          ? cloned.summon.campaignId
          : 1;
    cloned.summon = {
      ...cloned.summon,
      campaignId: cid,
      npcId: Number.isSafeInteger(cloned.summon.npcId) && cloned.summon.npcId >= 1 ? cloned.summon.npcId : 1,
    };
  }
  return cloned;
}

export function serializeStandaloneEffect(effect: EffectDefinition): string {
  const clean = adaptEffectForCampaign(effect);
  const payload: StandaloneEffectEnvelope = {
    ...clean,
    format: 'loomweaver-effect',
    exportedAt: new Date().toISOString(),
    portable: true,
    effect: clean,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseStandaloneEffectPayload(
  raw: unknown,
  targetCampaignId?: number | null
): EffectDefinition[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Expected a valid effect JSON file.');
  }

  let items: unknown[];
  if (Array.isArray(raw)) {
    items = raw;
  } else {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj['effects'])) {
      items = obj['effects'];
    } else if (obj['effect'] && typeof obj['effect'] === 'object') {
      items = [obj['effect']];
    } else {
      items = [obj];
    }
  }

  if (items.length === 0) {
    throw new Error('No effects found in imported file.');
  }

  return items.map((item) => {
    const unwrapped =
      item && typeof item === 'object' && (item as any).effect && typeof (item as any).effect === 'object'
        ? (item as any).effect
        : item;
    if (unwrapped && typeof unwrapped === 'object' && (unwrapped as any).summon) {
      const s = (unwrapped as any).summon;
      const cid =
        typeof targetCampaignId === 'number' && targetCampaignId >= 1
          ? targetCampaignId
          : Number.isSafeInteger(s.campaignId) && s.campaignId >= 1
            ? s.campaignId
            : 1;
      (unwrapped as any).summon = {
        ...s,
        campaignId: cid,
        npcId: Number.isSafeInteger(s.npcId) && s.npcId >= 1 ? s.npcId : 1,
      };
    }
    const parsed = parseEffect(unwrapped);
    return {
      ...adaptEffectForCampaign(parsed, targetCampaignId),
      id: newId(),
    };
  });
}

export function downloadStandaloneEffectFile(effect: EffectDefinition): void {
  const slug =
    (effect.name || 'effect')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'effect';
  const json = serializeStandaloneEffect(effect);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.lweffect.json`;
  a.click();
  URL.revokeObjectURL(url);
}
