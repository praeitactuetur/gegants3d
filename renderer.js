import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
export class RealisticEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2('#e8d9c5', 0.0085);
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.15, 450);
    this.camera.position.set(0, 2.4, 6.2);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.quality = 'high';
    this.setupAtmosphereAndLighting();
    this.setupPostProcessing();
    window.addEventListener('resize', () => this.onResize());
  }
  setupAtmosphereAndLighting() {
    this.sky = new Sky(); this.sky.scale.setScalar(450); this.scene.add(this.sky);
    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 6.5; skyUniforms['rayleigh'].value = 1.8;
    skyUniforms['mieCoefficient'].value = 0.005; skyUniforms['mieDirectionalG'].value = 0.82;
    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 24), THREE.MathUtils.degToRad(142));
    skyUniforms['sunPosition'].value.copy(sun);
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(this.sky).texture;
    this.scene.environmentIntensity = 0.65;
    this.scene.add(new THREE.HemisphereLight('#fff6e5', '#6b5b4b', 0.85));
    this.sunLight = new THREE.DirectionalLight('#fff1d6', 2.4);
    this.sunLight.position.copy(sun).multiplyScalar(65);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 5; this.sunLight.shadow.camera.far = 160;
    const d = 32;
    this.sunLight.shadow.camera.left = -d; this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d; this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);
  }
  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
    this.ssaoPass.kernelRadius = 0.45; this.ssaoPass.minDistance = 0.002; this.ssaoPass.maxDistance = 0.08;
    this.ssaoPass.enabled = false;
    this.composer.addPass(this.ssaoPass);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.65, 0.88);
    this.bloomPass.enabled = false;
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
  }
  setQuality(level) {
    this.quality = level;
    if (level === 'medium') { this.renderer.setPixelRatio(1); this.sunLight.shadow.mapSize.set(1024, 1024); this.ssaoPass.enabled = false; this.bloomPass.enabled = false; }
    else if (level === 'high') { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); this.sunLight.shadow.mapSize.set(2048, 2048); this.ssaoPass.enabled = false; this.bloomPass.enabled = true; }
    else { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); this.sunLight.shadow.mapSize.set(2048, 2048); this.ssaoPass.enabled = true; this.bloomPass.enabled = true; }
    this.sunLight.shadow.map?.dispose(); this.sunLight.shadow.map = null;
  }
  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h); this.composer.setSize(w, h); this.ssaoPass.setSize(w, h);
  }
  render() { if (this.quality === 'medium') this.renderer.render(this.scene, this.camera); else this.composer.render(); }
}