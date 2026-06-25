import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'prisma', 'seed-analytics', 'logs');

export class SeedLogger {
  private logFile: string;
  private startTime: number;

  constructor(runId: string) {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    this.logFile = path.join(LOG_DIR, `seed-${runId}.log`);
    this.startTime = Date.now();
    this.write('INFO', '=== Início do seed analítico Precivox ===');
  }

  private write(level: string, msg: string) {
    const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
    fs.appendFileSync(this.logFile, line + '\n');
    const icon = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : level === 'OK' ? '✅' : '📋';
    console.log(`${icon} ${msg}`);
  }

  info(msg: string) { this.write('INFO', msg); }
  ok(msg: string) { this.write('OK', msg); }
  warn(msg: string) { this.write('WARN', msg); }
  error(msg: string) { this.write('ERROR', msg); }

  progress(phase: string, current: number, total: number) {
    const pct = total > 0 ? ((current / total) * 100).toFixed(1) : '100.0';
    this.info(`${phase}: ${current}/${total} (${pct}%)`);
  }

  getLogPath() { return this.logFile; }

  elapsed() {
    return ((Date.now() - this.startTime) / 1000).toFixed(1);
  }
}
