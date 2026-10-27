import { MapSceneGraphState } from '../map-scene-contract';

export interface Real2dRenderOptions {
  readonly hideGmSecrets: boolean;
  readonly selectedNodeId?: string;
  readonly gridStepWorld?: number;
}

export class Real2dMapRenderer {
  static renderSceneToCanvas(
    canvas: HTMLCanvasElement,
    state: MapSceneGraphState,
    options: Real2dRenderOptions,
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = canvas.width || 960;
    const height = canvas.height || 600;
    const scale = Math.min(width, height) / 30;
    const cx = width / 2;
    const cy = height / 2;

    const toScreenX = (wx: number): number => cx + wx * scale;
    const toScreenY = (wz: number): number => cy - wz * scale;

    // 1. Background terrain base
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, Math.max(width, height) * 0.65);
    grad.addColorStop(0, '#12271d');
    grad.addColorStop(0.65, '#091610');
    grad.addColorStop(1, '#050c09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Tactical 5ft square grid
    const gridStep = options.gridStepWorld ?? 1.5;
    ctx.strokeStyle = 'rgba(73, 232, 146, 0.12)';
    ctx.lineWidth = 1;
    for (let gx = -16; gx <= 16; gx += gridStep) {
      const sx = toScreenX(gx);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
    for (let gz = -12; gz <= 12; gz += gridStep) {
      const sy = toScreenY(gz);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 3. Deterministic scatter foliage / rubble dots
    const scatterCount = Math.min(90, Math.max(12, Math.round(state.scatterDensity * 0.9)));
    for (let i = 0; i < scatterCount; i++) {
      const s1 = Math.sin(state.scatterSeed * 13.37 + i * 7.13) * 10000;
      const s2 = Math.cos(state.scatterSeed * 21.19 + i * 11.41) * 10000;
      const fx = ((s1 - Math.floor(s1)) * 2 - 1) * 13.5;
      const fz = ((s2 - Math.floor(s2)) * 2 - 1) * 9.5;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(65, 130, 88, 0.35)' : 'rgba(96, 112, 102, 0.28)';
      ctx.beginPath();
      ctx.arc(toScreenX(fx), toScreenY(fz), 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Water splines
    for (const water of state.waterSplines) {
      if (water.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = water.colorHex || '#1b6d82';
      ctx.lineWidth = Math.max(6, water.width * scale * 0.65);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      water.points.forEach((pt, idx) => {
        const sx = toScreenX(pt[0]);
        const sy = toScreenY(pt[2]);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();

      ctx.strokeStyle = 'rgba(130, 228, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Path ribbons
    for (const ribbon of state.pathRibbons ?? []) {
      if (ribbon.waypoints.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = ribbon.colorHex || '#8c7a62';
      ctx.lineWidth = Math.max(5, ribbon.widthMeters * scale * 0.55);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ribbon.waypoints.forEach((wp, idx) => {
        const sx = toScreenX(wp[0]);
        const sy = toScreenY(wp[1]);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
      ctx.restore();
    }

    // 6. Cutaway rooms, dungeon walls, and doors (respecting Player-Safe sanitization)
    for (const wall of state.walls ?? []) {
      if (wall.points.length < 2) continue;
      const isSelected = options.selectedNodeId === wall.id;

      ctx.save();
      ctx.fillStyle = 'rgba(26, 36, 32, 0.62)';
      ctx.strokeStyle = isSelected ? '#49e892' : '#8d9991';
      ctx.lineWidth = Math.max(4, wall.thicknessMeters * scale * 0.9);
      ctx.lineJoin = 'round';

      ctx.beginPath();
      wall.points.forEach((pt, idx) => {
        const sx = toScreenX(pt[0]);
        const sy = toScreenY(pt[1]);
        if (idx === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      if (wall.drawMode !== 'line') {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Corner posts
      if (wall.hasCornerPosts) {
        ctx.fillStyle = isSelected ? '#49e892' : '#c7b089';
        for (const pt of wall.points) {
          const sx = toScreenX(pt[0]);
          const sy = toScreenY(pt[1]);
          ctx.fillRect(sx - 3.5, sy - 3.5, 7, 7);
        }
      }

      // Openings (doors, archways, secret doors)
      for (const op of wall.openings) {
        if (options.hideGmSecrets && op.isSecret && !op.isRevealedToPlayers) {
          continue;
        }
        const p0 = wall.points[0];
        const p1 = wall.points[1] ?? p0;
        const ox = p0[0] + (p1[0] - p0[0]) * op.t;
        const oz = p0[1] + (p1[1] - p0[1]) * op.t;
        const sx = toScreenX(ox);
        const sy = toScreenY(oz);

        ctx.fillStyle = op.isSecret ? '#d9b77a' : '#2ee66b';
        ctx.beginPath();
        ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Dynamic Torch & Light Halos
    for (const light of state.lights) {
      const sx = toScreenX(light.x);
      const sy = toScreenY(light.z);
      const radiusPx = Math.max(24, light.range * scale * 0.35);
      const halo = ctx.createRadialGradient(sx, sy, 2, sx, sy, radiusPx);
      halo.addColorStop(0, 'rgba(255, 198, 109, 0.36)');
      halo.addColorStop(0.5, 'rgba(255, 152, 68, 0.14)');
      halo.addColorStop(1, 'rgba(255, 152, 68, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sx, sy, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Props, Furniture, Architecture Stamps & Tokens
    for (const st of state.stamps) {
      const isSecretStamp = st.label.toLowerCase().includes('secret');
      if (options.hideGmSecrets && isSecretStamp) {
        continue;
      }
      const sx = toScreenX(st.x);
      const sy = toScreenY(st.z);
      const r = Math.max(7, 8 * st.scale);
      const isSelected = options.selectedNodeId === st.id;

      ctx.save();
      ctx.fillStyle = st.colorHex || '#49e892';
      ctx.strokeStyle = isSelected ? '#49e892' : '#06140e';
      ctx.lineWidth = isSelected ? 3 : 1.5;

      ctx.beginPath();
      if (st.category === 'Token') {
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
      } else {
        ctx.roundRect(sx - r, sy - r, r * 2, r * 2, 4);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e9f8ef';
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st.label.slice(0, 18), sx, sy - r - 5);
      ctx.restore();
    }
  }

  static screenToWorld(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number,
  ): { x: number; z: number } {
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
    const py = ((clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
    const scale = Math.min(canvas.width, canvas.height) / 30;
    const wx = (px - canvas.width / 2) / scale;
    const wz = (canvas.height / 2 - py) / scale;
    return {
      x: Math.round(wx * 10) / 10,
      z: Math.round(wz * 10) / 10,
    };
  }
}
