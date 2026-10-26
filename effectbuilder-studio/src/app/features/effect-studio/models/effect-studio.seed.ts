import {
  EffectEmitterCardVm,
  EffectMotionForceConfigVm,
  EffectStudioDocumentVm,
  EffectTimelineTrackVm,
} from './effect-studio.models';

export const EFFECT_EMITTER_LIBRARY_SEED: readonly EffectEmitterCardVm[] = [
  { id: 'emit-magic-bolt', name: 'Magic Bolt', category: 'Projectiles', emitterType: 'Particle', shape: 'Directional Cone', radius: 1.2, height: 2.5, emissionRate: 95, lifetimeSeconds: 1.4, speed: 3.8, spreadDegrees: 18, materialName: 'Arcane Plasma', colorPrimaryHex: '#38bdf8', colorSecondaryHex: '#bae6fd', sizeMin: 0.15, sizeMax: 0.85, opacityPercent: 90, blendMode: 'Additive', castLight: true, lightIntensity: 1.4, receiveShadows: false, previewAccentHex: '#38bdf8' },
  { id: 'emit-fire-burst', name: 'Fire Burst', category: 'Elemental', emitterType: 'Particle', shape: 'Sphere Burst', radius: 3.5, height: 4.2, emissionRate: 180, lifetimeSeconds: 1.8, speed: 2.6, spreadDegrees: 65, materialName: 'Solar Ember', colorPrimaryHex: '#f97316', colorSecondaryHex: '#fde047', sizeMin: 0.25, sizeMax: 1.65, opacityPercent: 88, blendMode: 'Additive', castLight: true, lightIntensity: 1.8, receiveShadows: false, previewAccentHex: '#f97316' },
  { id: 'emit-ice-shards', name: 'Ice Shards', category: 'Elemental', emitterType: 'Mesh Shard', shape: 'Directional Cone', radius: 2.4, height: 3.0, emissionRate: 75, lifetimeSeconds: 2.0, speed: 3.2, spreadDegrees: 32, materialName: 'Crystalline Frost', colorPrimaryHex: '#7dd3fc', colorSecondaryHex: '#e0f2fe', sizeMin: 0.20, sizeMax: 1.10, opacityPercent: 85, blendMode: 'Additive', castLight: true, lightIntensity: 1.0, receiveShadows: true, previewAccentHex: '#7dd3fc' },
  { id: 'emit-shadow-swirl', name: 'Shadow Swirl', category: 'Necrotic & Void', emitterType: 'Ribbon Vortex', shape: 'Circle (Area)', radius: 3.8, height: 4.5, emissionRate: 110, lifetimeSeconds: 2.8, speed: 1.4, spreadDegrees: 50, materialName: 'Abyssal Mist', colorPrimaryHex: '#a855f7', colorSecondaryHex: '#3b0764', sizeMin: 0.30, sizeMax: 1.80, opacityPercent: 82, blendMode: 'AlphaBlend', castLight: false, lightIntensity: 0.4, receiveShadows: true, previewAccentHex: '#a855f7' },
  { id: 'emit-holy-light', name: 'Holy Light', category: 'Radiant & Runes', emitterType: 'Particle', shape: 'Circle (Area)', radius: 4.0, height: 6.0, emissionRate: 120, lifetimeSeconds: 2.5, speed: 1.5, spreadDegrees: 45, materialName: 'Golden Light', colorPrimaryHex: '#fcd34d', colorSecondaryHex: '#fffbeb', sizeMin: 0.20, sizeMax: 1.50, opacityPercent: 80, blendMode: 'Additive', castLight: true, lightIntensity: 1.2, receiveShadows: false, previewAccentHex: '#f59e0b' },
  { id: 'emit-poison-cloud', name: 'Poison Cloud', category: 'Atmospheric', emitterType: 'Volumetric Fog', shape: 'Circle (Area)', radius: 4.5, height: 2.8, emissionRate: 65, lifetimeSeconds: 3.6, speed: 0.6, spreadDegrees: 80, materialName: 'Spore Vapor', colorPrimaryHex: '#84cc16', colorSecondaryHex: '#365314', sizeMin: 0.45, sizeMax: 2.20, opacityPercent: 72, blendMode: 'AlphaBlend', castLight: false, lightIntensity: 0.3, receiveShadows: true, previewAccentHex: '#84cc16' },
  { id: 'emit-rune-circle', name: 'Rune Circle', category: 'Radiant & Runes', emitterType: 'Ground Sigil', shape: 'Circle (Area)', radius: 4.0, height: 0.4, emissionRate: 40, lifetimeSeconds: 4.0, speed: 0.5, spreadDegrees: 15, materialName: 'Golden Light', colorPrimaryHex: '#2dd4bf', colorSecondaryHex: '#fcd34d', sizeMin: 0.30, sizeMax: 1.40, opacityPercent: 92, blendMode: 'Additive', castLight: true, lightIntensity: 1.5, receiveShadows: false, previewAccentHex: '#2dd4bf' },
  { id: 'emit-healing-aura', name: 'Healing Aura', category: 'Radiant & Runes', emitterType: 'Particle', shape: 'Cylinder Pillar', radius: 3.2, height: 5.2, emissionRate: 130, lifetimeSeconds: 2.4, speed: 1.2, spreadDegrees: 35, materialName: 'Emerald Vitality', colorPrimaryHex: '#34d399', colorSecondaryHex: '#a7f3d0', sizeMin: 0.18, sizeMax: 1.25, opacityPercent: 84, blendMode: 'Additive', castLight: true, lightIntensity: 1.3, receiveShadows: false, previewAccentHex: '#34d399' },
  { id: 'emit-lightning-arc', name: 'Lightning Arc', category: 'Elemental', emitterType: 'Shader Beam', shape: 'Arc Chain', radius: 2.0, height: 5.5, emissionRate: 150, lifetimeSeconds: 0.9, speed: 4.5, spreadDegrees: 25, materialName: 'High-Voltage Arc', colorPrimaryHex: '#60a5fa', colorSecondaryHex: '#e0f2fe', sizeMin: 0.12, sizeMax: 0.95, opacityPercent: 95, blendMode: 'Additive', castLight: true, lightIntensity: 2.0, receiveShadows: false, previewAccentHex: '#60a5fa' },
  { id: 'emit-smoke', name: 'Smoke', category: 'Atmospheric', emitterType: 'Volumetric Fog', shape: 'Circle (Area)', radius: 3.6, height: 4.8, emissionRate: 55, lifetimeSeconds: 3.8, speed: 0.8, spreadDegrees: 60, materialName: 'Charcoal Plume', colorPrimaryHex: '#94a3b8', colorSecondaryHex: '#334155', sizeMin: 0.50, sizeMax: 2.40, opacityPercent: 68, blendMode: 'AlphaBlend', castLight: false, lightIntensity: 0.0, receiveShadows: true, previewAccentHex: '#94a3b8' },
  { id: 'emit-embers', name: 'Embers', category: 'Elemental', emitterType: 'Particle', shape: 'Circle (Area)', radius: 3.8, height: 5.8, emissionRate: 140, lifetimeSeconds: 2.6, speed: 1.9, spreadDegrees: 55, materialName: 'Cinder Spark', colorPrimaryHex: '#fb923c', colorSecondaryHex: '#fef08a', sizeMin: 0.10, sizeMax: 0.65, opacityPercent: 90, blendMode: 'Additive', castLight: true, lightIntensity: 1.1, receiveShadows: false, previewAccentHex: '#fb923c' },
  { id: 'emit-water-splash', name: 'Water Splash', category: 'Elemental', emitterType: 'Particle', shape: 'Ring Fountain', radius: 3.0, height: 3.4, emissionRate: 115, lifetimeSeconds: 1.7, speed: 2.4, spreadDegrees: 48, materialName: 'Refractive Foam', colorPrimaryHex: '#38bdf8', colorSecondaryHex: '#f0f9ff', sizeMin: 0.20, sizeMax: 1.30, opacityPercent: 78, blendMode: 'Additive', castLight: false, lightIntensity: 0.6, receiveShadows: true, previewAccentHex: '#38bdf8' },
  { id: 'emit-wind-gust', name: 'Wind Gust', category: 'Atmospheric', emitterType: 'Ribbon Vortex', shape: 'Spiral Funnel', radius: 4.2, height: 5.4, emissionRate: 90, lifetimeSeconds: 2.2, speed: 2.8, spreadDegrees: 52, materialName: 'Zephyr Ribbon', colorPrimaryHex: '#cbd5e1', colorSecondaryHex: '#f8fafc', sizeMin: 0.25, sizeMax: 1.60, opacityPercent: 64, blendMode: 'AlphaBlend', castLight: false, lightIntensity: 0.2, receiveShadows: false, previewAccentHex: '#cbd5e1' },
  { id: 'emit-leaf-swirl', name: 'Leaf Swirl', category: 'Atmospheric', emitterType: 'Mesh Shard', shape: 'Spiral Funnel', radius: 3.5, height: 4.6, emissionRate: 85, lifetimeSeconds: 2.9, speed: 1.6, spreadDegrees: 42, materialName: 'Feywild Foliage', colorPrimaryHex: '#4ade80', colorSecondaryHex: '#bef264', sizeMin: 0.18, sizeMax: 0.90, opacityPercent: 88, blendMode: 'AlphaBlend', castLight: false, lightIntensity: 0.4, receiveShadows: true, previewAccentHex: '#4ade80' },
  { id: 'emit-blood-mist', name: 'Blood Mist', category: 'Necrotic & Void', emitterType: 'Volumetric Fog', shape: 'Circle (Area)', radius: 3.8, height: 3.2, emissionRate: 100, lifetimeSeconds: 2.7, speed: 1.1, spreadDegrees: 62, materialName: 'Crimson Vapor', colorPrimaryHex: '#ef4444', colorSecondaryHex: '#7f1d1d', sizeMin: 0.35, sizeMax: 1.95, opacityPercent: 76, blendMode: 'AlphaBlend', castLight: true, lightIntensity: 0.8, receiveShadows: true, previewAccentHex: '#ef4444' },
  { id: 'emit-arcane-sigil', name: 'Arcane Sigil', category: 'Radiant & Runes', emitterType: 'Ground Sigil', shape: 'Circle (Area)', radius: 4.4, height: 0.5, emissionRate: 60, lifetimeSeconds: 4.2, speed: 0.4, spreadDegrees: 12, materialName: 'Anelith Glyph', colorPrimaryHex: '#38bdf8', colorSecondaryHex: '#818cf8', sizeMin: 0.35, sizeMax: 1.50, opacityPercent: 94, blendMode: 'Additive', castLight: true, lightIntensity: 1.6, receiveShadows: false, previewAccentHex: '#38bdf8' },
  { id: 'emit-portal', name: 'Portal', category: 'Necrotic & Void', emitterType: 'Ribbon Vortex', shape: 'Vertical Ring', radius: 3.6, height: 5.0, emissionRate: 160, lifetimeSeconds: 3.2, speed: 1.8, spreadDegrees: 40, materialName: 'Void Rift', colorPrimaryHex: '#c084fc', colorSecondaryHex: '#f472b6', sizeMin: 0.22, sizeMax: 1.55, opacityPercent: 86, blendMode: 'Additive', castLight: true, lightIntensity: 1.7, receiveShadows: false, previewAccentHex: '#c084fc' },
  { id: 'emit-energy-beam', name: 'Energy Beam', category: 'Projectiles', emitterType: 'Shader Beam', shape: 'Linear Ray', radius: 1.5, height: 6.0, emissionRate: 175, lifetimeSeconds: 1.5, speed: 4.2, spreadDegrees: 14, materialName: 'Concentrated Aether', colorPrimaryHex: '#e879f9', colorSecondaryHex: '#fae8ff', sizeMin: 0.20, sizeMax: 1.35, opacityPercent: 92, blendMode: 'Additive', castLight: true, lightIntensity: 1.9, receiveShadows: false, previewAccentHex: '#e879f9' },
];

export const DEFAULT_TIMELINE_TRACKS: readonly EffectTimelineTrackVm[] = [
  { id: 'trk-light-beam', label: 'Light Beam', trackType: 'Beam', visible: true, expanded: false, startTimeSeconds: 0.0, endTimeSeconds: 3.3, colorHex: '#d97706', accentHex: '#fde047', emitterId: 'emit-holy-light' },
  { id: 'trk-rising-particles', label: 'Rising Particles', trackType: 'Particle', visible: true, expanded: false, startTimeSeconds: 0.52, endTimeSeconds: 2.8, colorHex: '#b45309', accentHex: '#fcd34d', emitterId: 'emit-embers' },
  { id: 'trk-rune-circle', label: 'Rune Circle', trackType: 'Sigil', visible: true, expanded: false, startTimeSeconds: 0.06, endTimeSeconds: 3.58, colorHex: '#1e3a5f', accentHex: '#60a5fa', emitterId: 'emit-rune-circle' },
  { id: 'trk-dust', label: 'Dust', trackType: 'Atmospheric', visible: true, expanded: false, startTimeSeconds: 0.34, endTimeSeconds: 4.12, colorHex: '#4c3b71', accentHex: '#a78bfa', emitterId: 'emit-smoke' },
  { id: 'trk-sound', label: 'Sound', trackType: 'Audio', visible: true, expanded: false, startTimeSeconds: 0.0, endTimeSeconds: 4.18, colorHex: '#7e22ce', accentHex: '#c084fc', emitterId: 'emit-holy-light' },
];

export const DEFAULT_MOTION_FORCES: EffectMotionForceConfigVm = {
  gravityY: 1.35,
  vortexStrength: 2.8,
  spiralFrequency: 2.4,
  dragCoefficient: 0.18,
  enableCollision: true,
  bounceRestitution: 0.35,
  attachedModelKey: 'mdl-arcane-staff-orb',
  soundCueId: 'sfx-celestial-choir-swell',
  soundVolumePercent: 85,
};

export const DEFAULT_STUDIO_DOCUMENT: EffectStudioDocumentVm = {
  id: 'fx-unnamed-default',
  campaignId: 1,
  name: 'Unnamed Effect',
  subtitle: 'Custom Visual Effect',
  statusLabel: 'Not Saved',
  activeCameraPreset: 'Isometric',
  totalDurationSeconds: 5.0,
  activeEmitterId: 'emit-holy-light',
  activeProperties: EFFECT_EMITTER_LIBRARY_SEED[4],
  motionAndForces: DEFAULT_MOTION_FORCES,
  tracks: DEFAULT_TIMELINE_TRACKS,
  canonStatus: 'approved',
  updatedAt: new Date().toISOString(),
};
