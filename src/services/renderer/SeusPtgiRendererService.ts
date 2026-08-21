// src/services/renderer/SeusPtgiRendererService.ts
// SEUS PTGI Progressive Path Tracing Engine with 8K Snapshot Accumulator

import * as THREE from 'three';
import {
  SEUS_PTGI_VERTEX_SHADER,
  SEUS_PTGI_FRAGMENT_SHADER,
  SEUS_DENOISER_FRAGMENT_SHADER
} from './seusShaders';

export interface RenderConfig {
  resolutionTier: 'PREVIEW_1080P' | 'UHD_4K' | 'MASTER_8K';
  targetWidth: number;
  targetHeight: number;
  maxBounces: number;
  samplesPerPixel: number;
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  sunIntensity: number;
  skyTurbidity: number;
  materialType: number; // 0: Sandstone, 1: Titanium, 2: Glass, 3: Gold, 4: Marble, 5: Solar PV
  roughness: number;
  metallic: number;
  enableCaustics: boolean;
  enableVolumetrics: boolean;
  enableDenoise: boolean;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number;
}

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  resolutionTier: 'PREVIEW_1080P',
  targetWidth: 1920,
  targetHeight: 1080,
  maxBounces: 4,
  samplesPerPixel: 256,
  sunElevationDeg: 28, // Golden Hour UAE
  sunAzimuthDeg: 235,
  sunIntensity: 1.35,
  skyTurbidity: 1.2,
  materialType: 1, // Brushed Titanium
  roughness: 0.15,
  metallic: 0.95,
  enableCaustics: true,
  enableVolumetrics: true,
  enableDenoise: true,
  cameraPos: [0, 85, 240],
  cameraTarget: [0, 65, 0],
  fov: 48
};

export type RenderProgressCallback = (currentSpp: number, targetSpp: number, isConverged: boolean) => void;

export class SeusPtgiRendererService {
  private renderer: THREE.WebGLRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  // Ping-pong render targets for temporal accumulation
  private readTarget: THREE.WebGLRenderTarget | null = null;
  private writeTarget: THREE.WebGLRenderTarget | null = null;
  private denoiseTarget: THREE.WebGLRenderTarget | null = null;

  // Shader Materials
  private ptgiMaterial: THREE.ShaderMaterial;
  private denoiseMaterial: THREE.ShaderMaterial;
  private displayMaterial: THREE.MeshBasicMaterial;

  private quadMesh: THREE.Mesh;
  private currentFrameIndex: number = 0;
  private isRendering: boolean = false;
  private config: RenderConfig = { ...DEFAULT_RENDER_CONFIG };
  private progressCallbacks: Set<RenderProgressCallback> = new Set();
  private animFrameId: number | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Initialize PTGI Material
    this.ptgiMaterial = new THREE.ShaderMaterial({
      vertexShader: SEUS_PTGI_VERTEX_SHADER,
      fragmentShader: SEUS_PTGI_FRAGMENT_SHADER,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1920, 1080) },
        uCameraPos: { value: new THREE.Vector3(0, 85, 240) },
        uCameraTarget: { value: new THREE.Vector3(0, 65, 0) },
        uFov: { value: 48 },
        uTime: { value: 0 },
        uFrameIndex: { value: 0 },
        uMaxBounces: { value: 4 },
        uSamplesPerPixel: { value: 256 },
        uSunDirection: { value: new THREE.Vector3(0.5, 0.7, 0.5).normalize() },
        uSunColor: { value: new THREE.Vector3(1.0, 0.92, 0.82) },
        uSunIntensity: { value: 1.35 },
        uSkyTurbidity: { value: 1.2 },
        uRoughness: { value: 0.15 },
        uMetallic: { value: 0.95 },
        uMaterialType: { value: 1 },
        uEnableCaustics: { value: true },
        uEnableVolumetrics: { value: true },
        uEnableDenoise: { value: true },
        uAccumTexture: { value: null }
      }
    });

    // Initialize Denoiser Material
    this.denoiseMaterial = new THREE.ShaderMaterial({
      vertexShader: SEUS_PTGI_VERTEX_SHADER,
      fragmentShader: SEUS_DENOISER_FRAGMENT_SHADER,
      uniforms: {
        uTexture: { value: null },
        uResolution: { value: new THREE.Vector2(1920, 1080) },
        uEnabled: { value: true }
      }
    });

    this.displayMaterial = new THREE.MeshBasicMaterial();
    const planeGeo = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(planeGeo, this.ptgiMaterial);
    this.scene.add(this.quadMesh);
  }

  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });

    this.renderer.autoClear = false;
    this.updateRenderTargets();
    this.resetAccumulation();
    this.startRenderLoop();
  }

  public setConfig(newConfig: Partial<RenderConfig>): void {
    const prevTier = this.config.resolutionTier;
    this.config = { ...this.config, ...newConfig };

    if (newConfig.resolutionTier && newConfig.resolutionTier !== prevTier) {
      if (this.config.resolutionTier === 'PREVIEW_1080P') {
        this.config.targetWidth = 1920;
        this.config.targetHeight = 1080;
      } else if (this.config.resolutionTier === 'UHD_4K') {
        this.config.targetWidth = 3840;
        this.config.targetHeight = 2160;
      } else if (this.config.resolutionTier === 'MASTER_8K') {
        this.config.targetWidth = 7680;
        this.config.targetHeight = 4320;
      }
      this.updateRenderTargets();
    }

    this.updateUniforms();
    this.resetAccumulation();
  }

  public getConfig(): RenderConfig {
    return { ...this.config };
  }

  public onProgress(cb: RenderProgressCallback): () => void {
    this.progressCallbacks.add(cb);
    return () => this.progressCallbacks.delete(cb);
  }

  private updateRenderTargets(): void {
    if (!this.renderer) return;

    const w = this.config.targetWidth;
    const h = this.config.targetHeight;

    const options: THREE.RenderTargetOptions = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType, // High dynamic range accumulation buffer
      depthBuffer: false,
      stencilBuffer: false
    };

    if (this.readTarget) this.readTarget.dispose();
    if (this.writeTarget) this.writeTarget.dispose();
    if (this.denoiseTarget) this.denoiseTarget.dispose();

    this.readTarget = new THREE.WebGLRenderTarget(w, h, options);
    this.writeTarget = new THREE.WebGLRenderTarget(w, h, options);
    this.denoiseTarget = new THREE.WebGLRenderTarget(w, h, options);

    this.ptgiMaterial.uniforms.uResolution.value.set(w, h);
    this.denoiseMaterial.uniforms.uResolution.value.set(w, h);

    if (this.canvas) {
      const displayW = this.canvas.parentElement?.clientWidth || w;
      const displayH = this.canvas.parentElement?.clientHeight || h;
      this.renderer.setSize(displayW, displayH, false);
    }
  }

  public resetAccumulation(): void {
    this.currentFrameIndex = 0;
    if (this.renderer && this.readTarget && this.writeTarget) {
      this.renderer.setRenderTarget(this.readTarget);
      this.renderer.clearColor();
      this.renderer.setRenderTarget(this.writeTarget);
      this.renderer.clearColor();
      this.renderer.setRenderTarget(null);
    }
  }

  private updateUniforms(): void {
    const u = this.ptgiMaterial.uniforms;

    u.uCameraPos.value.set(...this.config.cameraPos);
    u.uCameraTarget.value.set(...this.config.cameraTarget);
    u.uFov.value = this.config.fov;
    u.uMaxBounces.value = this.config.maxBounces;
    u.uSamplesPerPixel.value = this.config.samplesPerPixel;

    // Compute Sun vector from Elevation and Azimuth
    const elRad = (this.config.sunElevationDeg * Math.PI) / 180;
    const azRad = (this.config.sunAzimuthDeg * Math.PI) / 180;
    const sunDir = new THREE.Vector3(
      Math.cos(elRad) * Math.sin(azRad),
      Math.sin(elRad),
      Math.cos(elRad) * Math.cos(azRad)
    ).normalize();

    u.uSunDirection.value.copy(sunDir);
    u.uSunIntensity.value = this.config.sunIntensity;
    u.uSkyTurbidity.value = this.config.skyTurbidity;
    u.uRoughness.value = this.config.roughness;
    u.uMetallic.value = this.config.metallic;
    u.uMaterialType.value = this.config.materialType;
    u.uEnableCaustics.value = this.config.enableCaustics;
    u.uEnableVolumetrics.value = this.config.enableVolumetrics;
    u.uEnableDenoise.value = this.config.enableDenoise;

    this.denoiseMaterial.uniforms.uEnabled.value = this.config.enableDenoise;
  }

  private startRenderLoop(): void {
    if (this.isRendering) return;
    this.isRendering = true;

    const loop = () => {
      this.renderFrame();
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public renderFrame(): void {
    if (!this.renderer || !this.readTarget || !this.writeTarget || !this.denoiseTarget) return;

    const isConverged = this.currentFrameIndex >= this.config.samplesPerPixel;

    if (!isConverged) {
      // 1. Pass 1: PTGI Raytracing Step into writeTarget
      this.ptgiMaterial.uniforms.uTime.value = performance.now() * 0.001;
      this.ptgiMaterial.uniforms.uFrameIndex.value = this.currentFrameIndex;
      this.ptgiMaterial.uniforms.uAccumTexture.value = this.readTarget.texture;

      this.quadMesh.material = this.ptgiMaterial;
      this.renderer.setRenderTarget(this.writeTarget);
      this.renderer.render(this.scene, this.camera);

      // Swap Ping-Pong targets
      const temp = this.readTarget;
      this.readTarget = this.writeTarget;
      this.writeTarget = temp;

      this.currentFrameIndex++;
    }

    // 2. Pass 2: Denoise / Tone Mapping pass to final canvas screen
    this.denoiseMaterial.uniforms.uTexture.value = this.readTarget.texture;
    this.quadMesh.material = this.denoiseMaterial;

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    // Notify listeners
    this.progressCallbacks.forEach(cb =>
      cb(this.currentFrameIndex, this.config.samplesPerPixel, isConverged)
    );
  }

  /**
   * Export the current high-resolution converged canvas as a Master 8K / 4K PNG
   */
  public async exportMasterRender(): Promise<string> {
    if (!this.renderer || !this.readTarget) {
      throw new Error('Renderer not initialized');
    }

    return new Promise((resolve) => {
      const dataUrl = this.renderer!.domElement.toDataURL('image/png', 1.0);
      resolve(dataUrl);
    });
  }

  public dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.isRendering = false;
    this.readTarget?.dispose();
    this.writeTarget?.dispose();
    this.denoiseTarget?.dispose();
    this.renderer?.dispose();
  }
}

export const seusPtgiRenderer = new SeusPtgiRendererService();
