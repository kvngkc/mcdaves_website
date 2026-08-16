// src/vto-lab/pose/FacePose.ts
/**
 * 6-DOF Pose Filter & Smoothing Helper.
 * Employs frame-rate independent exponential smoothing using Quaternion.slerp
 * and Vector3.lerp with high responsiveness for instantaneous, zero-latency tracking.
 */

import { Quaternion, Vector3 } from 'three';

export class PoseFilter {
  public position = new Vector3();
  public quaternion = new Quaternion();
  public scale = 1.0;
  public isInitialized = false;

  private targetPosition = new Vector3();
  private targetQuaternion = new Quaternion();
  private targetScale = 1.0;

  constructor(
    public positionSmoothing = 45.0, // High-speed responsive smoothing (no latency)
    public rotationSmoothing = 50.0,
    public scaleSmoothing = 40.0,
  ) {}

  public setTarget(
    position: Vector3,
    quaternion: Quaternion,
    scale: number,
  ): void {
    this.targetPosition.copy(position);
    this.targetQuaternion.copy(quaternion);
    this.targetScale = scale;

    if (!this.isInitialized) {
      this.position.copy(position);
      this.quaternion.copy(quaternion);
      this.scale = scale;
      this.isInitialized = true;
    }
  }

  public update(delta: number): void {
    if (!this.isInitialized) return;

    // Frame-rate independent exponential alpha
    const posAlpha = 1 - Math.exp(-this.positionSmoothing * delta);
    const rotAlpha = 1 - Math.exp(-this.rotationSmoothing * delta);
    const scaleAlpha = 1 - Math.exp(-this.scaleSmoothing * delta);

    this.position.lerp(this.targetPosition, posAlpha);
    this.quaternion.slerp(this.targetQuaternion, rotAlpha);
    this.scale += (this.targetScale - this.scale) * scaleAlpha;
  }

  public reset(): void {
    this.isInitialized = false;
  }
}
