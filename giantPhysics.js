export class GiantPhysicsEngine {
  constructor() { this.reset(); }
  reset() {
    this.position = { x: 0, z: 6.5 }; this.giantPos = { x: 0, z: 2.0 };
    this.yaw = 0; this.tiltX = 0; this.tiltZ = 0; this.velTiltX = 0; this.velTiltZ = 0;
    this.windForce = 0; this.stabilityScore = 100; this.maxSafeTilt = 0.62;
  }
  update(dt, input, specs) {
    const { moveX, moveY, spinAction, carrying, build } = input;
    const strengthMult = build === 'strong' ? 1.22 : build === 'robust' ? 1.18 : build === 'agile' ? 1.08 : 1.12;
    const weightFactor = (specs?.weight || 55) / 56;
    const baseSpeed = carrying ? 3.4 : 4.2, vx = moveX * baseSpeed, vz = -moveY * baseSpeed;
    this.position.x = Math.max(-3.6, Math.min(3.6, this.position.x + vx * dt));
    this.position.z = Math.max(-47.5, Math.min(10.0, this.position.z + vz * dt));
    if (!carrying) {
      if (Math.hypot(vx, vz) > 0.15) this.yaw = Math.atan2(-vx, -vz);
      return { speed: Math.hypot(vx, vz), tiltDeg: 0, windLabel: 'Suau', fallen: false };
    }
    this.giantPos.x = this.position.x; this.giantPos.z = this.position.z;
    if (spinAction) this.yaw += 2.6 * dt;
    else if (Math.abs(moveX) > 0.15) this.yaw -= moveX * 0.85 * dt;
    const time = performance.now() * 0.001;
    this.windForce = Math.sin(time * 0.75) * 0.14 + Math.cos(time * 1.4) * 0.07;
    const inertiaX = -moveX * 0.28 * weightFactor, userCorrectionX = -moveX * 1.45 * strengthMult;
    const gravityPull = this.tiltX * 0.72 * weightFactor, damping = -this.velTiltX * 3.4;
    const accX = gravityPull + this.windForce + inertiaX + userCorrectionX + damping;
    this.velTiltX += accX * dt; this.tiltX += this.velTiltX * dt;
    this.tiltZ += (moveY * 0.08 - this.tiltZ) * 5 * dt;
    if (Math.abs(this.tiltX) < 0.06 && Math.abs(moveX) < 0.1) this.tiltX *= 0.94;
    const tiltDeg = (this.tiltX * 180) / Math.PI;
    if (Math.abs(this.tiltX) > 0.35) this.stabilityScore = Math.max(50, this.stabilityScore - 4 * dt);
    const fallen = Math.abs(this.tiltX) >= this.maxSafeTilt;
    if (fallen) { this.tiltX = Math.sign(this.tiltX) * 0.25; this.velTiltX = 0; }
    return { speed: Math.hypot(vx, vz), tiltDeg, windLabel: Math.abs(this.windForce) > 0.14 ? 'Ratxa moderada' : 'Brisa suau', fallen };
  }
}