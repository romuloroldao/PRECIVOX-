import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function readBuildId(): string {
  try {
    return readFileSync(path.join(process.cwd(), '.next/BUILD_ID'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

/** Health check operacional — expõe BUILD_ID para smoke deploy e correlação de incidentes. */
export async function GET() {
  const buildId = readBuildId();
  return NextResponse.json(
    {
      ok: true,
      service: 'precivox-frontend',
      buildId,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Precivox-Build-Id': buildId,
      },
    }
  );
}
