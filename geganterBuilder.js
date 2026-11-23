import * as THREE from 'three';
export class GeganterCharacter {
  constructor() {
    this.root = new THREE.Group(); this.parts = {};
    this.state = { gender: 'male', build: 'athletic', skin: '#f5cbb0', hair: 'short', hairColor: '#1e1815', beard: 'none', shirt: '#f7f5f0', faixa: '#b91c1c', scarf: 'red-dots', pants: '#18181b' };
    this.buildMesh();
  }
  getBuildScale() {
    switch (this.state.build) {
      case 'agile': return { torsoW: 0.9, torsoD: 0.88, legW: 0.9, height: 0.98 };
      case 'strong': return { torsoW: 1.15, torsoD: 1.12, legW: 1.08, height: 1.03 };
      case 'robust': return { torsoW: 1.28, torsoD: 1.24, legW: 1.16, height: 1.01 };
      default: return { torsoW: 1.02, torsoD: 1.0, legW: 1.0, height: 1.0 };
    }
  }
  buildMesh() {
    this.root.clear();
    const s = this.getBuildScale(), isFemale = this.state.gender === 'female';
    const skinMat = new THREE.MeshStandardMaterial({ color: this.state.skin, roughness: 0.55, metalness: 0.02 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: this.state.shirt, roughness: 0.78 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: this.state.pants, roughness: 0.85 });
    const faixaMat = new THREE.MeshStandardMaterial({ color: this.state.faixa, roughness: 0.72 });
    const hairMat = new THREE.MeshStandardMaterial({ color: this.state.hairColor, roughness: 0.68 });
    const bodyGroup = new THREE.Group(); bodyGroup.scale.set(1, s.height, 1); this.root.add(bodyGroup); this.parts.bodyGroup = bodyGroup;
    const legGeo = new THREE.CapsuleGeometry(0.085 * s.legW, 0.58, 8, 16);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat); leftLeg.position.set(-0.12 * s.torsoW, 0.44, 0); leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeo, pantsMat); rightLeg.position.set(0.12 * s.torsoW, 0.44, 0); rightLeg.castShadow = true;
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#f5f0e6', roughness: 0.85 });
    const soleMat = new THREE.MeshStandardMaterial({ color: '#c29b61', roughness: 0.95 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: this.state.pants === '#18181b' ? '#dc2626' : '#111827', roughness: 0.7 });
    [-0.12 * s.torsoW, 0.12 * s.torsoW].forEach((lx) => {
      const shoeGroup = new THREE.Group(); shoeGroup.position.set(lx, 0.05, 0.03);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.24), soleMat);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.12, 6, 12), shoeMat); upper.rotation.x = Math.PI / 2; upper.position.y = 0.03;
      const vetes = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.01, 6, 16), ribbonMat); vetes.rotation.x = Math.PI / 2; vetes.position.set(0, 0.09, -0.02);
      shoeGroup.add(sole, upper, vetes); bodyGroup.add(shoeGroup);
    });
    bodyGroup.add(leftLeg, rightLeg); this.parts.leftLeg = leftLeg; this.parts.rightLeg = rightLeg;
    const torsoW = (isFemale ? 0.34 : 0.40) * s.torsoW;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.56, torsoW * 0.46, 0.56, 18), shirtMat);
    torso.position.y = 1.06; torso.castShadow = true; bodyGroup.add(torso); this.parts.torso = torso;
    const faixaGroup = new THREE.Group(); faixaGroup.position.y = 0.81;
    for (let i = 0; i < 4; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(torsoW * 0.50 + i * 0.003, torsoW * 0.51 + i * 0.003, 0.042, 20), faixaMat);
      band.position.y = i * 0.036; band.castShadow = true; faixaGroup.add(band);
    }
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.09), faixaMat);
    fringe.position.set(torsoW * 0.52, -0.04, 0.04); fringe.rotation.z = -0.15; faixaGroup.add(fringe);
    bodyGroup.add(faixaGroup); this.parts.faixa = faixaGroup;
    if (this.state.scarf !== 'none') {
      const scarfColors = { 'red-dots': '#dc2626', 'blue-dots': '#1d4ed8', 'senyera': '#facc15' };
      const scarfMat = new THREE.MeshStandardMaterial({ color: scarfColors[this.state.scarf] || '#dc2626', roughness: 0.7 });
      const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.028, 8, 20), scarfMat);
      scarfRing.rotation.x = Math.PI / 2 + 0.2; scarfRing.position.set(0, 1.33, 0.01);
      const scarfTail = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.20, 4), scarfMat);
      scarfTail.position.set(0, 1.24, -0.11); scarfTail.rotation.x = 0.25;
      bodyGroup.add(scarfRing, scarfTail);
    }
    const armGeo = new THREE.CapsuleGeometry(0.055 * s.legW, 0.44, 8, 12);
    const leftArm = new THREE.Group(); leftArm.position.set(-(torsoW * 0.58 + 0.04), 1.28, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat); leftArmMesh.position.y = -0.22; leftArmMesh.castShadow = true;
    const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.068, 0.18, 12), shirtMat); leftSleeve.position.y = -0.06;
    leftArm.add(leftArmMesh, leftSleeve);
    const rightArm = new THREE.Group(); rightArm.position.set(torsoW * 0.58 + 0.04, 1.28, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat); rightArmMesh.position.y = -0.22; rightArmMesh.castShadow = true;
    const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.068, 0.18, 12), shirtMat); rightSleeve.position.y = -0.06;
    rightArm.add(rightArmMesh, rightSleeve);
    bodyGroup.add(leftArm, rightArm); this.parts.leftArm = leftArm; this.parts.rightArm = rightArm;
    const headGroup = new THREE.Group(); headGroup.position.set(0, 1.50, 0);
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 24), skinMat); headMesh.scale.set(0.94, 1.08, 0.98); headMesh.castShadow = true;
    headGroup.add(headMesh);
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.2 });
    [-0.045, 0.045].forEach((ex) => { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), eyeMat); eye.position.set(ex, 0.015, 0.122); headGroup.add(eye); });
    if (this.state.hair !== 'bald') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.142, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
      cap.rotation.x = -0.18; cap.position.y = 0.01; headGroup.add(cap);
      if (this.state.hair === 'bun') { const bun = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), hairMat); bun.position.set(0, 0.06, -0.14); headGroup.add(bun); }
      else if (this.state.hair === 'long') { const longHair = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.28, 16), hairMat); longHair.position.set(0, -0.08, -0.04); headGroup.add(longHair); }
      else if (this.state.hair === 'curly') {
        for (let a = 0; a < 10; a++) { const puff = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), hairMat); const ang = (a / 10) * Math.PI * 2; puff.position.set(Math.cos(ang) * 0.11, 0.09, Math.sin(ang) * 0.11); headGroup.add(puff); }
      }
    }
    if (this.state.beard === 'full' || this.state.beard === 'stubble') {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.138, 18, 18, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.45), hairMat);
      beard.position.set(0, -0.01, 0.012); headGroup.add(beard);
    }
    if (this.state.beard === 'mustache' || this.state.beard === 'full') {
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.03), hairMat); stache.position.set(0, -0.032, 0.132); headGroup.add(stache);
    }
    bodyGroup.add(headGroup); this.parts.head = headGroup;
  }
  updateConfig(partial) { Object.assign(this.state, partial); this.buildMesh(); }
  animate(time, speed, carrying) {
    const walkFreq = time * 8.5, amp = Math.min(speed * 0.65, 0.55);
    this.parts.leftLeg.rotation.x = Math.sin(walkFreq) * amp;
    this.parts.rightLeg.rotation.x = -Math.sin(walkFreq) * amp;
    if (carrying) {
      this.parts.leftArm.rotation.x = -2.35; this.parts.rightArm.rotation.x = -2.35;
      this.parts.leftArm.rotation.z = -0.18; this.parts.rightArm.rotation.z = 0.18;
      this.parts.bodyGroup.position.y = Math.abs(Math.sin(walkFreq)) * 0.025;
    } else {
      this.parts.leftArm.rotation.x = -Math.sin(walkFreq) * amp * 0.8; this.parts.rightArm.rotation.x = Math.sin(walkFreq) * amp * 0.8;
      this.parts.leftArm.rotation.z = 0; this.parts.rightArm.rotation.z = 0;
      this.parts.bodyGroup.position.y = Math.abs(Math.sin(walkFreq)) * 0.03;
    }
  }
}