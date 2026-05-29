/**
 * Fila simples para limitar requisições paralelas do cliente (evita 503 do nginx).
 */

type Task<T> = () => Promise<T>;

const MAX_CONCURRENT = 4;
let active = 0;
const queue: Array<{
  run: Task<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function drainQueue() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    active++;
    void item
      .run()
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        active--;
        drainQueue();
      });
  }
}

export function enqueueClientFetch<T>(task: Task<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({
      run: task as Task<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    drainQueue();
  });
}
