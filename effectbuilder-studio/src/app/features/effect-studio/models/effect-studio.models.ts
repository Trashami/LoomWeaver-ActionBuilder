export type EffectStudioMode = 'design' | 'preview' | 'ingame';

export type EffectRailToolId =
  | 'emitters'
  | 'forces'
  | 'lights'
  | 'materials'
  | 'models'
  | 'sounds'
  | 'timeline'
  | 'presets';

export type EffectInspectorTabId = 'properties' | 'layers' | 'advanced';

export type EffectCameraPreset = 'Isometric' | 'Top-Down' | 'Tactical Orbit' | 'Caster POV';

export type EffectGizmoToolId = 'move' | 'rotate' | 'scale' | 'grid' | 'bounds' | 'particles';

export interface EffectEmitterCardVm {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly emitterType: string;
  readonly shape: string;
  readonly radius: number;
  readonly height: number;
  readonly emissionRate: number;
  readonly lifetimeSeconds: number;
  readonly speed: number;
  readonly spreadDegrees: number;
  readonly materialName: string;
  readonly colorPrimaryHex: string;
  readonly colorSecondaryHex: string;
  readonly sizeMin: number;
  readonly sizeMax: number;
  readonly opacityPercent: number;
  readonly blendMode: string;
  readonly castLight: boolean;
  readonly lightIntensity: number;
  readonly receiveShadows: boolean;
  readonly previewAccentHex: string;
}

export interface EffectTimelineTrackVm {
  readonly id: string;
  readonly label: string;
  readonly trackType: 'Beam' | 'Particle' | 'Sigil' | 'Atmospheric' | 'Audio' | string;
  readonly visible: boolean;
  readonly expanded: boolean;
  readonly startTimeSeconds: number;
  readonly endTimeSeconds: number;
  readonly colorHex: string;
  readonly accentHex: string;
  readonly emitterId: string;
}

export interface EffectMotionForceConfigVm {
  readonly gravityY: number;
  readonly vortexStrength: number;
  readonly spiralFrequency: number;
  readonly dragCoefficient: number;
  readonly enableCollision: boolean;
  readonly bounceRestitution: number;
  readonly attachedModelKey: string;
  readonly soundCueId: string;
  readonly soundVolumePercent: number;
}

export interface EffectStudioDocumentVm {
  readonly id: string;
  readonly campaignId: number;
  readonly name: string;
  readonly subtitle: string;
  readonly statusLabel: string;
  readonly activeCameraPreset: EffectCameraPreset;
  readonly totalDurationSeconds: number;
  readonly activeEmitterId: string;
  readonly activeProperties: EffectEmitterCardVm;
  readonly motionAndForces: EffectMotionForceConfigVm;
  readonly tracks: readonly EffectTimelineTrackVm[];
  readonly canonStatus: 'approved' | 'draft';
  readonly updatedAt: string;
}

export interface EffectInGameTestResultVm {
  readonly effectId: string;
  readonly effectName: string;
  readonly casterTokenKey: string;
  readonly targetTokenKey: string;
  readonly distanceFeet: number;
  readonly simulatedParticlesSpawned: number;
  readonly dynamicLightPeakLux: number;
  readonly triggeredTrackLabels: readonly string[];
  readonly combatLogSummary: string;
  readonly timestamp: string;
}
