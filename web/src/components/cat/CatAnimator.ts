/**
 * CatAnimator.ts
 * Pixar/Disney-grade 3D character animation controller for Leo Cat.
 *
 * Implements:
 * 1. Volume-Preserving Squash & Stretch (Sx * Sy * Sz = 1.0) with ground anchoring
 * 2. 2nd-order damped harmonic ODE springs for cheeks, belly, ear tips, and whiskers
 * 3. 6-segment tail multi-frequency wave propagation
 * 4. Bio-realistic eye micro-saccades, emotional pupil morphs & asymmetric blinks
 * 5. Interactive gestures: cursor petting purr vibration, belly poke recoil bounce
 * 6. Natural idle behaviors state machine (stretch & yawn, ear scratch, paw lick)
 * 7. Asymmetric lip-sync kinetics (attack 28/s vs decay 13/s) and tongue flutter tremor
 */

import * as THREE from 'three';
import type { CatRig, CatActionState } from './CatRig';
import {
  SpringOscillator,
  SPRING_PRESETS,
  calculateVolumePreservingScale,
  computeGroundContactOffset,
  calculateTailSegmentRotation,
  createSaccadeState,
  updateMicroSaccade,
  type SaccadeState,
} from './CatPhysics';

export type IdleBehaviorType = 'none' | 'stretch_yawn' | 'ear_scratch' | 'paw_lick';

export class CatAnimator {
  private rig: CatRig;
  private state: CatActionState = 'idle';
  private targetState: CatActionState = 'idle';
  private transitionAlpha = 1.0;

  // Timers & Simulation time
  private time = 0;
  private blinkTimer = 2.5;
  private blinkProgress = 0;
  private isBlinking = false;
  private isDoubleBlink = false;
  private earTwitchTimer = 3.5;
  private earTwitchAlpha = 0;

  // Smoothing mouse
  private currentMouse = { x: 0, y: 0 };
  private targetMouse = { x: 0, y: 0 };
  private prevMouse = { x: 0, y: 0 };

  // Secondary Motion Spring Oscillators
  private squashSpring = new SpringOscillator(0, SPRING_PRESETS.belly);
  private recoilYSpring = new SpringOscillator(0, SPRING_PRESETS.recoilBounce);
  private cheekSpringL = new SpringOscillator(0, SPRING_PRESETS.cheeks);
  private cheekSpringR = new SpringOscillator(0, SPRING_PRESETS.cheeks);
  private earSpringL = new SpringOscillator(0, SPRING_PRESETS.earTips);
  private earSpringR = new SpringOscillator(0, SPRING_PRESETS.earTips);
  private whiskerSpring = new SpringOscillator(0, SPRING_PRESETS.whiskers);

  // Micro-saccade simulation
  private saccadeState: SaccadeState = createSaccadeState();

  // Poke reaction & Annoyance
  private pokeIntensity = 0;
  private annoyanceLevel = 0;

  // Petting interaction & Purr vibration
  private isPetting = false;
  private petDuration = 0;
  private lastHeartSpawnTime = 0;

  // Idle Behavior State Machine
  private idleBehavior: IdleBehaviorType = 'none';
  private idleTimer = 0;
  private idleDuration = 0;
  private inactivityTimer = 0;

  // Lip-sync / Jaw opening with asymmetric attack/decay
  private jawOpenTarget = 0;
  private currentJawOpen = 0;

  // Particle VFX spawn callback
  public onSpawnParticle?: (type: 'heart' | 'sweat' | 'star', count?: number, origin?: THREE.Vector3) => void;

  // Reduced motion flag
  public reducedMotion = false;

  constructor(rig: CatRig) {
    this.rig = rig;
  }

  public setState(newState: CatActionState) {
    if (this.state !== newState) {
      this.targetState = newState;
      this.transitionAlpha = 0;

      // When switching state, interrupt any idle behavior
      this.abortIdleBehavior();

      // Celebration burst
      if (newState === 'celebrating') {
        this.onSpawnParticle?.('star', 12);
        this.squashSpring.impulse(0.8);
      }
    }
  }

  public setMousePosition(x: number, y: number) {
    const clampedX = THREE.MathUtils.clamp(x, -1, 1);
    const clampedY = THREE.MathUtils.clamp(y, -1, 1);

    const mouseDelta = Math.hypot(clampedX - this.prevMouse.x, clampedY - this.prevMouse.y);
    if (mouseDelta > 0.015) {
      this.inactivityTimer = 0;
      if (this.idleBehavior !== 'none') {
        this.abortIdleBehavior();
      }
    }
    this.prevMouse.x = clampedX;
    this.prevMouse.y = clampedY;

    this.targetMouse.x = clampedX;
    this.targetMouse.y = clampedY;
  }

  public setJawOpen(value: number) {
    this.jawOpenTarget = THREE.MathUtils.clamp(value, 0, 1);
    if (this.jawOpenTarget > 0.1) {
      this.inactivityTimer = 0;
      if (this.idleBehavior !== 'none') {
        this.abortIdleBehavior();
      }
    }
  }

  public triggerPoke(region: 'belly' | 'head' | 'paw' | 'tail' = 'belly') {
    this.inactivityTimer = 0;
    this.abortIdleBehavior();

    this.pokeIntensity = 1.0;
    this.annoyanceLevel = Math.min(3, this.annoyanceLevel + 0.6);
    this.state = 'poked';

    if (region === 'belly') {
      // Recoil bounce impulse: compress down, pop up
      this.squashSpring.impulse(-1.9);
      this.recoilYSpring.impulse(0.18);
      this.earSpringL.impulse(0.45);
      this.earSpringR.impulse(-0.45);
      this.cheekSpringL.impulse(0.12);
      this.cheekSpringR.impulse(0.12);

      this.onSpawnParticle?.('sweat', this.annoyanceLevel >= 2 ? 3 : 1);
    } else {
      this.earSpringL.impulse(0.3);
      this.earSpringR.impulse(0.3);
      this.squashSpring.impulse(-0.8);
      this.onSpawnParticle?.('sweat', 1);
    }
  }

  public triggerHeadPat() {
    this.inactivityTimer = 0;
    if (this.idleBehavior !== 'none') {
      this.abortIdleBehavior();
    }

    this.isPetting = true;
    this.petDuration = 0.55;

    // Cheeks & ears soft jiggle
    this.earSpringL.setTarget(0.35);
    this.earSpringR.setTarget(-0.35);

    // Periodically spawn floating heart particles
    if (this.time - this.lastHeartSpawnTime > 0.28) {
      this.lastHeartSpawnTime = this.time;
      this.onSpawnParticle?.('heart', 2);
    }
  }

  public abortIdleBehavior() {
    this.idleBehavior = 'none';
    this.idleTimer = 0;
    this.idleDuration = 0;
  }

  public update(delta: number) {
    const safeDelta = Math.min(Math.max(0, delta), 0.033);
    this.time += safeDelta;
    this.inactivityTimer += safeDelta;

    // Decay petting duration
    if (this.petDuration > 0) {
      this.petDuration = Math.max(0, this.petDuration - safeDelta);
      this.isPetting = this.petDuration > 0;
    } else {
      this.isPetting = false;
      this.earSpringL.setTarget(0);
      this.earSpringR.setTarget(0);
    }

    // Recover annoyance over time
    if (this.annoyanceLevel > 0) {
      this.annoyanceLevel = Math.max(0, this.annoyanceLevel - safeDelta * 0.25);
    }

    if (this.pokeIntensity > 0) {
      this.pokeIntensity = Math.max(0, this.pokeIntensity - safeDelta * 3.0);
      if (this.pokeIntensity === 0 && this.state === 'poked') {
        this.state = this.targetState;
      }
    }

    // State transition alpha blending
    if (this.transitionAlpha < 1.0) {
      this.transitionAlpha = Math.min(1.0, this.transitionAlpha + safeDelta * 3.5);
      if (this.transitionAlpha >= 1.0) {
        this.state = this.targetState;
      }
    }

    // Smooth mouse damping
    const mouseDamp = this.reducedMotion ? 0.03 : 0.08;
    this.currentMouse.x = THREE.MathUtils.lerp(this.currentMouse.x, this.targetMouse.x, mouseDamp);
    this.currentMouse.y = THREE.MathUtils.lerp(this.currentMouse.y, this.targetMouse.y, mouseDamp);

    // Idle state machine evaluation
    this.updateIdleStateMachine(safeDelta);

    // 1. Natural blinking & Micro-saccades
    this.updateBlinkingAndEyes(safeDelta);

    // 2. Asymmetric attack/decay Lip-sync & tongue tremor
    this.updateJawAndLipSync(safeDelta);

    // 3. Random & reactive ear twitch
    this.updateEarTwitch(safeDelta);

    // 4. Volume-preserving Squash & Stretch breathing + secondary jiggle physics
    this.updateBreathingAndSecondaryPhysics(safeDelta);

    // 5. Head look-at & emotional facial morphs
    this.updateHeadAndExpressions();

    // 6. Arm poses & gestures
    this.updateArmsAndPaws(safeDelta);
  }

  private updateIdleStateMachine(delta: number) {
    if (this.reducedMotion) return;

    // Check trigger: inactivity > 10.0s, cat in idle state, no current idle behavior
    if (this.inactivityTimer > 10.0 && this.state === 'idle' && this.idleBehavior === 'none') {
      const rand = Math.random();
      if (rand < 0.4) {
        this.idleBehavior = 'stretch_yawn';
        this.idleDuration = 3.2;
      } else if (rand < 0.72) {
        this.idleBehavior = 'ear_scratch';
        this.idleDuration = 2.6;
      } else {
        this.idleBehavior = 'paw_lick';
        this.idleDuration = 2.8;
      }
      this.idleTimer = 0;
    }

    if (this.idleBehavior !== 'none') {
      this.idleTimer += delta;
      if (this.idleTimer >= this.idleDuration) {
        this.abortIdleBehavior();
        this.inactivityTimer = 4.0; // Wait before triggering next idle
      }
    }
  }

  private updateBlinkingAndEyes(delta: number) {
    this.blinkTimer -= delta;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      this.blinkProgress = 0;
      this.isDoubleBlink = Math.random() < 0.25;
      this.blinkTimer = 2.2 + Math.random() * 4.2;
    }

    if (this.isBlinking) {
      this.blinkProgress += delta * 9.5;
      const blinkPhase = Math.sin(this.blinkProgress * Math.PI);

      if (this.state === 'break') {
        this.rig.upperEyelidL.rotation.x = 0;
        this.rig.upperEyelidR.rotation.x = 0;
      } else {
        const closedAngle = -Math.PI / 2 + blinkPhase * (Math.PI / 2);
        this.rig.upperEyelidL.rotation.x = closedAngle;
        this.rig.upperEyelidR.rotation.x = closedAngle;
      }

      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        if (this.isDoubleBlink) {
          this.isDoubleBlink = false;
          this.blinkTimer = 0.12;
        }
      }
    } else {
      // Expressive emotional eyelids
      if (this.state === 'break') {
        this.rig.upperEyelidL.rotation.x = 0;
        this.rig.upperEyelidR.rotation.x = 0;
      } else if (this.isPetting) {
        // Blissful crescent squint
        this.rig.upperEyelidL.rotation.x = -0.35;
        this.rig.upperEyelidR.rotation.x = -0.35;
      } else if (this.state === 'warning' || this.annoyanceLevel > 1) {
        // Asymmetric skeptical squint
        this.rig.upperEyelidL.rotation.x = -0.65;
        this.rig.upperEyelidR.rotation.x = -0.45;
      } else if (this.state === 'celebrating') {
        // Happy smile curve
        this.rig.upperEyelidL.rotation.x = -0.38;
        this.rig.upperEyelidR.rotation.x = -0.38;
      } else if (this.idleBehavior === 'stretch_yawn') {
        const p = this.idleTimer / this.idleDuration;
        const yawnSquint = Math.sin(p * Math.PI) * 0.6;
        this.rig.upperEyelidL.rotation.x = -Math.PI / 2 + yawnSquint;
        this.rig.upperEyelidR.rotation.x = -Math.PI / 2 + yawnSquint;
      } else {
        // Normal wide open
        this.rig.upperEyelidL.rotation.x = -Math.PI / 2;
        this.rig.upperEyelidR.rotation.x = -Math.PI / 2;
      }
    }

    // Micro-saccade biological eye jitter & fixational drift
    const saccade = updateMicroSaccade(this.saccadeState, this.time, delta);

    // Look-at mouse pupil position + saccades
    const pupilLookMax = 0.038;
    this.rig.pupilL.position.x = 0.02 + this.currentMouse.x * pupilLookMax + saccade.x;
    this.rig.pupilL.position.y = -this.currentMouse.y * pupilLookMax + saccade.y;
    this.rig.pupilR.position.x = -0.02 + this.currentMouse.x * pupilLookMax + saccade.x;
    this.rig.pupilR.position.y = -this.currentMouse.y * pupilLookMax + saccade.y;

    // Pupil dilation modulation according to mood
    if (this.isPetting || this.state === 'celebrating') {
      // Big cute round anime pupils
      this.rig.pupilL.scale.set(1.15, 1.15, 0.2);
      this.rig.pupilR.scale.set(1.15, 1.15, 0.2);
    } else if (this.state === 'scolding_extreme' || this.annoyanceLevel > 2) {
      // Narrow sharp slits
      this.rig.pupilL.scale.set(0.42, 1.45, 0.2);
      this.rig.pupilR.scale.set(0.42, 1.45, 0.2);
    } else {
      // Normal chibi ellipse
      this.rig.pupilL.scale.set(0.85, 1.35, 0.2);
      this.rig.pupilR.scale.set(0.85, 1.35, 0.2);
    }
  }

  private updateJawAndLipSync(delta: number) {
    // Override jaw if currently yawning in idle
    let effectiveTarget = this.jawOpenTarget;
    if (this.idleBehavior === 'stretch_yawn') {
      const p = this.idleTimer / this.idleDuration;
      effectiveTarget = Math.max(effectiveTarget, Math.sin(p * Math.PI) * 0.9);
    }

    // Asymmetric attack/decay kinetics: opens fast (k=28), closes smoothly (k=13)
    const kRate = effectiveTarget > this.currentJawOpen ? 28.0 : 13.0;
    this.currentJawOpen = THREE.MathUtils.lerp(
      this.currentJawOpen,
      effectiveTarget,
      Math.min(1.0, delta * kRate)
    );

    // Jaw rotation & chin depression
    this.rig.jaw.rotation.x = -this.currentJawOpen * 0.55;
    this.rig.jaw.position.y = -0.10 - this.currentJawOpen * 0.08;

    // Tongue elevation & speech tremor
    const tremor = Math.sin(this.time * 26) * 0.025 * this.currentJawOpen;
    this.rig.tongue.position.y = -0.02 + tremor;
    this.rig.tongue.scale.set(
      1.0 + Math.sin(this.time * 20) * 0.1 * this.currentJawOpen,
      1.0,
      1.0 + this.currentJawOpen * 0.25
    );
  }

  private updateEarTwitch(delta: number) {
    this.earTwitchTimer -= delta;
    if (this.earTwitchTimer <= 0) {
      this.earTwitchAlpha = 1.0;
      this.earTwitchTimer = 2.5 + Math.random() * 4.5;
      this.earSpringL.impulse(0.28);
    }

    if (this.earTwitchAlpha > 0) {
      this.earTwitchAlpha = Math.max(0, this.earTwitchAlpha - delta * 7.0);
    }
  }

  private updateBreathingAndSecondaryPhysics(delta: number) {
    let breathSpeed = 2.2;
    let breathScale = 0.035;
    let tailSpeed = 2.0;
    let tailAmplitude = 0.12;

    switch (this.state) {
      case 'scolding_extreme':
      case 'scolding_medium':
        breathSpeed = 4.8;
        breathScale = 0.06;
        tailSpeed = 6.8;
        tailAmplitude = 0.28;
        break;
      case 'warning':
        breathSpeed = 3.2;
        tailSpeed = 4.2;
        tailAmplitude = 0.20;
        break;
      case 'celebrating':
        breathSpeed = 3.6;
        tailSpeed = 5.2;
        tailAmplitude = 0.26;
        break;
      case 'break':
        breathSpeed = 1.2; // 4-7-8 breathing
        breathScale = 0.08;
        tailSpeed = 0.8;
        tailAmplitude = 0.05;
        break;
      default:
        break;
    }

    if (this.reducedMotion) {
      breathScale = 0.015;
      tailAmplitude = 0.05;
    }

    // 1. Volume-Preserving Squash & Stretch:
    const breathCycle = Math.sin(this.time * breathSpeed);
    const squashJiggle = this.squashSpring.step(delta);
    const recoilY = this.recoilYSpring.step(delta);

    const totalSy = 1.0 + breathCycle * breathScale + squashJiggle;
    const { scaleX, scaleY, scaleZ } = calculateVolumePreservingScale(totalSy);

    this.rig.body.scale.set(scaleX, scaleY, scaleZ);

    // Ground contact compensation (anchors paws to floor)
    const groundOffset = computeGroundContactOffset(scaleY, 0.45);

    // Purr vibration when petting: Delta Y = 0.002 * cos(50t), Delta X = 0.003 * sin(55t)
    let purrX = 0;
    let purrY = 0;
    if (this.isPetting) {
      purrY = 0.002 * Math.cos(50.0 * this.time);
      purrX = 0.003 * Math.sin(55.0 * this.time);
    }

    this.rig.body.position.y = -0.15 + groundOffset + recoilY + purrY;
    this.rig.body.position.x = purrX;

    // Belly jiggle & breathing scale
    const bellyCycle = Math.sin(this.time * breathSpeed);
    this.rig.belly.scale.set(
      1.0 + bellyCycle * (breathScale * 0.5),
      1.0,
      1.0 + bellyCycle * breathScale + Math.abs(squashJiggle) * 0.4
    );

    // 2. Secondary Cheek Springs
    this.cheekSpringL.setTarget(this.currentJawOpen * 0.06);
    this.cheekSpringR.setTarget(this.currentJawOpen * 0.06);
    const cheekDispL = this.cheekSpringL.step(delta);
    const cheekDispR = this.cheekSpringR.step(delta);

    this.rig.cheekL.scale.set(1.15 + cheekDispL, 0.9 + cheekDispL, 0.8);
    this.rig.cheekR.scale.set(1.15 + cheekDispR, 0.9 + cheekDispR, 0.8);

    // 3. Secondary Ear Springs (angular spring jiggle)
    const earJiggleL = this.earSpringL.step(delta);
    const earJiggleR = this.earSpringR.step(delta);

    let baseEarZ_L = 0.35;
    let baseEarZ_R = -0.35;
    if (this.isPetting) {
      // Ears droop down happily
      baseEarZ_L = 0.72;
      baseEarZ_R = -0.72;
    }

    this.rig.earL.rotation.z = baseEarZ_L + earJiggleL;
    this.rig.earR.rotation.z = baseEarZ_R + earJiggleR;

    // 4. Secondary Whisker Springs
    this.whiskerSpring.setTarget(Math.sin(this.time * breathSpeed) * 0.03);
    const whiskerJiggle = this.whiskerSpring.step(delta);
    this.rig.whiskersL.rotation.y = whiskerJiggle;
    this.rig.whiskersR.rotation.y = -whiskerJiggle;

    // 5. 6-Segment Tail Multi-Frequency Wave Kinematics
    const isFlicking = this.state === 'warning' || this.state === 'scolding_extreme' || this.annoyanceLevel > 1;
    const segments = this.rig.tailSegments;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      const rot = calculateTailSegmentRotation(
        i,
        segments.length,
        this.time,
        tailSpeed,
        tailAmplitude,
        isFlicking
      );
      seg.rotation.set(rot.x, rot.y, rot.z);
    }
  }

  private updateHeadAndExpressions() {
    const maxHeadYaw = 0.35;
    const maxHeadPitch = 0.25;

    let targetYaw = this.currentMouse.x * maxHeadYaw;
    let targetPitch = -this.currentMouse.y * maxHeadPitch;
    let targetRoll = -targetYaw * 0.25;

    // Handle Idle Behaviors head overrides
    if (this.idleBehavior === 'stretch_yawn') {
      const p = this.idleTimer / this.idleDuration;
      targetPitch -= Math.sin(p * Math.PI) * 0.22;
    } else if (this.idleBehavior === 'ear_scratch') {
      targetRoll = -0.35; // Tilt head toward scratching ear
      targetPitch += 0.08;
    } else if (this.idleBehavior === 'paw_lick') {
      targetPitch += 0.28; // Head bows down toward paw
    } else if (this.state === 'scolding_extreme') {
      targetPitch -= 0.15;
      targetYaw += Math.sin(this.time * 8) * 0.04;
    } else if (this.state === 'break') {
      targetPitch = 0.20;
      targetYaw = 0.25;
    }

    this.rig.head.rotation.y = targetYaw;
    this.rig.head.rotation.x = targetPitch;
    this.rig.head.rotation.z = targetRoll;

    // Eyebrows expressive modulation
    if (this.state === 'scolding_extreme' || this.state === 'scolding_medium') {
      this.rig.browL.rotation.z = -0.38;
      this.rig.browR.rotation.z = 0.38;
    } else if (this.state === 'warning' || this.annoyanceLevel > 1) {
      this.rig.browL.rotation.z = -0.22;
      this.rig.browR.rotation.z = 0.22;
    } else if (this.state === 'celebrating') {
      this.rig.browL.rotation.z = 0.22;
      this.rig.browR.rotation.z = -0.22;
    } else {
      this.rig.browL.rotation.z = 0;
      this.rig.browR.rotation.z = 0;
    }
  }

  private updateArmsAndPaws(delta: number) {
    // If executing an idle behavior, animate paws accordingly
    if (this.idleBehavior === 'stretch_yawn') {
      const p = this.idleTimer / this.idleDuration;
      const stretch = Math.sin(p * Math.PI) * 0.45;
      this.rig.armL.rotation.set(-stretch, 0.1, 0);
      this.rig.armR.rotation.set(-stretch, -0.1, 0);
      return;
    }

    if (this.idleBehavior === 'ear_scratch') {
      const scratchFlutter = Math.sin(this.time * 24.0) * 0.15;
      this.rig.armR.rotation.set(1.15 + scratchFlutter, -0.25, 0.45);
      this.rig.armL.rotation.set(0, 0, 0);
      return;
    }

    if (this.idleBehavior === 'paw_lick') {
      this.rig.armL.rotation.set(0.75, 0.25, 0.35);
      this.rig.armR.rotation.set(0, 0, 0);
      return;
    }

    // Default state-based arm poses
    switch (this.state) {
      case 'idle':
        this.rig.armL.rotation.set(0, 0, 0);
        this.rig.armR.rotation.set(0, 0, 0);
        break;

      case 'focusing':
        this.rig.armL.rotation.set(0.35, 0.2, 0.2);
        this.rig.armR.rotation.set(0.35, -0.2, -0.2);
        break;

      case 'warning':
        const tapPaw = Math.abs(Math.sin(this.time * 6)) * 0.12;
        this.rig.pawR.position.y = -0.5 + tapPaw;
        this.rig.armL.rotation.set(0.2, 0.1, 0);
        break;

      case 'scolding_extreme':
      case 'scolding_medium':
        const slam = Math.sin(this.time * 8);
        this.rig.armR.rotation.set(0.9 + slam * 0.15, -0.3, 0);
        this.rig.pawR.rotation.set(0.4, 0, 0);
        this.rig.armL.rotation.set(0.2, 0.2, 0);
        break;

      case 'celebrating':
        const clap = Math.sin(this.time * 12) * 0.25;
        this.rig.armL.rotation.set(0.6, 0.4 + clap, 0.2);
        this.rig.armR.rotation.set(0.6, -0.4 - clap, -0.2);
        break;

      case 'break':
        this.rig.armL.rotation.set(0.5, 0.4, 0.3);
        this.rig.armR.rotation.set(0.5, -0.4, -0.3);
        break;

      case 'poked':
        this.rig.armL.rotation.set(0.6, 0.3, 0.3);
        this.rig.armR.rotation.set(0.6, -0.3, -0.3);
        break;
    }
  }
}
