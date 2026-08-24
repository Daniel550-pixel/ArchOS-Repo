import assert from 'node:assert/strict';
import { causalGraph } from '../src/aios/causalGraph';
import { executionTrace } from '../src/aios/executionTrace';
import { missionReplay } from '../src/aios/missionReplay';
import { sessionIntelligence } from '../src/aios/sessionIntelligence';
import { temporalControlPlane } from '../src/aios/temporalControlPlane';
import { ultronEventBus } from '../src/aios/events';

async function main(){
 executionTrace.clear();sessionIntelligence.clear();ultronEventBus.clear();executionTrace.initialize();sessionIntelligence.initialize();
 const session=sessionIntelligence.start('temporal verification');
 const root='trace-root',child='trace-child';
 executionTrace.append({id:'r1',traceId:root,parentTraceId:null,kind:'system',status:'completed',timestamp:100,phase:'root'});
 executionTrace.append({id:'r2',traceId:child,parentTraceId:root,kind:'agent',status:'completed',timestamp:200,agentId:'verification-agent'});
 sessionIntelligence.recordCommand(session,{traceId:root,commandType:'REQUEST_EXECUTION',timestamp:100,status:'completed'});
 sessionIntelligence.recordCommand(session,{traceId:child,commandType:'REQUEST_EXECUTION',timestamp:200,status:'completed'});
 const graph=causalGraph.build(session);assert(graph);assert.equal(graph.nodes.length,2);assert.equal(graph.edges.length,1);assert.deepEqual(graph.roots,[root]);assert.equal(causalGraph.health(session)?.valid,true);assert.deepEqual(causalGraph.lineage(session,child).map(n=>n.traceId),[root,child]);
 const replay=missionReplay.getSession(session);assert(replay?.integrityValid);const branch=temporalControlPlane.branchFrom(session,1);assert(branch);assert.equal(branch.sourceTraceId,child);assert.equal(temporalControlPlane.appendBranchCommand(branch.id,{type:'WHAT_IF',value:'test'})?.parentTraceId,child);assert.equal(temporalControlPlane.beginSimulation(branch.id),true);assert.equal(temporalControlPlane.getBranch(branch.id)?.status,'SIMULATING');assert.equal(temporalControlPlane.completeSimulation(branch.id),'true'==='true'?'COMPLETED':'ABORTED');assert.equal(temporalControlPlane.getBranch(branch.id)?.status,'COMPLETED');
 console.log('Temporal control plane verification: PASS');
 sessionIntelligence.shutdown();executionTrace.shutdown();ultronEventBus.clear();
}
main().catch(error=>{console.error('Temporal control plane verification: FAIL');console.error(error);process.exit(1);});
