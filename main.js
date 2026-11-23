import * as THREE from 'three';
import { RealisticEngine } from './engine/renderer.js';
import { GeganterCharacter } from './characters/geganterBuilder.js';
import { GiantFigure, GIANT_CATALOG } from './characters/giantBuilder.js';
import { CatalanTownWorld } from './world/townBuilder.js';
import { GiantPhysicsEngine } from './physics/giantPhysics.js';
import { CercavilaAudio } from './audio/cercavilaAudio.js';

class GegantersApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.engine = new RealisticEngine(this.canvas);
    this.shaderUniforms = { uTime: { value: 0 }, uWind: { value: 0.35 }, uMoveSpeed: { value: 0 }, uSpinSpeed: { value: 0 } };
    this.world = new CatalanTownWorld(this.engine.scene, this.shaderUniforms);
    this.giant = new GiantFigure(this.shaderUniforms);
    this.geganter = new GeganterCharacter();
    this.physics = new GiantPhysicsEngine();
    this.audio = new CercavilaAudio();
    this.engine.scene.add(this.giant.root);
    this.engine.scene.add(this.geganter.root);
    this.mode = 'studio'; this.phase = 'approach'; this.phaseProgress = 0; this.cameraMode = 'gta';
    this.studioOrbitAngle = 0.45; this.studioOrbitPitch = 0.22; this.studioSkirtView = false; this.startTime = 0;
    this.input = { moveX: 0, moveY: 0, actionHeld: false }; this.keys = {};
    this.bindUI(); this.bindControls(); this.positionStudioActors();
    this.lastFrame = performance.now(); this.loop(this.lastFrame);
  }
  positionStudioActors() {
    this.giant.root.position.set(-0.75, 0, 2.0); this.giant.root.rotation.set(0, 0.25, 0); this.giant.tiltGroup.rotation.set(0, 0, 0);
    this.geganter.root.position.set(0.75, 0, 2.35); this.geganter.root.rotation.set(0, -0.15, 0);
  }
  bindUI() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });
    document.querySelectorAll('#town-selector .choice-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#town-selector .choice-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active'); this.world.buildTown(card.dataset.town);
      });
    });
    document.querySelectorAll('#giant-selector .choice-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#giant-selector .choice-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active'); const gKey = card.dataset.giant; this.giant.build(gKey);
        const town = GIANT_CATALOG[gKey].town;
        document.querySelectorAll('#town-selector .choice-card').forEach((c) => c.classList.toggle('active', c.dataset.town === town));
        this.world.buildTown(town);
      });
    });
    document.querySelectorAll('#quality-selector .pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#quality-selector .pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active'); this.engine.setQuality(pill.dataset.quality);
      });
    });
    const bindGroup = (selector, prop) => {
      document.querySelectorAll(`${selector} .pill, ${selector} .swatch`).forEach((el) => {
        el.addEventListener('click', () => {
          document.querySelectorAll(`${selector} .pill, ${selector} .swatch`).forEach((x) => x.classList.remove('active'));
          el.classList.add('active'); this.geganter.updateConfig({ [prop]: el.dataset.val });
        });
      });
    };
    bindGroup('#gender-selector', 'gender'); bindGroup('#build-selector', 'build'); bindGroup('#skin-selector', 'skin');
    bindGroup('#hair-selector', 'hair'); bindGroup('#haircolor-selector', 'hairColor'); bindGroup('#beard-selector', 'beard');
    bindGroup('#shirt-selector', 'shirt'); bindGroup('#faixa-selector', 'faixa'); bindGroup('#scarf-selector', 'scarf'); bindGroup('#pants-selector', 'pants');
    document.getElementById('btn-randomize').addEventListener('click', () => {
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      this.geganter.updateConfig({
        gender: pick(['male', 'female']), build: pick(['agile', 'athletic', 'strong', 'robust']),
        skin: pick(['#f5cbb0', '#eab696', '#d69a74', '#b87852']), hair: pick(['short', 'curly', 'bun', 'long']),
        hairColor: pick(['#1e1815', '#4a3020', '#7c5233', '#c79b52', '#8d949c']), beard: pick(['none', 'stubble', 'full', 'mustache']),
        shirt: pick(['#f7f5f0', '#1d4ed8', '#991b1b', '#15803d']), faixa: pick(['#b91c1c', '#111827', '#1e3a8a', '#6b21a8']),
        scarf: pick(['red-dots', 'blue-dots', 'senyera'])
      });
    });
    document.getElementById('btn-toggle-skirt-preview').addEventListener('click', (e) => {
      this.studioSkirtView = !this.studioSkirtView;
      e.target.textContent = this.studioSkirtView ? '👁️ Vista General' : '👁️ Mirar sota faldilles';
    });
    document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
    document.getElementById('btn-replay').addEventListener('click', () => this.startGame());
    document.getElementById('btn-back-studio').addEventListener('click', () => this.returnToStudio());
    document.getElementById('btn-return-studio').addEventListener('click', () => this.returnToStudio());
    document.getElementById('btn-camera-mode').addEventListener('click', (e) => {
      const order = ['gta', 'panoramic', 'skirt'];
      const labels = { gta: '🎥 Càmera: GTA Darrere', panoramic: '🎥 Càmera: Panoràmica', skirt: '🎥 Càmera: Sota Faldilles' };
      this.cameraMode = order[(order.indexOf(this.cameraMode) + 1) % order.length];
      e.target.textContent = labels[this.cameraMode];
    });
    document.getElementById('btn-audio-toggle').addEventListener('click', (e) => {
      const on = this.audio.toggle(); e.target.textContent = on ? '🔊 Gralles: ON' : '🔇 Gralles: OFF';
    });
  }
  bindControls() {
    let dragging = false, lastX = 0, lastY = 0;
    this.canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('pointermove', (e) => {
      if (!dragging || this.mode !== 'studio') return;
      this.studioOrbitAngle -= (e.clientX - lastX) * 0.008;
      this.studioOrbitPitch = Math.max(0.05, Math.min(0.65, this.studioOrbitPitch + (e.clientY - lastY) * 0.005));
      lastX = e.clientX; lastY = e.clientY;
    });
    window.addEventListener('pointerup', () => (dragging = false));
    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; if (e.code === 'Space') this.input.actionHeld = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; if (e.code === 'Space') this.input.actionHeld = false; });
    const actionBtn = document.getElementById('btn-main-action');
    actionBtn.addEventListener('pointerdown', () => (this.input.actionHeld = true));
    window.addEventListener('pointerup', () => (this.input.actionHeld = false));
    const joyBase = document.getElementById('joystick-base'), joyStick = document.getElementById('joystick-stick');
    let joyActive = false;
    const updateJoystick = (clientX, clientY) => {
      const rect = joyBase.getBoundingClientRect(), cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2, maxR = rect.width * 0.36;
      let dx = clientX - cx, dy = clientY - cy; const dist = Math.hypot(dx, dy);
      if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
      joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.moveX = dx / maxR; this.input.moveY = -dy / maxR;
    };
    joyBase.addEventListener('pointerdown', (e) => { joyActive = true; joyBase.setPointerCapture(e.pointerId); updateJoystick(e.clientX, e.clientY); });
    joyBase.addEventListener('pointermove', (e) => { if (joyActive) updateJoystick(e.clientX, e.clientY); });
    const resetJoy = () => { joyActive = false; joyStick.style.transform = 'translate(0px, 0px)'; this.input.moveX = 0; this.input.moveY = 0; };
    joyBase.addEventListener('pointerup', resetJoy); joyBase.addEventListener('pointercancel', resetJoy);
  }
  startGame() {
    document.getElementById('studio-overlay').classList.add('hidden');
    document.getElementById('finish-modal').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    this.mode = 'playing'; this.phase = 'approach'; this.phaseProgress = 0; this.cameraMode = 'gta';
    document.getElementById('btn-camera-mode').textContent = '🎥 Càmera: GTA Darrere';
    this.physics.reset();
    this.giant.root.position.set(0, 0, 2.0); this.giant.root.rotation.set(0, 0, 0);
    this.geganter.root.position.set(0, 0, 6.2); this.geganter.root.rotation.set(0, 0, 0);
    this.startTime = performance.now(); this.audio.start(); this.updateHUDText();
  }
  returnToStudio() {
    this.audio.stop(); this.mode = 'studio';
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('finish-modal').classList.add('hidden');
    document.getElementById('studio-overlay').classList.remove('hidden');
    this.positionStudioActors();
  }
  updateHUDText() {
    const gName = this.giant.spec.name;
    const phaseEl = document.getElementById('hud-phase'), objEl = document.getElementById('hud-objective');
    const iconEl = document.getElementById('action-icon'), labelEl = document.getElementById('action-label'), hintEl = document.getElementById('action-hint');
    if (this.phase === 'approach') { phaseEl.textContent = 'FASE 1 · ENTRADA SOTA EL GEGANT'; objEl.textContent = `Camina cap endavant i fica't sota les faldilles d'${gName}`; iconEl.textContent = '🏃'; labelEl.textContent = 'ENTRAR SOTA FALDILLES'; hintEl.textContent = 'Mou el joystick cap amunt'; }
    else if (this.phase === 'faixa') { phaseEl.textContent = 'FASE 2 · TENSAR LA FAIXA'; objEl.textContent = 'Enfaixa bé la zona lumbar abans de carregar el pes'; iconEl.textContent = '🧣'; labelEl.textContent = 'ENFAIXAR-SE'; hintEl.textContent = 'Mantén premut o prem ESPAI'; }
    else if (this.phase === 'lift') { phaseEl.textContent = 'FASE 3 · ALÇADA DEL GEGANT'; objEl.textContent = `Carrega ${gName} (${this.giant.spec.weight} kg) a les espatlles!`; iconEl.textContent = '💪'; labelEl.textContent = 'ALÇAR EL GEGANT'; hintEl.textContent = 'Mantén premut fins dalt'; }
    else if (this.phase === 'cercavila') { phaseEl.textContent = 'FASE 4 · LA CERCAVILA'; objEl.textContent = 'Avança pel carrer fins al cercle daurat de la plaça'; iconEl.textContent = '🥁'; labelEl.textContent = 'SALUDAR / MARXAR'; hintEl.textContent = 'Compensa el balanceig amb el joystick'; }
    else if (this.phase === 'dance') { phaseEl.textContent = 'FASE 5 · BALL DE PLAÇA'; objEl.textContent = `Fes girar ${gName} davant del públic!`; iconEl.textContent = '💃'; labelEl.textContent = 'FER VOLTA DE BALL'; hintEl.textContent = 'Mantén premut per girar'; }
    else if (this.phase === 'plantada') { phaseEl.textContent = 'FASE 6 · PLANTADA FINAL'; objEl.textContent = `Baixa suaument ${gName} per plantar-lo a la plaça`; iconEl.textContent = '🏁'; labelEl.textContent = 'PLANTAR EL GEGANT'; hintEl.textContent = 'Mantén premut per completar'; }
  }
  readCombinedInput() {
    let mx = this.input.moveX, my = this.input.moveY;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx = -1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx = 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) my = 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my = -1;
    return { moveX: mx, moveY: my };
  }
  updateGameplay(dt, time) {
    const { moveX, moveY } = this.readCombinedInput();
    const carrying = ['lift', 'cercavila', 'dance', 'plantada'].includes(this.phase);
    const phys = this.physics.update(dt, { moveX, moveY, spinAction: this.phase === 'dance' && this.input.actionHeld, carrying, build: this.geganter.state.build }, this.giant.spec);
    this.geganter.root.position.set(this.physics.position.x, 0, this.physics.position.z);
    this.geganter.root.rotation.y = this.physics.yaw;
    this.geganter.animate(time, phys.speed, carrying);
    if (carrying) {
      this.giant.root.position.set(this.physics.giantPos.x, 0, this.physics.giantPos.z);
      this.giant.root.rotation.y = this.physics.yaw;
      this.giant.tiltGroup.rotation.z = -this.physics.tiltX;
      this.giant.tiltGroup.rotation.x = this.physics.tiltZ;
    }
    if (this.phase === 'approach') {
      const dist = Math.hypot(this.physics.position.x - this.physics.giantPos.x, this.physics.position.z - this.physics.giantPos.z);
      document.getElementById('hud-progress').style.width = `${Math.max(0, Math.min(100, ((4.5 - dist) / 3.8) * 100))}%`;
      if (dist < 0.85 || this.input.actionHeld) {
        this.physics.position.x = this.physics.giantPos.x; this.physics.position.z = this.physics.giantPos.z;
        this.phase = 'faixa'; this.phaseProgress = 0; this.updateHUDText();
      }
    } else if (this.phase === 'faixa') {
      if (this.input.actionHeld) { this.phaseProgress += 65 * dt; this.geganter.root.rotation.y += 6 * dt; }
      document.getElementById('hud-progress').style.width = `${Math.min(100, this.phaseProgress)}%`;
      if (this.phaseProgress >= 100) { this.geganter.root.rotation.y = 0; this.phase = 'lift'; this.phaseProgress = 0; this.updateHUDText(); }
    } else if (this.phase === 'lift') {
      if (this.input.actionHeld) this.phaseProgress += 55 * dt;
      this.giant.root.position.y = (Math.min(100, this.phaseProgress) / 100) * 0.28;
      document.getElementById('hud-progress').style.width = `${Math.min(100, this.phaseProgress)}%`;
      if (this.phaseProgress >= 100) { this.phase = 'cercavila'; this.updateHUDText(); }
    } else if (this.phase === 'cercavila') {
      this.giant.root.position.y = 0.28 + Math.abs(Math.sin(time * 8.5)) * 0.03 * Math.min(phys.speed, 1);
      const distToPlaza = Math.max(0, this.physics.giantPos.z - -46);
      document.getElementById('hud-progress').style.width = `${Math.max(0, Math.min(100, ((48 - distToPlaza) / 48) * 100))}%`;
      if (this.physics.giantPos.z <= -45) { this.phase = 'dance'; this.phaseProgress = 0; this.updateHUDText(); }
    } else if (this.phase === 'dance') {
      if (this.input.actionHeld) this.phaseProgress += 38 * dt;
      document.getElementById('hud-progress').style.width = `${Math.min(100, this.phaseProgress)}%`;
      if (this.phaseProgress >= 100) { this.phase = 'plantada'; this.phaseProgress = 0; this.updateHUDText(); }
    } else if (this.phase === 'plantada') {
      if (this.input.actionHeld) { this.phaseProgress += 55 * dt; this.giant.root.position.y = Math.max(0, 0.28 * (1 - this.phaseProgress / 100)); }
      document.getElementById('hud-progress').style.width = `${Math.min(100, this.phaseProgress)}%`;
      if (this.phaseProgress >= 100) this.finishPerformance();
    }
    document.getElementById('hud-tilt-deg').textContent = `${phys.tiltDeg.toFixed(1)}°`;
    document.getElementById('hud-wind').textContent = phys.windLabel;
    const needlePct = 50 + (this.physics.tiltX / this.physics.maxSafeTilt) * 48;
    document.getElementById('balance-needle').style.left = `${Math.max(4, Math.min(96, needlePct))}%`;
    this.shaderUniforms.uMoveSpeed.value = phys.speed;
    this.shaderUniforms.uSpinSpeed.value = this.phase === 'dance' && this.input.actionHeld ? 2.6 : 0;
    this.updateGameCamera(dt); this.world.update(time, this.giant.root.position, true);
  }
  updateGameCamera(dt) {
    const target = this.giant.root.position, desiredPos = new THREE.Vector3(), lookTarget = new THREE.Vector3();
    if (this.cameraMode === 'gta') { desiredPos.set(target.x * 0.7, 3.1, target.z + 6.4); lookTarget.set(target.x, 2.35, target.z - 6.0); }
    else if (this.cameraMode === 'panoramic') { desiredPos.set(target.x + 5.8, 4.8, target.z + 7.5); lookTarget.set(0, 2.1, target.z - 4.0); }
    else { desiredPos.set(target.x + 0.22, 1.18, target.z + 0.52); lookTarget.set(target.x, 1.48, target.z - 0.15); }
    this.engine.camera.position.lerp(desiredPos, 1 - Math.exp(-6 * dt)); this.engine.camera.lookAt(lookTarget);
  }
  finishPerformance() {
    this.mode = 'finished'; this.audio.stop();
    const elapsedSec = Math.floor((performance.now() - this.startTime) / 1000);
    document.getElementById('stat-time').textContent = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`;
    document.getElementById('stat-stability').textContent = `${Math.round(this.physics.stabilityScore)}%`;
    document.getElementById('finish-desc').textContent = `Has completat la cercavila i plantat ${this.giant.spec.name} davant de tota la plaça!`;
    document.getElementById('finish-modal').classList.remove('hidden');
  }
  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000); this.lastFrame = now; const time = now * 0.001;
    this.shaderUniforms.uTime.value = time;
    if (this.mode === 'studio') {
      this.geganter.animate(time, 0, false); this.world.update(time, this.giant.root.position, false);
      if (this.studioSkirtView) { this.engine.camera.position.lerp(new THREE.Vector3(-0.55, 1.05, 2.65), 0.08); this.engine.camera.lookAt(-0.75, 1.45, 2.0); }
      else {
        const radius = 5.4, cx = Math.sin(this.studioOrbitAngle) * radius, cz = 2.1 + Math.cos(this.studioOrbitAngle) * radius, cy = 1.6 + this.studioOrbitPitch * 4.2;
        this.engine.camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.12); this.engine.camera.lookAt(-0.1, 1.85, 2.1);
      }
    } else if (this.mode === 'playing') this.updateGameplay(dt, time);
    this.engine.render();
  }
}
window.addEventListener('DOMContentLoaded', () => new GegantersApp());