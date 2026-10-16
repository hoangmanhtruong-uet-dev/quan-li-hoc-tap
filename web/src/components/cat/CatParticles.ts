/**
 * CatParticles.ts
 * Zero-GC pooled WebGL particle VFX engine for Leo 3D Character.
 *
 * Provides:
 * - Floating pink hearts (petting, praise, affection)
 * - Cartoon sweat / anger streaks (poking, scolding)
 * - Sparkling celebration stars (session completion)
 *
 * Architectural constraints:
 * - Zero allocations during update() loop (pre-allocated particle pool)
 * - 100% procedurally generated textures (no network payload)
 * - Clean disposal of all textures, materials, and sprite objects
 */

import * as THREE from 'three';

export type ParticleType = 'heart' | 'sweat' | 'star';

export interface CatParticleSystem {
  group: THREE.Group;
  spawn(type: ParticleType, count?: number, origin?: THREE.Vector3): void;
  update(delta: number): void;
  dispose(): void;
}

interface Particle {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  type: ParticleType;
  active: boolean;
  age: number;
  maxLife: number;
  baseScale: number;
  posX: number;
  posY: number;
  posZ: number;
  velX: number;
  velY: number;
  velZ: number;
  wobbleSpeed: number;
  wobblePhase: number;
  rotationSpeed: number;
}

const POOL_CAPACITIES: Record<ParticleType, number> = {
  heart: 20,
  sweat: 16,
  star: 28,
};

/**
 * Procedurally draws a cartoon heart on a 2D canvas and returns CanvasTexture.
 */
function createHeartTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    ctx.translate(32, 34);

    // Cute chubby heart path
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-22, -14, -28, -26, 0, -30);
    ctx.bezierCurveTo(28, -26, 22, -14, 0, 8);

    // Radiant pink gradient
    const grad = ctx.createRadialGradient(-4, -14, 4, 0, -10, 24);
    grad.addColorStop(0, '#FF85A1');
    grad.addColorStop(0.5, '#FF3366');
    grad.addColorStop(1, '#E60049');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(255, 105, 180, 0.7)';
    ctx.shadowBlur = 8;
    ctx.fill();

    // White gloss highlight
    ctx.beginPath();
    ctx.arc(-8, -16, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedurally draws a cartoon anime sweat drop on a 2D canvas.
 */
function createSweatTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    ctx.translate(32, 28);

    // Teardrop path
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.bezierCurveTo(16, -4, 20, 16, 0, 22);
    ctx.bezierCurveTo(-20, 16, -16, -4, 0, -22);

    const grad = ctx.createLinearGradient(0, -20, 0, 22);
    grad.addColorStop(0, '#A5F3FC');
    grad.addColorStop(0.6, '#38BDF8');
    grad.addColorStop(1, '#0284C7');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fill();

    // White sheen
    ctx.beginPath();
    ctx.ellipse(-6, 4, 3, 7, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedurally draws a sparkling 4-pointed star on a 2D canvas.
 */
function createStarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    ctx.translate(32, 32);

    // 4-pointed star with curved inner flares
    ctx.beginPath();
    const rOuter = 26;
    const rInner = 6;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
      const angleMid = angle + Math.PI / 4;
      ctx.lineTo(Math.cos(angleMid) * rInner, Math.sin(angleMid) * rInner);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.35, '#FDE047');
    grad.addColorStop(0.8, '#EAB308');
    grad.addColorStop(1, '#CA8A04');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(250, 204, 21, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createCatParticleSystem(): CatParticleSystem {
  const group = new THREE.Group();
  group.name = 'cat_particles_root';

  const textures: Record<ParticleType, THREE.CanvasTexture> = {
    heart: createHeartTexture(),
    sweat: createSweatTexture(),
    star: createStarTexture(),
  };

  const pool: Particle[] = [];

  // Initialize pre-allocated pool
  (['heart', 'sweat', 'star'] as const).forEach((type) => {
    const capacity = POOL_CAPACITIES[type];
    for (let i = 0; i < capacity; i++) {
      const mat = new THREE.SpriteMaterial({
        map: textures[type],
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      sprite.scale.set(0, 0, 0);
      group.add(sprite);

      pool.push({
        sprite,
        material: mat,
        type,
        active: false,
        age: 0,
        maxLife: 1.0,
        baseScale: 0.25,
        posX: 0,
        posY: 0,
        posZ: 0,
        velX: 0,
        velY: 0,
        velZ: 0,
        wobbleSpeed: 4.0,
        wobblePhase: 0,
        rotationSpeed: 0,
      });
    }
  });

  const spawn = (type: ParticleType, count: number = 1, origin?: THREE.Vector3) => {
    let spawned = 0;
    for (let i = 0; i < pool.length && spawned < count; i++) {
      const p = pool[i]!;
      if (p.type === type && !p.active) {
        p.active = true;
        p.age = 0;

        // Default origins tailored for Leo's 3D anatomy
        if (origin) {
          p.posX = origin.x + (Math.random() - 0.5) * 0.12;
          p.posY = origin.y + (Math.random() - 0.5) * 0.12;
          p.posZ = origin.z + (Math.random() - 0.5) * 0.12;
        } else if (type === 'heart') {
          // Above head / crown
          p.posX = (Math.random() - 0.5) * 0.44;
          p.posY = 0.65 + Math.random() * 0.25;
          p.posZ = 0.35 + Math.random() * 0.25;
        } else if (type === 'sweat') {
          // Near temples
          const side = Math.random() > 0.5 ? 1 : -1;
          p.posX = side * (0.32 + Math.random() * 0.15);
          p.posY = 0.62 + Math.random() * 0.2;
          p.posZ = 0.55;
        } else {
          // Star: around center/head
          p.posX = (Math.random() - 0.5) * 0.35;
          p.posY = 0.45 + (Math.random() - 0.5) * 0.35;
          p.posZ = 0.35 + (Math.random() - 0.5) * 0.35;
        }

        p.wobblePhase = Math.random() * Math.PI * 2;

        if (type === 'heart') {
          p.maxLife = 1.2 + Math.random() * 0.5;
          p.baseScale = 0.24 + Math.random() * 0.1;
          p.velX = (Math.random() - 0.5) * 0.22;
          p.velY = 0.45 + Math.random() * 0.25; // Gentle float upward
          p.velZ = (Math.random() - 0.5) * 0.15;
          p.wobbleSpeed = 5.0 + Math.random() * 3.0;
          p.rotationSpeed = (Math.random() - 0.5) * 1.5;
        } else if (type === 'sweat') {
          p.maxLife = 0.85 + Math.random() * 0.35;
          p.baseScale = 0.2 + Math.random() * 0.08;
          p.velX = (Math.random() - 0.5) * 0.12;
          p.velY = -0.35 - Math.random() * 0.3; // Slide down temple
          p.velZ = 0.05;
          p.wobbleSpeed = 2.0;
          p.rotationSpeed = 0;
        } else {
          // Star radial burst
          p.maxLife = 1.3 + Math.random() * 0.4;
          p.baseScale = 0.28 + Math.random() * 0.12;
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.65 + Math.random() * 0.65;
          p.velX = Math.cos(angle) * speed;
          p.velY = Math.sin(angle) * speed + 0.2;
          p.velZ = (Math.random() - 0.5) * 0.3;
          p.wobbleSpeed = 8.0;
          p.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * (8.0 + Math.random() * 6.0);
        }

        p.sprite.visible = true;
        p.sprite.position.set(p.posX, p.posY, p.posZ);
        p.material.opacity = 0;
        p.sprite.scale.set(0, 0, 0);

        spawned++;
      }
    }
  };

  const update = (delta: number) => {
    const safeDt = Math.min(Math.max(0, delta), 0.05);
    if (safeDt <= 0) return;

    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]!;
      if (!p.active) continue;

      p.age += safeDt;
      if (p.age >= p.maxLife) {
        p.active = false;
        p.sprite.visible = false;
        p.material.opacity = 0;
        p.sprite.scale.set(0, 0, 0);
        continue;
      }

      const progress = p.age / p.maxLife;

      // Position integration
      if (p.type === 'star') {
        // Drag deceleration
        p.velX *= Math.pow(0.92, safeDt * 60);
        p.velY *= Math.pow(0.92, safeDt * 60);
        p.velZ *= Math.pow(0.92, safeDt * 60);
      }

      p.posX += p.velX * safeDt;
      p.posY += p.velY * safeDt;
      p.posZ += p.velZ * safeDt;

      let displayX = p.posX;
      if (p.type === 'heart') {
        // Sinusoidal lateral sway
        displayX += Math.sin(p.age * p.wobbleSpeed + p.wobblePhase) * 0.045;
      }

      p.sprite.position.set(displayX, p.posY, p.posZ);

      // Alpha lifecycle: smooth fade in, sustain, fade out
      let alpha = 1.0;
      if (progress < 0.2) {
        alpha = progress / 0.2;
      } else if (progress > 0.65) {
        alpha = (1.0 - progress) / 0.35;
      }
      p.material.opacity = Math.max(0, Math.min(1.0, alpha));

      // Scale lifecycle: pop in, gentle pulse, settle
      let scaleMult = 1.0;
      if (progress < 0.15) {
        scaleMult = progress / 0.15 * 1.15;
      } else if (p.type === 'star') {
        // Twinkle pulse
        scaleMult = 1.0 + Math.sin(p.age * 20.0) * 0.18;
      }
      const currentScale = p.baseScale * scaleMult;
      p.sprite.scale.set(currentScale, currentScale, currentScale);

      // Rotation update
      if (p.rotationSpeed !== 0) {
        p.material.rotation += p.rotationSpeed * safeDt;
      }
    }
  };

  const dispose = () => {
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i]!;
      p.active = false;
      group.remove(p.sprite);
      p.material.dispose();
    }
    pool.length = 0;

    textures.heart.dispose();
    textures.sweat.dispose();
    textures.star.dispose();
  };

  return {
    group,
    spawn,
    update,
    dispose,
  };
}
