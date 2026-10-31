import {
  AbstractMesh,
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  TransformNode,
} from '@babylonjs/core';
import { MapStampNode } from '../map-scene-contract';
import { TerrainMeshBuilder } from '../terrain/terrain-mesh.builder';
import { resolveTextureLodUrl } from './glb-lod';
import { GlbCloneMetadata, GlbModelCache } from './glb-model-cache';

interface BuiltStampEntry {
  readonly signature: string;
  readonly node: TransformNode | AbstractMesh;
}

/** One shared texture per scene and URL, so stamp rebuilds never re-upload the same image. */
const decalTexturesByScene = new WeakMap<Scene, Map<string, Texture>>();
/** Shared StandardMaterial per scene and decal style so multiple stamps of the same 2D asset share 1 material. */
const decalMaterialsByScene = new WeakMap<Scene, Map<string, StandardMaterial>>();
/** Incrementally reconciled stamp nodes per scene so adding a second stamp never recreates existing stamps. */
const builtStampsByScene = new WeakMap<Scene, Map<string, BuiltStampEntry>>();

function decalTexture(scene: Scene, kind: 'albedo' | 'normal', url: string): Texture {
  let cache = decalTexturesByScene.get(scene);
  if (!cache) {
    cache = new Map<string, Texture>();
    decalTexturesByScene.set(scene, cache);
  }
  const resolvedUrl = resolveTextureLodUrl(url, GlbModelCache.getLodTier());
  const key = `${kind}:${resolvedUrl}`;
  let tex = cache.get(key);
  if (!tex) {
    tex = new Texture(resolvedUrl, scene);
    cache.set(key, tex);
  }
  return tex;
}

function getOrCreateDecalMaterial(
  scene: Scene,
  texUrl: string,
  normalUrl: string | undefined,
  colorHex: string | undefined,
  opacity: number | undefined,
): StandardMaterial {
  let matCache = decalMaterialsByScene.get(scene);
  if (!matCache) {
    matCache = new Map<string, StandardMaterial>();
    decalMaterialsByScene.set(scene, matCache);
  }
  const tier = GlbModelCache.getLodTier();
  const resolvedTex = resolveTextureLodUrl(texUrl, tier);
  const resolvedNorm = normalUrl ? resolveTextureLodUrl(normalUrl, tier) : '';
  const hex = (colorHex || '#ffffff').toLowerCase();
  const alpha = opacity ?? 1.0;
  const key = `${resolvedTex}|${resolvedNorm}|${hex}|${alpha.toFixed(2)}`;
  const existing = matCache.get(key);
  if (existing) {
    return existing;
  }

  const dMat = new StandardMaterial(`lw-stamp-decal-mat-${matCache.size}`, scene);
  dMat.diffuseTexture = decalTexture(scene, 'albedo', resolvedTex);
  dMat.diffuseTexture.hasAlpha = true;
  dMat.useAlphaFromDiffuseTexture = true;
  dMat.diffuseColor = hex !== '#ffffff' ? Color3.FromHexString(hex) : Color3.White();
  dMat.alpha = alpha;
  dMat.specularColor = Color3.FromHexString('#18221c');
  if (resolvedNorm) {
    const bumpTex = decalTexture(scene, 'normal', resolvedNorm);
    bumpTex.level = 1.25;
    dMat.bumpTexture = bumpTex;
  }
  matCache.set(key, dMat);
  return dMat;
}

export class StampSceneBuilder {
  /** Clears cached stamp instances for `scene` (e.g., when switching visual quality LOD tier). */
  static evictScene(scene: Scene): void {
    const built = builtStampsByScene.get(scene);
    if (built) {
      for (const entry of built.values()) {
        entry.node.dispose(false, false);
      }
      built.clear();
    }
    const mats = decalMaterialsByScene.get(scene);
    if (mats) {
      for (const m of mats.values()) {
        m.dispose(false, false);
      }
      mats.clear();
    }
  }

  /**
   * Incrementally reconciles stamp nodes in `scene`.
   * Existing stamps whose asset/scale/material have not changed are updated in place without re-cloning,
   * and multiple stamps of the same asset share a single loaded template and material in memory.
   */
  static rebuild(
    scene: Scene,
    stamps: readonly MapStampNode[],
    hideGmSecrets: boolean,
    onTemplateLoaded: () => void,
  ): void {
    let builtMap = builtStampsByScene.get(scene);
    if (!builtMap) {
      builtMap = new Map<string, BuiltStampEntry>();
      builtStampsByScene.set(scene, builtMap);
    }

    const activeIds = new Set<string>();
    const cellMeters = TerrainMeshBuilder.getCellStepMeters();
    const tier = GlbModelCache.getLodTier();

    for (const st of stamps) {
      if (hideGmSecrets && (st.gmSecretOnly || st.label.toLowerCase().includes('secret'))) {
        continue;
      }
      activeIds.add(st.id);

      const groundY = TerrainMeshBuilder.sampleElevationAt(scene, st.x, st.z);
      const offsetY = st.placementMode === 'custom' ? (st.offsetY ?? 0) : 0;
      const sx = (st.scaleX ?? 1) * st.scale;
      const sy = (st.scaleY ?? 1) * st.scale;
      const sz = (st.scaleZ ?? 1) * st.scale;
      const tiltRad = ((st.tiltX ?? 0) * Math.PI) / 180;

      const tpl = st.modelUrl
        ? GlbModelCache.getOrLoadTemplate(scene, st.modelUrl, onTemplateLoaded)
        : null;
      const modeKey = tpl ? `3d:${tpl.url}` : `2d:${st.albedoUrl || st.thumbnailUrl || ''}:${st.normalUrl || ''}`;
      const sig = `${modeKey}|${tier}|${cellMeters}|${sx.toFixed(3)}|${sy.toFixed(3)}|${sz.toFixed(3)}|${st.colorHex || ''}|${st.surfaceFinish || ''}|${(st.opacity ?? 1).toFixed(2)}`;

      const existing = builtMap.get(st.id);
      if (existing && existing.signature === sig && !existing.node.isDisposed()) {
        const targetY = tpl ? groundY + offsetY : groundY + 0.04 + offsetY;
        existing.node.position.set(st.x, targetY, st.z);
        existing.node.rotation.y = st.rotationY;
        if (tpl) {
          existing.node.rotation.x = tiltRad;
        }
        continue;
      }

      if (existing) {
        existing.node.dispose(false, false);
        builtMap.delete(st.id);
      }

      const stampMeta: GlbCloneMetadata = {
        lwNodeName: `lw-stamp-${st.id}`,
        lwKind: 'object',
        lwEntityId: st.id,
      };

      // 1. Real 3D Asset Model (shared template & GPU geometry across all stamps of this asset)
      if (tpl) {
        const isUniform = Math.abs(sx - sy) < 0.01 && Math.abs(sy - sz) < 0.01;
        const inst = GlbModelCache.instantiateClone(
          scene,
          tpl,
          `lw-stamp-node-${st.id}`,
          cellMeters * sx,
          cellMeters * sy,
          cellMeters * sz,
          isUniform,
          false,
          stampMeta,
          {
            colorHex: st.colorHex,
            surfaceFinish: st.surfaceFinish,
            opacity: st.opacity,
          },
        );
        inst.position.set(st.x, groundY + offsetY, st.z);
        inst.rotation.y = st.rotationY;
        inst.rotation.x = tiltRad;
        builtMap.set(st.id, { signature: sig, node: inst });
        continue;
      }

      // 2. 2D Cutout Floor Stamp / Decal (shared texture & material across all stamps of this asset)
      const texUrl = st.albedoUrl || st.thumbnailUrl;
      if (texUrl) {
        const decal = MeshBuilder.CreateGround(
          `lw-stamp-${st.id}`,
          { width: cellMeters * sx, height: cellMeters * sz },
          scene,
        );
        decal.position.set(st.x, groundY + 0.04 + offsetY, st.z);
        decal.rotation.y = st.rotationY;
        decal.receiveShadows = true;
        decal.metadata = stampMeta;
        decal.material = getOrCreateDecalMaterial(
          scene,
          texUrl,
          st.normalUrl,
          st.colorHex,
          st.opacity,
        );
        builtMap.set(st.id, { signature: sig, node: decal });
      }
    }

    for (const [id, entry] of builtMap.entries()) {
      if (!activeIds.has(id)) {
        entry.node.dispose(false, false);
        builtMap.delete(id);
      }
    }
  }
}
