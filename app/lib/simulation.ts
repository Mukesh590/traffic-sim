export const GRID_SIZE = 10;
export const CELL_SIZE = 60;

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface TrafficLight {
  row: number;
  col: number;
  nsGreen: boolean;    // north-south green; east-west red when true
  nsTimer: number;     // ticks remaining in current phase
  ewTimer: number;
  nsPhase: number;     // configured green duration for NS
  ewPhase: number;     // configured green duration for EW
  nsQueue: number;     // cars waiting N/S
  ewQueue: number;     // cars waiting E/W
}

export interface Car {
  id: number;
  x: number;           // pixel x (centre)
  y: number;           // pixel y (centre)
  col: number;         // grid col
  row: number;         // grid row
  direction: Direction;
  speed: number;
  waiting: boolean;
  waitTicks: number;
  totalWait: number;
  done: boolean;
  color: string;
}

export interface SimState {
  cars: Car[];
  lights: TrafficLight[][];
  tick: number;
  completed: number;
  totalWaitAccum: number;
  spawnAccum: number;
  aiMode: boolean;
}

const CAR_COLORS = ['#00f5ff', '#00ff88', '#7c3aed', '#f59e0b', '#ff6b6b', '#06b6d4'];
let nextId = 0;

export function createInitialState(): SimState {
  const lights: TrafficLight[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    lights[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      lights[r][c] = {
        row: r, col: c,
        nsGreen: (r + c) % 2 === 0,
        nsTimer: 30, ewTimer: 30,
        nsPhase: 30, ewPhase: 30,
        nsQueue: 0, ewQueue: 0,
      };
    }
  }
  return {
    cars: [],
    lights,
    tick: 0,
    completed: 0,
    totalWaitAccum: 0,
    spawnAccum: 0,
    aiMode: true,
  };
}

function roadX(col: number) { return col * CELL_SIZE + CELL_SIZE / 2; }
function roadY(row: number) { return row * CELL_SIZE + CELL_SIZE / 2; }

function spawnCar(state: SimState) {
  const dir = (['north', 'south', 'east', 'west'] as Direction[])[Math.floor(Math.random() * 4)];
  let col: number, row: number;
  if (dir === 'south') { col = Math.floor(Math.random() * GRID_SIZE); row = 0; }
  else if (dir === 'north') { col = Math.floor(Math.random() * GRID_SIZE); row = GRID_SIZE - 1; }
  else if (dir === 'east') { col = 0; row = Math.floor(Math.random() * GRID_SIZE); }
  else { col = GRID_SIZE - 1; row = Math.floor(Math.random() * GRID_SIZE); }

  // Don't spawn if another car is very close to the spawn point
  const sx = roadX(col), sy = roadY(row);
  const tooClose = state.cars.some(c => Math.abs(c.x - sx) < 20 && Math.abs(c.y - sy) < 20);
  if (tooClose) return;

  state.cars.push({
    id: nextId++,
    x: sx, y: sy,
    col, row,
    direction: dir,
    speed: 1.5 + Math.random() * 0.5,
    waiting: false,
    waitTicks: 0,
    totalWait: 0,
    done: false,
    color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
  });
}

function isAtIntersection(car: Car): boolean {
  const dx = Math.abs(car.x - roadX(car.col));
  const dy = Math.abs(car.y - roadY(car.row));
  return dx < 3 && dy < 3;
}

function getNextCell(car: Car): { col: number; row: number } {
  switch (car.direction) {
    case 'south': return { col: car.col, row: car.row + 1 };
    case 'north': return { col: car.col, row: car.row - 1 };
    case 'east':  return { col: car.col + 1, row: car.row };
    case 'west':  return { col: car.col - 1, row: car.row };
  }
}

function isNSDirection(dir: Direction) { return dir === 'north' || dir === 'south'; }

function lightAllowsMovement(light: TrafficLight, dir: Direction): boolean {
  return isNSDirection(dir) ? light.nsGreen : !light.nsGreen;
}

function stopDistance(car: Car): number {
  // Distance from car centre to stop line (just before intersection centre)
  const STOP = 22;
  switch (car.direction) {
    case 'south': return roadY(car.row) - car.y - STOP;   // how far until stop line ahead
    case 'north': return car.y - roadY(car.row) - STOP;
    case 'east':  return roadX(car.col) - car.x - STOP;
    case 'west':  return car.x - roadX(car.col) - STOP;
  }
}

export function stepSimulation(state: SimState, spawnRate: number, aiMode: boolean): SimState {
  const s = { ...state, cars: state.cars.map(c => ({ ...c })), aiMode };
  s.tick++;

  // --- Spawn cars ---
  s.spawnAccum += spawnRate;
  while (s.spawnAccum >= 1) {
    spawnCar(s);
    s.spawnAccum -= 1;
  }

  // --- Update queues for lights ---
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      s.lights[r][c] = { ...s.lights[r][c], nsQueue: 0, ewQueue: 0 };
    }
  }
  for (const car of s.cars) {
    if (car.waiting) {
      const l = s.lights[car.row][car.col];
      if (isNSDirection(car.direction)) l.nsQueue++;
      else l.ewQueue++;
    }
  }

  // --- Update traffic lights ---
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const light = s.lights[r][c];
      const timerField = light.nsGreen ? 'nsTimer' : 'ewTimer';
      light[timerField]--;

      if (light[timerField] <= 0) {
        light.nsGreen = !light.nsGreen;
        if (aiMode) {
          // Adapt next phase durations based on queue depth
          const base = 20, scale = 4, max = 60, min = 10;
          light.nsPhase = Math.min(max, Math.max(min, base + light.nsQueue * scale));
          light.ewPhase = Math.min(max, Math.max(min, base + light.ewQueue * scale));
        } else {
          light.nsPhase = 30;
          light.ewPhase = 30;
        }
        light.nsTimer = light.nsPhase;
        light.ewTimer = light.ewPhase;
      }
    }
  }

  // --- Move cars ---
  const livingCars: Car[] = [];
  for (const car of s.cars) {
    if (car.done) {
      s.completed++;
      s.totalWaitAccum += car.totalWait;
      continue;
    }

    const next = getNextCell(car);

    // Check if out of bounds → done
    if (next.row < 0 || next.row >= GRID_SIZE || next.col < 0 || next.col >= GRID_SIZE) {
      // Already crossed last intersection — keep moving until off-canvas
      moveCar(car);
      const offCanvas = car.x < -CELL_SIZE || car.x > GRID_SIZE * CELL_SIZE + CELL_SIZE ||
                        car.y < -CELL_SIZE || car.y > GRID_SIZE * CELL_SIZE + CELL_SIZE;
      if (offCanvas) {
        s.completed++;
        s.totalWaitAccum += car.totalWait;
        continue;
      }
      livingCars.push(car);
      continue;
    }

    const light = s.lights[car.row][car.col];
    const dist = stopDistance(car);

    // Check for car ahead (collision avoidance)
    const carAhead = livingCars.find(other => {
      if (other.direction !== car.direction) return false;
      const ahead = 28;
      switch (car.direction) {
        case 'south': return other.col === car.col && other.y > car.y && other.y - car.y < ahead;
        case 'north': return other.col === car.col && car.y > other.y && car.y - other.y < ahead;
        case 'east':  return other.row === car.row && other.x > car.x && other.x - car.x < ahead;
        case 'west':  return other.row === car.row && car.x > other.x && car.x - other.x < ahead;
      }
    });

    const blockedByCar = !!carAhead;
    const mustStop = !lightAllowsMovement(light, car.direction) && dist >= 0 && dist < car.speed + 2;

    if (mustStop || blockedByCar) {
      car.waiting = true;
      car.waitTicks++;
      car.totalWait++;
    } else {
      car.waiting = false;
      moveCar(car);
      // Update grid cell
      car.col = Math.round((car.x - CELL_SIZE / 2) / CELL_SIZE);
      car.row = Math.round((car.y - CELL_SIZE / 2) / CELL_SIZE);
      car.col = Math.max(0, Math.min(GRID_SIZE - 1, car.col));
      car.row = Math.max(0, Math.min(GRID_SIZE - 1, car.row));
    }

    livingCars.push(car);
  }

  s.cars = livingCars;
  return s;
}

function moveCar(car: Car) {
  switch (car.direction) {
    case 'south': car.y += car.speed; break;
    case 'north': car.y -= car.speed; break;
    case 'east':  car.x += car.speed; break;
    case 'west':  car.x -= car.speed; break;
  }
}

export function computeMetrics(state: SimState, fixedCompleted: number, fixedWait: number) {
  const waitingCars = state.cars.filter(c => c.waiting).length;
  const congestion = state.cars.length > 0 ? (waitingCars / state.cars.length) * 100 : 0;
  const avgWait = state.completed > 0 ? state.totalWaitAccum / state.completed / 60 : 0; // seconds at 60fps
  const throughput = state.tick > 0 ? (state.completed / state.tick) * 60 * 60 : 0; // per minute
  const fixedAvgWait = fixedCompleted > 0 ? fixedWait / fixedCompleted / 60 : 0;
  return { congestion, avgWait, throughput, waitingCars, fixedAvgWait };
}
