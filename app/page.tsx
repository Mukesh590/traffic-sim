'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Controls from './components/Controls';
import MetricsDashboard from './components/MetricsDashboard';
import {
  createInitialState, stepSimulation, computeMetrics, SimState, GRID_SIZE, CELL_SIZE,
} from './lib/simulation';

const TrafficCanvas = dynamic(() => import('./components/TrafficCanvas'), { ssr: false });

export default function Home() {
  const [state, setState] = useState<SimState>(createInitialState);
  const [fixedState, setFixedState] = useState<SimState>(() => ({ ...createInitialState(), aiMode: false }));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [spawnRate, setSpawnRate] = useState(0.08);
  const [aiMode, setAiMode] = useState(true);

  const stateRef = useRef(state);
  const fixedRef = useRef(fixedState);
  const runningRef = useRef(running);
  const speedRef = useRef(speed);
  const spawnRef = useRef(spawnRate);
  const aiRef = useRef(aiMode);

  stateRef.current = state;
  fixedRef.current = fixedState;
  runningRef.current = running;
  speedRef.current = speed;
  spawnRef.current = spawnRate;
  aiRef.current = aiMode;

  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const steps = speedRef.current;
    let s = stateRef.current;
    let f = fixedRef.current;
    for (let i = 0; i < steps; i++) {
      s = stepSimulation(s, spawnRef.current, aiRef.current);
      f = stepSimulation(f, spawnRef.current, false);
    }
    setState(s);
    setFixedState(f);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, tick]);

  const handleReset = () => {
    setState(createInitialState());
    setFixedState({ ...createInitialState(), aiMode: false });
    setRunning(false);
  };

  const metrics = computeMetrics(state, fixedState.completed, fixedState.totalWaitAccum);

  const W = GRID_SIZE * CELL_SIZE;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 20%, #0a0f2e 0%, #050810 60%)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#00f5ff',
            textShadow: '0 0 20px #00f5ff88', margin: 0, letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            Traffic Flow AI
          </h1>
          <p style={{ fontSize: 12, color: '#475569', margin: '2px 0 0', letterSpacing: 1 }}>
            Real-time intersection optimization · 10×10 grid · 100 intersections
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Next.js', 'Canvas API', 'AI Algo'].map(tag => (
            <span key={tag} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 99,
              border: '1px solid #00f5ff33', color: '#00f5ff88',
              textTransform: 'uppercase', letterSpacing: 1,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${W}px 1fr`,
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Canvas */}
        <div>
          <TrafficCanvas state={state} />
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 280 }}>
          <Controls
            running={running}
            speed={speed}
            spawnRate={spawnRate}
            aiMode={aiMode}
            onToggleRun={() => setRunning(r => !r)}
            onReset={handleReset}
            onSpeedChange={setSpeed}
            onSpawnChange={setSpawnRate}
            onToggleAI={() => setAiMode(m => !m)}
          />
          <MetricsDashboard
            metrics={{
              ...metrics,
              totalCars: state.cars.length,
              completed: state.completed,
              aiMode,
              tick: state.tick,
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { color: '#00f5ff', label: 'Cyan car — moving' },
          { color: '#00ff88', label: 'Green light — go' },
          { color: '#ff4444', label: 'Red light — stop' },
          { color: '#f59e0b', label: 'Waiting car' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
