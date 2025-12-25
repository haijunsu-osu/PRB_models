
export enum BeamModelType {
  LINEAR = 'Linear Theory (Small Deflection)',
  NONLINEAR = 'Nonlinear Theory (Numerical ODE)',
  PRB_1R_CANTILEVER_P = 'PRB 1R: Cantilever Vertical Force (A.1.2)',
  PRB_1R_CANTILEVER_PNP = 'PRB 1R: Cantilever General Force (A.1.3)',
  PRB_1R_MOMENT = 'PRB 1R: Applied Moment (A.1.5)',
  PRB_3R_SU = 'PRB 3R: Combined Force-Moment (Su Table A.5.3)'
}

export enum CrossSectionType {
  RECTANGULAR = 'Rectangular',
  CIRCULAR = 'Circular'
}

export enum UnitSystem {
  METRIC = 'Metric',
  ENGLISH = 'English'
}

export interface PrbParameters {
  gamma?: number;
  k_theta?: number;
  c_theta?: number;
  links?: number[];
  stiffness_coeffs?: number[];
  stiffness_physicals?: number[]; // Torsional spring constants K in N-m/rad
}

export interface BeamParams {
  E: number;      // Young's Modulus (Pa)
  I: number;      // Moment of Inertia (m^4)
  L: number;      // Length (m)
  P: number;      // Vertical Load (N)
  nP: number;     // Horizontal Load (N, where n = nP/P)
  M0: number;     // Applied Moment (N-m)
  c: number;      // Distance to outer fiber (m)
  A: number;      // Cross-sectional Area (m^2)
}

export interface Point {
  x: number;
  y: number;
}

export interface BeamResult {
  points: Point[];
  tipX: number;
  tipY: number;
  tipAngle: number;
  maxStress: number;
  label: string;
  color: string;
  prbParams?: PrbParameters;
}
