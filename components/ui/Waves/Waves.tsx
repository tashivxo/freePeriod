'use client';

import { useRef, useEffect, CSSProperties } from 'react';
import './Waves.css';

interface WavesProps {
  lineColor?: string;
  backgroundColor?: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  xGap?: number;
  yGap?: number;
  friction?: number;
  tension?: number;
  maxCursorMove?: number;
  style?: CSSProperties;
  className?: string;
}

interface GradPoint {
  x: number;
  y: number;
  z: number;
}

class Grad {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot2(x: number, y: number): number {
    return this.x * x + this.y * y;
  }
}

class PerlinNoise {
  private perm: number[];
  private gradP: Grad[];

  private grad3: Grad[] = [
    new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1),
  ];

  private p: number[] = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
    120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177,
    33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
    71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
    133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
    63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
    226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
    59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248,
    152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22,
    39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
    246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106,
    157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236,
    205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61,
    156, 180,
  ];

  constructor(seed = 0) {
    this.perm = new Array(512);
    this.gradP = new Array(512);
    this.seed(seed);
  }

  seed(seed: number): void {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;

    for (let i = 0; i < 256; i++) {
      let v: number;
      if (i & 1) {
        v = this.p[i] ^ (seed & 255);
      } else {
        v = this.p[i] ^ ((seed >> 8) & 255);
      }
      this.perm[i] = this.perm[i + 256] = v;
      this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
    }
  }

  fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
  }

  perlin2(x: number, y: number): number {
    let X = Math.floor(x);
    let Y = Math.floor(y);
    x = x - X;
    y = y - Y;
    X = X & 255;
    Y = Y & 255;

    const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
    const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
    const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
    const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);

    const u = this.fade(x);
    return this.lerp(this.lerp(n00, n10, u), this.lerp(n01, n11, u), this.fade(y));
  }
}

const Waves = ({
  lineColor = 'black',
  backgroundColor = 'transparent',
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  style = {},
  className = '',
}: WavesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = container.offsetWidth);
    let height = (canvas.height = container.offsetHeight);

    const noise = new PerlinNoise(Math.random());

    let animationFrameId: number;
    let tick = 0;
    let mouseX = -1;
    let mouseY = -1;

    interface WavePoint {
      x: number;
      y: number;
      wave: { x: number; y: number };
      cursor: { x: number; y: number; vx: number; vy: number };
    }

    let points: WavePoint[][] = [];

    function buildGrid() {
      width = canvas!.width = container!.offsetWidth;
      height = canvas!.height = container!.offsetHeight;
      points = [];

      const cols = Math.ceil(width / xGap) + 2;
      const rows = Math.ceil(height / yGap) + 2;

      for (let r = 0; r < rows; r++) {
        const row: WavePoint[] = [];
        for (let c = 0; c < cols; c++) {
          row.push({
            x: c * xGap,
            y: r * yGap,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          });
        }
        points.push(row);
      }
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouseX = -1;
      mouseY = -1;
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', buildGrid);
    buildGrid();

    function draw() {
      animationFrameId = requestAnimationFrame(draw);
      ctx!.clearRect(0, 0, width, height);

      tick++;

      for (let r = 0; r < points.length; r++) {
        for (let c = 0; c < points[r].length; c++) {
          const pt = points[r][c];

          pt.wave.x = Math.cos(tick * waveSpeedX + pt.x * 0.015) * waveAmpX;
          pt.wave.y = Math.sin(tick * waveSpeedY + pt.y * 0.015) * waveAmpY;

          const dx = mouseX - pt.x;
          const dy = mouseY - pt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const limit = maxCursorMove;

          if (mouseX !== -1 && dist < limit) {
            const force = (1 - dist / limit) * limit;
            pt.cursor.vx += (dx / dist) * force * tension * 8;
            pt.cursor.vy += (dy / dist) * force * tension * 8;
          }

          pt.cursor.vx *= friction;
          pt.cursor.vy *= friction;
          pt.cursor.x += pt.cursor.vx;
          pt.cursor.y += pt.cursor.vy;

          const limit2 = maxCursorMove * 0.5;
          if (Math.abs(pt.cursor.x) > limit2) pt.cursor.x *= 0.95;
          if (Math.abs(pt.cursor.y) > limit2) pt.cursor.y *= 0.95;
        }
      }

      ctx!.strokeStyle = lineColor;
      ctx!.lineWidth = 1;
      ctx!.beginPath();

      for (let r = 0; r < points.length; r++) {
        for (let c = 0; c < points[r].length - 1; c++) {
          const curr = points[r][c];
          const next = points[r][c + 1];

          const cx1 = curr.x + curr.wave.x + curr.cursor.x;
          const cy1 = curr.y + curr.wave.y + curr.cursor.y;
          const cx2 = next.x + next.wave.x + next.cursor.x;
          const cy2 = next.y + next.wave.y + next.cursor.y;

          const mx = (cx1 + cx2) / 2;
          const my = (cy1 + cy2) / 2;

          if (c === 0) ctx!.moveTo(cx1, cy1);
          ctx!.quadraticCurveTo(cx1, cy1, mx, my);
        }
      }

      ctx!.stroke();
    }

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', buildGrid);
    };
  }, [
    lineColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    xGap,
    yGap,
    friction,
    tension,
    maxCursorMove,
  ]);

  return (
    <div
      ref={containerRef}
      className={`waves ${className}`}
      style={{ position: 'absolute', top: 0, left: 0, background: backgroundColor, ...style }}
    >
      <canvas ref={canvasRef} className="waves-canvas" style={{ display: 'block' }} />
    </div>
  );
};

export default Waves;
