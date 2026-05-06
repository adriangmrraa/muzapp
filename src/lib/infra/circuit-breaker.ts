export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly cooldownMs = 60000;

  private get isOpen(): boolean {
    if (this.failures < this.threshold) return false;

    const elapsed = Date.now() - this.lastFailureTime;
    if (elapsed >= this.cooldownMs) {
      this.failures = 0;
      return false;
    }

    return true;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      throw new Error("Servicio no disponible");
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailureTime = Date.now();
      throw err;
    }
  }
}

export const openaiCircuitBreaker = new CircuitBreaker();
