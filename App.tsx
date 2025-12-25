
import React, { useState, useMemo, useEffect } from 'react';
import Controls from './components/Controls';
import BeamVisualizer from './components/BeamVisualizer';
import { BeamParams, BeamModelType, BeamResult, CrossSectionType, UnitSystem } from './types';
import { solveLinearBeam, solveNonlinearBeam, solvePRB1R, solvePRB3R } from './services/beamSolver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Layout } from 'lucide-react';

const App: React.FC = () => {
  // Start in English units as requested
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(UnitSystem.ENGLISH);
  const [sectionType, setSectionType] = useState<CrossSectionType>(CrossSectionType.RECTANGULAR);
  
  // Default dimensions: b=1.25in, h=1/32in (0.03125in)
  const [dimensions, setDimensions] = useState({
    width: 1.25,      // in
    height: 0.03125,  // in
    diameter: 0.5     // in
  });

  // Default physical params: E=30Mpsi, L=20in, P=0.5lbs
  // Internal units are SI: L=20in=0.508m, E=30Mpsi=206.8GPa, P=0.5lb=2.224N
  const [params, setParams] = useState<BeamParams>({
    E: 30 * 6.89476e9, 
    I: 0, // Calculated in useEffect
    L: 20 * 0.0254,
    P: 0.5 * 4.44822, 
    nP: 0,
    M0: 0,
    c: 0, // Calculated in useEffect
    A: 0  // Calculated in useEffect
  });

  const handleToggleUnitSystem = () => {
    setUnitSystem(prev => {
      const next = prev === UnitSystem.METRIC ? UnitSystem.ENGLISH : UnitSystem.METRIC;
      setDimensions(d => {
        if (next === UnitSystem.ENGLISH) {
          // From metric (mm) to english (in)
          return { width: d.width / 25.4, height: d.height / 25.4, diameter: d.diameter / 25.4 };
        } else {
          // From english (in) to metric (mm)
          return { width: d.width * 25.4, height: d.height * 25.4, diameter: d.diameter * 25.4 };
        }
      });
      return next;
    });
  };

  useEffect(() => {
    let newI: number;
    let newC: number;
    let newA: number;
    const isMetric = unitSystem === UnitSystem.METRIC;

    if (sectionType === CrossSectionType.RECTANGULAR) {
      const b = isMetric ? dimensions.width / 1000 : dimensions.width * 0.0254;
      const h = isMetric ? dimensions.height / 1000 : dimensions.height * 0.0254;
      newI = (b * Math.pow(h, 3)) / 12;
      newC = h / 2;
      newA = b * h;
    } else {
      const d = isMetric ? dimensions.diameter / 1000 : dimensions.diameter * 0.0254;
      newI = (Math.PI * Math.pow(d, 4)) / 64;
      newC = d / 2;
      newA = (Math.PI * Math.pow(d, 2)) / 4;
    }

    setParams(prev => ({
      ...prev,
      I: newI,
      c: newC,
      A: newA
    }));
  }, [sectionType, dimensions, unitSystem]);

  const [selectedModels, setSelectedModels] = useState<BeamModelType[]>([
    BeamModelType.LINEAR,
    BeamModelType.NONLINEAR,
    BeamModelType.PRB_1R_CANTILEVER_PNP,
    BeamModelType.PRB_3R_SU
  ]);

  const results = useMemo(() => {
    const res: BeamResult[] = [];
    selectedModels.forEach(model => {
      switch (model) {
        case BeamModelType.LINEAR: res.push(solveLinearBeam(params)); break;
        case BeamModelType.NONLINEAR: res.push(solveNonlinearBeam(params)); break;
        case BeamModelType.PRB_1R_CANTILEVER_P:
        case BeamModelType.PRB_1R_CANTILEVER_PNP:
        case BeamModelType.PRB_1R_MOMENT: res.push(solvePRB1R(params, model)); break;
        case BeamModelType.PRB_3R_SU: res.push(solvePRB3R(params)); break;
      }
    });
    return res;
  }, [params, selectedModels]);

  const chartData = results.map(r => {
    const isMetric = unitSystem === UnitSystem.METRIC;
    const scale = isMetric ? 1 : 1 / 0.0254;
    return {
      name: r.label,
      tipX: parseFloat((r.tipX * scale).toFixed(4)),
      tipY: parseFloat((r.tipY * scale).toFixed(4)),
      tipAngleDeg: parseFloat((r.tipAngle * (180 / Math.PI)).toFixed(2)),
      error: r.label === 'Nonlinear' ? 0 : Math.sqrt(Math.pow(r.tipX - (results.find(n => n.label === 'Nonlinear')?.tipX || r.tipX), 2) + Math.pow(r.tipY - (results.find(n => n.label === 'Nonlinear')?.tipY || r.tipY), 2))
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Compliant Mechanisms PRBM Visualizer</h1>
              <p className="text-xs text-slate-500 font-medium">Pseudo-Rigid-Body Model vs Classical Beam Theories</p>
            </div>
          </div>
          <div className="flex gap-4">
             <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
               {unitSystem} Units Mode
             </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3">
          <Controls 
            params={params} 
            setParams={setParams} 
            selectedModels={selectedModels}
            setSelectedModels={setSelectedModels}
            sectionType={sectionType}
            setSectionType={setSectionType}
            dimensions={dimensions}
            setDimensions={setDimensions}
            unitSystem={unitSystem}
            onToggleUnitSystem={handleToggleUnitSystem}
            results={results}
          />
        </div>

        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <BeamVisualizer results={results} length={params.L} params={params} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Layout size={18} className="text-blue-600" />
                Tip Coordinates Comparison ({unitSystem === UnitSystem.METRIC ? 'm' : 'in'})
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar dataKey="tipX" fill="#3b82f6" name={`X (${unitSystem === UnitSystem.METRIC ? 'm' : 'in'})`} />
                    <Bar dataKey="tipY" fill="#10b981" name={`Y (${unitSystem === UnitSystem.METRIC ? 'm' : 'in'})`} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
               <h3 className="text-lg font-bold text-slate-800 mb-6">Results Summary ({unitSystem === UnitSystem.METRIC ? 'SI' : 'English'})</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="text-slate-500 border-b">
                     <tr>
                       <th className="pb-3 font-semibold">Model</th>
                       <th className="pb-3 font-semibold text-right">X ({unitSystem === UnitSystem.METRIC ? 'm' : 'in'})</th>
                       <th className="pb-3 font-semibold text-right">Y ({unitSystem === UnitSystem.METRIC ? 'm' : 'in'})</th>
                       <th className="pb-3 font-semibold text-right">θ₀ (°)</th>
                       <th className="pb-3 font-semibold text-right">Err (%)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {chartData.map((d, i) => {
                       const nonlinear = chartData.find(x => x.name === 'Nonlinear');
                       const errorPct = nonlinear && d.name !== 'Nonlinear' 
                        ? (d.error / Math.sqrt(Math.pow(nonlinear.tipX / (unitSystem === UnitSystem.METRIC ? 1 : 39.37),2)+Math.pow(nonlinear.tipY / (unitSystem === UnitSystem.METRIC ? 1 : 39.37),2)) * 100).toFixed(2)
                        : "0.00";

                       return (
                         <tr key={i} className="hover:bg-slate-50">
                           <td className="py-3 font-medium text-slate-700">{d.name}</td>
                           <td className="py-3 text-right text-slate-600 font-mono">{d.tipX.toFixed(unitSystem === UnitSystem.METRIC ? 3 : 2)}</td>
                           <td className="py-3 text-right text-slate-600 font-mono">{d.tipY.toFixed(unitSystem === UnitSystem.METRIC ? 3 : 2)}</td>
                           <td className="py-3 text-right text-blue-600 font-mono">{d.tipAngleDeg.toFixed(1)}°</td>
                           <td className="py-3 text-right">
                             <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                               parseFloat(errorPct) < 2 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                             }`}>
                               {errorPct}%
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
               <div className="mt-6 pt-4 border-t text-xs text-slate-400 italic leading-relaxed">
                 *Results are converted to {unitSystem} for display. Internal solvers maintain high-precision SI consistency.
               </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-8 text-center text-slate-400 text-sm">
          Pseudo-Rigid-Body Modeling Tool • Based on the Handbook of Compliant Mechanisms
        </div>
      </footer>
    </div>
  );
};

export default App;
