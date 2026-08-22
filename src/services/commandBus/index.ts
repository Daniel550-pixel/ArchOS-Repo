import { ExperienceCommand, CommandSource, CommandLogEntry } from '../../types';
import { securityFabric } from '../security/securityFabric';
import { quantumCryptoService } from '../security/quantumCryptoService';
import { voiceService, ARCHOS_VOICES } from '../voice/elevenlabs';
import { eventFabric } from '../eventFabric';
import { ArchOSCommand as RuntimeCommand, ArchOSRuntimeResponse } from '../../types/archosRuntimeContracts';

export interface ArchOSCommand {
  type: 'AUTH_SUCCESS' | 'THREAT_DETECTED' | 'SIMULATION_COMPLETE' | 'WORLD_MODEL_SYNC' | 'DEFCON_CHANGE' | 'TELEMETRY_ALERT' | string;
  payload?: any;
}

type CommandListener = (command: ExperienceCommand, source: CommandSource, rawText?: string) => void;

class UnifiedCommandBus {
  private listeners: Set<CommandListener> = new Set();
  private logs: CommandLogEntry[] = [];
  private maxLogs = 50;

  public subscribe(listener: CommandListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async executeNaturalLanguageCommand(text: string, source: CommandSource = 'keyboard'): Promise<ArchOSRuntimeResponse | null> {
    if (!text.trim()) return null;

    const commandId = `cmd_${Date.now().toString(36)}`;
    const correlationId = `corr_${Math.random().toString(36).substr(2, 6)}`;
    const activeIdentity = securityFabric.getActiveIdentity();

    // 1. Emit local command.received immediately for instant UI feedback
    eventFabric.emit({
      id: `evt_local_${Date.now()}`,
      type: 'command.received',
      timestamp: new Date().toISOString(),
      correlationId,
      sessionId: activeIdentity.id,
      actor: activeIdentity.id,
      payload: {
        commandId,
        rawText: text,
        source: source === 'voice' ? 'voice' : source === 'gesture' ? 'gesture' : 'keyboard'
      }
    });

    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          commandId,
          sessionId: activeIdentity.id,
          actor: activeIdentity.id,
          tenantId: activeIdentity.tenant
        })
      });

      if (!response.ok) {
        throw new Error(`Command dispatch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result as ArchOSRuntimeResponse;
    } catch (err: any) {
      console.error('[CommandBus] Execution failed:', err);
      eventFabric.emit({
        id: `evt_err_${Date.now()}`,
        type: 'error.occurred',
        timestamp: new Date().toISOString(),
        correlationId,
        sessionId: activeIdentity.id,
        payload: {
          code: 'COMMAND_DISPATCH_FAILURE',
          message: err.message || 'Failed to dispatch command to AIOS runtime'
        }
      });
      return null;
    }
  }

  public async cancelCommand(commandId: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/jarvis/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandId, reason: reason || 'User cancellation from UI' })
      });
      const data = await response.json();
      return data.cancelled === true;
    } catch (err) {
      console.error('[CommandBus] Cancel failed:', err);
      return false;
    }
  }

  public handleSystemEvent = (event: ArchOSCommand): void => {
    switch (event.type) {
      case 'AUTH_SUCCESS':
        voiceService.speak('Authentication verified. Sovereign access granted. All systems nominal.', ARCHOS_VOICES.sovereign);
        break;

      case 'THREAT_DETECTED':
        voiceService.speak('Alert. Anomaly detected in sector four. Initiating defensive protocols.', ARCHOS_VOICES.sovereign);
        break;

      case 'SIMULATION_COMPLETE':
        voiceService.speak('Simulation complete. Structural integrity holds at ninety-eight percent.', ARCHOS_VOICES.synthetic);
        break;

      case 'WORLD_MODEL_SYNC':
        voiceService.speak('World model synchronized. Telemetry streams active.', ARCHOS_VOICES.synthetic);
        break;

      case 'DEFCON_CHANGE':
        if (event.payload?.level === 1) {
          voiceService.speak('Warning. DEFCON 1 activated. Sovereign cyber defenses fully energized.', ARCHOS_VOICES.sovereign);
        } else {
          voiceService.speak('DEFCON status restored to standard monitoring readiness.', ARCHOS_VOICES.synthetic);
        }
        break;

      case 'TELEMETRY_ALERT':
        if (event.payload?.title) {
          voiceService.speak(`Telemetry alert. ${event.payload.title}.`, ARCHOS_VOICES.synthetic);
        }
        break;

      default:
        if (typeof event.payload === 'string') {
          voiceService.speak(event.payload, ARCHOS_VOICES.sovereign);
        }
        break;
    }
  };

  public dispatch(command: ExperienceCommand, source: CommandSource = 'api', rawText?: string): void {
    const activeIdentity = securityFabric.getActiveIdentity();

    // 1. Quantum Encapsulation & Lattice Signature
    const quantumEnvelope = quantumCryptoService.encryptPayload(
      command,
      activeIdentity.tenant,
      'CONFIDENTIAL'
    );

    // 2. Enforce Zero-Trust policy evaluation with Quantum Verification
    const securityCheck = securityFabric.evaluateAndAuthorize({
      toolName: `command.${command.type}`,
      callerIdentity: activeIdentity.id,
      targetResource: `experience.command.${command.type.toLowerCase()}`,
      resourceClassification: 'CONFIDENTIAL',
      domainScope: 'experience.public',
      actionType: command.type === 'SET_PROGRESS' ? 'WRITE' : 'EXECUTE',
      parameters: 'payload' in command ? (command as any).payload : undefined,
      reason: rawText || `Dispatched command ${command.type} via ${source} [Lattice:${quantumEnvelope.header.keyFingerprint.slice(0, 8)}]`,
      requiresQuantumEncapsulation: true
    });

    if (securityCheck.status === 'DENIED') {
      console.warn(`[SecurityFabric] Command ${command.type} BLOCKED by Zero-Trust policy.`);
      return;
    }

    const entry: CommandLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      source,
      command,
      rawText
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Trigger verbal confirmation for relevant commands
    if (command.type === 'OPEN_EXPERIENCE' && command.payload?.id) {
      voiceService.stream(`Loading spatial matrix for ${command.payload.id.replace(/-/g, ' ')}.`);
    }

    this.listeners.forEach((listener) => {
      try {
        listener(command, source, rawText);
      } catch (err) {
        console.error('[CommandBus] Error notifying listener:', err);
      }
    });
  }

  public getHistory(): CommandLogEntry[] {
    return [...this.logs];
  }

  /**
   * Helper to parse natural voice phrases or text utterances into standardized Unified Commands
   */
  public parseVoiceUtterance(phrase: string): ExperienceCommand | null {
    const text = phrase.trim().toLowerCase();

    // Quantum Voice Commands
    if (text.includes('rotate key') || text.includes('rotate quantum') || text.includes('re-key')) {
      quantumCryptoService.rotateKeyPair(false);
      return null;
    }
    if (text.includes('quantum defense') || text.includes('intercept defense') || text.includes('test intercept')) {
      quantumCryptoService.simulateQuantumInterceptDefense();
      return null;
    }
    if (text.includes('kyber') || text.includes('ml-kem')) {
      quantumCryptoService.setAlgorithm('KYBER_1024');
      return null;
    }
    if (text.includes('qkd') || text.includes('bb84') || text.includes('entangled photon')) {
      quantumCryptoService.setAlgorithm('QKD_BB84');
      return null;
    }
    if (text.includes('dilithium') || text.includes('ml-dsa')) {
      quantumCryptoService.setAlgorithm('DILITHIUM_5');
      return null;
    }

    if (text.includes('kinetic') || text.includes('car') || text.includes('gt')) {
      return { type: 'SELECT_EXPERIENCE', payload: { id: 'kinetic-gt' } };
    }
    if (text.includes('orbital') || text.includes('habitat') || text.includes('station') || text.includes('space')) {
      return { type: 'SELECT_EXPERIENCE', payload: { id: 'orbital-habitat' } };
    }
    if (text.includes('botanical') || text.includes('clock') || text.includes('timepiece') || text.includes('watch')) {
      return { type: 'SELECT_EXPERIENCE', payload: { id: 'botanical-clock' } };
    }
    if (text.includes('sound') || text.includes('analogue') || text.includes('turntable') || text.includes('synth')) {
      return { type: 'SELECT_EXPERIENCE', payload: { id: 'analogue-sound-machine' } };
    }
    if (text.includes('city') || text.includes('block') || text.includes('future city') || text.includes('building')) {
      return { type: 'SELECT_EXPERIENCE', payload: { id: 'future-city-block' } };
    }

    if (text.includes('open') || text.includes('enter') || text.includes('explore')) {
      return { type: 'OPEN_EXPERIENCE', payload: { id: '' } };
    }
    if (text.includes('close') || text.includes('exit') || text.includes('return') || text.includes('back')) {
      return { type: 'CLOSE_EXPERIENCE' };
    }
    if (text.includes('next') || text.includes('forward')) {
      return { type: 'NEXT_EXPERIENCE' };
    }
    if (text.includes('previous') || text.includes('prev') || text.includes('backward')) {
      return { type: 'PREV_EXPERIENCE' };
    }

    if (text.includes('assembled') || text.includes('assemble') || text.includes('zero') || text.includes('reset')) {
      return { type: 'SET_PROGRESS', payload: { value: 0 } };
    }
    if (text.includes('halfway') || text.includes('half') || text.includes('50')) {
      return { type: 'SET_PROGRESS', payload: { value: 0.5 } };
    }
    if (text.includes('exploded') || text.includes('explode') || text.includes('disassemble') || text.includes('100')) {
      return { type: 'SET_PROGRESS', payload: { value: 1.0 } };
    }

    if (text.includes('enable gesture') || text.includes('start camera') || text.includes('turn on camera')) {
      return { type: 'ENABLE_GESTURES' };
    }
    if (text.includes('disable gesture') || text.includes('stop camera') || text.includes('turn off camera')) {
      return { type: 'DISABLE_GESTURES' };
    }

    return null;
  }
}

export const commandBus = new UnifiedCommandBus();
