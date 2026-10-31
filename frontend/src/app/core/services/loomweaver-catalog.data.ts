import {
  AssetCardVm,
  CombatTelemetryVm,
  GraphEdgeVm,
  SceneVm,
  SubscriptionTierVm,
} from '../models/loomweaver.models';

export const LW_SCENES: readonly SceneVm[] = [];

export const LW_ASSETS: readonly AssetCardVm[] = [];

export const LW_GRAPH_EDGES: readonly GraphEdgeVm[] = [];

export const LW_TELEMETRY: readonly CombatTelemetryVm[] = [];

export const LW_SUBSCRIPTION_TIERS: readonly SubscriptionTierVm[] = [
  {
    code: 'spark',
    name: 'The Spark',
    monthlyPrice: '$0 / mo',
    annualPrice: '$0 / yr',
    maxCampaigns: 'Join Unlimited + 1 Starter',
    storageLimit: '250 MB',
    includesWeave: false,
    royaltySplit: '85% Creator / 15% Platform',
    summary: 'Create your first living campaign world, The Loom campaign memory search, and free invite-link player seats.',
  },
  {
    code: 'threadkeeper',
    name: 'The Threadkeeper',
    monthlyPrice: '$6 / mo',
    annualPrice: '$60 / yr (2 mos free)',
    maxCampaigns: '3 Active Campaigns',
    storageLimit: '2 GB',
    includesWeave: true,
    royaltySplit: '85% Creator / 15% Platform',
    summary: 'Expanded campaign worlds, Neo4j lore graph, LoomMaps battlemap studio, and unlimited free player seats.',
  },
  {
    code: 'weaver',
    name: 'The Weaver',
    monthlyPrice: '$12 / mo',
    annualPrice: '$120 / yr (2 mos free)',
    maxCampaigns: '10 Active Campaigns',
    storageLimit: '10 GB',
    includesWeave: true,
    royaltySplit: '85% Creator / 15% Platform',
    summary: 'Full 2.5D/3D VTT dynamic lighting, connected world and lore atlas with faction graph, and custom spell shader FX.',
  },
  {
    code: 'archweaver',
    name: 'The Archweaver',
    monthlyPrice: '$24 / mo',
    annualPrice: '$240 / yr (2 mos free)',
    maxCampaigns: 'Unlimited Campaigns',
    storageLimit: '50 GB',
    includesWeave: true,
    royaltySplit: '85% Creator / 15% Platform',
    summary: 'Maximum worldbuilding and 3D model capacity, multi-campaign universe linking, creator marketplace publishing, and adventure module export.',
  },
];
