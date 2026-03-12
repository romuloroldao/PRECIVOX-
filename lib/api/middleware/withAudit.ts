import type { NextRequest } from 'next/server';
import type { RoleHandler } from '@/lib/api/auth/withRole';
import type { RouteWrapper } from './composePipeline';

type AuditFn = (params: {
  action: string;
  userId: string;
  path: string;
  method: string;
  timestamp: string;
}) => Promise<void> | void;

let auditSink: AuditFn | null = null;

export function configureAuditSink(sink: AuditFn) {
  auditSink = sink;
}

function getPath(req: NextRequest): string {
  try {
    return req.nextUrl.pathname;
  } catch {
    return 'unknown';
  }
}

export function withAudit(action: string): RouteWrapper {
  return (handler: RoleHandler): RoleHandler => {
    return async (req, user) => {
      const res = await handler(req, user);

      if (auditSink) {
        const path = getPath(req);
        const method = req.method ?? 'UNKNOWN';
        const timestamp = new Date().toISOString();

        try {
          await auditSink({
            action,
            userId: user.id,
            path,
            method,
            timestamp,
          });
        } catch {
          // Audit não deve quebrar a rota principal
        }
      }

      return res;
    };
  };
}

