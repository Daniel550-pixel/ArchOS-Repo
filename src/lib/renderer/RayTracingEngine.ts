// src/lib/renderer/RayTracingEngine.ts
// 8K SEUS-inspired Hybrid Path Tracing Engine with BVH Acceleration & WebGL2 Fallback

import { LinearBVH, RTXRenderState, RTXScene, RTXSettings } from './types';
import { PATH_TRACER_COMPUTE, WEBGL2_RAYMARCH_FS, WEBGL2_RAYMARCH_VS } from './shaders';
import { BVH } from './bvh';
import { BVHBuilder } from './bvh/BVHBuilder';

export class RayTracingEngine {
  private canvas: HTMLCanvasElement | null = null;
  private device: any = null;
  private context: any = null;
  private computePipeline: any = null;
  private renderPipeline: any = null;
  private bindGroup: any = null;

  // WebGPU GPU Buffers
  private cameraBuffer: any = null;
  private sceneUniformBuffer: any = null;
  private outputBuffer: any = null;
  private historyBuffer: any = null;
  private bvhNodesBuffer: any = null;
  private trianglesBuffer: any = null;
  private materialsBuffer: any = null;
  private matPropertiesBuffer: any = null;

  // WebGL2 Fallback state
  private gl: WebGL2RenderingContext | null = null;
  private glProgram: WebGLProgram | null = null;
  private glHistoryFBOs: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null];
  private glTexs: [WebGLTexture | null, WebGLTexture | null] = [null, null];
  private glFboIndex = 0;
  private glQuadVAO: WebGLVertexArrayObject | null = null;

  private frameIndex = 0;
  private isRunning = false;
  private animFrameId: number | null = null;
  private lastTime = performance.now();
  private scene: RTXScene | null = null;
  private bvh: LinearBVH | null = null;

  private settings: RTXSettings;
  private state: RTXRenderState = {
    samplesRendered: 0,
    fps: 0,
    isFallback: false,
    error: null,
    convergencePct: 0,
    renderTimeMs: 0,
    bvhStats: null
  };
  private onStateChange?: (state: RTXRenderState) => void;

  constructor(settings: Partial<RTXSettings> = {}) {
    this.settings = {
      maxSamples: 1024,
      resolutionScale: 0.75,
      enableTemporal: true,
      adaptiveSampling: true,
      noiseThreshold: 0.01,
      maxBounces: 4,
      sunElevation: 35,
      sunAzimuth: 140,
      useBVH: true,
      bvhMaxLeafSize: 4,
      ...settings
    };
  }

  public async initialize(canvas: HTMLCanvasElement, scene: RTXScene): Promise<boolean> {
    this.canvas = canvas;
    this.scene = scene;
    this.frameIndex = 0;

    // 1. Build BVH from Scene Meshes
    this.buildSceneBVH();

    // 2. Try WebGPU Native Compute
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter({
          powerPreference: 'high-performance'
        });
        if (adapter) {
          this.device = await adapter.requestDevice();
          this.context = canvas.getContext('webgpu');
          if (this.context) {
            const format = (navigator as any).gpu.getPreferredCanvasFormat();
            this.context.configure({
              device: this.device,
              format,
              alphaMode: 'premultiplied'
            });

            await this.createWebGPUPipeline();
            this.updateWebGPUBuffers();
            this.state.isFallback = false;
            this.state.error = null;
            return true;
          }
        }
      } catch (err: any) {
        console.warn('[RTX Engine] WebGPU setup failed, falling back to WebGL2 Path Tracer:', err?.message || err);
      }
    }

    // 3. WebGL2 Raymarcher Fallback
    try {
      const gl = canvas.getContext('webgl2', {
        antialias: false,
        alpha: false,
        depth: false,
        preserveDrawingBuffer: true
      });

      if (!gl) {
        throw new Error('WebGL2 is not supported in this browser environment');
      }

      this.gl = gl;
      this.state.isFallback = true;
      this.initWebGL2Pipeline();
      this.resizeWebGL2();
      return true;
    } catch (glErr: any) {
      console.error('[RTX Engine] Fallback WebGL2 initialization failed:', glErr);
      this.state.isFallback = true;
      this.state.error = glErr?.message || 'Renderer initialization failed';
      this.onStateChange?.(this.state);
      return false;
    }
  }

  private buildSceneBVH() {
    if (!this.scene) return;
    const bvhHierarchy = BVH.fromScene(this.scene, {
      maxLeafSize: this.settings.bvhMaxLeafSize ?? 4,
      useSAH: true
    });
    const flatBVH = bvhHierarchy.flatten();
    this.bvh = flatBVH;
    this.scene.bvh = flatBVH;
    this.state.bvhStats = flatBVH.stats;
  }

  private async createWebGPUPipeline() {
    if (!this.device) return;
    try {
      const shaderModule = this.device.createShaderModule({
        code: PATH_TRACER_COMPUTE
      });
      this.computePipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main'
        }
      });
    } catch (e) {
      console.warn('[RTX] WebGPU compute pipeline error:', e);
      throw e;
    }
  }

  private updateWebGPUBuffers() {
    if (!this.device || !this.computePipeline || !this.canvas) return;

    const width = Math.max(256, Math.floor(this.canvas.clientWidth * this.settings.resolutionScale));
    const height = Math.max(256, Math.floor(this.canvas.clientHeight * this.settings.resolutionScale));
    const pixelCount = width * height;

    // Destroy old buffers
    [this.cameraBuffer, this.sceneUniformBuffer, this.outputBuffer, this.historyBuffer, this.bvhNodesBuffer, this.trianglesBuffer, this.materialsBuffer, this.matPropertiesBuffer].forEach((b) => b?.destroy());

    // 1. Camera uniform buffer (32 bytes)
    this.cameraBuffer = this.device.createBuffer({
      size: 32,
      usage: 0x0040 | 0x0008 // UNIFORM | COPY_DST
    });

    // 2. Scene uniform buffer (64 bytes)
    this.sceneUniformBuffer = this.device.createBuffer({
      size: 64,
      usage: 0x0040 | 0x0008 // UNIFORM | COPY_DST
    });

    // 3. Pixel storage buffers (RGBA32Float)
    this.outputBuffer = this.device.createBuffer({
      size: pixelCount * 16,
      usage: 0x0080 | 0x0008 // STORAGE | COPY_DST
    });

    this.historyBuffer = this.device.createBuffer({
      size: pixelCount * 16,
      usage: 0x0080 | 0x0008 // STORAGE | COPY_DST
    });

    // 4. BVH Nodes Buffer
    const nodeData = this.bvh?.nodeBuffer || new Float32Array(8);
    this.bvhNodesBuffer = this.device.createBuffer({
      size: Math.max(64, nodeData.byteLength),
      usage: 0x0080 | 0x0008,
      mappedAtCreation: true
    });
    new Float32Array(this.bvhNodesBuffer.getMappedRange()).set(nodeData);
    this.bvhNodesBuffer.unmap();

    // 5. Triangles Buffer
    const triData = this.bvh?.triBuffer || new Float32Array(16);
    this.trianglesBuffer = this.device.createBuffer({
      size: Math.max(64, triData.byteLength),
      usage: 0x0080 | 0x0008,
      mappedAtCreation: true
    });
    new Float32Array(this.trianglesBuffer.getMappedRange()).set(triData);
    this.trianglesBuffer.unmap();

    // 6. Materials Buffers (8 materials max)
    const matAlbedoRough = new Float32Array(8 * 4);
    const matMetEmiss = new Float32Array(8 * 4);

    if (this.scene?.materials) {
      Object.values(this.scene.materials).forEach((mat, idx) => {
        if (idx < 8) {
          matAlbedoRough[idx * 4 + 0] = mat.albedo[0];
          matAlbedoRough[idx * 4 + 1] = mat.albedo[1];
          matAlbedoRough[idx * 4 + 2] = mat.albedo[2];
          matAlbedoRough[idx * 4 + 3] = mat.roughness;

          matMetEmiss[idx * 4 + 0] = mat.metallic;
          matMetEmiss[idx * 4 + 1] = mat.emissive[0];
          matMetEmiss[idx * 4 + 2] = mat.emissive[1];
          matMetEmiss[idx * 4 + 3] = mat.emissive[2];
        }
      });
    }

    this.materialsBuffer = this.device.createBuffer({
      size: 8 * 16,
      usage: 0x0080 | 0x0008,
      mappedAtCreation: true
    });
    new Float32Array(this.materialsBuffer.getMappedRange()).set(matAlbedoRough);
    this.materialsBuffer.unmap();

    this.matPropertiesBuffer = this.device.createBuffer({
      size: 8 * 16,
      usage: 0x0080 | 0x0008,
      mappedAtCreation: true
    });
    new Float32Array(this.matPropertiesBuffer.getMappedRange()).set(matMetEmiss);
    this.matPropertiesBuffer.unmap();

    // Create Bind Group
    this.bindGroup = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.sceneUniformBuffer } },
        { binding: 2, resource: { buffer: this.outputBuffer } },
        { binding: 3, resource: { buffer: this.historyBuffer } },
        { binding: 4, resource: { buffer: this.bvhNodesBuffer } },
        { binding: 5, resource: { buffer: this.trianglesBuffer } },
        { binding: 6, resource: { buffer: this.materialsBuffer } },
        { binding: 7, resource: { buffer: this.matPropertiesBuffer } }
      ]
    });
  }

  private initWebGL2Pipeline() {
    const gl = this.gl;
    if (!gl) return;

    // Compile Vertex Shader
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, WEBGL2_RAYMARCH_VS);
    gl.compileShader(vs);

    // Compile Fragment Shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, WEBGL2_RAYMARCH_FS);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(fs);
      console.error('[RTX] WebGL2 Fragment Shader Error:', log);
      throw new Error(`Shader compilation failed: ${log}`);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
    }

    this.glProgram = program;

    // Create Fullscreen Quad VAO
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.glQuadVAO = vao;
  }

  private resizeWebGL2() {
    const gl = this.gl;
    if (!gl || !this.canvas) return;

    const width = Math.max(256, Math.floor(this.canvas.clientWidth * this.settings.resolutionScale));
    const height = Math.max(256, Math.floor(this.canvas.clientHeight * this.settings.resolutionScale));

    this.canvas.width = width;
    this.canvas.height = height;
    gl.viewport(0, 0, width, height);

    // Ping-pong history framebuffers
    for (let i = 0; i < 2; i++) {
      if (this.glTexs[i]) gl.deleteTexture(this.glTexs[i]);
      if (this.glHistoryFBOs[i]) gl.deleteFramebuffer(this.glHistoryFBOs[i]);

      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this.glTexs[i] = tex;
      this.glHistoryFBOs[i] = fbo;
    }

    this.frameIndex = 0;
  }

  public resize(width: number, height: number) {
    if (this.gl) {
      this.resizeWebGL2();
      return;
    }

    if (!this.device || !this.context) return;
    this.updateWebGPUBuffers();
    this.frameIndex = 0;
  }

  public start(onFrame?: (state: RTXRenderState) => void) {
    this.onStateChange = onFrame;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.renderLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public updateSettings(newSettings: Partial<RTXSettings>) {
    const oldLeaf = this.settings.bvhMaxLeafSize;
    this.settings = { ...this.settings, ...newSettings };

    if (newSettings.bvhMaxLeafSize && newSettings.bvhMaxLeafSize !== oldLeaf) {
      this.buildSceneBVH();
      if (this.device) this.updateWebGPUBuffers();
    }

    this.frameIndex = 0;
  }

  public updateScene(scene: RTXScene) {
    this.scene = scene;
    this.buildSceneBVH();
    if (this.device) {
      this.updateWebGPUBuffers();
    }
    this.frameIndex = 0;
  }

  public resetAccumulation() {
    this.frameIndex = 0;
  }

  public getBVHStats() {
    return this.bvh?.stats || null;
  }

  private renderLoop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;
    const fps = dt > 0 ? Math.round(1000 / dt) : 60;

    if (this.gl && this.glProgram && this.glQuadVAO) {
      this.renderWebGL2Frame();
    } else if (this.device && this.computePipeline) {
      this.renderWebGPUFrame();
    }

    this.frameIndex++;
    this.state.samplesRendered = this.frameIndex;
    this.state.fps = fps;
    this.state.convergencePct = Math.min(100, Math.round((this.frameIndex / this.settings.maxSamples) * 100));
    this.state.renderTimeMs = Math.round(now);
    this.state.bvhStats = this.bvh?.stats || null;
    this.onStateChange?.(this.state);

    if (this.frameIndex < this.settings.maxSamples && this.isRunning) {
      this.animFrameId = requestAnimationFrame(this.renderLoop);
    } else {
      this.isRunning = false;
    }
  };

  private renderWebGL2Frame() {
    const gl = this.gl;
    if (!gl || !this.glProgram || !this.glQuadVAO || !this.canvas) return;

    gl.useProgram(this.glProgram);

    const camera = this.scene?.camera || {
      position: [0, 4, 10],
      target: [0, 2, 0],
      fov: 60,
      aspect: this.canvas.width / this.canvas.height
    };

    // Calculate Sun position from elevation & azimuth
    const elRad = ((this.settings.sunElevation ?? 35) * Math.PI) / 180;
    const azRad = ((this.settings.sunAzimuth ?? 140) * Math.PI) / 180;
    const sunX = Math.cos(elRad) * Math.sin(azRad);
    const sunY = Math.sin(elRad);
    const sunZ = Math.cos(elRad) * Math.cos(azRad);

    gl.uniform3fv(gl.getUniformLocation(this.glProgram, 'u_camPos'), camera.position);
    gl.uniform3fv(gl.getUniformLocation(this.glProgram, 'u_camTarget'), camera.target);
    gl.uniform1f(gl.getUniformLocation(this.glProgram, 'u_fov'), camera.fov);
    gl.uniform1f(gl.getUniformLocation(this.glProgram, 'u_aspect'), this.canvas.width / this.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.glProgram, 'u_time'), performance.now() * 0.001);
    gl.uniform1i(gl.getUniformLocation(this.glProgram, 'u_sampleIndex'), this.frameIndex);
    gl.uniform3f(gl.getUniformLocation(this.glProgram, 'u_sunDir'), sunX, sunY, sunZ);
    gl.uniform1f(gl.getUniformLocation(this.glProgram, 'u_sunIntensity'), 1.8);

    const readIndex = this.glFboIndex;
    const writeIndex = 1 - this.glFboIndex;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.glTexs[readIndex]);
    gl.uniform1i(gl.getUniformLocation(this.glProgram, 'u_historyTexture'), 0);

    // Render to backbuffer FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.glHistoryFBOs[writeIndex]);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.bindVertexArray(this.glQuadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Blit to main screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    this.glFboIndex = writeIndex;
  }

  private renderWebGPUFrame() {
    if (!this.device || !this.computePipeline || !this.context || !this.canvas) return;

    try {
      const camera = this.scene?.camera || {
        position: [0, 4.5, 9.5],
        target: [0, 2.0, 0],
        fov: 55,
        aspect: this.canvas.width / this.canvas.height
      };

      // 1. Update Camera Buffer (8 floats: [pos.xyz, fov, target.xyz, aspect])
      const camData = new Float32Array([
        camera.position[0],
        camera.position[1],
        camera.position[2],
        camera.fov,
        camera.target[0],
        camera.target[1],
        camera.target[2],
        this.canvas.width / this.canvas.height
      ]);
      this.device.queue.writeBuffer(this.cameraBuffer, 0, camData);

      // 2. Update Scene Uniforms (16 floats)
      const elRad = ((this.settings.sunElevation ?? 35) * Math.PI) / 180;
      const azRad = ((this.settings.sunAzimuth ?? 140) * Math.PI) / 180;
      const sunX = Math.cos(elRad) * Math.sin(azRad);
      const sunY = Math.sin(elRad);
      const sunZ = Math.cos(elRad) * Math.cos(azRad);

      const sceneData = new ArrayBuffer(64);
      const u32View = new Uint32Array(sceneData);
      const f32View = new Float32Array(sceneData);

      u32View[0] = this.bvh?.nodeCount || 0;
      u32View[1] = this.bvh?.triCount || 0;
      u32View[2] = this.settings.maxBounces ?? 4;
      u32View[3] = this.frameIndex;

      f32View[4] = sunX;
      f32View[5] = sunY;
      f32View[6] = sunZ;
      f32View[7] = 2.4; // sunIntensity

      f32View[8] = 0.12; f32View[9] = 0.25; f32View[10] = 0.58; f32View[11] = 0; // skyZenith
      f32View[12] = 0.95; f32View[13] = 0.68; f32View[14] = 0.45; f32View[15] = 0; // skyHorizon

      this.device.queue.writeBuffer(this.sceneUniformBuffer, 0, sceneData);

      // 3. Dispatch Compute Pass
      const commandEncoder = this.device.createCommandEncoder();
      const computePass = commandEncoder.beginComputePass();
      computePass.setPipeline(this.computePipeline);
      computePass.setBindGroup(0, this.bindGroup);
      computePass.dispatchWorkgroups(
        Math.ceil(this.canvas.width / 8),
        Math.ceil(this.canvas.height / 8)
      );
      computePass.end();

      this.device.queue.submit([commandEncoder.finish()]);
    } catch (err) {
      console.warn('[RTX] WebGPU frame execution error:', err);
    }
  }

  public destroy() {
    this.stop();
    if (this.gl) {
      this.glTexs.forEach((t) => t && this.gl?.deleteTexture(t));
      this.glHistoryFBOs.forEach((f) => f && this.gl?.deleteFramebuffer(f));
      if (this.glProgram) this.gl.deleteProgram(this.glProgram);
      if (this.glQuadVAO) this.gl.deleteVertexArray(this.glQuadVAO);
      this.gl = null;
    }
    if (this.device) {
      [this.cameraBuffer, this.sceneUniformBuffer, this.outputBuffer, this.historyBuffer, this.bvhNodesBuffer, this.trianglesBuffer, this.materialsBuffer, this.matPropertiesBuffer].forEach((b) => b?.destroy());
      try {
        this.device.destroy();
      } catch (e) {
        // ignore
      }
      this.device = null;
    }
  }
}
