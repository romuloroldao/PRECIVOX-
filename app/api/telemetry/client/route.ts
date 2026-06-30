import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const ALLOWED_EVENTS = new Set([
  'chunk_load_error',
  'chunk_recovery_attempt',
  'chunk_recovery_exhausted',
  'app_ready',
]);

function readBuildId(): string {
  try {
    return readFileSync(path.join(process.cwd(), '.next/BUILD_ID'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Telemetria leve do browser (ChunkLoadError, recovery, app-ready).
 * Sem auth — rate limit por IP. Logs estruturados para SRE.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkRateLimit(`telemetry:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const event = typeof body.event === 'string' ? body.event : '';
    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ success: false, error: 'Evento inválido' }, { status: 400 });
    }

    const payload = {
      ts: new Date().toISOString(),
      event,
      buildId: readBuildId(),
      route: typeof body.route === 'string' ? body.route.slice(0, 256) : undefined,
      source: typeof body.source === 'string' ? body.source.slice(0, 512) : undefined,
      retry: typeof body.retry === 'number' ? body.retry : undefined,
      userAgent: req.headers.get('user-agent')?.slice(0, 200),
      ip,
    };

    console.info('[telemetry/client]', JSON.stringify(payload));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
