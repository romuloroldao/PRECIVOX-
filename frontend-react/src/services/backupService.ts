// services/backupService.ts - SISTEMA DE BACKUP AUTOMÁTICO
import { loggingService } from './loggingService';
import { cacheService } from './cacheService';

interface BackupData {
  id: string;
  timestamp: number;
  version: string;
  type: 'full' | 'incremental';
  userId?: string;
  data: {
    userProfiles: any[];
    shoppingLists: any[];
    searchHistory: any[];
    preferences: any;
    analytics: any[];
    cache: any;
    favorites: any[];
    appState: any;
  };
  metadata: {
    size: number;
    checksum: string;
    compressed: boolean;
    encrypted: boolean;
  };
}

interface BackupConfig {
  enableAutoBackup: boolean;
  backupInterval: number; // em milliseconds
  maxBackups: number;
  compressionLevel: 'none' | 'low' | 'high';
  enableEncryption: boolean;
  backupSources: string[];
  cloudSync: boolean;
  cloudProvider?: 'localStorage' | 'indexedDB' | 'server';
}

interface BackupStats {
  totalBackups: number;
  lastBackup: number;
  totalSize: number;
  successRate: number;
  averageBackupTime: number;
}

class BackupService {
  private config: BackupConfig = {
    enableAutoBackup: true,
    backupInterval: 60 * 60 * 1000, // 1 hora
    maxBackups: 10,
    compressionLevel: 'low',
    enableEncryption: false,
    backupSources: ['userProfiles', 'shoppingLists', 'searchHistory', 'preferences', 'favorites'],
    cloudSync: false,
    cloudProvider: 'localStorage'
  };

  private backupTimer?: NodeJS.Timeout;
  private isBackingUp = false;
  private backupHistory: BackupData[] = [];

  constructor() {
    this.initializeService();
  }

  // ✅ BACKUP MANUAL COMPLETO
  async createFullBackup(userId?: string): Promise<BackupData> {
    if (this.isBackingUp) {
      throw new Error('Backup já em andamento');
    }

    try {
      this.isBackingUp = true;
      const startTime = Date.now();
      
      loggingService.info('BACKUP', 'Iniciando backup completo');

      const backupData: BackupData = {
        id: this.generateBackupId(),
        timestamp: Date.now(),
        version: '1.0.0',
        type: 'full',
        userId,
        data: await this.collectAllData(),
        metadata: {
          size: 0,
          checksum: '',
          compressed: false,
          encrypted: false
        }
      };

      // Processar dados
      backupData.data = await this.processData(backupData.data);
      backupData.metadata = await this.generateMetadata(backupData.data);

      // Salvar backup
      await this.saveBackup(backupData);

      const duration = Date.now() - startTime;
      loggingService.info('BACKUP', `Backup completo concluído em ${duration}ms`, {
        backupId: backupData.id,
        size: backupData.metadata.size,
        duration
      });

      return backupData;
    } catch (error) {
      loggingService.error('BACKUP', 'Erro no backup completo', error);
      throw error;
    } finally {
      this.isBackingUp = false;
    }
  }

  // ✅ BACKUP INCREMENTAL
  async createIncrementalBackup(userId?: string, lastBackupId?: string): Promise<BackupData> {
    try {
      loggingService.info('BACKUP', 'Iniciando backup incremental');

      const lastBackup = lastBackupId ? 
        this.backupHistory.find(b => b.id === lastBackupId) :
        this.getLastBackup();

      const lastBackupTime = lastBackup ? lastBackup.timestamp : 0;

      const backupData: BackupData = {
        id: this.generateBackupId(),
        timestamp: Date.now(),
        version: '1.0.0',
        type: 'incremental',
        userId,
        data: await this.collectIncrementalData(lastBackupTime),
        metadata: {
          size: 0,
          checksum: '',
          compressed: false,
          encrypted: false
        }
      };

      // Processar apenas se há dados novos
      if (this.hasNewData(backupData.data)) {
        backupData.data = await this.processData(backupData.data);
        backupData.metadata = await this.generateMetadata(backupData.data);
        await this.saveBackup(backupData);

        loggingService.info('BACKUP', 'Backup incremental concluído', {
          backupId: backupData.id,
          size: backupData.metadata.size
        });

        return backupData;
      } else {
        loggingService.info('BACKUP', 'Nenhum dado novo para backup incremental');
        throw new Error('Nenhum dado novo encontrado');
      }
    } catch (error) {
      loggingService.error('BACKUP', 'Erro no backup incremental', error);
      throw error;
    }
  }

  // ✅ RESTAURAR BACKUP
  async restoreBackup(backupId: string): Promise<void> {
    try {
      loggingService.info('BACKUP', `Iniciando restauração do backup: ${backupId}`);

      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} não encontrado`);
      }

      // Validar integridade
      if (!await this.validateBackup(backup)) {
        throw new Error('Backup corrompido ou inválido');
      }

      // Restaurar dados
      await this.restoreData(backup.data);

      loggingService.info('BACKUP', `Backup restaurado com sucesso: ${backupId}`);
    } catch (error) {
      loggingService.error('BACKUP', 'Erro na restauração', error);
      throw error;
    }
  }

  // ✅ LISTAR BACKUPS DISPONÍVEIS
  async listBackups(userId?: string): Promise<BackupData[]> {
    const backups = this.backupHistory
      .filter(backup => !userId || backup.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);

    return backups.map(backup => ({
      ...backup,
      data: {} as any // Não retornar dados completos na listagem
    }));
  }

  // ✅ DELETAR BACKUP
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const index = this.backupHistory.findIndex(b => b.id === backupId);
      if (index === -1) {
        return false;
      }

      // Remover do storage
      await this.removeBackupFromStorage(backupId);
      
      // Remover do histórico
      this.backupHistory.splice(index, 1);

      loggingService.info('BACKUP', `Backup deletado: ${backupId}`);
      return true;
    } catch (error) {
      loggingService.error('BACKUP', 'Erro ao deletar backup', error);
      return false;
    }
  }

  // ✅ LIMPEZA AUTOMÁTICA DE BACKUPS ANTIGOS
  async cleanupOldBackups(): Promise<number> {
    const backupsToDelete = this.backupHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(this.config.maxBackups);

    let deletedCount = 0;
    for (const backup of backupsToDelete) {
      if (await this.deleteBackup(backup.id)) {
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      loggingService.info('BACKUP', `${deletedCount} backups antigos removidos`);
    }

    return deletedCount;
  }

  // ✅ SYNC COM CLOUD
  async syncToCloud(): Promise<void> {
    if (!this.config.cloudSync) {
      throw new Error('Sync com cloud não habilitado');
    }

    try {
      loggingService.info('BACKUP', 'Iniciando sync com cloud');

      const localBackups = this.backupHistory;
      const cloudBackups = await this.getCloudBackups();

      // Identificar backups que precisam ser sincronizados
      const toUpload = localBackups.filter(local => 
        !cloudBackups.find(cloud => cloud.id === local.id)
      );

      const toDownload = cloudBackups.filter(cloud => 
        !localBackups.find(local => local.id === cloud.id)
      );

      // Upload de backups locais
      for (const backup of toUpload) {
        await this.uploadToCloud(backup);
      }

      // Download de backups da cloud
      for (const backup of toDownload) {
        await this.downloadFromCloud(backup.id);
      }

      loggingService.info('BACKUP', `Sync concluído: ${toUpload.length} enviados, ${toDownload.length} baixados`);
    } catch (error) {
      loggingService.error('BACKUP', 'Erro no sync com cloud', error);
      throw error;
    }
  }

  // ✅ VERIFICAR INTEGRIDADE DE TODOS OS BACKUPS
  async verifyAllBackups(): Promise<{
    total: number;
    valid: number;
    corrupted: string[];
  }> {
    const results = {
      total: this.backupHistory.length,
      valid: 0,
      corrupted: [] as string[]
    };

    for (const backup of this.backupHistory) {
      try {
        if (await this.validateBackup(backup)) {
          results.valid++;
        } else {
          results.corrupted.push(backup.id);
        }
      } catch (error) {
        results.corrupted.push(backup.id);
      }
    }

    loggingService.info('BACKUP', 'Verificação de integridade concluída', results);
    return results;
  }

  // ✅ ESTATÍSTICAS DE BACKUP
  getBackupStats(): BackupStats {
    const now = Date.now();
    const lastBackup = this.getLastBackup();
    
    const totalSize = this.backupHistory.reduce((sum, backup) => 
      sum + backup.metadata.size, 0
    );

    return {
      totalBackups: this.backupHistory.length,
      lastBackup: lastBackup ? lastBackup.timestamp : 0,
      totalSize,
      successRate: 95, // Placeholder - em produção seria calculado
      averageBackupTime: 2500 // Placeholder - em produção seria calculado
    };
  }

  // ✅ EXPORTAR BACKUP
  exportBackup(backupId: string, format: 'json' | 'encrypted' = 'json'): string {
    const backup = this.backupHistory.find(b => b.id === backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} não encontrado`);
    }

    if (format === 'json') {
      return JSON.stringify(backup, null, 2);
    } else {
      // Implementação simplificada de "encriptação"
      return btoa(JSON.stringify(backup));
    }
  }

  // ✅ IMPORTAR BACKUP
  async importBackup(backupString: string, format: 'json' | 'encrypted' = 'json'): Promise<string> {
    try {
      let backupData: BackupData;

      if (format === 'json') {
        backupData = JSON.parse(backupString);
      } else {
        backupData = JSON.parse(atob(backupString));
      }

      // Validar estrutura
      if (!this.isValidBackupStructure(backupData)) {
        throw new Error('Estrutura de backup inválida');
      }

      // Gerar novo ID para evitar conflitos
      backupData.id = this.generateBackupId();
      backupData.timestamp = Date.now();

      await this.saveBackup(backupData);

      loggingService.info('BACKUP', `Backup importado: ${backupData.id}`);
      return backupData.id;
    } catch (error) {
      loggingService.error('BACKUP', 'Erro ao importar backup', error);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS
  private async collectAllData(): Promise<BackupData['data']> {
    const data: BackupData['data'] = {
      userProfiles: [],
      shoppingLists: [],
      searchHistory: [],
      preferences: {},
      analytics: [],
      cache: {},
      favorites: [],
      appState: {}
    };

    // Coletar dados de várias fontes
    if (this.config.backupSources.includes('shoppingLists')) {
      data.shoppingLists = this.getShoppingLists();
    }

    if (this.config.backupSources.includes('searchHistory')) {
      data.searchHistory = this.getSearchHistory();
    }

    if (this.config.backupSources.includes('preferences')) {
      data.preferences = this.getUserPreferences();
    }

    if (this.config.backupSources.includes('favorites')) {
      data.favorites = this.getFavorites();
    }

    if (this.config.backupSources.includes('userProfiles')) {
      data.userProfiles = this.getUserProfiles();
    }

    // Analytics (se habilitado)
    try {
      data.analytics = JSON.parse(localStorage.getItem('precivox_analytics') || '[]');
    } catch (e) {
      data.analytics = [];
    }

    // Estado da aplicação
    data.appState = {
      currentPage: localStorage.getItem('currentPage'),
      lastLocation: localStorage.getItem('user_location'),
      theme: localStorage.getItem('theme') || 'light'
    };

    return data;
  }

  private async collectIncrementalData(lastBackupTime: number): Promise<BackupData['data']> {
    // Implementação simplificada - coletar apenas dados modificados
    return this.collectAllData(); // Por simplicidade, fazer backup completo
  }

  private async processData(data: BackupData['data']): Promise<BackupData['data']> {
    // Compressão (se habilitada)
    if (this.config.compressionLevel !== 'none') {
      // Implementação simplificada de compressão
      data = JSON.parse(JSON.stringify(data)); // Deep clone
    }

    // Encriptação (se habilitada)
    if (this.config.enableEncryption) {
      // Implementação simplificada de encriptação
    }

    return data;
  }

  private async generateMetadata(data: BackupData['data']): Promise<BackupData['metadata']> {
    const dataString = JSON.stringify(data);
    
    return {
      size: dataString.length,
      checksum: this.calculateChecksum(dataString),
      compressed: this.config.compressionLevel !== 'none',
      encrypted: this.config.enableEncryption
    };
  }

  private calculateChecksum(data: string): string {
    // Implementação simplificada de checksum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async saveBackup(backup: BackupData): Promise<void> {
    // Salvar no storage local
    const storageKey = `backup_${backup.id}`;
    
    try {
      if (this.config.cloudProvider === 'localStorage') {
        localStorage.setItem(storageKey, JSON.stringify(backup));
      } else if (this.config.cloudProvider === 'indexedDB') {
        // Implementação IndexedDB seria aqui
        localStorage.setItem(storageKey, JSON.stringify(backup));
      }

      this.backupHistory.push(backup);
      this.saveBackupHistory();

      // Limpeza automática
      await this.cleanupOldBackups();
    } catch (error) {
      throw new Error(`Erro ao salvar backup: ${error}`);
    }
  }

  private async getBackup(backupId: string): Promise<BackupData | null> {
    try {
      const storageKey = `backup_${backupId}`;
      const backupString = localStorage.getItem(storageKey);
      
      if (!backupString) {
        return null;
      }

      return JSON.parse(backupString);
    } catch (error) {
      loggingService.error('BACKUP', `Erro ao recuperar backup ${backupId}`, error);
      return null;
    }
  }

  private async validateBackup(backup: BackupData): Promise<boolean> {
    try {
      // Verificar estrutura
      if (!this.isValidBackupStructure(backup)) {
        return false;
      }

      // Verificar checksum
      const dataString = JSON.stringify(backup.data);
      const calculatedChecksum = this.calculateChecksum(dataString);
      
      return calculatedChecksum === backup.metadata.checksum;
    } catch (error) {
      return false;
    }
  }

  private async restoreData(data: BackupData['data']): Promise<void> {
    // Restaurar listas de compras
    if (data.shoppingLists.length > 0) {
      localStorage.setItem('user_lists', JSON.stringify(data.shoppingLists));
    }

    // Restaurar histórico de busca
    if (data.searchHistory.length > 0) {
      localStorage.setItem('search_history', JSON.stringify(data.searchHistory));
    }

    // Restaurar preferências
    if (Object.keys(data.preferences).length > 0) {
      Object.entries(data.preferences).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
    }

    // Restaurar favoritos
    if (data.favorites.length > 0) {
      localStorage.setItem('favorites', JSON.stringify(data.favorites));
    }

    // Restaurar estado da aplicação
    if (data.appState) {
      Object.entries(data.appState).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          localStorage.setItem(key, String(value));
        }
      });
    }
  }

  private hasNewData(data: BackupData['data']): boolean {
    return Object.values(data).some(value => 
      Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0
    );
  }

  private getLastBackup(): BackupData | null {
    return this.backupHistory
      .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
  }

  private isValidBackupStructure(backup: any): boolean {
    return backup &&
           typeof backup.id === 'string' &&
           typeof backup.timestamp === 'number' &&
           typeof backup.data === 'object' &&
           typeof backup.metadata === 'object';
  }

  // Métodos de coleta de dados (simplificados)
  private getShoppingLists(): any[] {
    try {
      return JSON.parse(localStorage.getItem('user_lists') || '[]');
    } catch { return []; }
  }

  private getSearchHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem('search_history') || '[]');
    } catch { return []; }
  }

  private getUserPreferences(): any {
    const preferences: any = {};
    const keys = ['theme', 'language', 'location', 'notifications'];
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) preferences[key] = value;
    });

    return preferences;
  }

  private getFavorites(): any[] {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch { return []; }
  }

  private getUserProfiles(): any[] {
    // Implementação simplificada
    return [];
  }

  private saveBackupHistory(): void {
    try {
      const history = this.backupHistory.map(backup => ({
        id: backup.id,
        timestamp: backup.timestamp,
        type: backup.type,
        userId: backup.userId,
        size: backup.metadata.size
      }));
      
      localStorage.setItem('backup_history', JSON.stringify(history));
    } catch (error) {
      loggingService.error('BACKUP', 'Erro ao salvar histórico de backups', error);
    }
  }

  private loadBackupHistory(): void {
    try {
      const historyString = localStorage.getItem('backup_history');
      if (historyString) {
        const history = JSON.parse(historyString);
        // Carregar apenas metadata na inicialização
        this.backupHistory = history;
      }
    } catch (error) {
      loggingService.error('BACKUP', 'Erro ao carregar histórico de backups', error);
    }
  }

  private async removeBackupFromStorage(backupId: string): Promise<void> {
    const storageKey = `backup_${backupId}`;
    localStorage.removeItem(storageKey);
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeService(): void {
    this.loadBackupHistory();
    
    if (this.config.enableAutoBackup) {
      this.startAutoBackup();
    }

    loggingService.info('BACKUP', 'Serviço de backup inicializado');
  }

  private startAutoBackup(): void {
    this.backupTimer = setInterval(async () => {
      try {
        await this.createIncrementalBackup();
      } catch (error) {
        loggingService.error('BACKUP', 'Erro no backup automático', error);
      }
    }, this.config.backupInterval);
  }

  // Métodos de cloud (placeholders)
  private async getCloudBackups(): Promise<BackupData[]> { return []; }
  private async uploadToCloud(backup: BackupData): Promise<void> { }
  private async downloadFromCloud(backupId: string): Promise<void> { }

  // ✅ CONFIGURAÇÃO
  configure(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.backupInterval && this.backupTimer) {
      clearInterval(this.backupTimer);
      if (this.config.enableAutoBackup) {
        this.startAutoBackup();
      }
    }

    loggingService.info('BACKUP', 'Configuração de backup atualizada', newConfig);
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }
}

// ✅ INSTANCE SINGLETON
export const backupService = new BackupService();

// ✅ HOOK PARA USO EM COMPONENTES
export const useBackup = () => {
  return {
    createFullBackup: (userId?: string) => backupService.createFullBackup(userId),
    createIncrementalBackup: (userId?: string, lastBackupId?: string) => 
      backupService.createIncrementalBackup(userId, lastBackupId),
    restoreBackup: (backupId: string) => backupService.restoreBackup(backupId),
    listBackups: (userId?: string) => backupService.listBackups(userId),
    deleteBackup: (backupId: string) => backupService.deleteBackup(backupId),
    cleanupOldBackups: () => backupService.cleanupOldBackups(),
    syncToCloud: () => backupService.syncToCloud(),
    verifyAllBackups: () => backupService.verifyAllBackups(),
    getBackupStats: () => backupService.getBackupStats(),
    exportBackup: (backupId: string, format?: 'json' | 'encrypted') => 
      backupService.exportBackup(backupId, format),
    importBackup: (backupString: string, format?: 'json' | 'encrypted') => 
      backupService.importBackup(backupString, format),
    configure: (config: Partial<BackupConfig>) => backupService.configure(config)
  };
};

export default backupService;