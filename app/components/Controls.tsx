'use client';

interface Props {
  running: boolean;
  speed: number;
  spawnRate: number;
  aiMode: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onSpeedChange: (v: number) => void;
  onSpawnChange: (v: number) => void;
  onToggleAI: () => void;
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#00f5ff' }}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#00f5ff', cursor: 'pointer' }}
      />
    </div>
  );
}

export default function Controls({
  running, speed, spawnRate, aiMode,
  onToggleRun, onReset, onSpeedChange, onSpawnChange, onToggleAI,
}: Props) {
  return (
    <div style={{
      background: '#0a0f1e',
      border: '1px solid #00f5ff22',
      borderRadius: 8,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Controls</div>

      {/* Run / Stop / Reset */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onToggleRun}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Courier New, monospace',
            background: running ? '#ff444422' : '#00f5ff22',
            color: running ? '#ff6b6b' : '#00f5ff',
            boxShadow: running ? '0 0 12px #ff444444' : '0 0 12px #00f5ff44',
            transition: 'all 0.2s',
          }}
        >
          {running ? '⏸ PAUSE' : '▶ START'}
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            border: '1px solid #334155',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'Courier New, monospace',
            background: 'transparent',
            color: '#64748b',
            transition: 'all 0.2s',
          }}
        >
          ↺ RESET
        </button>
      </div>

      {/* AI Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
          AI Optimization
        </span>
        <button
          onClick={onToggleAI}
          style={{
            position: 'relative', width: 44, height: 24, borderRadius: 12,
            border: 'none', cursor: 'pointer',
            background: aiMode ? '#00f5ff33' : '#1e293b',
            boxShadow: aiMode ? '0 0 10px #00f5ff44' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: aiMode ? 23 : 3,
            width: 18, height: 18, borderRadius: 9,
            background: aiMode ? '#00f5ff' : '#475569',
            transition: 'left 0.2s',
            boxShadow: aiMode ? '0 0 8px #00f5ff' : 'none',
          }} />
        </button>
      </div>

      <Slider
        label="Sim Speed"
        value={speed}
        min={1} max={10} step={1}
        onChange={onSpeedChange}
        format={v => `${v}×`}
      />

      <Slider
        label="Spawn Rate"
        value={spawnRate}
        min={0.01} max={0.3} step={0.01}
        onChange={onSpawnChange}
        format={v => `${(v * 60).toFixed(0)}/min`}
      />
    </div>
  );
}
