declare module 'ssh2-sftp-client' {
  export default class SftpClient {
    connect(config: Record<string, unknown>): Promise<void>;
    end(): Promise<void>;
    get(path: string, dst?: string | NodeJS.WritableStream): Promise<string | Buffer | NodeJS.WritableStream>;
    stat(path: string): Promise<{ size: number; modifyTime: number; isFile: boolean; isDirectory: boolean }>;
    list(path: string): Promise<Array<{ name: string; type: string; size: number; modifyTime: number }>>;
  }
}
