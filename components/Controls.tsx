
import React, { useState } from 'react';
import { BeamParams, BeamModelType, CrossSectionType, UnitSystem, BeamResult } from '../types';
import { Settings, Play, Info, Square, Circle, Ruler, List, Hash } from 'lucide-react';

interface ControlsProps {
  params: BeamParams;
  setParams: (p: BeamParams) => void;
  selectedModels: BeamModelType[];
  setSelectedModels: (m: BeamModelType[]) => void;
  sectionType: CrossSectionType;
  setSectionType: (t: CrossSectionType) => void;
  dimensions: { width: number; height: number; diameter: number };
  setDimensions: (d: { width: number; height: number; diameter: number }) => void;
  unitSystem: UnitSystem;
  onToggleUnitSystem: () => void;
  results: BeamResult[];
}

const Controls: React.FC<ControlsProps> = ({ 
  params, 
  setParams, 
  selectedModels, 
  setSelectedModels,
  sectionType,
  setSectionType,
  dimensions,
  setDimensions,
  unitSystem,
  onToggleUnitSystem,
  results
}) => {
  const [activeTab, setActiveTab] = useState<'selection' | 'parameters'>('selection');
  const isMetric = unitSystem === UnitSystem.METRIC;

  const handleNumericChange = (name: string, value: string) => {
    const val = parseFloat(value);
    if (isNaN(val)) return;

    if (name === 'L') {
      setParams({ ...params, L: isMetric ? val : val * 0.0254 });
    } else if (name === 'P') {
      setParams({ ...params, P: isMetric ? val : val * 4.44822 });
    } else if (name === 'nP') {
      setParams({ ...params, nP: isMetric ? val : val * 4.44822 });
    } else if (name === 'M0') {
      setParams({ ...params, M0: isMetric ? val : val * 0.112985 });
    }
  };

  const handleDimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const val = parseFloat(value);
    if (!isNaN(val)) {
      setDimensions({ ...dimensions, [name]: val });
    }
  };

  const toggleModel = (model: BeamModelType) => {
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter(m => m !== model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const uiL = isMetric ? params.L : params.L / 0.0254;
  const uiP = isMetric ? params.P : params.P / 4.44822;
  const uiNP = isMetric ? params.nP : params.nP / 4.44822;
  const uiM0 = isMetric ? params.M0 : params.M0 / 0.112985;
  const uiE = isMetric ? params.E / 1e9 : params.E / 6.89476e9;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-full overflow-y-auto max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          <Settings className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Parameters</h2>
        </div>
        <button 
          onClick={onToggleUnitSystem}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors"
        >
          <Ruler size={14} />
          {unitSystem}
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Cross Section</h3>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSectionType(CrossSectionType.RECTANGULAR)}
              className={`flex-1 py-2 px-3 rounded-md border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                sectionType === CrossSectionType.RECTANGULAR 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Square size={16} /> Rect
            </button>
            <button
              onClick={() => setSectionType(CrossSectionType.CIRCULAR)}
              className={`flex-1 py-2 px-3 rounded-md border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                sectionType === CrossSectionType.CIRCULAR 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Circle size={16} /> Circ
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
            {sectionType === CrossSectionType.RECTANGULAR ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Width (b) [{isMetric ? 'mm' : 'in'}]</label>
                  <input 
                    type="number" 
                    name="width" 
                    value={dimensions.width} 
                    onChange={handleDimChange} 
                    onFocus={onInputFocus}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-shadow font-mono" 
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Height (h) [{isMetric ? 'mm' : 'in'}]</label>
                  <input 
                    type="number" 
                    name="height" 
                    value={dimensions.height} 
                    onChange={handleDimChange} 
                    onFocus={onInputFocus}
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-shadow font-mono" 
                    step="any"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Diameter (d) [{isMetric ? 'mm' : 'in'}]</label>
                <input 
                  type="number" 
                  name="diameter" 
                  value={dimensions.diameter} 
                  onChange={handleDimChange} 
                  onFocus={onInputFocus}
                  className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 outline-none transition-shadow font-mono" 
                  step="any"
                />
              </div>
            )}
            <div className="col-span-2 pt-2 border-t border-slate-200">
               <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>I: {isMetric ? (params.I * 1e12).toFixed(2) : (params.I / 1.746e-7).toFixed(6)} {isMetric ? 'mm⁴' : 'in⁴'}</span>
                  <span>c: {isMetric ? (params.c * 1000).toFixed(2) : (params.c / 0.0254).toFixed(4)} {isMetric ? 'mm' : 'in'}</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Length (L) [{isMetric ? 'm' : 'in'}]</label>
              <input 
                type="number" 
                name="L" 
                value={Number(uiL.toFixed(4))} 
                onChange={(e) => handleNumericChange('L', e.target.value)} 
                onFocus={onInputFocus}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-mono" 
                step="any"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stiffness (E) [{isMetric ? 'GPa' : 'Mpsi'}]</label>
              <input 
                type="number" 
                name="E_gpa" 
                value={Number(uiE.toFixed(2))} 
                onChange={(e) => setParams({...params, E: parseFloat(e.target.value) * (isMetric ? 1e9 : 6.89476e9)})} 
                onFocus={onInputFocus}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow font-mono" 
                step="any"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Loading</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">Vertical Load (P)</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={Number(uiP.toFixed(4))} 
                    onChange={(e) => handleNumericChange('P', e.target.value)}
                    onFocus={onInputFocus}
                    className="w-20 px-1 py-0.5 text-right text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                    step="any"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">{isMetric ? 'N' : 'lbf'}</span>
                </div>
              </div>
              <input type="range" name="P" min={isMetric ? -200 : -45} max={isMetric ? 200 : 45} step={0.01} value={uiP} onChange={(e) => handleNumericChange('P', e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">Horizontal (nP)</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={Number(uiNP.toFixed(4))} 
                    onChange={(e) => handleNumericChange('nP', e.target.value)}
                    onFocus={onInputFocus}
                    className="w-20 px-1 py-0.5 text-right text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                    step="any"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">{isMetric ? 'N' : 'lbf'}</span>
                </div>
              </div>
              <input type="range" name="nP" min={isMetric ? -200 : -45} max={isMetric ? 200 : 45} step={0.01} value={uiNP} onChange={(e) => handleNumericChange('nP', e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">Tip Moment (M₀)</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={Number(uiM0.toFixed(4))} 
                    onChange={(e) => handleNumericChange('M0', e.target.value)}
                    onFocus={onInputFocus}
                    className="w-20 px-1 py-0.5 text-right text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                    step="any"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">{isMetric ? 'N-m' : 'lbf-in'}</span>
                </div>
              </div>
              <input type="range" name="M0" min={isMetric ? -20 : -175} max={isMetric ? 20 : 175} step={0.01} value={uiM0} onChange={(e) => handleNumericChange('M0', e.target.value)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>
          </div>
        </section>

        <section className="pt-4 border-t">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mb-4">
             <button 
               onClick={() => setActiveTab('selection')}
               className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'selection' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <List size={14} /> Models
             </button>
             <button 
               onClick={() => setActiveTab('parameters')}
               className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'parameters' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Hash size={14} /> PRB Data
             </button>
          </div>

          {activeTab === 'selection' ? (
            <div className="grid grid-cols-1 gap-2">
              {Object.values(BeamModelType).map((model) => (
                <button
                  key={model}
                  onClick={() => toggleModel(model)}
                  className={`text-left px-4 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedModels.includes(model)
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{model}</span>
                    {selectedModels.includes(model) && <Play size={12} fill="currentColor" />}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {results.filter(r => r.prbParams).map((r, i) => {
                const stiffnessScale = isMetric ? 1.0 : 8.85075; // N-m to lbf-in
                const stiffnessUnit = isMetric ? 'N-m/rad' : 'lbf-in/rad';

                return (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2 border-b pb-1">{r.label}</h4>
                    <div className="grid grid-cols-1 gap-2 text-[11px]">
                      {r.prbParams?.gamma !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 italic">γ (Characteristic radius)</span>
                          <span className="font-mono font-bold text-blue-700">{r.prbParams.gamma.toFixed(4)}</span>
                        </div>
                      )}
                      {r.prbParams?.k_theta !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 italic">K_θ (Non-dim stiffness)</span>
                          <span className="font-mono font-bold text-blue-700">{r.prbParams.k_theta.toFixed(4)}</span>
                        </div>
                      )}
                      
                      {/* Physical Spring Constant K */}
                      {r.prbParams?.stiffness_physicals?.map((k, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-1 rounded border border-slate-100 shadow-sm mt-1">
                          <span className="text-slate-600 font-semibold">{r.prbParams?.stiffness_physicals?.length === 1 ? 'K' : `K${idx + 1}`}</span>
                          <span className="font-mono text-emerald-600 font-bold">
                            {(k * stiffnessScale).toExponential(3)} <span className="text-[9px] font-sans text-slate-400">{stiffnessUnit}</span>
                          </span>
                        </div>
                      ))}

                      {r.prbParams?.c_theta !== undefined && (
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-500 italic">c_θ (Tip angle factor)</span>
                          <span className="font-mono font-bold text-blue-700">{r.prbParams.c_theta.toFixed(4)}</span>
                        </div>
                      )}
                      
                      {r.prbParams?.links && (
                        <div className="col-span-1 pt-1 mt-1 border-t border-slate-200 border-dashed">
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-500 italic">Link Ratios (g0-g3)</span>
                            <span className="font-mono text-[9px] text-blue-700">[{r.prbParams.links.join(', ')}]</span>
                          </div>
                        </div>
                      )}
                      {r.prbParams?.stiffness_coeffs && (
                        <div className="col-span-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500 italic">Non-dim K_ci</span>
                            <span className="font-mono text-[9px] text-blue-700">[{r.prbParams.stiffness_coeffs.join(', ')}]</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {results.filter(r => r.prbParams).length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Select a PRB model to see its coefficients.
                </div>
              )}
            </div>
          )}
        </section>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex gap-3">
          <Info className="text-amber-600 shrink-0" size={20} />
          <p className="text-[10px] text-amber-800 leading-relaxed">
            PRB models approximate nonlinear deflection with rigid links. {isMetric ? 'Rectangular I = bh³/12. Circular I = πd⁴/64.' : 'English units use inches and lbf for calculations.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Controls;
