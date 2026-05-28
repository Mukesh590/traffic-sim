'use client';

interface Metrics {
  congestion: number;
  avgWait: number;
  throughput: number;
  waitingCars: number;
  totalCars: number;
  completed: number;
  fixedAvgWait: number;
  aiMode: boolean;
  tick: number;
}

interface Props {
  metrics: Metrics;
}

function MetricCard({ label, value, unit, color, sub }: {
  label: string;
  value: string;
  unit?: string;
  color: string;
  sub?: string;
}) {
  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 16px', background: '#0a0f1e' }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, textShadow: `0 0 12px ${color}88` }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12, color: '#64748b' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function CongestionBar({ value }: { value: number }) {
  const color = value < 30 ? '#00ff88' : value < 60 ? '#f59e0b' : '#ff4444';
  return (
    <div style={{ border: `1px solid ${color}33`, borderRadius: 8, padding: '12px 16px', background: '#0a0f1e' }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        Congestion Level
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color, textShadow: `0 0 12px ${color}88`, minWidth: 60 }}>
          {value.toFixed(0)}%
        </span>
        <div style={{ flex: 1, height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 4,
            transition: 'width 0.3s ease, background 0.3s ease',
            boxShadow: `0 0 8px ${color}`,
          }} />
        </div>
      </div>
    </div>
  );
}

export default function MetricsDashboard({ metrics }: Props) {
  const improvement = metrics.fixedAvgWait > 0 && metrics.avgWait > 0
    ? ((metrics.fixedAvgWait - metrics.avgWait) / metrics.fixedAvgWait * 100)
    : 0;

  const elapsed = Math.floor(metrics.tick / 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          T+{elapsed}s · {metrics.totalCars} active
        </span>
        <span style={{
          fontSize: 11, padding: '2px 10px', borderRadius: 99,
          background: metrics.aiMode ? '#00f5ff22' : '#f59e0b22',
          color: metrics.aiMode ? '#00f5ff' : '#f59e0b',
          border: `1px solid ${metrics.aiMode ? '#00f5ff44' : '#f59e0b44'}`,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {metrics.aiMode ? 'AI Mode' : 'Fixed Mode'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricCard
          label="Avg Wait Time"
          value={metrics.avgWait.toFixed(1)}
          unit="sec"
          color="#00f5ff"
          sub={`Fixed: ${metrics.fixedAvgWait.toFixed(1)}s`}
        />
        <MetricCard
          label="Throughput"
          value={metrics.throughput.toFixed(0)}
          unit="/min"
          color="#00ff88"
          sub={`${metrics.completed} completed`}
        />
      </div>

      <CongestionBar value={metrics.congestion} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricCard
          label="Waiting Cars"
          value={String(metrics.waitingCars)}
          color="#f59e0b"
        />
        <MetricCard
          label="AI vs Fixed"
          value={improvement > 0 ? `-${improvement.toFixed(0)}%` : improvement < -1 ? `+${Math.abs(improvement).toFixed(0)}%` : '—'}
          color={improvement > 0 ? '#00ff88' : improvement < -1 ? '#ff4444' : '#64748b'}
          sub="wait time delta"
        />
      </div>

      {/* AI Status */}
      <div style={{
        border: '1px solid #7c3aed33', borderRadius: 8, padding: '10px 16px',
        background: '#0a0f1e', fontSize: 12,
      }}>
        <div style={{ color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, fontSize: 11, marginBottom: 6 }}>
          Algorithm Status
        </div>
        {metrics.aiMode ? (
          <div style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            <span style={{ color: '#00f5ff' }}>●</span> Monitoring queue depths at 100 intersections<br />
            <span style={{ color: '#00ff88' }}>●</span> Dynamically adjusting phase durations<br />
            <span style={{ color: '#7c3aed' }}>●</span> Prioritising congested directions
          </div>
        ) : (
          <div style={{ color: '#475569', lineHeight: 1.6 }}>
            <span style={{ color: '#475569' }}>○</span> Fixed 30-tick cycles active<br />
            <span style={{ color: '#475569' }}>○</span> No queue monitoring<br />
            <span style={{ color: '#475569' }}>○</span> Equal NS/EW timing
          </div>
        )}
      </div>
    </div>
  );
}
