
import { BeamParams, Point, BeamResult, BeamModelType, PrbParameters } from '../types';

/**
 * Solves the Bernoulli-Euler beam equation using RK4 numerical integration.
 */
export function solveNonlinearBeam(params: BeamParams): BeamResult {
  const { E, I, L, P, nP, M0 } = params;
  const EI = E * I;
  
  if (EI === 0) return { points: [], tipX: 0, tipY: 0, tipAngle: 0, maxStress: 0, label: 'Nonlinear', color: '#ef4444' };

  let a = L; 
  let b = 0; 
  let points: Point[] = [];
  let finalTheta = 0;
  
  const steps = 100;
  const ds = L / steps;

  for (let iter = 0; iter < 15; iter++) {
    points = [{ x: 0, y: 0 }];
    let x = 0;
    let y = 0;
    let theta = 0;

    for (let i = 0; i < steps; i++) {
      const getDerivatives = (cx: number, cy: number, ct: number) => {
        const M = P * (a - cx) + nP * (b - cy) + M0;
        return { dx: Math.cos(ct), dy: Math.sin(ct), dt: M / EI };
      };

      const k1 = getDerivatives(x, y, theta);
      const k2 = getDerivatives(x + k1.dx * ds / 2, y + k1.dy * ds / 2, theta + k1.dt * ds / 2);
      const k3 = getDerivatives(x + k2.dx * ds / 2, y + k2.dy * ds / 2, theta + k2.dt * ds / 2);
      const k4 = getDerivatives(x + k3.dx * ds, y + k3.dy * ds, theta + k3.dt * ds);

      x += (ds / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
      y += (ds / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
      theta += (ds / 6) * (k1.dt + 2 * k2.dt + 2 * k3.dt + k4.dt);
      
      points.push({ x, y });
    }

    finalTheta = theta;
    const last = points[points.length - 1];
    const errorX = last.x - a;
    const errorY = last.y - b;
    if (Math.abs(errorX) < 1e-6 && Math.abs(errorY) < 1e-6) break;
    a += errorX * 0.5;
    b += errorY * 0.5;
  }

  const tip = points[points.length - 1];
  return {
    points,
    tipX: tip.x,
    tipY: tip.y,
    tipAngle: finalTheta,
    maxStress: Math.abs((P * a + nP * b + M0) * params.c / I),
    label: 'Nonlinear',
    color: '#ef4444' // Red
  };
}

export function solveLinearBeam(params: BeamParams): BeamResult {
  const { E, I, L, P, M0 } = params;
  const EI = E * I;
  const points: Point[] = [];
  const steps = 50;
  
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * L;
    const y = (P * Math.pow(x, 2) / (6 * EI)) * (3 * L - x) + (M0 * Math.pow(x, 2)) / (2 * EI);
    points.push({ x, y });
  }

  const tip = points[points.length - 1];
  return {
    points,
    tipX: L,
    tipY: tip.y,
    tipAngle: (P * L * L) / (2 * EI) + (M0 * L) / EI,
    maxStress: Math.abs((P * L + M0) * params.c / I),
    label: 'Linear',
    color: '#3b82f6' // Blue
  };
}

export function solvePRB1R(params: BeamParams, type: BeamModelType): BeamResult {
  const { E, I, L, P, nP, M0 } = params;
  const EI = E * I;
  let gamma = 0.85;
  let K_theta = 2.65;
  let c_theta = 1.24; 
  let n = P !== 0 ? nP / P : 0;
  let label = "";
  let color = "";

  if (type === BeamModelType.PRB_1R_CANTILEVER_P) {
    gamma = 0.8517;
    K_theta = 2.6706;
    c_theta = 1.2407;
    label = "PRB 1R (P)";
    color = "#22c55e"; // Bright Green
  } else if (type === BeamModelType.PRB_1R_CANTILEVER_PNP) {
    if (n > -1.83) {
      gamma = 0.8521 - 0.0183 * n;
      K_theta = 2.65;
    } else {
      gamma = 0.9123 + 0.0146 * n;
      K_theta = 2.65;
    }
    gamma = Math.max(0.7, Math.min(0.95, gamma));
    c_theta = 1.24; 
    label = "PRB 1R (nP)";
    color = "#f59e0b"; // Amber / Orange
  } else if (type === BeamModelType.PRB_1R_MOMENT) {
    gamma = 0.7346;
    K_theta = 1.5164;
    c_theta = 1.0;
    label = "PRB 1R (M)";
    color = "#ec4899"; // Pink
  }

  const K = gamma * K_theta * (EI / L);
  let Theta = 0;
  for (let i = 0; i < 30; i++) {
    const f = K * Theta - (P * gamma * L * Math.cos(Theta) + nP * gamma * L * Math.sin(Theta) + M0);
    const df = K + P * gamma * L * Math.sin(Theta) - nP * gamma * L * Math.cos(Theta);
    const delta = f / df;
    Theta -= delta * 0.8;
    if (Math.abs(delta) < 1e-8) break;
  }

  const a = L * (1 - gamma) + gamma * L * Math.cos(Theta);
  const b = gamma * L * Math.sin(Theta);

  return {
    points: [{ x: 0, y: 0 }, { x: L * (1 - gamma), y: 0 }, { x: a, y: b }],
    tipX: a,
    tipY: b,
    tipAngle: c_theta * Theta,
    maxStress: 0,
    label,
    color,
    prbParams: { 
      gamma, 
      k_theta: K_theta, 
      c_theta,
      stiffness_physicals: [K]
    }
  };
}

export function solvePRB3R(params: BeamParams): BeamResult {
  const { E, I, L, P, nP, M0 } = params;
  const EI = E * I;
  
  // Su Table A.5.3 parameters
  const g0 = 0.1, g1 = 0.35, g2 = 0.40, g3 = 0.15;
  const K_c1 = 3.51, K_c2 = 2.99, K_c3 = 2.58;
  const K1 = K_c1 * (EI / L), K2 = K_c2 * (EI / L), K3 = K_c3 * (EI / L);

  let T1 = 0.0, T2 = 0.0, T3 = 0.0;

  // Solving equilibrium for 3R segments
  for(let iter = 0; iter < 150; iter++) {
    const a = L * (g0 + g1 * Math.cos(T1) + g2 * Math.cos(T1+T2) + g3 * Math.cos(T1+T2+T3));
    const b = L * (g1 * Math.sin(T1) + g2 * Math.sin(T1+T2) + g3 * Math.sin(T1+T2+T3));
    
    const x1 = g0*L + g1*L*Math.cos(T1);
    const y1 = g1*L*Math.sin(T1);
    const x2 = x1 + g2*L*Math.cos(T1+T2);
    const y2 = y1 + g2*L*Math.sin(T1+T2);

    const M1 = P * (a - g0*L) + nP * (b - 0) + M0;
    const M2 = P * (a - x1) + nP * (b - y1) + M0;
    const M3 = P * (a - x2) + nP * (b - y2) + M0;

    T1 += (M1/K1 - T1) * 0.1;
    T2 += (M2/K2 - T2) * 0.1;
    T3 += (M3/K3 - T3) * 0.1;
  }

  const p1 = { x: g0 * L, y: 0 };
  const p2 = { x: p1.x + g1 * L * Math.cos(T1), y: p1.y + g1 * L * Math.sin(T1) };
  const p3 = { x: p2.x + g2 * L * Math.cos(T1 + T2), y: p2.y + g2 * L * Math.sin(T1 + T2) };
  const p4 = { x: p3.x + g3 * L * Math.cos(T1 + T2 + T3), y: p3.y + g3 * L * Math.sin(T1 + T2 + T3) };

  return {
    points: [{ x: 0, y: 0 }, p1, p2, p3, p4],
    tipX: p4.x,
    tipY: p4.y,
    tipAngle: T1 + T2 + T3,
    maxStress: 0,
    label: 'PRB 3R',
    color: '#8b5cf6', // Violet
    prbParams: { 
      links: [g0, g1, g2, g3],
      stiffness_coeffs: [K_c1, K_c2, K_c3],
      stiffness_physicals: [K1, K2, K3]
    }
  };
}
