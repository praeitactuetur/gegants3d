import * as THREE from 'three';
import { createBrocadeFabricPBR, createWoodTexture } from './textures.js';
import { applyClothWindShader } from './clothShader.js';

export const GIANT_CATALOG = {
  mansuet: { name: 'En Mansuet', colla: 'Colla Gegantera de Collbató', town: 'collbato', height: 4.10, weight: 58, type: 'king', primaryColor: '#7f1d1d', secondaryColor: '#1e3a8a', accentColor: '#f59e0b' },
  marta: { name: 'La Marta', colla: 'Colla Gegantera de Collbató', town: 'collbato', height: 3.95, weight: 52, type: 'queen', primaryColor: '#991b1b', secondaryColor: '#fdf8f0', accentColor: '#eab308' },
  ferragus: { name: 'Ferragús', colla: 'Gegants de Vilafranca', town: 'vilafranca', height: 4.20, weight: 62, type: 'king', primaryColor: '#065f46', secondaryColor: '#78350f', accentColor: '#fbbf24' },
  elisenda: { name: 'Elisenda', colla: 'Gegants de Vilafranca', town: 'vilafranca', height: 4.00, weight: 54, type: 'queen', primaryColor: '#1e40af', secondaryColor: '#f8fafc', accentColor: '#fbbf24' },
  vell: { name: 'Gegant Vell', colla: 'Comparsa de Berga', town: 'berga', height: 4.15, weight: 60, type: 'king', primaryColor: '#581c87', secondaryColor: '#991b1b', accentColor: '#f59e0b' },
  geganta: { name: 'Geganta', colla: 'Comparsa de Berga', town: 'berga', height: 3.95, weight: 53, type: 'queen', primaryColor: '#be123c', secondaryColor: '#fef3c7', accentColor: '#f59e0b' }
};

export class GiantFigure {
  constructor(shaderUniforms) {
    this.root = new THREE.Group();
    this.tiltGroup = new THREE.Group();
    this.root.add(this.tiltGroup);
    this.shaderUniforms = shaderUniforms;
    this.currentKey = 'mansuet';
    this.woodTex = createWoodTexture();
    this.build('mansuet');
  }

  build(key) {
    this.currentKey = key;
    const spec = GIANT_CATALOG[key] || GIANT_CATALOG.mansuet;
    this.spec = spec;
    this.tiltGroup.clear();

    const scaleFactor = spec.height / 4.05;
    const figure = new THREE.Group();
    figure.scale.setScalar(scaleFactor);
    this.tiltGroup.add(figure);

    const woodMat = new THREE.MeshStandardMaterial({ map: this.woodTex, roughness: 0.65 });
    const cavallet = new THREE.Group();
    [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.22], [0.24, 0.22]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, 2.1, 0.055), woodMat);
      post.position.set(px, 1.35, pz);
      cavallet.add(post);
    });

    const padMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.85 });
    [-0.17, 0.17].forEach((sx) => {
      const shoulderBar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.56), woodMat);
      shoulderBar.position.set(sx, 1.48, 0);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.34), padMat);
      pad.position.set(sx, 1.44, 0);
      cavallet.add(shoulderBar, pad);
    });

    const frontHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.54, 12), woodMat);
    frontHandle.rotation.z = Math.PI / 2;
    frontHandle.position.set(0, 1.52, 0.24);
    cavallet.add(frontHandle);
    figure.add(cavallet);

    const skirtPBR = createBrocadeFabricPBR(spec.primaryColor, spec.accentColor);
    const skirtMat = new THREE.MeshStandardMaterial({
      map: skirtPBR.map,
      normalMap: skirtPBR.normalMap,
      roughness: 0.72,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    applyClothWindShader(skirtMat, this.shaderUniforms, { stiffness: 1.05, maxY: 2.35, minY: 0.18 });

    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.86, 2.18, 48, 24, true), skirtMat);
    skirt.position.y = 1.26;
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    figure.add(skirt);

    const goldMat = new THREE.MeshStandardMaterial({ color: spec.accentColor, metalness: 0.78, roughness: 0.28 });
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.025, 10, 48), goldMat);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = 0.18;
    figure.add(hem);

    const upperPBR = createBrocadeFabricPBR(spec.secondaryColor, spec.accentColor);
    const upperMat = new THREE.MeshStandardMaterial({
      map: upperPBR.map,
      normalMap: upperPBR.normalMap,
      roughness: 0.65,
      metalness: 0.2
    });

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.45, 0.92, 24), upperMat);
    chest.position.y = 2.78;
    chest.castShadow = true;
    figure.add(chest);

    const capeMat = new THREE.MeshStandardMaterial({ map: skirtPBR.map, roughness: 0.7, side: THREE.DoubleSide });
    applyClothWindShader(capeMat, this.shaderUniforms, { stiffness: 0.75, maxY: 3.15, minY: 1.1 });

    const cape = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.78, 1.95, 24, 16, true, Math.PI * 0.65, Math.PI * 0.7),
      capeMat
    );
    cape.position.set(0, 2.22, -0.04);
    cape.castShadow = true;
    figure.add(cape);

    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.75, 10, 16), upperMat);
      arm.position.set(side * 0.48, 2.72, 0.08);
      arm.rotation.z = side * 0.25;
      arm.rotation.x = -0.35;
      arm.castShadow = true;
      figure.add(arm);
    });

    if (spec.type === 'king') {
      const bladeMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.9, roughness: 0.18 });
      const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.04), goldMat);
      hilt.position.set(0.56, 2.38, 0.34);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.85, 0.012), bladeMat);
      blade.position.set(0.56, 2.82, 0.34);
      figure.add(hilt, blade);
    } else {
      const bouquet = new THREE.Group();
      bouquet.position.set(0.46, 2.42, 0.36);
      const flowerColors = ['#f43f5e', '#fbbf24', '#ffffff', '#ec4899'];
      for (let i = 0; i < 9; i++) {
        const fl = new THREE.Mesh(
          new THREE.SphereGeometry(0.048, 10, 10),
          new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length], roughness: 0.5 })
        );
        fl.position.set((Math.random() - 0.5) * 0.16, Math.random() * 0.12, (Math.random() - 0.5) * 0.16);
        bouquet.add(fl);
      }
      figure.add(bouquet);
    }

    const skinMat = new THREE.MeshStandardMaterial({ color: '#f3c6a5', roughness: 0.48 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 28, 28), skinMat);
    head.scale.set(0.92, 1.12, 0.98);
    head.position.set(0, 3.52, 0.04);
    head.castShadow = true;
    figure.add(head);

    if (spec.type === 'king') {
      const beard = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.36, 18),
        new THREE.MeshStandardMaterial({ color: '#291d18', roughness: 0.75 })
      );
      beard.rotation.x = Math.PI;
      beard.position.set(0, 3.30, 0.12);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.23, 0.18, 16), goldMat);
      crown.position.set(0, 3.78, 0.04);
      figure.add(beard, crown);
    } else {
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 22, 22, 0, Math.PI * 2, 0, Math.PI * 0.6),
        new THREE.MeshStandardMaterial({ color: '#3b2316', roughness: 0.65 })
      );
      hair.position.set(0, 3.55, 0.02);
      const tiara = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 10, 24), goldMat);
      tiara.rotation.x = Math.PI / 2 - 0.15;
      tiara.position.set(0, 3.74, 0.05);
      figure.add(hair, tiara);
    }
  }
}
