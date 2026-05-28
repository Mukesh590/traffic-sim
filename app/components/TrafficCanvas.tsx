'use client';
import { useEffect, useRef } from 'react';
import { SimState, GRID_SIZE, CELL_SIZE, TrafficLight, Car } from '../lib/simulation';

interface Props {
  state: SimState;
}

export default function TrafficCanvas({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = GRID_SIZE * CELL_SIZE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, W);

    // Background
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, W, W);

    drawGrid(ctx, W);
    drawLights(ctx, state.lights);
    drawCars(ctx, state.cars);
  }, [state, W]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={W}
      style={{
        border: '1px solid #00f5ff33',
        borderRadius: '8px',
        boxShadow: '0 0 40px #00f5ff22',
      }}
    />
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number) {
  const ROAD_W = 14;

  // Draw road blocks (city blocks = dark rectangles between roads)
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      // Block fill
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(x + ROAD_W, y + ROAD_W, CELL_SIZE - ROAD_W * 2, CELL_SIZE - ROAD_W * 2);
    }
  }

  // Roads (horizontal + vertical strips)
  ctx.fillStyle = '#111827';
  for (let r = 0; r < GRID_SIZE; r++) {
    const y = r * CELL_SIZE + CELL_SIZE / 2 - ROAD_W / 2;
    ctx.fillRect(0, y, W, ROAD_W);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    const x = c * CELL_SIZE + CELL_SIZE / 2 - ROAD_W / 2;
    ctx.fillRect(x, 0, ROAD_W, W);
  }

  // Dashed centre lines
  ctx.setLineDash([4, 8]);
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = '#ffffff18';
  for (let r = 0; r < GRID_SIZE; r++) {
    const y = r * CELL_SIZE + CELL_SIZE / 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    const x = c * CELL_SIZE + CELL_SIZE / 2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, W); ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawLights(ctx: CanvasRenderingContext2D, lights: TrafficLight[][]) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const light = lights[r][c];
      const cx = c * CELL_SIZE + CELL_SIZE / 2;
      const cy = r * CELL_SIZE + CELL_SIZE / 2;

      // N/S light (top & bottom of intersection)
      const nsColor = light.nsGreen ? '#00ff88' : '#ff4444';
      const ewColor = light.nsGreen ? '#ff4444' : '#00ff88';

      drawLightDot(ctx, cx, cy - 18, nsColor);
      drawLightDot(ctx, cx, cy + 18, nsColor);
      drawLightDot(ctx, cx - 18, cy, ewColor);
      drawLightDot(ctx, cx + 18, cy, ewColor);
    }
  }
}

function drawLightDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCars(ctx: CanvasRenderingContext2D, cars: Car[]) {
  for (const car of cars) {
    ctx.save();
    ctx.shadowColor = car.color;
    ctx.shadowBlur = car.waiting ? 6 : 14;

    const isNS = car.direction === 'north' || car.direction === 'south';
    const w = isNS ? 6 : 10;
    const h = isNS ? 10 : 6;

    ctx.fillStyle = car.waiting ? car.color + '99' : car.color;
    ctx.beginPath();
    ctx.roundRect(car.x - w / 2, car.y - h / 2, w, h, 2);
    ctx.fill();

    // Headlights
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    const hw = 1.5;
    if (car.direction === 'south') {
      ctx.fillRect(car.x - 2, car.y + h / 2 - 1, hw, hw);
      ctx.fillRect(car.x + 2 - hw, car.y + h / 2 - 1, hw, hw);
    } else if (car.direction === 'north') {
      ctx.fillRect(car.x - 2, car.y - h / 2, hw, hw);
      ctx.fillRect(car.x + 2 - hw, car.y - h / 2, hw, hw);
    } else if (car.direction === 'east') {
      ctx.fillRect(car.x + w / 2 - 1, car.y - 2, hw, hw);
      ctx.fillRect(car.x + w / 2 - 1, car.y + 2 - hw, hw, hw);
    } else {
      ctx.fillRect(car.x - w / 2, car.y - 2, hw, hw);
      ctx.fillRect(car.x - w / 2, car.y + 2 - hw, hw, hw);
    }

    ctx.restore();
  }
}
