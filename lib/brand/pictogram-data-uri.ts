import fs from 'fs';
import path from 'path';

let cached: string | null = null;

export function getPictogramDataUri(): string {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), 'public', 'brand', 'pictogram.png');
  const buffer = fs.readFileSync(filePath);
  cached = `data:image/png;base64,${buffer.toString('base64')}`;
  return cached;
}
