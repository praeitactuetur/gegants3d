import * as THREE from 'three';
import { createCobblestonePBR, createFacadeTexture } from './textures.js';
import { applyClothWindShader } from './clothShader.js';

export class CatalanTownWorld {
  constructor(scene, shaderUniforms) {
    this.scene = scene;
    this.shaderUniforms = shaderUniforms;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.crowd = [];
    this.musicians = [];
    this.cobblePBR = createCobblestonePBR();
    this.buildTown('collbato');
  }

  buildTown(townKey) {
    this.worldGroup.clear();
    this.crowd = [];
    this.musicians = [];

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.cobblePBR.map,
      normalMap: this.cobblePBR.normalMap,
      roughnessMap: this.cobblePBR.roughnessMap,
      roughness: 0.78,
      metalness: 0.08
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(46, 110), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -28);
    ground.receiveShadow = true;
    this.worldGroup.add(ground);

    const danceRing = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 2.95, 48),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#d97706', emissiveIntensity: 0.35, roughness: 0.4 })
    );
    danceRing.rotation.x = -Math.PI / 2;
    danceRing.position.set(0, 0.015, -46);
    this.worldGroup.add(danceRing);

    if (townKey === 'collbato') this.buildMontserratBackdrop();

    const facadeColors =
      townKey === 'collbato'
        ? ['#e8dec8', '#dfd0b8', '#d6c3a5']
        : townKey === 'vilafranca'
        ? ['#d8cfc0', '#c9bea9', '#e2d8c5']
        : ['#cbbba0', '#bfa98a', '#d4c5ad'];

    const senyeraMat = new THREE.MeshStandardMaterial({
      map: this.createSenyeraTexture(),
      roughness: 0.72,
      side: THREE.DoubleSide
    });
    applyClothWindShader(senyeraMat, this.shaderUniforms, { stiffness: 0.65, maxY: 0.9, minY: -0.9 });

    [-1, 1].forEach((side) => {
      for (let i = 0; i < 8; i++) {
        const zPos = 14 - i * 9.5;
        const h = 9.5 + (i % 3) * 2.2;
        const w = 8.8;
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(6, h, w),
          new THREE.MeshStandardMaterial({ map: createFacadeTexture(facadeColors[i % facadeColors.length]), roughness: 0.88 })
        );
        building.position.set(side * 10.5, h / 2, zPos);
        building.castShadow = true;
        building.receiveShadow = true;
        this.worldGroup.add(building);

        const balcony = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.16, 3.2),
          new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.8 })
        );
        balcony.position.set(side * 7.2, 4.2, zPos);
        this.worldGroup.add(balcony);

        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(1.05, 0.95, 3.15),
          new THREE.MeshStandardMaterial({ color: '#1c1917', metalness: 0.7, roughness: 0.4, wireframe: true })
        );
        rail.position.set(side * 7.2, 4.75, zPos);
        this.worldGroup.add(rail);

        if (i % 2 === 0) {
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8, 8, 12), senyeraMat);
          flag.position.set(side * 6.62, 3.55, zPos);
          flag.rotation.y = side * (Math.PI / 2);
          this.worldGroup.add(flag);
        }
      }
    });

    const churchMat = new THREE.MeshStandardMaterial({ map: createFacadeTexture('#d6c6ae'), roughness: 0.85 });
    const church = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 8), churchMat);
    church.position.set(0, 7, -64);
    church.castShadow = true;
    this.worldGroup.add(church);

    const bellTower = new THREE.Mesh(new THREE.BoxGeometry(4.2, 22, 4.2), churchMat);
    bellTower.position.set(-6.5, 11, -63);
    bellTower.castShadow = true;
    this.worldGroup.add(bellTower);

    this.populateCrowd();
    this.populateMusicians();
  }

  buildMontserratBackdrop() {
    const mountainMat = new THREE.MeshStandardMaterial({ color: '#8c7d70', roughness: 0.92, flatShading: true });
    [
      { x: -55, z: -135, r: 26, h: 68 },
      { x: -28, z: -140, r: 22, h: 78 },
      { x: -4, z: -145, r: 24, h: 86 },
      { x: 22, z: -138, r: 21, h: 74 },
      { x: 48, z: -132, r: 25, h: 64 }
    ].forEach((p) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, 7), mountainMat);
      cone.position.set(p.x, p.h / 2 - 4, p.z);
      this.worldGroup.add(cone);
    });
  }

  createSenyeraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#dc2626';
      ctx.fillRect((i * 128) / 9, 0, 128 / 9 + 1, 192);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  populateCrowd() {
    const shirtPalette = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f8fafc', '#ec4899'];
    for (let i = 0; i < 42; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = 8 - Math.floor(i / 2) * 2.8 + (Math.random() - 0.5);
      const x = side * (4.3 + Math.random() * 1.4);

      const person = new THREE.Group();
      person.position.set(x, 0, z);
      person.rotation.y = -side * (Math.PI / 2) + (Math.random() - 0.5) * 0.4;

      const torso = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.16, 0.52, 6, 10),
        new THREE.MeshStandardMaterial({ color: shirtPalette[i % shirtPalette.length], roughness: 0.8 })
      );
      torso.position.y = 1.02;
      torso.castShadow = true;

      const legs = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.12, 0.72, 10),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 })
      );
      legs.position.y = 0.36;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color: '#eab696', roughness: 0.6 })
      );
      head.position.y = 1.48;

      person.add(legs, torso, head);
      this.worldGroup.add(person);
      this.crowd.push({ group: person, phase: Math.random() * Math.PI * 2 });
    }
  }

  populateMusicians() {
    [[-1.1, 4.8], [-0.35, 5.1], [0.45, 5.0], [1.15, 4.7]].forEach(([mx, mz], idx) => {
      const mus = new THREE.Group();
      mus.position.set(mx, 0, mz);

      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.17, 0.54, 8, 12),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.75 })
      );
      body.position.y = 1.04;
      body.castShadow = true;

      const faixa = new THREE.Mesh(
        new THREE.CylinderGeometry(0.185, 0.185, 0.14, 14),
        new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.7 })
      );
      faixa.position.y = 0.82;

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.125, 14, 14),
        new THREE.MeshStandardMaterial({ color: '#eab696', roughness: 0.55 })
      );
      head.position.y = 1.5;

      if (idx < 3) {
        const gralla = new THREE.Mesh(
          new THREE.ConeGeometry(0.035, 0.36, 10),
          new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.4 })
        );
        gralla.rotation.x = -Math.PI / 3;
        gralla.position.set(0, 1.38, -0.22);
        mus.add(gralla);
      } else {
        const drum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.24, 18),
          new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.5, roughness: 0.35 })
        );
        drum.position.set(0, 0.96, -0.24);
        mus.add(drum);
      }

      mus.add(body, faixa, head);
      this.worldGroup.add(mus);
      this.musicians.push({ group: mus, offset: new THREE.Vector3(mx, 0, mz) });
    });
  }

  update(time, giantPos, isPlaying) {
    for (const c of this.crowd) {
      const dist = c.group.position.distanceTo(giantPos);
      const excitement = dist < 12 ? 1.0 : 0.25;
      c.group.position.y = Math.abs(Math.sin(time * 5.2 + c.phase)) * 0.06 * excitement;
      c.group.lookAt(giantPos.x, 0, giantPos.z);
    }

    if (isPlaying) {
      this.musicians.forEach((m, i) => {
        const targetZ = giantPos.z + 4.8 + (i % 2) * 0.4;
        const targetX = giantPos.x + m.offset.x;
        m.group.position.x += (targetX - m.group.position.x) * 0.04;
        m.group.position.z += (targetZ - m.group.position.z) * 0.04;
        m.group.position.y = Math.abs(Math.sin(time * 8 + i)) * 0.03;
      });
    }
  }
}
