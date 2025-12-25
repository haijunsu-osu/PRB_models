
import React from 'react';
import { BeamResult, Point, BeamParams } from '../types';

interface BeamVisualizerProps {
  results: BeamResult[];
  length: number;
  params: BeamParams;
}

const BeamVisualizer: React.FC<BeamVisualizerProps> = ({ results, length, params }) => {
  const width = 800;
  const height = 400;
  const svgAspect = width / height;

  // 1. Determine "True Scale" Bounds with padding
  const allPoints = results.flatMap(r => r.points);
  const rawMinX = Math.min(0, ...allPoints.map(p => p.x));
  const rawMaxX = Math.max(length, ...allPoints.map(p => p.x));
  const rawMinY = Math.min(0, ...allPoints.map(p => p.y));
  const rawMaxY = Math.max(0, ...allPoints.map(p => p.y));

  const centerX = (rawMinX + rawMaxX) / 2;
  const centerY = (rawMinY + rawMaxY) / 2;
  
  let rangeX = (rawMaxX - rawMinX) || length;
  let rangeY = (rawMaxY - rawMinY) || (length / 2);

  const paddingFactor = 1.4;
  rangeX *= paddingFactor;
  rangeY *= paddingFactor;

  let viewRangeX, viewRangeY;
  if (rangeX / rangeY > svgAspect) {
    viewRangeX = rangeX;
    viewRangeY = rangeX / svgAspect;
  } else {
    viewRangeY = rangeY;
    viewRangeX = rangeY * svgAspect;
  }

  const minX = centerX - viewRangeX / 2;
  const maxX = centerX + viewRangeX / 2;
  const minY = centerY - viewRangeY / 2;
  const maxY = centerY + viewRangeY / 2;

  const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * width;
  const scaleY = (y: number) => height - ((y - minY) / (maxY - minY)) * height;

  const renderPath = (points: Point[], color: string, isRigid: boolean) => {
    if (points.length < 2) return null;
    
    if (isRigid) {
      return (
        <g>
          {points.slice(0, -1).map((p, i) => (
            <line
              key={i}
              x1={scaleX(p.x)}
              y1={scaleY(p.y)}
              x2={scaleX(points[i+1].x)}
              y2={scaleY(points[i+1].y)}
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
          {points.map((p, i) => (
            <circle
              key={`j-${i}`}
              cx={scaleX(p.x)}
              cy={scaleY(p.y)}
              r="3.5"
              fill="white"
              stroke={color}
              strokeWidth="1.5"
            />
          ))}
        </g>
      );
    }

    const d = points.reduce((acc, p, i) => 
      acc + `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)} `, ""
    );

    return (
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  const majorStep = length * 0.1; 
  const minorStep = length * 0.02; 
  
  const generateGrids = (step: number) => {
    const x = [];
    for (let i = Math.floor(minX / step) * step; i <= maxX; i += step) x.push(i);
    const y = [];
    for (let i = Math.floor(minY / step) * step; i <= maxY; i += step) y.push(i);
    return { x, y };
  };

  const major = generateGrids(majorStep);
  const minor = generateGrids(minorStep);

  // Load Resultant Force Vector Components
  // Physics Force: (nP, P). Horizontal = nP, Vertical = P.
  // SVG axis: X is same as physics, Y is flipped (positive P is up in physics, which is negative Y in SVG).
  const F_mag = Math.sqrt(Math.pow(params.nP, 2) + Math.pow(params.P, 2));
  
  // Normalized vector in SVG coordinates pointing ALONG the force direction
  let ux = 0, uy = 0;
  if (F_mag > 1e-12) {
    ux = params.nP / F_mag;
    uy = -params.P / F_mag; // Negate P because SVG Y increases downwards
  }

  // Anchor at the tip of the first selected model (typically Nonlinear)
  const anchorModel = results.find(r => r.label === 'Nonlinear') || results[0];
  const tipX = anchorModel ? anchorModel.tipX : length;
  const tipY = anchorModel ? anchorModel.tipY : 0;
  const sx = scaleX(tipX);
  const sy = scaleY(tipY);

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-100 font-semibold text-lg flex items-center gap-2">
          Beam Deflection Canvas (True Scale 1:1)
        </h3>
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 text-[10px] max-w-md">
          {results.map(r => (
            <div key={r.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
              <span className="text-slate-400 font-medium whitespace-nowrap">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-900 rounded-lg shadow-inner border border-slate-800">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          <marker id="arrowhead-force" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orientation="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#f87171" />
          </marker>
        </defs>

        {/* --- GRID SYSTEM (RENDERED FIRST AS BACKGROUND) --- */}
        {/* Minor Grid Lines */}
        <g className="minor-grid" stroke="#1a222e" strokeWidth="0.5">
          {minor.x.map(x => <line key={`mix-${x}`} x1={scaleX(x)} y1="0" x2={scaleX(x)} y2={height} />)}
          {minor.y.map(y => <line key={`miy-${y}`} x1="0" y1={scaleY(y)} x2={width} y2={scaleY(y)} />)}
        </g>

        {/* Major Grid Lines (10%) */}
        <g className="major-grid" stroke="#252f3f" strokeWidth="1">
          {major.x.map(x => (
            <line 
              key={`mjx-${x}`} 
              x1={scaleX(x)} y1="0" x2={scaleX(x)} y2={height} 
              strokeDasharray={x === 0 ? "0" : "4 4"}
            />
          ))}
          {major.y.map(y => (
            <line 
              key={`mjy-${y}`} 
              x1="0" y1={scaleY(y)} x2={width} y2={scaleY(y)} 
              strokeDasharray={y === 0 ? "0" : "4 4"}
            />
          ))}
        </g>

        {/* Main Origin Axes */}
        <line x1={scaleX(minX)} y1={scaleY(0)} x2={scaleX(maxX)} y2={scaleY(0)} stroke="#334155" strokeWidth="1.5" />
        <line x1={scaleX(0)} y1={scaleY(minY)} x2={scaleX(0)} y2={scaleY(maxY)} stroke="#334155" strokeWidth="1.5" />

        {/* Undeflected Beam Reference */}
        <line 
          x1={scaleX(0)} 
          y1={scaleY(0)} 
          x2={scaleX(length)} 
          y2={scaleY(0)} 
          stroke="white" 
          strokeWidth="2" 
          strokeDasharray="8,5" 
          opacity="0.25"
        />

        {/* Fixed Support Representation */}
        <rect 
          x={scaleX(0) - 10} 
          y={scaleY(length * 0.12)} 
          width="10" 
          height={Math.abs(scaleY(-length * 0.12) - scaleY(length * 0.12))} 
          fill="#475569" 
          rx="2"
        />
        
        {/* --- BEAM MODELS --- */}
        {results.map((res, idx) => (
          <g key={idx}>{renderPath(res.points, res.color, res.label.includes('PRB'))}</g>
        ))}

        {/* --- LOAD INDICATORS (OVERLAYS) --- */}
        {anchorModel && F_mag > 1e-12 && (
          <g>
            {/* The force vector is drawn pointing TOWARDS the tip. 
                So it starts at tip - 60px*dir and ends at tip - 5px*dir. */}
            <line 
              x1={sx - 60 * ux} 
              y1={sy - 60 * uy} 
              x2={sx - 5 * ux} 
              y2={sy - 5 * uy} 
              stroke="#f87171" 
              strokeWidth="2.5" 
              markerEnd="url(#arrowhead-force)" 
            />
            <text 
              x={sx - 75 * ux} 
              y={sy - 75 * uy} 
              fill="#f87171" 
              fontSize="12" 
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              F
            </text>
          </g>
        )}

        {anchorModel && Math.abs(params.M0) > 1e-12 && (
          <g transform={`translate(${sx}, ${sy}) rotate(${params.M0 > 0 ? 0 : 180})`}>
            <path 
              d="M -22,-22 A 30,30 0 1,1 22,-22" 
              fill="none" 
              stroke="#64748b" 
              strokeWidth="2" 
              strokeDasharray="4,2" 
              markerEnd="url(#arrowhead)"
            />
            <text 
              x="40" y="-40" 
              fill="#64748b" fontSize="11" fontWeight="bold" 
              transform={`rotate(${params.M0 > 0 ? 0 : -180})`}
            >
              M₀
            </text>
          </g>
        )}

        {/* Scale Legend */}
        <text x={width - 15} y={height - 15} textAnchor="end" fill="#475569" fontSize="9">
          True Scale • Grid Step: { (majorStep * (params.L > 1 ? 1 : 1/0.0254)).toFixed(2) }{params.L > 1 ? 'm' : 'in'}
        </text>
      </svg>
    </div>
  );
};

export default BeamVisualizer;
