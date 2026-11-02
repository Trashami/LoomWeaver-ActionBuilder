import {
  AbstractMesh,
  AssetContainer,
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  SceneLoader,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import {
  VttTokenVm,
  getDndSizeScale,
  getTokenBaseColorHex,
} from './effect-timeline.contract';
import { TerrainMeshBuilder } from '../../maps/engine/terrain/terrain-mesh.builder';

export class BabylonTokenMeshBuilder {
  private readonly glbContainerCache = new Map<string, AssetContainer>();
  private readonly loadingGlbUrls = new Set<string>();

  clearCache(): void {
    this.glbContainerCache.forEach((c) => c.dispose());
    this.glbContainerCache.clear();
    this.loadingGlbUrls.clear();
  }

  syncTokens(
    scene: Scene,
    tokens: readonly VttTokenVm[],
    isTopDown2D: boolean,
    attackerKey: string | undefined,
    targetKey: string | undefined,
    targetedKeys: readonly string[],
    opacityByKey: ReadonlyMap<string, number>,
    gridScale: number,
    onGlbLoaded: () => void,
  ): void {
    scene.meshes
      .filter(
        (m) =>
          m.name.startsWith('lw-token-') ||
          m.name.startsWith('lw-target-reticle-') ||
          m.name === 'lw-tether-line',
      )
      .forEach((m) => m.dispose());
    scene.transformNodes
      .filter((n) => n.name.startsWith('lw-token-'))
      .forEach((n) => n.dispose());

    const activeTargetSet = new Set<string>(
      targetedKeys.length > 0 ? targetedKeys : targetKey ? [targetKey] : [],
    );

    for (const t of tokens) {
      const isDead = t.currentHp <= 0;
      const isTargeted = activeTargetSet.has(t.key);
      const isAttacker = t.key === attackerKey;

      const sizeScale = getDndSizeScale(t.sizeCategory);
      // 1 grid square = 1.0 * gridScale world units; 0.82 diameter leaves a clean margin inside the cell
      const effectiveScale = Math.max(0.25, gridScale) * sizeScale;
      const baseDiameter = 0.82 * effectiveScale;
      const baseHeight = isDead ? 0.014 : 0.02;

      const groundY = TerrainMeshBuilder.sampleElevationAt(scene, t.x, t.z);

      const baseMesh = MeshBuilder.CreateCylinder(
        `lw-token-${t.key}`,
        { height: baseHeight, diameter: baseDiameter, tessellation: 36 },
        scene,
      );
      baseMesh.position.set(t.x, groundY + baseHeight / 2, t.z);
      baseMesh.metadata = { tokenKey: t.key, baseHeight };
      baseMesh.isPickable = true;
      baseMesh.visibility = opacityByKey.get(t.key) ?? 1;

      const hitboxHeight = isTopDown2D ? 0.35 : 1.15 * effectiveScale;
      const hitbox = MeshBuilder.CreateCylinder(
        `lw-token-hitbox-${t.key}`,
        { height: hitboxHeight, diameter: 0.94 * effectiveScale, tessellation: 18 },
        scene,
      );
      hitbox.parent = baseMesh;
      hitbox.position.set(0, hitboxHeight / 2, 0);
      hitbox.visibility = 0;
      hitbox.isPickable = true;
      hitbox.metadata = { tokenKey: t.key };

      const baseColorHex = getTokenBaseColorHex(t);
      const baseMat = new StandardMaterial(`lw-tmat-${t.key}`, scene);
      baseMat.diffuseColor = Color3.FromHexString(baseColorHex);
      // True matte finish: near-zero specular shine and subtle self-illumination that preserves the deep theme color
      baseMat.specularColor = new Color3(0.02, 0.02, 0.02);
      baseMat.specularPower = 2;
      baseMat.emissiveColor = Color3.FromHexString(baseColorHex).scale(0.08);
      baseMesh.material = baseMat;

      if (!isTopDown2D && t.glbUrl) {
        this.attachGlbMiniature(
          scene,
          t,
          baseMesh,
          isDead,
          effectiveScale,
          baseHeight,
          isAttacker,
          isTargeted,
          onGlbLoaded,
        );
      } else {
        this.attachMattePuckFace(
          scene,
          t,
          baseMesh,
          effectiveScale,
          baseHeight,
          baseColorHex,
          isAttacker,
          isTargeted,
        );
      }

      if (isTargeted) {
        this.createSpinningBaseTargetReticle(scene, t.key, t.x, groundY, t.z, effectiveScale);
      }
    }

    const src = tokens.find((t) => t.key === attackerKey);
    const dst = tokens.find((t) => t.key === targetKey);
    if (src && dst && src.key !== dst.key) {
      const srcY = TerrainMeshBuilder.sampleElevationAt(scene, src.x, src.z);
      const dstY = TerrainMeshBuilder.sampleElevationAt(scene, dst.x, dst.z);
      const midY = Math.max(srcY, dstY) + (isTopDown2D ? 0.45 : 1.15);
      const tether = MeshBuilder.CreateLines(
        'lw-tether-line',
        {
          points: [
            new Vector3(src.x, srcY + 0.35, src.z),
            new Vector3((src.x + dst.x) / 2, midY, (src.z + dst.z) / 2),
            new Vector3(dst.x, dstY + 0.35, dst.z),
          ],
        },
        scene,
      );
      tether.color = Color3.FromHexString('#2d8a56');
      tether.isPickable = false;
    }
  }

  private attachGlbMiniature(
    scene: Scene,
    token: VttTokenVm,
    baseMesh: Mesh,
    isDead: boolean,
    effectiveScale: number,
    baseHeight: number,
    isAttacker: boolean,
    isTargeted: boolean,
    onGlbLoaded: () => void,
  ): void {
    const glbUrl = token.glbUrl;
    if (!glbUrl) return;

    if (this.glbContainerCache.has(glbUrl)) {
      this.instantiateGlbToToken(
        scene,
        this.glbContainerCache.get(glbUrl)!,
        token,
        baseMesh,
        isDead,
        effectiveScale,
        baseHeight,
        isAttacker,
        isTargeted,
      );
      return;
    }

    this.attachMattePuckFace(
      scene,
      token,
      baseMesh,
      effectiveScale,
      baseHeight,
      getTokenBaseColorHex(token),
      isAttacker,
      isTargeted,
    );

    if (this.loadingGlbUrls.has(glbUrl)) return;
    this.loadingGlbUrls.add(glbUrl);

    const lastSlash = glbUrl.lastIndexOf('/');
    const rootUrl = lastSlash >= 0 ? glbUrl.slice(0, lastSlash + 1) : '';
    const fileName = lastSlash >= 0 ? glbUrl.slice(lastSlash + 1) : glbUrl;

    SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene)
      .then((container) => {
        this.glbContainerCache.set(glbUrl, container);
        this.loadingGlbUrls.delete(glbUrl);
        onGlbLoaded();
      })
      .catch(() => {
        this.loadingGlbUrls.delete(glbUrl);
      });
  }

  private instantiateGlbToToken(
    scene: Scene,
    container: AssetContainer,
    token: VttTokenVm,
    baseMesh: Mesh,
    isDead: boolean,
    effectiveScale: number,
    baseHeight: number,
    isAttacker: boolean,
    isTargeted: boolean,
  ): void {
    try {
      const instance = container.instantiateModelsToScene(
        (name) => `lw-token-mini-${token.key}-${name}`,
        false,
      );
      const rootNode = new TransformNode(`lw-token-root-${token.key}`, scene);
      rootNode.position.set(0, 0, 0);
      rootNode.scaling.set(1, 1, 1);

      instance.rootNodes.forEach((node) => {
        node.parent = rootNode;
      });

      rootNode.computeWorldMatrix(true);
      const allMeshes: AbstractMesh[] = [];
      instance.rootNodes.forEach((node) => {
        if (node instanceof AbstractMesh) allMeshes.push(node);
        allMeshes.push(...node.getChildMeshes());
      });

      let min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
      let max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      let foundBounds = false;

      for (const m of allMeshes) {
        m.computeWorldMatrix(true);
        const b = m.getBoundingInfo().boundingBox;
        min = Vector3.Minimize(min, b.minimumWorld);
        max = Vector3.Maximize(max, b.maximumWorld);
        foundBounds = true;
        this.applyMatteFinishToMiniatureMesh(m);
      }

      const targetHeight = 1.05 * effectiveScale;
      const sizeY = foundBounds ? Math.max(0.01, max.y - min.y) : 1.05;
      const scale = targetHeight / sizeY;

      rootNode.parent = baseMesh;
      rootNode.scaling.set(scale, scale, scale);

      if (foundBounds) {
        const centerX = (min.x + max.x) / 2;
        const centerZ = (min.z + max.z) / 2;
        rootNode.position.set(-centerX * scale, baseHeight / 2 - min.y * scale, -centerZ * scale);
      } else {
        rootNode.position.set(0, baseHeight / 2, 0);
      }

      const tagMesh = (m: AbstractMesh) => {
        m.metadata = { tokenKey: token.key };
        m.name = `lw-token-part-${token.key}-${m.name}`;
        m.getChildMeshes().forEach(tagMesh);
      };
      instance.rootNodes.forEach((node) => {
        if (node instanceof AbstractMesh) tagMesh(node);
      });

      this.attachRimOnly(scene, token.key, baseMesh, effectiveScale, baseHeight, isAttacker, isTargeted);

      if (isDead) {
        rootNode.rotation.z = Math.PI / 2.2;
        rootNode.position.y = baseHeight / 2 + 0.03 * effectiveScale;
      }
    } catch {
      this.attachMattePuckFace(
        scene,
        token,
        baseMesh,
        effectiveScale,
        baseHeight,
        getTokenBaseColorHex(token),
        isAttacker,
        isTargeted,
      );
    }
  }

  private applyMatteFinishToMiniatureMesh(mesh: AbstractMesh): void {
    const mat = mesh.material;
    if (!mat) return;
    if (mat instanceof PBRMaterial) {
      mat.roughness = Math.max(0.88, mat.roughness ?? 0.92);
      mat.metallic = Math.min(0.06, mat.metallic ?? 0.02);
      if (!mat.albedoTexture && mat.albedoColor) {
        const c = mat.albedoColor;
        if (c.r > 0.82 && c.g > 0.82 && c.b > 0.82) {
          mat.albedoColor = Color3.FromHexString('#7d8581');
        }
      }
    } else if (mat instanceof StandardMaterial) {
      mat.specularColor = new Color3(0.03, 0.03, 0.03);
      if (!mat.diffuseTexture && mat.diffuseColor) {
        const c = mat.diffuseColor;
        if (c.r > 0.82 && c.g > 0.82 && c.b > 0.82) {
          mat.diffuseColor = Color3.FromHexString('#7d8581');
        }
      }
    }
  }

  private attachMattePuckFace(
    scene: Scene,
    token: VttTokenVm,
    baseMesh: Mesh,
    effectiveScale: number,
    baseHeight: number,
    baseColorHex: string,
    isAttacker: boolean,
    isTargeted: boolean,
  ): void {
    const disc = MeshBuilder.CreateDisc(
      `lw-token-puck-disc-${token.key}`,
      { radius: 0.36 * effectiveScale, tessellation: 36, sideOrientation: Mesh.DOUBLESIDE },
      scene,
    );
    disc.parent = baseMesh;
    disc.position.set(0, baseHeight / 2 + 0.002, 0);
    disc.rotation.x = Math.PI / 2;
    disc.isPickable = true;
    disc.metadata = { tokenKey: token.key };

    const discMat = new StandardMaterial(`lw-mat-puck-${token.key}`, scene);
    discMat.backFaceCulling = false;
    discMat.specularColor = new Color3(0.02, 0.02, 0.02);
    if (token.avatarUrl) {
      const tex = new Texture(token.avatarUrl, scene, false, false);
      discMat.diffuseTexture = tex;
      discMat.emissiveColor = new Color3(0.12, 0.12, 0.12);
    } else {
      const initials = (token.name || 'TK')
        .split(/\s+/)
        .map((w) => w[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const dt = new DynamicTexture(`lw-dt-puck-${token.key}`, { width: 128, height: 128 }, scene, false);
      const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
      ctx.fillStyle = baseColorHex;
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#e5ece8';
      ctx.font = 'bold 52px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, 64, 66);
      dt.update(false);
      discMat.diffuseTexture = dt;
      discMat.emissiveColor = Color3.FromHexString(baseColorHex).scale(0.16);
    }
    disc.material = discMat;

    this.attachRimOnly(scene, token.key, baseMesh, effectiveScale, baseHeight, isAttacker, isTargeted);
  }

  private attachRimOnly(
    scene: Scene,
    tokenKey: string,
    baseMesh: Mesh,
    effectiveScale: number,
    baseHeight: number,
    isAttacker: boolean,
    isTargeted: boolean,
  ): void {
    const rim = MeshBuilder.CreateTorus(
      `lw-token-puck-rim-${tokenKey}`,
      { diameter: 0.78 * effectiveScale, thickness: 0.032 * effectiveScale, tessellation: 36 },
      scene,
    );
    rim.parent = baseMesh;
    rim.position.set(0, baseHeight / 2 + 0.003, 0);
    rim.metadata = { tokenKey };

    const rimMat = new StandardMaterial(`lw-mat-rim-${tokenKey}`, scene);
    const rimHex = isTargeted ? '#991b1b' : isAttacker ? '#c9a66b' : '#26302c';
    rimMat.diffuseColor = Color3.FromHexString(rimHex);
    rimMat.specularColor = new Color3(0.03, 0.03, 0.03);
    rimMat.emissiveColor = Color3.FromHexString(rimHex).scale(isTargeted || isAttacker ? 0.18 : 0.04);
    rim.material = rimMat;
  }

  private createSpinningBaseTargetReticle(
    scene: Scene,
    tokenKey: string,
    x: number,
    groundY: number,
    z: number,
    effectiveScale: number,
  ): void {
    const root = new Mesh(`lw-target-reticle-root-${tokenKey}`, scene);
    root.position.set(x, groundY + 0.025, z);
    root.isPickable = false;

    const reticleMat = new StandardMaterial(`lw-target-reticle-mat-${tokenKey}`, scene);
    reticleMat.diffuseColor = Color3.FromHexString('#881313');
    reticleMat.emissiveColor = Color3.FromHexString('#7f1d1d').scale(0.4);
    reticleMat.specularColor = Color3.Black();
    reticleMat.alpha = 0.88;

    const outerRing = MeshBuilder.CreateTorus(
      `lw-target-reticle-outer-${tokenKey}`,
      { diameter: 1.05 * effectiveScale, thickness: 0.035 * effectiveScale, tessellation: 36 },
      scene,
    );
    outerRing.parent = root;
    outerRing.material = reticleMat;
    outerRing.isPickable = false;

    const innerRing = MeshBuilder.CreateTorus(
      `lw-target-reticle-inner-${tokenKey}`,
      { diameter: 0.56 * effectiveScale, thickness: 0.025 * effectiveScale, tessellation: 28 },
      scene,
    );
    innerRing.parent = root;
    innerRing.material = reticleMat;
    innerRing.isPickable = false;
  }
}
