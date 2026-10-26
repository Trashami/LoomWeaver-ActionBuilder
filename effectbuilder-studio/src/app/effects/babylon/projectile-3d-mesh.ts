import {
  Color3,
  Effect,
  Mesh,
  MeshBuilder,
  Quaternion,
  RenderTargetTexture,
  Scene,
  TransformNode,
  Vector2,
  Vector3,
} from '@babylonjs/core';
import { CustomMaterial } from '@babylonjs/materials/custom/customMaterial.js';
import { ProjectileCoreShape, ProjectileElement } from '../projectile-core';
import { NATIVE_BLEND_FUNCTIONS, nativeBlendModes } from './native-materials';
import { NativePoint } from './native-frame';

export interface NativeProjectile3D {
  head: NativePoint;
  prev: NativePoint;
  radius: number;
  element: ProjectileElement;
  shape: ProjectileCoreShape;
  coreScale: number;
  coronaSize: number;
  spinSpeed: number;
  orbitCount: number;
  clock: number;
  progress: number;
  color: string;
  secondaryColor: string;
}

export interface Projectile3DRig {
  root: TransformNode;
  core: Mesh;
  corona: Mesh;
  satellites: Mesh[];
  shape: ProjectileCoreShape;
  coreMat: CustomMaterial;
  coronaMat: CustomMaterial;
}

const ELEMENT_INDEX: Record<ProjectileElement, number> = {
  fire: 0,
  ice: 1,
  snow: 2,
  eldritch: 3,
  lightning: 4,
  acid: 5,
  radiant: 6,
  shadow: 7,
};

function createCoreShapeMesh(name: string, shape: ProjectileCoreShape, scene: Scene): Mesh {
  switch (shape) {
    case 'lance':
      return MeshBuilder.CreateCylinder(
        name,
        { height: 2.3, diameterTop: 0.06, diameterBottom: 0.85, tessellation: 6 },
        scene
      );
    case 'prism':
      return MeshBuilder.CreatePolyhedron(name, { type: 1, size: 0.65 }, scene);
    case 'star':
      return MeshBuilder.CreatePolyhedron(name, { type: 4, size: 0.68 }, scene);
    case 'comet':
      return MeshBuilder.CreateSphere(name, { diameter: 1.15, segments: 16 }, scene);
    case 'sphere':
    default:
      return MeshBuilder.CreateSphere(name, { diameter: 1.05, segments: 18 }, scene);
  }
}

function createProjectile3DMaterial(
  scene: Scene,
  owner: string,
  name: string,
  isCorona: boolean,
  getBlend: () => string,
  getBackdrop: () => RenderTargetTexture | undefined
): CustomMaterial {
  const mat = new CustomMaterial(`${owner}-${name}`, scene);
  mat.backFaceCulling = !isCorona;
  mat.specularColor = new Color3(0.9, 0.95, 1);
  mat.specularPower = isCorona ? 32 : 64;
  mat
    .AddUniform('uProjTime', 'float', 0)
    .AddUniform('uElementId', 'float', 0)
    .AddUniform('uLayerAlpha', 'float', 1)
    .AddUniform('uBlend', 'float', 0)
    .AddUniform('uViewport', 'vec2', new Vector2(1, 1))
    .AddUniform('uBackdrop', 'sampler2D', null)
    .AddUniform('uMainCol', 'vec3', new Color3(1, 0.4, 0.1))
    .AddUniform('uCoreCol', 'vec3', new Color3(1, 0.95, 0.75))
    .Fragment_Definitions(NATIVE_BLEND_FUNCTIONS)
    .Fragment_Before_FragColor(
      `
      float ndv = abs(dot(normalW, viewDirectionW));
      float fresnel = pow(1.0 - ndv, ${isCorona ? '1.65' : '2.2'});
      vec3 p3 = vPositionW * 6.5;
      float w1 = sin(p3.x * 2.4 + uProjTime * 5.2) * cos(p3.y * 2.7 - uProjTime * 4.4) * sin(p3.z * 2.5 + uProjTime * 3.8);
      float w2 = sin(p3.x * 5.8 - uProjTime * 8.5 + sin(p3.z * 4.2) * 2.0);
      float cells = 0.5 + 0.5 * (w1 * 0.65 + w2 * 0.35);
      vec3 surf = mix(uMainCol, uCoreCol, clamp(cells * 0.85 + (1.0 - fresnel) * 0.45, 0.0, 1.0));
      if (uElementId > 0.5 && uElementId < 1.5) {
        float facet = pow(max(0.0, abs(w2)), 3.0);
        surf = mix(uMainCol * 0.85, uCoreCol, clamp(facet * 0.7 + fresnel * 0.65, 0.0, 1.0));
      } else if (uElementId >= 1.5 && uElementId < 2.5) {
        float flake = smoothstep(0.25, 0.85, cells);
        surf = mix(uMainCol, uCoreCol, flake * 0.8 + fresnel * 0.4);
      } else if (uElementId >= 2.5 && uElementId < 3.5) {
        float crackle = pow(max(0.0, 1.0 - abs(w2)), 8.0);
        surf = mix(uMainCol * 0.28, uCoreCol * 1.35, clamp(fresnel * 0.85 + crackle * 0.9, 0.0, 1.0));
      } else if (uElementId >= 6.5) {
        surf = mix(vec3(0.04, 0.02, 0.08), uMainCol * 1.4, clamp(fresnel * 1.15 + pow(cells, 4.0) * 0.5, 0.0, 1.0));
      }
      color.rgb = surf * ${isCorona ? '1.35' : '1.55'} + uCoreCol * pow(max(0.0, cells), 3.0) * 0.45;
      color.a = clamp(${isCorona ? '(0.28 + fresnel * 0.62 + cells * 0.22)' : '(0.88 + fresnel * 0.12)'}, 0.0, 1.0);
      color = finishLayer(color);
      `
    );

  mat.onBindObservable.add(() => {
    const eff = mat.getEffect();
    if (!eff) return;
    const meta = (mat as any).__projMeta ?? {
      time: 0,
      elementId: 0,
      alpha: 1,
      main: new Color3(1, 0.4, 0.1),
      core: new Color3(1, 0.95, 0.75),
    };
    eff.setFloat('uProjTime', meta.time);
    eff.setFloat('uElementId', meta.elementId);
    eff.setFloat('uLayerAlpha', meta.alpha);
    eff.setColor3('uMainCol', meta.main);
    eff.setColor3('uCoreCol', meta.core);
    eff.setFloat('uBlend', Math.max(0, nativeBlendModes.indexOf(getBlend() as any)));
    eff.setVector2(
      'uViewport',
      new Vector2(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight())
    );
    const backdrop = getBackdrop();
    if (backdrop) eff.setTexture('uBackdrop', backdrop);
  });

  mat.onDisposeObservable.add(() => {
    delete Effect.ShadersStore[mat._createdShaderName + 'VertexShader'];
    delete Effect.ShadersStore[mat._createdShaderName + 'PixelShader'];
  });

  return mat;
}

export function buildOrUpdateProjectileRig(
  scene: Scene,
  owner: string,
  parent: TransformNode,
  order: number,
  existing: Projectile3DRig | undefined,
  spec: NativeProjectile3D,
  worldPoint: (p: NativePoint) => Vector3,
  unit: number,
  layerAlpha: number,
  getBlend: () => string,
  getBackdrop: () => RenderTargetTexture | undefined
): Projectile3DRig {
  let rig = existing;
  if (rig && rig.shape !== spec.shape) {
    rig.core.dispose();
    rig.corona.dispose();
    rig.core = createCoreShapeMesh(`${owner}-proj-core`, spec.shape, scene);
    rig.corona = createCoreShapeMesh(`${owner}-proj-corona`, spec.shape, scene);
    rig.core.parent = rig.root;
    rig.corona.parent = rig.root;
    rig.core.material = rig.coreMat;
    rig.corona.material = rig.coronaMat;
    rig.core.isPickable = false;
    rig.corona.isPickable = false;
    rig.shape = spec.shape;
  }

  if (!rig) {
    const root = new TransformNode(`${owner}-proj3d-root`, scene);
    root.parent = parent;
    const coreMat = createProjectile3DMaterial(scene, owner, 'proj3d-core-mat', false, getBlend, getBackdrop);
    const coronaMat = createProjectile3DMaterial(scene, owner, 'proj3d-corona-mat', true, getBlend, getBackdrop);
    const core = createCoreShapeMesh(`${owner}-proj-core`, spec.shape, scene);
    const corona = createCoreShapeMesh(`${owner}-proj-corona`, spec.shape, scene);
    core.parent = root;
    corona.parent = root;
    core.material = coreMat;
    corona.material = coronaMat;
    core.isPickable = false;
    corona.isPickable = false;
    rig = {
      root,
      core,
      corona,
      satellites: [],
      shape: spec.shape,
      coreMat,
      coronaMat,
    };
  }

  const headPos = worldPoint(spec.head);
  const prevPos = worldPoint(spec.prev);
  const dir = headPos.subtract(prevPos);
  if (dir.lengthSquared() < 0.00001) {
    dir.set(1, 0, 0);
  } else {
    dir.normalize();
  }

  rig.root.setEnabled(true);
  rig.root.position.copyFrom(headPos);
  const orient = Quaternion.FromUnitVectorsToRef(Vector3.Up(), dir, new Quaternion());
  rig.root.rotationQuaternion = orient;

  const baseRadius = Math.max(0.14, (spec.radius / unit) * spec.coreScale);
  const spin = spec.clock * spec.spinSpeed * 3.2;

  const mainCol = Color3.FromHexString(spec.color);
  const coreCol = Color3.FromHexString(spec.secondaryColor);
  const elementId = ELEMENT_INDEX[spec.element] ?? 0;

  (rig.coreMat as any).__projMeta = {
    time: spec.clock,
    elementId,
    alpha: layerAlpha,
    main: mainCol,
    core: coreCol,
  };
  (rig.coronaMat as any).__projMeta = {
    time: spec.clock * 1.35 + 1.7,
    elementId,
    alpha: layerAlpha * Math.min(1, spec.coronaSize * 0.75),
    main: mainCol,
    core: coreCol,
  };

  rig.core.metadata = { lwNativeOwner: owner, lwNativeOrder: order };
  rig.corona.metadata = { lwNativeOwner: owner, lwNativeOrder: order };
  rig.core.alphaIndex = order * 10;
  rig.corona.alphaIndex = order * 10 + 1;

  const stretchY = spec.shape === 'lance' ? 1.55 : spec.shape === 'comet' ? 1.35 : 1.0;
  rig.core.scaling.set(baseRadius, baseRadius * stretchY, baseRadius);
  rig.core.rotation.set(spin * 0.35, spin, spin * 0.2);

  const coronaScale = Math.max(0, spec.coronaSize);
  rig.corona.setEnabled(coronaScale > 0.02);
  if (coronaScale > 0.02) {
    rig.corona.scaling.set(
      baseRadius * coronaScale * 1.28,
      baseRadius * stretchY * coronaScale * (spec.shape === 'comet' ? 1.65 : 1.28),
      baseRadius * coronaScale * 1.28
    );
    rig.corona.position.set(0, spec.shape === 'comet' ? -baseRadius * 0.28 : 0, 0);
    rig.corona.rotation.set(-spin * 0.5, -spin * 1.2, spin * 0.4);
  }

  const satCount = Math.max(0, Math.min(6, Math.round(spec.orbitCount)));
  while (rig.satellites.length < satCount) {
    const sat = MeshBuilder.CreatePolyhedron(
      `${owner}-proj-sat-${rig.satellites.length}`,
      { type: 1, size: 0.22 },
      scene
    );
    sat.parent = rig.root;
    sat.material = rig.coreMat;
    sat.isPickable = false;
    rig.satellites.push(sat);
  }

  for (let i = 0; i < rig.satellites.length; i++) {
    const sat = rig.satellites[i];
    if (i >= satCount) {
      sat.setEnabled(false);
      continue;
    }
    sat.setEnabled(true);
    sat.metadata = { lwNativeOwner: owner, lwNativeOrder: order };
    sat.alphaIndex = order * 10 + 2;
    const angle = spin * 1.6 + (i * Math.PI * 2) / Math.max(1, satCount);
    const orbitR = baseRadius * (1.35 + (i % 2) * 0.28);
    const axialOffset = Math.sin(spin * 2 + i) * baseRadius * 0.35;
    sat.position.set(Math.cos(angle) * orbitR, axialOffset, Math.sin(angle) * orbitR);
    const satScale = baseRadius * (spec.element === 'ice' || spec.element === 'snow' ? 0.55 : 0.45);
    sat.scaling.set(satScale, satScale * (spec.element === 'ice' ? 1.8 : 1.15), satScale);
    sat.rotation.set(angle, spin * 2, i);
  }

  return rig;
}

export function disposeProjectileRigs(rigs: Projectile3DRig[]): void {
  for (const rig of rigs) {
    rig.root.dispose(false);
    rig.coreMat.dispose(true);
    rig.coronaMat.dispose(true);
  }
}
