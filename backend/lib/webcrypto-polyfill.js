/**
 * jose@6 usa o build webapi com o identificador livre `crypto`.
 * Em alguns runtimes Node 18 (ex.: processo PM2) isso pode falhar mesmo com
 * globalThis.crypto presente. Garantimos WebCrypto no global antes de jose.
 */
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
