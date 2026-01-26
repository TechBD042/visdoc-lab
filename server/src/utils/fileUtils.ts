import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.join(__dirname, '../../uploads');
export const OUTPUT_DIR = path.join(__dirname, '../../output');
export const TEMP_DIR = path.join(__dirname, '../../temp');

export async function ensureDirectories(): Promise<void> {
  const dirs = [UPLOADS_DIR, OUTPUT_DIR, TEMP_DIR];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to cleanup file: ${filePath}`, error);
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function getOutputPath(filename: string): string {
  return path.join(OUTPUT_DIR, filename);
}

export function getTempPath(filename: string): string {
  return path.join(TEMP_DIR, filename);
}
