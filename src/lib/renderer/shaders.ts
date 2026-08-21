// src/lib/renderer/shaders.ts
// 8K SEUS-inspired Path Tracing Compute Shader with Linear BVH Acceleration Structure (WGSL) & WebGL2 Fallback

export const PATH_TRACER_COMPUTE = `
struct Camera {
  pos: vec3f,
  fov: f32,
  target: vec3f,
  aspect: f32,
};

struct SceneUniforms {
  nodeCount: u32,
  triCount: u32,
  maxBounces: u32,
  sampleIndex: u32,
  sunDir: vec3f,
  sunIntensity: f32,
  skyZenithColor: vec3f,
  pad0: f32,
  skyHorizonColor: vec3f,
  pad1: f32,
};

struct BVHNode {
  min_and_left: vec4f,  // min.xyz, leftChildOrFirstTri (w)
  max_and_count: vec4f, // max.xyz, triCount (w: 0 if internal, >0 if leaf)
};

struct Triangle {
  v0_and_mat: vec4f,      // v0.xyz, materialId (w)
  v1_and_mesh: vec4f,     // v1.xyz, meshId (w)
  v2_and_pad: vec4f,      // v2.xyz, pad (w)
  normal_and_area: vec4f, // normal.xyz, area (w)
};

struct Ray {
  origin: vec3f,
  dir: vec3f,
};

struct Hit {
  t: f32,
  normal: vec3f,
  materialId: u32,
};

@group(0) @binding(0) var<uniform> cam: Camera;
@group(0) @binding(1) var<uniform> sceneInfo: SceneUniforms;
@group(0) @binding(2) var<storage, read_write> output: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> history: array<vec4f>;
@group(0) @binding(4) var<storage, read> bvh_nodes: array<BVHNode>;
@group(0) @binding(5) var<storage, read> triangles: array<Triangle>;
@group(0) @binding(6) var<storage, read> materials: array<vec4f>;     // albedo.xyz, roughness (w)
@group(0) @binding(7) var<storage, read> mat_properties: array<vec4f>;// metallic (x), emissive.yzw

fn hash(u: u32) -> u32 {
  var x = u;
  x = x ^ (x >> 16u);
  x = x * 0x7feb352du;
  x = x ^ (x >> 15u);
  x = x * 0x846ca68bu;
  x = x ^ (x >> 16u);
  return x;
}

fn rand(seed: ptr<function, u32>) -> f32 {
  *seed = hash(*seed);
  return f32(*seed & 0x00ffffffu) / f32(0x01000000u);
}

fn generate_ray(coord: vec2u, dims: vec2u, seed: ptr<function, u32>) -> Ray {
  let jitter = vec2f(rand(seed) - 0.5, rand(seed) - 0.5);
  let uv = (vec2f(coord) + jitter) / vec2f(dims);
  let ndc = uv * 2.0 - 1.0;
  let aspect = cam.aspect;
  let fov_scale = tan(cam.fov * 0.5 * 3.14159265 / 180.0);
  
  let forward = normalize(cam.target - cam.pos);
  let right = normalize(cross(forward, vec3f(0.0, 1.0, 0.0)));
  let up = cross(right, forward);
  
  let dir = normalize(forward + right * (ndc.x * fov_scale * aspect) + up * (-ndc.y * fov_scale));
  return Ray(cam.pos, dir);
}

fn intersect_aabb(origin: vec3f, inv_dir: vec3f, box_min: vec3f, box_max: vec3f, t_max: f32) -> f32 {
  let t0 = (box_min - origin) * inv_dir;
  let t1 = (box_max - origin) * inv_dir;
  let t_near = max(max(min(t0.x, t1.x), min(t0.y, t1.y)), min(t0.z, t1.z));
  let t_far = min(min(max(t0.x, t1.x), max(t0.y, t1.y)), max(t0.z, t1.z));
  if (t_far >= max(0.001, t_near) && t_near < t_max) {
    return t_near;
  }
  return 1e30;
}

fn intersect_triangle(ray: Ray, tri: Triangle, closest_t: f32) -> Hit {
  let v0 = tri.v0_and_mat.xyz;
  let v1 = tri.v1_and_mesh.xyz;
  let v2 = tri.v2_and_pad.xyz;
  let mat_id = u32(tri.v0_and_mat.w + 0.5);

  let e1 = v1 - v0;
  let e2 = v2 - v0;
  let pvec = cross(ray.dir, e2);
  let det = dot(e1, pvec);

  if (abs(det) < 1e-7) {
    return Hit(1e30, vec3f(0.0), 0u);
  }

  let inv_det = 1.0 / det;
  let tvec = ray.origin - v0;
  let u = dot(tvec, pvec) * inv_det;
  if (u < 0.0 || u > 1.0) {
    return Hit(1e30, vec3f(0.0), 0u);
  }

  let qvec = cross(tvec, e1);
  let v = dot(ray.dir, qvec) * inv_det;
  if (v < 0.0 || u + v > 1.0) {
    return Hit(1e30, vec3f(0.0), 0u);
  }

  let t = dot(e2, qvec) * inv_det;
  if (t > 0.001 && t < closest_t) {
    var norm = tri.normal_and_area.xyz;
    if (dot(norm, ray.dir) > 0.0) {
      norm = -norm;
    }
    return Hit(t, norm, mat_id);
  }

  return Hit(1e30, vec3f(0.0), 0u);
}

fn traverse_bvh(ray: Ray) -> Hit {
  var closest_hit = Hit(1e30, vec3f(0.0, 1.0, 0.0), 0u);

  // 1. Procedural ground plane intersection (Sandstone plaza material)
  if (abs(ray.dir.y) > 1e-6) {
    let t_ground = (0.0 - ray.origin.y) / ray.dir.y;
    if (t_ground > 0.001 && t_ground < closest_hit.t && ray.dir.y < 0.0) {
      closest_hit = Hit(t_ground, vec3f(0.0, 1.0, 0.0), 3u);
    }
  }

  if (sceneInfo.nodeCount == 0u) {
    return closest_hit;
  }

  // Precomputed inverse ray direction with division-by-zero protection
  let inv_dir = vec3f(
    select(1.0 / ray.dir.x, select(-1e8, 1e8, ray.dir.x >= 0.0), abs(ray.dir.x) < 1e-7),
    select(1.0 / ray.dir.y, select(-1e8, 1e8, ray.dir.y >= 0.0), abs(ray.dir.y) < 1e-7),
    select(1.0 / ray.dir.z, select(-1e8, 1e8, ray.dir.z >= 0.0), abs(ray.dir.z) < 1e-7)
  );

  // Linear BVH Traversal Stack
  var stack: array<u32, 64>;
  var stack_ptr: u32 = 0u;
  stack[0] = 0u; // Push Root node
  stack_ptr = 1u;

  while (stack_ptr > 0u) {
    stack_ptr = stack_ptr - 1u;
    let node_idx = stack[stack_ptr];
    if (node_idx >= sceneInfo.nodeCount) {
      continue;
    }

    let node = bvh_nodes[node_idx];
    let box_min = node.min_and_left.xyz;
    let box_max = node.max_and_count.xyz;
    let left_or_first = u32(node.min_and_left.w + 0.5);
    let tri_count = u32(node.max_and_count.w + 0.5);

    let aabb_t = intersect_aabb(ray.origin, inv_dir, box_min, box_max, closest_hit.t);
    if (aabb_t > closest_hit.t) {
      continue;
    }

    if (tri_count > 0u) {
      // Leaf Node: test intersection with contained geometric triangles
      for (var i = 0u; i < tri_count; i = i + 1u) {
        let tri_idx = left_or_first + i;
        if (tri_idx < sceneInfo.triCount) {
          let tri = triangles[tri_idx];
          let hit = intersect_triangle(ray, tri, closest_hit.t);
          if (hit.t < closest_hit.t) {
            closest_hit = hit;
          }
        }
      }
    } else {
      // Interior Node: evaluate left and right child AABBs and push in optimal front-to-back order
      let left_idx = left_or_first;
      let right_idx = left_or_first + 1u;

      if (left_idx < sceneInfo.nodeCount && right_idx < sceneInfo.nodeCount) {
        let left_node = bvh_nodes[left_idx];
        let right_node = bvh_nodes[right_idx];

        let dist_left = intersect_aabb(ray.origin, inv_dir, left_node.min_and_left.xyz, left_node.max_and_count.xyz, closest_hit.t);
        let dist_right = intersect_aabb(ray.origin, inv_dir, right_node.min_and_left.xyz, right_node.max_and_count.xyz, closest_hit.t);

        // Push farther node first, nearer node second (so nearer child is popped and processed first)
        if (dist_left < dist_right) {
          if (dist_right < closest_hit.t && stack_ptr < 62u) {
            stack[stack_ptr] = right_idx;
            stack_ptr = stack_ptr + 1u;
          }
          if (dist_left < closest_hit.t && stack_ptr < 62u) {
            stack[stack_ptr] = left_idx;
            stack_ptr = stack_ptr + 1u;
          }
        } else {
          if (dist_left < closest_hit.t && stack_ptr < 62u) {
            stack[stack_ptr] = left_idx;
            stack_ptr = stack_ptr + 1u;
          }
          if (dist_right < closest_hit.t && stack_ptr < 62u) {
            stack[stack_ptr] = right_idx;
            stack_ptr = stack_ptr + 1u;
          }
        }
      } else if (stack_ptr < 62u) {
        if (right_idx < sceneInfo.nodeCount) {
          stack[stack_ptr] = right_idx;
          stack_ptr = stack_ptr + 1u;
        }
        if (left_idx < sceneInfo.nodeCount) {
          stack[stack_ptr] = left_idx;
          stack_ptr = stack_ptr + 1u;
        }
      }
    }
  }

  return closest_hit;
}

fn trace(initial_ray: Ray, seed: ptr<function, u32>) -> vec3f {
  var ray = initial_ray;
  var throughput = vec3f(1.0, 1.0, 1.0);
  var radiance = vec3f(0.0);
  let max_bounces = min(sceneInfo.maxBounces, 6u);

  for (var bounce = 0u; bounce < max_bounces; bounce = bounce + 1u) {
    let hit = traverse_bvh(ray);
    if (hit.t > 1e28) {
      // Atmospheric Arabian Sky gradient
      let unit_dir = normalize(ray.dir);
      let t_sky = 0.5 * (unit_dir.y + 1.0);
      let sky_color = mix(sceneInfo.skyHorizonColor, sceneInfo.skyZenithColor, t_sky);
      radiance += throughput * sky_color * 1.35;
      break;
    }

    let mat_idx = min(hit.materialId, 7u);
    let mat_albedo_rough = materials[mat_idx];
    let mat_met_emiss = mat_properties[mat_idx];

    let albedo = mat_albedo_rough.xyz;
    let roughness = max(0.03, mat_albedo_rough.w);
    let metallic = mat_met_emiss.x;
    let emissive = mat_met_emiss.yzw;

    let hit_point = ray.origin + ray.dir * hit.t;

    // Emissive surface contribution
    radiance += throughput * emissive;

    // Direct Sun lighting & Shadow ray
    let sun_dir = normalize(sceneInfo.sunDir);
    let shadow_ray = Ray(hit_point + hit.normal * 0.002, sun_dir);
    let shadow_hit = traverse_bvh(shadow_ray);
    var shadow_factor = 1.0;
    if (shadow_hit.t < 1e20) {
      shadow_factor = 0.0;
    }

    let n_dot_l = max(dot(hit.normal, sun_dir), 0.0);
    let direct_sun = albedo * vec3f(1.4, 1.25, 1.05) * n_dot_l * shadow_factor * sceneInfo.sunIntensity;
    radiance += throughput * direct_sun;

    // GGX / Cosine-weighted bounce direction
    let r1 = rand(seed);
    let r2 = rand(seed);
    let phi = 6.2831853 * r1;
    let cos_theta = sqrt(1.0 - r2);
    let sin_theta = sqrt(r2);
    
    let rand_dir = vec3f(cos(phi) * sin_theta, cos_theta, sin(phi) * sin_theta);
    let reflect_dir = reflect(ray.dir, hit.normal);
    let diffuse_dir = normalize(hit.normal + rand_dir);
    let new_dir = normalize(mix(reflect_dir, diffuse_dir, roughness * (1.0 - metallic * 0.8)));

    throughput *= mix(albedo, vec3f(1.0), metallic) * 0.88;
    ray = Ray(hit_point + hit.normal * 0.002, new_dir);

    // Russian Roulette termination
    if (bounce > 2u) {
      let p = max(throughput.r, max(throughput.g, throughput.b));
      if (rand(seed) > p) {
        break;
      }
      throughput /= max(0.05, p);
    }
  }

  return radiance;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let dims = vec2u(800u, 600u);
  if (gid.x >= dims.x || gid.y >= dims.y) {
    return;
  }

  let idx = gid.x + gid.y * dims.x;
  var seed = (gid.x * 1973u) ^ (gid.y * 9277u) ^ (idx * 26699u) ^ (sceneInfo.sampleIndex * 8363u);

  let ray = generate_ray(gid.xy, dims, &seed);
  let color = trace(ray, &seed);

  let prev = history[idx];
  let weight = 1.0 / f32(sceneInfo.sampleIndex + 1u);
  let accumulated = mix(prev.xyz, color, clamp(weight, 0.015, 1.0));

  history[idx] = vec4f(accumulated, 1.0);
  output[idx] = vec4f(accumulated, 1.0);
}
`;

// WebGL2 GLSL Raymarching Shader for hardware fallback
export const WEBGL2_RAYMARCH_VS = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const WEBGL2_RAYMARCH_FS = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec3 u_camPos;
uniform vec3 u_camTarget;
uniform float u_fov;
uniform float u_aspect;
uniform float u_time;
uniform int u_sampleIndex;
uniform sampler2D u_historyTexture;
uniform vec3 u_sunDir;
uniform float u_sunIntensity;

// Pseudo-random generator
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCylinder(vec3 p, float h, float r) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float map(vec3 p, out int matId) {
  float dPlane = p.y + 0.0;
  
  // Central Sovereign Spire (Dubai Creek Tower BIM approximation)
  vec3 pTower = p - vec3(0.0, 4.0, 0.0);
  float dCore = sdCylinder(pTower, 4.5, 0.65 - pTower.y * 0.06);
  
  // Observation Pods
  vec3 pPod = p - vec3(0.0, 4.5, 0.0);
  float dPod = sdCylinder(pPod, 0.8, 1.8);

  // Ground perimeter plaza & solar shading arrays
  vec3 pPlaza = p - vec3(0.0, -0.1, 0.0);
  float dPlaza = sdBox(pPlaza, vec3(14.0, 0.1, 14.0));

  vec3 pSolar1 = p - vec3(5.5, 1.0, 3.5);
  float dSolar1 = sdBox(pSolar1, vec3(1.2, 0.08, 0.9));

  vec3 pSolar2 = p - vec3(-5.5, 1.0, -3.5);
  float dSolar2 = sdBox(pSolar2, vec3(1.2, 0.08, 0.9));

  float d = dPlane;
  matId = 3; // Sandstone Marble Plaza

  if (dCore < d) {
    d = dCore;
    matId = 0; // Titanium Gold Spire
  }
  if (dPod < d) {
    d = dPod;
    matId = 1; // Sovereign Dielectric Glass
  }
  if (dSolar1 < d || dSolar2 < d) {
    d = min(dSolar1, dSolar2);
    matId = 2; // Solar PV Panel
  }

  return d;
}

vec3 calcNormal(vec3 p) {
  int m;
  const float h = 0.001;
  const vec2 k = vec2(1, -1);
  return normalize(
    k.xyy * map(p + k.xyy * h, m) +
    k.yyx * map(p + k.yyx * h, m) +
    k.yxy * map(p + k.yxy * h, m) +
    k.xxx * map(p + k.xxx * h, m)
  );
}

float calcSoftShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  int m;
  for (int i = 0; i < 32; i++) {
    float h = map(ro + rd * t, m);
    res = min(res, k * h / t);
    t += clamp(h, 0.02, 0.25);
    if (res < 0.001 || t > maxt) break;
  }
  return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  int m;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.12 * float(i) / 4.0;
    float d = map(p + h * n, m);
    occ += (h - d) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

void main() {
  vec2 uv = v_uv;
  vec2 jitter = vec2(hash(uv + vec2(u_time, 0.1)), hash(uv + vec2(0.2, u_time))) * 0.002;
  vec2 ndc = (uv + jitter) * 2.0 - 1.0;
  
  float fovScale = tan(u_fov * 0.5 * 3.14159265 / 180.0);
  vec3 forward = normalize(u_camTarget - u_camPos);
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  
  vec3 rayDir = normalize(forward + right * (ndc.x * fovScale * u_aspect) + up * (ndc.y * fovScale));
  vec3 rayOrigin = u_camPos;

  float t = 0.01;
  int matId = 3;
  bool hit = false;

  for (int i = 0; i < 96; i++) {
    vec3 p = rayOrigin + rayDir * t;
    float dist = map(p, matId);
    if (dist < 0.001) {
      hit = true;
      break;
    }
    t += dist;
    if (t > 60.0) break;
  }

  vec3 sunDir = normalize(u_sunDir);
  vec3 currentSample = vec3(0.0);

  if (hit) {
    vec3 p = rayOrigin + rayDir * t;
    vec3 n = calcNormal(p);
    float ao = calcAO(p, n);
    float shadow = calcSoftShadow(p + n * 0.01, sunDir, 0.02, 25.0, 16.0);

    vec3 albedo = vec3(0.88, 0.82, 0.72); // Sandstone Plaza
    float metallic = 0.05;
    float roughness = 0.65;
    vec3 emissive = vec3(0.0);

    if (matId == 0) {
      albedo = vec3(0.98, 0.84, 0.38); // 24K Titanium Gold
      metallic = 0.88;
      roughness = 0.12;
    } else if (matId == 1) {
      albedo = vec3(0.2, 0.85, 0.95);  // Sovereign Glass
      metallic = 0.25;
      roughness = 0.04;
      emissive = vec3(0.03, 0.12, 0.18);
    } else if (matId == 2) {
      albedo = vec3(0.08, 0.14, 0.24); // Solar PV
      metallic = 0.8;
      roughness = 0.18;
      emissive = vec3(0.01, 0.03, 0.06);
    }

    float diff = max(dot(n, sunDir), 0.0);
    vec3 viewDir = normalize(u_camPos - p);
    vec3 halfDir = normalize(sunDir + viewDir);
    float spec = pow(max(dot(n, halfDir), 0.0), 32.0 / roughness) * metallic;

    vec3 skyLight = mix(vec3(0.95, 0.68, 0.45), vec3(0.18, 0.32, 0.68), clamp(n.y * 0.5 + 0.5, 0.0, 1.0)) * 0.45;

    currentSample = (albedo * (diff * shadow * u_sunIntensity + skyLight) + spec * shadow + emissive) * ao;
  } else {
    float skyT = clamp(rayDir.y * 0.5 + 0.5, 0.0, 1.0);
    currentSample = mix(vec3(0.95, 0.68, 0.45), vec3(0.12, 0.25, 0.58), skyT);
  }

  vec4 prevHistory = texture(u_historyTexture, v_uv);
  float weight = 1.0 / float(u_sampleIndex + 1);
  vec3 accumulated = mix(prevHistory.rgb, currentSample, clamp(weight, 0.02, 1.0));

  fragColor = vec4(accumulated, 1.0);
}
`;
