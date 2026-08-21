#!/usr/bin/env node

const baseUrl = (process.env.ARCHOS_WEB_URL || process.argv[2] || 'http://127.0.0.1:3000').replace(/\/$/, '');

const cases = [
  { name: 'healthz', method: 'GET', path: '/healthz' },
  { name: 'api-health', method: 'GET', path: '/api/health' },
  {
    name: 'jarvis-read-only',
    method: 'POST',
    path: '/api/v1/jarvis/ask',
    body: { query: 'system health and current UAE world model status' },
  },
  {
    name: 'jarvis-world-model',
    method: 'POST',
    path: '/api/v1/jarvis/ask',
    body: { query: 'show the current UAE world model state for Downtown Dubai' },
  },
  {
    name: 'jarvis-governance',
    method: 'POST',
    path: '/api/v1/jarvis/ask',
    body: { query: 'simulate a BMS setpoint change but do not execute it' },
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function runCase(testCase) {
  const response = await fetch(`${baseUrl}${testCase.path}`, {
    method: testCase.method,
    headers: testCase.body ? { 'content-type': 'application/json' } : undefined,
    body: testCase.body ? JSON.stringify(testCase.body) : undefined,
    redirect: 'manual',
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    // A non-JSON response is still useful in the diagnostic output.
  }

  assert(response.status >= 200 && response.status < 300, `${testCase.name}: HTTP ${response.status} ${text.slice(0, 300)}`);

  if (testCase.name === 'healthz') {
    assert(payload?.ok === true, 'healthz did not return ok=true');
  }

  if (testCase.name === 'api-health') {
    assert(payload?.status === 'OK', 'api/health did not report status=OK');
  }

  if (testCase.path === '/api/v1/jarvis/ask') {
    assert(payload && typeof payload === 'object', `${testCase.name}: expected JSON object`);
    assert(typeof payload.answer === 'string' && payload.answer.trim().length > 0, `${testCase.name}: missing answer`);
    console.log(`  answer: ${payload.answer.slice(0, 220).replace(/\s+/g, ' ')}`);
    if (payload.actionResult) {
      console.log(`  action: ${JSON.stringify(payload.actionResult)}`);
    }
  }

  console.log(`PASS ${testCase.name} (${response.status})`);
}

console.log(`ARCHOS WEB APP E2E`);
console.log(`target: ${baseUrl}`);

let failures = 0;
for (const testCase of cases) {
  try {
    await runCase(testCase);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures) {
  console.error(`\n${failures}/${cases.length} web-app tests failed.`);
  process.exit(1);
}

console.log(`\nAll ${cases.length} web-app tests passed.`);
