import * as THREE from 'three';

export type SpatialModule = { id:string; label:string; angle:number; radius:number; color:string; activity:number };
export const CORE_ID = 'ultron-core';
export const SPATIAL_MODULES: SpatialModule[] = [
  {id:'world-model',label:'WORLD MODEL',angle:-1.48,radius:3.35,color:'#ffb45c',activity:.96},
  {id:'aios',label:'AIOS',angle:-.98,radius:3.15,color:'#ffd28a',activity:.92},
  {id:'agents',label:'AGENT FABRIC',angle:-.48,radius:3.5,color:'#77d9ff',activity:.86},
  {id:'spatial',label:'SPATIAL INTELLIGENCE',angle:-.05,radius:3.8,color:'#8ee8ff',activity:.9},
  {id:'temporal',label:'TEMPORAL INTELLIGENCE',angle:.38,radius:3.45,color:'#9fc5ff',activity:.72},
  {id:'simulation',label:'SIMULATION',angle:.82,radius:3.65,color:'#d2a8ff',activity:.81},
  {id:'causal',label:'CAUSAL GRAPH',angle:1.25,radius:3.2,color:'#ff9bcf',activity:.68},
  {id:'fiscal',label:'FISCAL INTELLIGENCE',angle:1.68,radius:3.55,color:'#ffd166',activity:.78},
  {id:'governance',label:'GOVERNANCE',angle:2.1,radius:3.3,color:'#a8ffcf',activity:.94},
  {id:'security',label:'SECURITY',angle:2.52,radius:3.7,color:'#7ce6ff',activity:.98},
  {id:'memory',label:'MEMORY',angle:2.95,radius:3.25,color:'#b9b6ff',activity:.83},
  {id:'vision',label:'VISION',angle:3.38,radius:3.55,color:'#7fffd4',activity:.89},
  {id:'integrations',label:'INTEGRATIONS',angle:3.82,radius:3.25,color:'#8dc7ff',activity:.76},
  {id:'voice',label:'VOICE',angle:4.25,radius:3.65,color:'#ffb0c8',activity:.61},
  {id:'experience',label:'EXPERIENCE',angle:4.72,radius:3.4,color:'#ffc48c',activity:.88},
];
export function modulePosition(module:SpatialModule,y=0){return new THREE.Vector3(Math.cos(module.angle)*module.radius,y,Math.sin(module.angle)*module.radius);}
export function createSpatialScene(){const scene=new THREE.Scene();scene.background=new THREE.Color('#010206');scene.fog=new THREE.FogExp2('#010206',.012);return scene;}
