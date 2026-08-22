import crypto from "crypto";
import { AgentRegistry, agentRegistry } from "./registry";
import {
  ArchOSAgent,
  AgentContext,
  AgentResult,
  ExecutionPlan,
  PlanStage,
  ExecutionDAGWave
} from "./types";

export interface AgentEventEmitter {
  emit(event: {
    id: string;
    type: string;
    timestamp: string;
    correlationId: string;
    sessionId: string;
    source: string;
    severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
    payload: Record<string, any>;
  }): void;
}

export class AgentExecutor {
  constructor(
    private registry: AgentRegistry = agentRegistry,
    private defaultTimeoutMs: number = 8000
  ) {}

  public async executePlan(
    plan: ExecutionPlan,
    baseContext: {
      commandId: string;
      correlationId: string;
      sessionId: string;
      userId: string;
      tenantId: string;
      query: string;
      worldModelData: any;
      permissions: string[];
      memoryReferences: string[];
      isCancelled: () => boolean;
      cancellationReason?: string;
    },
    emitter: AgentEventEmitter
  ): Promise<{
    results: AgentResult[];
    synthesizedAnswer: string;
    reality: any;
    failedAgents: string[];
    isCancelled: boolean;
  }> {
    const allResults: AgentResult[] = [];
    const failedAgents: string[] = [];

    // Execute wave by wave
    for (const wave of plan.waves) {
      if (baseContext.isCancelled()) {
        break;
      }

      // Execute all stages in this wave concurrently (parallel execution)
      const wavePromises = wave.parallelStages.map(stage =>
        this.executeSingleAgentStage(stage, baseContext, allResults, failedAgents, emitter)
      );

      const waveResults = await Promise.all(wavePromises);

      for (const res of waveResults) {
        allResults.push(res);
        if (res.status === "FAILED") {
          failedAgents.push(res.agentId);
        }
      }
    }

    // Extract synthesized output
    const synthResult = allResults.find(r => r.agentId === "synthesis");
    const synthesizedAnswer =
      synthResult?.output?.executiveAnswer ||
      "Deterministic UAE Sovereign Reasoning Engine executed across geodetic, economic, and infrastructure boundaries.";
    const reality = synthResult?.output?.reality || "OBSERVED";

    return {
      results: allResults,
      synthesizedAnswer,
      reality,
      failedAgents,
      isCancelled: baseContext.isCancelled()
    };
  }

  private async executeSingleAgentStage(
    stage: PlanStage,
    baseContext: {
      commandId: string;
      correlationId: string;
      sessionId: string;
      userId: string;
      tenantId: string;
      query: string;
      worldModelData: any;
      permissions: string[];
      memoryReferences: string[];
      isCancelled: () => boolean;
      cancellationReason?: string;
    },
    priorResults: AgentResult[],
    failedAgents: string[],
    emitter: AgentEventEmitter
  ): Promise<AgentResult> {
    const agent = this.registry.get(stage.agentId);
    const startTime = Date.now();

    if (!agent) {
      const errRes: AgentResult = {
        agentId: stage.agentId,
        agentName: stage.name,
        domain: stage.domain,
        status: "FAILED",
        findings: [`Agent '${stage.agentId}' is not registered in the Agent Registry.`],
        evidence: [],
        confidence: 0,
        worldModelReferences: [],
        warnings: [`Missing agent implementation for ${stage.agentId}`],
        executionMetadata: {
          durationMs: 0,
          reality: "FALLBACK",
          timestamp: new Date().toISOString()
        },
        error: "AGENT_NOT_REGISTERED"
      };
      return errRes;
    }

    // Emit agent.started
    emitter.emit({
      id: `evt_${crypto.randomBytes(6).toString("hex")}`,
      type: "agent.started",
      timestamp: new Date().toISOString(),
      correlationId: baseContext.correlationId,
      sessionId: baseContext.sessionId,
      source: `jarvis.agent_fabric.${agent.id}`,
      severity: "INFO",
      payload: {
        agentId: agent.id,
        agentName: agent.name,
        version: agent.version,
        domain: agent.domain,
        capabilities: agent.capabilities,
        task: `Executing ${stage.name}`
      }
    });

    // Check cancellation early
    if (baseContext.isCancelled()) {
      return this.buildCancelledResult(agent, startTime);
    }

    // Build isolated AgentContext
    const agentContext: AgentContext = {
      executionId: `exec_${crypto.randomBytes(4).toString("hex")}`,
      commandId: baseContext.commandId,
      correlationId: baseContext.correlationId,
      sessionId: baseContext.sessionId,
      userId: baseContext.userId,
      tenantId: baseContext.tenantId,
      intent: {
        canonicalIntent: "SPECIALIST_ANALYSIS",
        domain: stage.domain,
        confidence: 0.98,
        entities: [],
        isActionIntent: false,
        requiredCapabilities: stage.requiredCapabilities
      },
      relevantMemory: baseContext.memoryReferences,
      authorizedTools: agent.permissions,
      worldModelAccess: {
        snapshotVersion: "ARCHOS_WORLD_MODEL_V2_4_DUBAI",
        region: "Emirate of Dubai / UAE",
        data: baseContext.worldModelData
      },
      policyConstraints: {
        decision: "ALLOWED",
        riskLevel: "READ_ONLY",
        permissions: baseContext.permissions
      },
      cancellationSignal: {
        isCancelled: baseContext.isCancelled,
        reason: baseContext.cancellationReason
      },
      query: baseContext.query,
      config: {
        priorStageResults: priorResults,
        unavailableAgents: failedAgents
      }
    };

    // Execute with Timeout & 1 Retry
    let attempt = 0;
    const maxAttempts = 2;
    let lastError: any = null;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        if (attempt > 1) {
          emitter.emit({
            id: `evt_${crypto.randomBytes(6).toString("hex")}`,
            type: "agent.retrying",
            timestamp: new Date().toISOString(),
            correlationId: baseContext.correlationId,
            sessionId: baseContext.sessionId,
            source: `jarvis.agent_fabric.${agent.id}`,
            severity: "WARNING",
            payload: {
              agentId: agent.id,
              attempt,
              maxAttempts,
              reason: lastError?.message || "Transient timeout/retry"
            }
          });
        }

        const executePromise = agent.execute(agentContext);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Agent ${agent.id} timed out after ${this.defaultTimeoutMs}ms`)), this.defaultTimeoutMs)
        );

        const result = await Promise.race([executePromise, timeoutPromise]);
        result.executionMetadata.retries = attempt - 1;

        // Emit agent.completed
        emitter.emit({
          id: `evt_${crypto.randomBytes(6).toString("hex")}`,
          type: "agent.completed",
          timestamp: new Date().toISOString(),
          correlationId: baseContext.correlationId,
          sessionId: baseContext.sessionId,
          source: `jarvis.agent_fabric.${agent.id}`,
          severity: result.status === "SUCCESS" ? "INFO" : "WARNING",
          payload: {
            agentId: agent.id,
            status: result.status,
            confidence: result.confidence,
            evidenceCount: result.evidence.length,
            durationMs: result.executionMetadata.durationMs,
            retries: attempt - 1
          }
        });

        return result;
      } catch (err: any) {
        lastError = err;
        if (baseContext.isCancelled()) {
          return this.buildCancelledResult(agent, startTime);
        }
      }
    }

    // All retry attempts failed — emit agent.failed and return graceful degraded result
    const durationMs = Date.now() - startTime;
    const failureResult: AgentResult = {
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      status: "FAILED",
      findings: [`Analysis for ${agent.name} was unavailable due to transient failure: ${lastError?.message}`],
      evidence: [],
      confidence: 0.0,
      worldModelReferences: [],
      warnings: [`Agent ${agent.id} failed after ${maxAttempts} attempts`],
      executionMetadata: {
        durationMs,
        reality: "FALLBACK",
        timestamp: new Date().toISOString(),
        retries: maxAttempts - 1
      },
      error: lastError?.message || "EXECUTION_TIMEOUT"
    };

    emitter.emit({
      id: `evt_${crypto.randomBytes(6).toString("hex")}`,
      type: "agent.failed",
      timestamp: new Date().toISOString(),
      correlationId: baseContext.correlationId,
      sessionId: baseContext.sessionId,
      source: `jarvis.agent_fabric.${agent.id}`,
      severity: "ERROR",
      payload: {
        agentId: agent.id,
        status: "FAILED",
        error: lastError?.message,
        durationMs,
        attempts: maxAttempts
      }
    });

    return failureResult;
  }

  private buildCancelledResult(agent: ArchOSAgent, startTime: number): AgentResult {
    return {
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      status: "CANCELLED",
      findings: [],
      evidence: [],
      confidence: 0,
      worldModelReferences: [],
      warnings: ["Agent execution halted due to command cancellation"],
      executionMetadata: {
        durationMs: Date.now() - startTime,
        reality: "OBSERVED",
        timestamp: new Date().toISOString()
      }
    };
  }
}

export const agentExecutor = new AgentExecutor();
