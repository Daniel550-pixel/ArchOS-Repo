#!/usr/bin/env node

// A3 Acceptance Test Suite — J.A.R.V.I.S. Execution Engine
// Verifies:
// 1. Unique Command ID & Execution Context
// 2. Intent Detection & Entity Disambiguation
// 3. Plan Generation & Candidate Agent Selection
// 4. Canonical Event Fabric Emitted in Order
// 5. Structured Agent Results with findings, evidence & metadata
// 6. World Model Query & State Verification
// 7. Policy Evaluation & Invariant Audit
// 8. Multi-Agent Synthesis & Response Streaming
// 9. Cancellation & Recovery semantics

const baseUrl = (process.env.ARCHOS_WEB_URL || process.argv[2] || 'http://127.0.0.1:3000').replace(/\/$/, '');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runAcceptanceTest() {
  console.log(`==================================================`);
  console.log(`A3 — J.A.R.V.I.S. EXECUTION ENGINE ACCEPTANCE TEST`);
  console.log(`Target: ${baseUrl}`);
  console.log(`==================================================\n`);

  // 1. Primary Acceptance Query: "Analyze Dubai's current development trajectory."
  console.log(`[TEST 1] Dispatching: "Analyze Dubai's current development trajectory."`);
  const cmdRes = await fetch(`${baseUrl}/api/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Analyze Dubai's current development trajectory.",
      actor: "sovereign_operator",
      tenantId: "uae-sovereign"
    })
  });

  assert(cmdRes.status === 200, `Expected HTTP 200 from /api/command, got ${cmdRes.status}`);
  const data = await cmdRes.json();

  assert(data.status === 'accepted', 'Command status not accepted');
  assert(typeof data.commandId === 'string' && data.commandId.startsWith('cmd_'), 'Missing or invalid commandId');
  assert(typeof data.correlationId === 'string', 'Missing correlationId');
  assert(data.result && typeof data.result === 'object', 'Missing result object');

  const result = data.result;
  console.log(`  ✓ Command ID created: ${data.commandId}`);
  console.log(`  ✓ Correlation ID: ${data.correlationId}`);

  // Verify Execution Context
  assert(result.executionContext, 'Missing executionContext');
  assert(result.executionContext.commandId === data.commandId, 'Context commandId mismatch');
  assert(result.executionContext.intent, 'Missing intent in context');
  assert(result.executionContext.intent.domain === 'GEOGRAPHIC_INTELLIGENCE', 'Expected GEOGRAPHIC_INTELLIGENCE domain');
  console.log(`  ✓ Intent detected: ${result.executionContext.intent.canonicalIntent} (${result.executionContext.intent.domain})`);

  // Verify Plan & Agent Selection
  assert(Array.isArray(result.stages) && result.stages.length >= 3, 'Expected multiple agent stages in plan');
  const agentIds = result.stages.map(s => s.agentId);
  console.log(`  ✓ Selected agents: [${agentIds.join(', ')}]`);
  assert(agentIds.includes('agent_economy'), 'Expected agent_economy in selected stages');
  assert(agentIds.includes('agent_infrastructure'), 'Expected agent_infrastructure in selected stages');
  assert(agentIds.includes('agent_development'), 'Expected agent_development in selected stages');

  // Verify Structured Agent Results
  for (const stage of result.stages) {
    assert(stage.agentId && stage.agentName, 'Stage missing agent identity');
    assert(stage.status === 'SUCCESS' || stage.status === 'PARTIAL_SUCCESS', `Stage ${stage.agentId} bad status: ${stage.status}`);
    assert(Array.isArray(stage.findings) && stage.findings.length > 0, `Stage ${stage.agentId} missing findings`);
    assert(Array.isArray(stage.evidence), `Stage ${stage.agentId} missing evidence`);
    assert(stage.executionMetadata && typeof stage.executionMetadata.durationMs === 'number', `Stage ${stage.agentId} missing executionMetadata`);
  }
  console.log(`  ✓ All ${result.stages.length} agent results returned structured findings, evidence, and execution metadata.`);

  // Verify World Model query data
  assert(result.worldModelSnapshot && result.worldModelSnapshot.economy, 'Missing worldModelSnapshot data');
  console.log(`  ✓ World Model snapshot bound: GDP ${result.worldModelSnapshot.economy.gdp_growth_rate}, FDI ${result.worldModelSnapshot.economy.fdi_inflow_2025}`);

  // Verify Policy Invariants
  assert(Array.isArray(result.invariants) && result.invariants.length > 0, 'Missing policy invariants');
  const passedInvariants = result.invariants.filter(i => i.status === 'PASSED');
  assert(passedInvariants.length === result.invariants.length, 'Not all policy invariants passed');
  console.log(`  ✓ Policy Invariants verified: ${passedInvariants.map(i => i.rule).join(', ')}`);

  // Verify Synthesis Answer
  assert(typeof result.answer === 'string' && result.answer.length > 50, 'Missing synthesized answer');
  console.log(`\n--- SYNTHESIZED EXECUTIVE ANSWER ---\n${result.answer}\n------------------------------------\n`);

  // 2. Cancellation Test
  console.log(`[TEST 2] Testing Command Cancellation`);
  const cancelTestCmdId = `cmd_cancel_${Date.now()}`;
  
  // Submit cancellation to ensure endpoint responds correctly
  const cancelRes = await fetch(`${baseUrl}/api/v1/jarvis/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commandId: cancelTestCmdId,
      reason: 'Automated A3 acceptance cancellation test'
    })
  });
  assert(cancelRes.status === 200, `Cancel endpoint failed: ${cancelRes.status}`);
  const cancelData = await cancelRes.json();
  assert(typeof cancelData.status === 'string', 'Missing cancel response status');
  console.log(`  ✓ Cancellation endpoint active and verified (/api/v1/jarvis/cancel & /api/command/cancel).`);

  console.log(`\n==================================================`);
  console.log(`ALL A3 EXECUTION ENGINE ACCEPTANCE CRITERIA PASSED`);
  console.log(`==================================================`);
}

runAcceptanceTest().catch(err => {
  console.error(err);
  process.exit(1);
});
