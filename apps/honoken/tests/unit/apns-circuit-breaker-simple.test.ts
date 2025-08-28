import { describe, it, expect, beforeEach } from 'vitest';

// Simplified circuit breaker implementation for testing
class CircuitBreaker {
  private failures = new Map<string, { count: number; resetAt: number }>();
  private threshold = 3;
  private resetMs = 5 * 60 * 1000; // 5 minutes

  checkCircuitBreaker(teamId: string, keyId: string) {
    const key = `${teamId}:${keyId}`;
    const failure = this.failures.get(key);
    
    if (!failure) return { open: false };
    
    if (Date.now() >= failure.resetAt) {
      this.failures.delete(key);
      return { open: false };
    }
    
    if (failure.count >= this.threshold) {
      return { 
        open: true, 
        resetAt: failure.resetAt,
        count: failure.count 
      };
    }
    
    return { open: false };
  }
  
  recordAuthFailure(teamId: string, keyId: string) {
    const key = `${teamId}:${keyId}`;
    const existing = this.failures.get(key);
    
    if (existing && Date.now() < existing.resetAt) {
      existing.count++;
    } else {
      this.failures.set(key, {
        count: 1,
        resetAt: Date.now() + this.resetMs
      });
    }
  }
  
  resetAuthFailures(teamId: string, keyId: string) {
    const key = `${teamId}:${keyId}`;
    this.failures.delete(key);
  }

  // Test helper to manually set time
  setFailureResetTime(teamId: string, keyId: string, resetAt: number) {
    const key = `${teamId}:${keyId}`;
    const failure = this.failures.get(key);
    if (failure) {
      failure.resetAt = resetAt;
    }
  }
}

describe('APNs Circuit Breaker - Simple Tests', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker();
  });

  describe('Basic functionality', () => {
    it('should start with circuit closed', () => {
      const result = breaker.checkCircuitBreaker('team1', 'key1');
      expect(result.open).toBe(false);
    });

    it('should remain closed for failures below threshold', () => {
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      
      const result = breaker.checkCircuitBreaker('team1', 'key1');
      expect(result.open).toBe(false);
    });

    it('should open circuit after reaching threshold (3 failures)', () => {
      // Record 3 failures
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      
      const result = breaker.checkCircuitBreaker('team1', 'key1');
      expect(result.open).toBe(true);
      expect(result.count).toBe(3);
    });

    it('should track failures separately per team/key combination', () => {
      // Team1/Key1 - 3 failures (open)
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      
      // Team2/Key1 - 1 failure (closed)
      breaker.recordAuthFailure('team2', 'key1');
      
      // Team1/Key2 - 2 failures (closed)
      breaker.recordAuthFailure('team1', 'key2');
      breaker.recordAuthFailure('team1', 'key2');
      
      expect(breaker.checkCircuitBreaker('team1', 'key1').open).toBe(true);
      expect(breaker.checkCircuitBreaker('team2', 'key1').open).toBe(false);
      expect(breaker.checkCircuitBreaker('team1', 'key2').open).toBe(false);
    });

    it('should reset circuit on successful auth', () => {
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      
      breaker.resetAuthFailures('team1', 'key1');
      
      const result = breaker.checkCircuitBreaker('team1', 'key1');
      expect(result.open).toBe(false);
    });
  });

  describe('Time-based reset', () => {
    it('should close circuit after cooldown period', () => {
      // Open the circuit
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      breaker.recordAuthFailure('team1', 'key1');
      
      expect(breaker.checkCircuitBreaker('team1', 'key1').open).toBe(true);
      
      // Manually set reset time to past
      breaker.setFailureResetTime('team1', 'key1', Date.now() - 1000);
      
      // Should now be closed
      expect(breaker.checkCircuitBreaker('team1', 'key1').open).toBe(false);
    });

    it('should continue counting failures after threshold', () => {
      // Record more than threshold
      for (let i = 0; i < 5; i++) {
        breaker.recordAuthFailure('team1', 'key1');
      }
      
      const result = breaker.checkCircuitBreaker('team1', 'key1');
      expect(result.open).toBe(true);
      expect(result.count).toBe(5);
    });
  });
});