// src/services/renderer/seusShaders.ts
// SEUS PTGI (Path Traced Global Illumination) Shader Architecture for ArchOS UAE World Model

export const SEUS_PTGI_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const SEUS_PTGI_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;
uniform float uFov;
uniform float uTime;
uniform int uFrameIndex;
uniform int uMaxBounces;
uniform int uSamplesPerPixel;
uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uSkyTurbidity;
uniform float uRoughness;
uniform float uMetallic;
uniform int uMaterialType; // 0: Sandstone, 1: Titanium, 2: Sovereign Glass, 3: Gold Leaf, 4: Emirates Marble, 5: Solar PV
uniform bool uEnableCaustics;
uniform bool uEnableVolumetrics;
uniform bool uEnableDenoise;
uniform sampler2D uAccumTexture;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define EPSILON 0.001
#define MAX_DIST 500.0

// PRNG - Hash function
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash2(vec2 p) {
  float n = sin(dot(p, vec2(1.0, 113.0)));
  return fract(vec2(262144.0, 32768.0) * n);
}

vec3 hash3(vec2 p) {
  vec3 q = vec3(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3)),
    dot(p, vec2(419.2, 371.9))
  );
  return fract(sin(q) * 43758.5453);
}

// Ray structure
struct Ray {
  vec3 origin;
  vec3 dir;
};

// Surface Hit structure
struct HitInfo {
  bool hit;
  float dist;
  vec3 point;
  vec3 normal;
  vec3 albedo;
  float roughness;
  float metallic;
  float transmission;
  float ior;
  vec3 emission;
  int matId;
};

// Cosine-weighted hemisphere sampling for diffuse path bounce
vec3 sampleCosineHemisphere(vec3 normal, vec2 u) {
  float phi = TWO_PI * u.x;
  float cosTheta = sqrt(u.y);
  float sinTheta = sqrt(1.0 - u.y);

  vec3 local = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);

  vec3 up = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, normal));
  vec3 bitangent = cross(normal, tangent);

  return normalize(tangent * local.x + bitangent * local.y + normal * local.z);
}

// GGX Microfacet Specular Sampling (Cook-Torrance)
vec3 sampleGGX(vec3 normal, vec3 V, float roughness, vec2 u) {
  float a = roughness * roughness;
  float a2 = a * a;
  
  float phi = TWO_PI * u.x;
  float cosTheta = sqrt((1.0 - u.y) / (1.0 + (a2 - 1.0) * u.y));
  float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));

  vec3 H_local = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);

  vec3 up = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, normal));
  vec3 bitangent = cross(normal, tangent);

  vec3 H = normalize(tangent * H_local.x + bitangent * H_local.y + normal * H_local.z);
  return reflect(-V, H);
}

// Atmospheric Sky Model (Preetham / Hosek-Wilkie approximation for UAE desert skies)
vec3 getSkyColor(vec3 dir, vec3 sunDir) {
  float cosTheta = clamp(dir.y, 0.0, 1.0);
  float cosSun = dot(dir, sunDir);

  // UAE Golden Hour / Desert Atmosphere Gradients
  vec3 zenith = vec3(0.12, 0.35, 0.65) * (1.0 + uSkyTurbidity * 0.2);
  vec3 horizon = vec3(0.85, 0.55, 0.32) + vec3(0.15, 0.1, 0.05) * uSkyTurbidity;
  vec3 ground = vec3(0.18, 0.14, 0.11);

  vec3 sky = mix(ground, horizon, smoothstep(-0.1, 0.15, dir.y));
  sky = mix(sky, zenith, pow(cosTheta, 0.6));

  // Sun Disk & Forward Mie Dust Haze
  float sunDisc = smoothstep(0.9985, 0.9998, cosSun) * 45.0 * uSunIntensity;
  float sunGlow = pow(max(0.0, cosSun), 8.0) * 1.8 * uSunIntensity;
  float desertHaze = pow(max(0.0, cosSun), 2.0) * 0.4 * uSkyTurbidity;

  vec3 sunLight = uSunColor * (sunDisc + sunGlow + desertHaze);
  return sky + sunLight;
}

// Distance estimators for Architectural Primitives
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCylinder(vec3 p, float h, float r) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// Architectural Scene SDF (Massing Models, Sovereign Towers, Podium, Reflective Water Basin)
float mapScene(vec3 p, out int matId) {
  matId = 0; // default sandstone/podium
  float minDist = 1e6;

  // 1. Terrain / Floor Plaza
  float dFloor = p.y;
  if (dFloor < minDist) {
    minDist = dFloor;
    matId = 4; // Emirates Marble Plaza
  }

  // 2. Sovereign Main Tower (Curved Aerodynamic Monolith)
  vec3 pTower = p - vec3(0.0, 75.0, 0.0);
  float dTower = sdBox(pTower, vec3(14.0, 75.0, 14.0)) - 1.2;
  // Twist & taper
  float taper = 1.0 - (p.y / 150.0) * 0.35;
  dTower = sdBox(vec3(p.x * taper, p.y - 75.0, p.z * taper), vec3(12.0, 75.0, 12.0)) - 1.5;
  if (dTower < minDist) {
    minDist = dTower;
    matId = uMaterialType; // Active chosen material
  }

  // 3. Spire / Crown Apex
  vec3 pSpire = p - vec3(0.0, 160.0, 0.0);
  float dSpire = sdCylinder(pSpire, 12.0, 1.2);
  if (dSpire < minDist) {
    minDist = dSpire;
    matId = 3; // Sovereign Gold Spire
  }

  // 4. Secondary Innovation Pods
  vec3 pPod1 = p - vec3(35.0, 30.0, 15.0);
  float dPod1 = sdBox(pPod1, vec3(10.0, 30.0, 10.0)) - 0.8;
  if (dPod1 < minDist) {
    minDist = dPod1;
    matId = 1; // Titanium Shell
  }

  vec3 pPod2 = p - vec3(-35.0, 22.0, -10.0);
  float dPod2 = sdBox(pPod2, vec3(12.0, 22.0, 8.0)) - 0.8;
  if (dPod2 < minDist) {
    minDist = dPod2;
    matId = 5; // Solar PV / High-Tech Glass
  }

  // 5. Reflective Water Basin / Cooling Oasis
  vec3 pPool = p - vec3(0.0, 0.2, 38.0);
  float dPool = sdBox(pPool, vec3(32.0, 0.2, 18.0));
  if (dPool < minDist) {
    minDist = dPool;
    matId = 2; // Water / Dielectric Glass
  }

  return minDist;
}

// Compute surface normal via central tetrahedral differences
vec3 computeNormal(vec3 p) {
  int dummy;
  float eps = 0.002;
  vec2 h = vec2(eps, -eps);
  return normalize(
    h.xyy * mapScene(p + h.xyy, dummy) +
    h.yyx * mapScene(p + h.yyx, dummy) +
    h.yxy * mapScene(p + h.yxy, dummy) +
    h.xxx * mapScene(p + h.xxx, dummy)
  );
}

// Raymarching Intersection Engine
HitInfo traceRay(Ray ray) {
  HitInfo hit;
  hit.hit = false;
  hit.dist = MAX_DIST;

  float t = 0.05;
  int matId = 0;

  for (int i = 0; i < 180; i++) {
    vec3 p = ray.origin + ray.dir * t;
    int curMat = 0;
    float d = mapScene(p, curMat);

    if (d < 0.002 * t) {
      hit.hit = true;
      hit.dist = t;
      hit.point = p;
      hit.normal = computeNormal(p);
      hit.matId = curMat;
      break;
    }

    t += d;
    if (t > MAX_DIST) break;
  }

  if (!hit.hit) {
    return hit;
  }

  // Material property assignment
  if (hit.matId == 0) {
    // Desert Sandstone
    hit.albedo = vec3(0.82, 0.68, 0.52);
    hit.roughness = max(0.4, uRoughness);
    hit.metallic = 0.0;
    hit.transmission = 0.0;
    hit.ior = 1.5;
    hit.emission = vec3(0.0);
  } else if (hit.matId == 1) {
    // Brushed Titanium
    hit.albedo = vec3(0.72, 0.74, 0.77);
    hit.roughness = max(0.12, uRoughness);
    hit.metallic = 0.95;
    hit.transmission = 0.0;
    hit.ior = 2.4;
    hit.emission = vec3(0.0);
  } else if (hit.matId == 2) {
    // Sovereign Glass / Water
    hit.albedo = vec3(0.92, 0.96, 0.99);
    hit.roughness = max(0.02, uRoughness);
    hit.metallic = 0.05;
    hit.transmission = 0.92;
    hit.ior = 1.48;
    hit.emission = vec3(0.0);
  } else if (hit.matId == 3) {
    // Sovereign Gold Leaf
    hit.albedo = vec3(1.00, 0.78, 0.28);
    hit.roughness = max(0.15, uRoughness);
    hit.metallic = 0.98;
    hit.transmission = 0.0;
    hit.ior = 1.35;
    hit.emission = vec3(0.0);
  } else if (hit.matId == 4) {
    // Emirates Marble (subtle procedural veining)
    float vein = sin(hit.point.x * 0.4 + hit.point.z * 0.3) * 0.15;
    hit.albedo = vec3(0.90 + vein, 0.89 + vein, 0.86);
    hit.roughness = 0.25;
    hit.metallic = 0.02;
    hit.transmission = 0.0;
    hit.ior = 1.52;
    hit.emission = vec3(0.0);
  } else if (hit.matId == 5) {
    // Solar PV Photovoltaic Glass
    hit.albedo = vec3(0.05, 0.08, 0.18);
    hit.roughness = 0.08;
    hit.metallic = 0.7;
    hit.transmission = 0.0;
    hit.ior = 1.8;
    hit.emission = vec3(0.0, 0.08, 0.12);
  }

  return hit;
}

// Fresnel Schlick
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// SEUS PTGI Multi-Bounce Path Tracing Kernel
vec3 pathTrace(Ray r, inout vec2 seed) {
  vec3 radiance = vec3(0.0);
  vec3 throughput = vec3(1.0);

  Ray curRay = r;

  for (int bounce = 0; bounce < 8; bounce++) {
    if (bounce >= uMaxBounces) break;

    HitInfo hit = traceRay(curRay);

    if (!hit.hit) {
      // Hit Sky Dome
      vec3 sky = getSkyColor(curRay.dir, uSunDirection);
      radiance += throughput * sky;
      break;
    }

    // Direct Lighting / Sun Shadow Ray (Next Event Estimation)
    vec3 N = hit.normal;
    vec3 V = -curRay.dir;
    float NdotL = max(dot(N, uSunDirection), 0.0);

    if (NdotL > 0.0) {
      Ray shadowRay;
      shadowRay.origin = hit.point + N * 0.01;
      shadowRay.dir = uSunDirection;
      HitInfo shadowHit = traceRay(shadowRay);

      if (!shadowHit.hit || shadowHit.dist > 250.0) {
        vec3 F0 = mix(vec3(0.04), hit.albedo, hit.metallic);
        vec3 F = fresnelSchlick(max(dot(N, V), 0.0), F0);
        vec3 kD = (1.0 - F) * (1.0 - hit.metallic);

        vec3 direct = (kD * hit.albedo / PI + (hit.metallic * F * 0.5)) * uSunColor * uSunIntensity * NdotL;
        radiance += throughput * direct;
      }
    }

    // Add Self-Emission
    radiance += throughput * hit.emission;

    // Russian Roulette path termination for bounces > 2
    if (bounce > 2) {
      float p = max(throughput.r, max(throughput.g, throughput.b));
      if (hash(seed += vec2(0.13, 0.17)) > p) {
        break;
      }
      throughput /= p;
    }

    // Specular vs Diffuse Monte Carlo Selection
    vec2 randSample = hash2(seed += vec2(0.31, 0.47));
    vec3 F0 = mix(vec3(0.04), hit.albedo, hit.metallic);
    float specProb = mix(0.15, 0.95, hit.metallic);

    vec3 nextDir;
    if (randSample.x < specProb) {
      // Specular Reflection (Cook-Torrance Microfacet)
      nextDir = sampleGGX(N, V, hit.roughness, randSample);
      if (dot(nextDir, N) <= 0.0) nextDir = reflect(curRay.dir, N);
      throughput *= hit.albedo;
    } else {
      // Diffuse Cosine Hemisphere Bounce (Global Illumination)
      nextDir = sampleCosineHemisphere(N, randSample);
      throughput *= hit.albedo;
    }

    curRay.origin = hit.point + N * 0.005;
    curRay.dir = normalize(nextDir);
  }

  return radiance;
}

// Tone Mapping & ACES sovereign film curve
vec3 acesFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 seed = uv * uTime + vec2(float(uFrameIndex) * 0.05, float(uFrameIndex) * 0.13);

  // Sub-pixel jitter for Anti-Aliasing (TAA)
  vec2 jitter = (hash2(seed) - 0.5) / uResolution;
  vec2 ndc = ((gl_FragCoord.xy / uResolution) + jitter) * 2.0 - 1.0;
  ndc.x *= uResolution.x / uResolution.y;

  // Construct Primary Camera Ray
  vec3 forward = normalize(uCameraTarget - uCameraPos);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);

  float tanFov = tan(radians(uFov * 0.5));
  vec3 rayDir = normalize(forward + right * ndc.x * tanFov + up * ndc.y * tanFov);

  Ray primaryRay;
  primaryRay.origin = uCameraPos;
  primaryRay.dir = rayDir;

  // Compute Path Traced Sample
  vec3 sampleColor = pathTrace(primaryRay, seed);

  // Temporal Accumulation Blend
  if (uFrameIndex > 0) {
    vec4 prevData = texture2D(uAccumTexture, uv);
    float weight = 1.0 / float(uFrameIndex + 1);
    vec3 accumulated = mix(prevData.rgb, sampleColor, weight);

    // Apply ACES Tone Mapping on output
    vec3 finalColor = acesFilm(accumulated);
    gl_FragColor = vec4(accumulated, 1.0);
  } else {
    gl_FragColor = vec4(sampleColor, 1.0);
  }
}
`;

export const SEUS_DENOISER_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform bool uEnabled;

// Edge-Preserving Wavelet / Bilateral Denoising Filter (Simulating OptiX/OIDN pass)
void main() {
  if (!uEnabled) {
    gl_FragColor = texture2D(uTexture, vUv);
    return;
  }

  vec2 texel = 1.0 / uResolution;
  vec4 center = texture2D(uTexture, vUv);

  vec4 sum = center * 0.25;
  float totalWeight = 0.25;

  // 5x5 Cross-Bilateral Kernel
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      if (x == 0 && y == 0) continue;
      vec2 offset = vec2(float(x), float(y)) * texel * 1.5;
      vec4 sampleCol = texture2D(uTexture, vUv + offset);

      // Color distance edge weight
      float d = length(sampleCol.rgb - center.rgb);
      float spatialWeight = exp(-float(x * x + y * y) / 8.0);
      float colorWeight = exp(-d * d * 16.0);

      float weight = spatialWeight * colorWeight;
      sum += sampleCol * weight;
      totalWeight += weight;
    }
  }

  vec3 denoised = (sum / totalWeight).rgb;

  // ACES Tone Map final output
  float a = 2.51; float b = 0.03; float c = 2.43; float d = 0.59; float e = 0.14;
  vec3 finalColor = clamp((denoised * (a * denoised + b)) / (denoised * (c * denoised + d) + e), 0.0, 1.0);

  // Gamma correction
  finalColor = pow(finalColor, vec3(1.0 / 2.2));

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
