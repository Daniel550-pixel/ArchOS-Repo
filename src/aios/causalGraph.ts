import { executionTrace, type ExecutionTraceRecord } from './executionTrace';
import { missionReplay } from './missionReplay';

export interface CausalGraphNode { traceId:string; parentTraceId:string|null; kind:ExecutionTraceRecord['kind']; status:string; timestamp:number; depth:number; frameIndex:number; label:string; }
export interface CausalGraphEdge { from:string; to:string; relation:'PARENT'; }
export interface CausalGraph { sessionId:string; nodes:readonly CausalGraphNode[]; edges:readonly CausalGraphEdge[]; roots:readonly string[]; cycles:readonly string[]; }

const label=(r:ExecutionTraceRecord)=>r.command?.type==='REQUEST_EXECUTION'?r.command.payload.title:r.agentId??r.worldEntityId??r.phase??r.kind;
export const causalGraph={
 build(sessionId:string):CausalGraph|null{
  const replay=missionReplay.getSession(sessionId); if(!replay)return null;
  const all=replay.frames.map(f=>f.record), byId=new Map(all.map(r=>[r.traceId,r])), frameById=new Map(replay.frames.map(f=>[f.record.traceId,f.index]));
  const nodes:CausalGraphNode[]=[],edges:CausalGraphEdge[]=[],cycles:string[]=[],cache=new Map<string,number>();
  const depth=(r:ExecutionTraceRecord,stack=new Set<string>()):number=>{if(cache.has(r.traceId))return cache.get(r.traceId)!;if(stack.has(r.traceId)){cycles.push(r.traceId);return 0;}if(!r.parentTraceId||!byId.has(r.parentTraceId)){cache.set(r.traceId,0);return 0;}const d=depth(byId.get(r.parentTraceId)!,new Set([...stack,r.traceId]))+1;cache.set(r.traceId,d);return d;};
  all.forEach(r=>{nodes.push({traceId:r.traceId,parentTraceId:r.parentTraceId??null,kind:r.kind,status:r.status,timestamp:r.timestamp,depth:depth(r),frameIndex:frameById.get(r.traceId)??-1,label:label(r)});if(r.parentTraceId&&byId.has(r.parentTraceId))edges.push({from:r.parentTraceId,to:r.traceId,relation:'PARENT'});});
  return{sessionId,nodes,edges,roots:nodes.filter(n=>!n.parentTraceId||!byId.has(n.parentTraceId)).map(n=>n.traceId),cycles:[...new Set(cycles)]};
 },
 lineage(sessionId:string,traceId:string){const g=this.build(sessionId);if(!g)return[];const byId=new Map<string, CausalGraphNode>(g.nodes.map(n=>[n.traceId,n])),out:CausalGraphNode[]=[],seen=new Set<string>();let n:CausalGraphNode|undefined=byId.get(traceId);while(n&&!seen.has(n.traceId)){seen.add(n.traceId);out.unshift(n);n=n.parentTraceId?byId.get(n.parentTraceId):undefined;}return out;},

 health(sessionId:string){const g=this.build(sessionId);if(!g)return null;const duplicate=g.nodes.length!==new Set(g.nodes.map(n=>n.traceId)).size;return{valid:!duplicate&&g.cycles.length===0,nodeCount:g.nodes.length,edgeCount:g.edges.length,roots:g.roots.length,cycles:g.cycles.length};},
 traceHealth(){return executionTrace.health();}
};
