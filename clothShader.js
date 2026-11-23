export function applyClothWindShader(material, uniforms, options = {}) {
  const stiffness = options.stiffness ?? 1.0;
  const maxY = options.maxY ?? 2.35;
  const minY = options.minY ?? 0.25;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWind = uniforms.uWind;
    shader.uniforms.uMoveSpeed = uniforms.uMoveSpeed;
    shader.uniforms.uSpinSpeed = uniforms.uSpinSpeed;
    shader.uniforms.uStiffness = { value: stiffness };
    shader.uniforms.uMaxY = { value: maxY };
    shader.uniforms.uMinY = { value: minY };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
uniform float uTime;
uniform float uWind;
uniform float uMoveSpeed;
uniform float uSpinSpeed;
uniform float uStiffness;
uniform float uMaxY;
uniform float uMinY;`);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
float hFactor = clamp((uMaxY - position.y) / (uMaxY - uMinY), 0.0, 1.0);
float flex = pow(hFactor, 1.65) / max(uStiffness, 0.2);
float stepRipple = sin(position.x * 5.5 + uTime * 7.5) * cos(position.z * 5.5 + uTime * 6.0);
float windWave = sin(uTime * 2.6 + position.x * 3.0 + position.y * 2.2) * (0.045 + uWind * 0.06);
float inertiaLag = -uMoveSpeed * 0.14 * flex;
float radialFlare = abs(uSpinSpeed) * 0.22 * flex;
vec2 radialDir = normalize(vec2(position.x, position.z) + vec2(0.0001));
transformed.x += (windWave + stepRipple * 0.025 * (0.3 + abs(uMoveSpeed))) * flex + radialDir.x * radialFlare;
transformed.z += (inertiaLag + stepRipple * 0.025 * (0.3 + abs(uMoveSpeed))) * flex + radialDir.y * radialFlare;
transformed.y += radialFlare * 0.18;`);
  };
  material.customProgramCacheKey = () => `cloth-wind-${stiffness}-${maxY}`;
}