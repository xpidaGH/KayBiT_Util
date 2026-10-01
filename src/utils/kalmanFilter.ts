/**
 * Linear 1D/2D Kalman Filter for Telemetry & IMU fusion
 * Simulates the Phase 2 C++ NDK native math engine.
 * State vector x = [position, velocity, acceleration]^T
 */

export interface KalmanState {
  x: number; // estimated position (lat/lon/alt)
  v: number; // estimated velocity
  a: number; // estimated acceleration
  p: number; // covariance error estimate
}

export class TelemetryKalmanFilter {
  private x: number;
  private v: number;
  private a: number;
  private p: number;
  private q: number; // process noise covariance
  private r: number; // measurement noise covariance
  private lastTimestamp: number;

  constructor(
    initialValue: number = 0,
    processNoise: number = 0.08,
    measurementNoise: number = 0.75
  ) {
    this.x = initialValue;
    this.v = 0;
    this.a = 0;
    this.p = 1.0;
    this.q = processNoise;
    this.r = measurementNoise;
    this.lastTimestamp = performance.now();
  }

  public update(measurement: number, timestampMs: number = performance.now()): {
    estimated: number;
    velocity: number;
    acceleration: number;
    gainK: number;
    residual: number;
  } {
    const dt = Math.max(0.001, (timestampMs - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestampMs;

    // 1. Time Update (Predict)
    // x_k|k-1 = x_k-1 + v*dt + 0.5*a*dt^2
    const xPredict = this.x + this.v * dt + 0.5 * this.a * dt * dt;
    // Update velocity
    const vPredict = this.v + this.a * dt;
    // Error covariance prediction: P_k|k-1 = P_k-1 + Q
    const pPredict = this.p + this.q;

    // 2. Measurement Update (Correct)
    // Innovation (residual)
    const residual = measurement - xPredict;
    // Kalman Gain: K = P / (P + R)
    const k = pPredict / (pPredict + this.r);

    // Update state estimate: x_k = x_k|k-1 + K * y
    this.x = xPredict + k * residual;
    this.v = vPredict + (k / dt) * residual * 0.4;
    this.a = (this.v - vPredict) / dt;

    // Update covariance estimate: P_k = (1 - K) * P_k|k-1
    this.p = (1 - k) * pPredict;

    return {
      estimated: this.x,
      velocity: this.v,
      acceleration: this.a,
      gainK: k,
      residual,
    };
  }

  public setParameters(q: number, r: number) {
    this.q = Math.max(0.0001, q);
    this.r = Math.max(0.0001, r);
  }

  public getState(): KalmanState {
    return {
      x: this.x,
      v: this.v,
      a: this.a,
      p: this.p,
    };
  }
}
