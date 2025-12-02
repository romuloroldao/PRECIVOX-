/**
 * Report Export Service - Exportação de relatórios em PDF e Excel
 */

import { logger } from '../ai/utils/logger';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportData {
    title: string;
    subtitle?: string;
    period?: {
        start: Date;
        end: Date;
    };
    sections: ReportSection[];
    metadata?: {
        generatedAt: Date;
        generatedBy: string;
        mercadoId?: string;
        unidadeId?: string;
    };
}

export interface ReportSection {
    title: string;
    type: 'table' | 'chart' | 'text' | 'metrics';
    data?: any[];
    columns?: string[];
    metrics?: Array<{ label: string; value: string | number }>;
    text?: string;
}

export class ReportExportService {
    private readonly OUTPUT_DIR = './exports';

    constructor() {
        // Criar diretório de exports se não existir
        if (!fs.existsSync(this.OUTPUT_DIR)) {
            fs.mkdirSync(this.OUTPUT_DIR, { recursive: true });
        }
    }

    /**
     * Exporta relatório em PDF
     */
    async exportToPDF(reportData: ReportData): Promise<string> {
        const startTime = Date.now();
        const filename = `relatorio_${Date.now()}.pdf`;
        const filepath = path.join(this.OUTPUT_DIR, filename);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(filepath);
                doc.pipe(stream);

                // Cabeçalho
                doc.fontSize(20).text(reportData.title, { align: 'center' });
                if (reportData.subtitle) {
                    doc.fontSize(12).text(reportData.subtitle, { align: 'center' });
                }
                doc.moveDown();

                // Período
                if (reportData.period) {
                    doc.fontSize(10)
                        .text(
                            `Período: ${reportData.period.start.toLocaleDateString('pt-BR')} a ${reportData.period.end.toLocaleDateString('pt-BR')}`,
                            { align: 'center' }
                        );
                    doc.moveDown();
                }

                // Seções
                reportData.sections.forEach((section, index) => {
                    if (index > 0) {
                        doc.addPage();
                    }

                    doc.fontSize(16).text(section.title, { underline: true });
                    doc.moveDown();

                    switch (section.type) {
                        case 'table':
                            this.addTableToPDF(doc, section);
                            break;
                        case 'metrics':
                            this.addMetricsToPDF(doc, section);
                            break;
                        case 'text':
                            doc.fontSize(11).text(section.text || '');
                            break;
                    }

                    doc.moveDown();
                });

                // Rodapé
                doc.fontSize(8)
                    .text(
                        `Gerado em ${new Date().toLocaleString('pt-BR')} por ${reportData.metadata?.generatedBy || 'Sistema'}`,
                        { align: 'center' }
                    );

                doc.end();

                stream.on('finish', () => {
                    const executionTime = Date.now() - startTime;
                    logger.info('ReportExportService', 'Relatório PDF gerado', {
                        filename,
                        executionTime
                    });
                    resolve(filepath);
                });

                stream.on('error', reject);
            } catch (error: any) {
                logger.error('ReportExportService', 'Erro ao gerar PDF', {
                    error: error.message
                });
                reject(error);
            }
        });
    }

    /**
     * Exporta relatório em Excel
     */
    async exportToExcel(reportData: ReportData): Promise<string> {
        const startTime = Date.now();
        const filename = `relatorio_${Date.now()}.xlsx`;
        const filepath = path.join(this.OUTPUT_DIR, filename);

        try {
            const workbook = XLSX.utils.book_new();

            // Criar sheet principal com informações do relatório
            const infoData = [
                ['Relatório', reportData.title],
                ['Subtítulo', reportData.subtitle || ''],
                ['Período', reportData.period 
                    ? `${reportData.period.start.toLocaleDateString('pt-BR')} a ${reportData.period.end.toLocaleDateString('pt-BR')}`
                    : ''],
                ['Gerado em', new Date().toLocaleString('pt-BR')],
                ['Gerado por', reportData.metadata?.generatedBy || 'Sistema']
            ];

            const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
            XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informações');

            // Criar sheet para cada seção
            reportData.sections.forEach((section, index) => {
                let sheetData: any[][] = [];

                switch (section.type) {
                    case 'table':
                        if (section.data && section.columns) {
                            // Cabeçalho
                            sheetData.push(section.columns);
                            // Dados
                            section.data.forEach(row => {
                                const rowData = section.columns!.map(col => row[col] || '');
                                sheetData.push(rowData);
                            });
                        }
                        break;
                    case 'metrics':
                        if (section.metrics) {
                            sheetData.push(['Métrica', 'Valor']);
                            section.metrics.forEach(metric => {
                                sheetData.push([metric.label, metric.value]);
                            });
                        }
                        break;
                    case 'text':
                        sheetData.push([section.text || '']);
                        break;
                }

                if (sheetData.length > 0) {
                    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
                    XLSX.utils.book_append_sheet(workbook, sheet, section.title.substring(0, 31)); // Excel limita a 31 caracteres
                }
            });

            // Escrever arquivo
            XLSX.writeFile(workbook, filepath);

            const executionTime = Date.now() - startTime;
            logger.info('ReportExportService', 'Relatório Excel gerado', {
                filename,
                executionTime
            });

            return filepath;
        } catch (error: any) {
            logger.error('ReportExportService', 'Erro ao gerar Excel', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Adiciona tabela ao PDF
     */
    private addTableToPDF(doc: PDFDocument, section: ReportSection): void {
        if (!section.data || !section.columns) return;

        const tableTop = doc.y;
        const colWidths = section.columns.map(() => 100);
        const rowHeight = 20;

        // Cabeçalho
        doc.fontSize(10).font('Helvetica-Bold');
        section.columns.forEach((col, i) => {
            doc.text(col, 50 + i * 100, tableTop, {
                width: colWidths[i],
                align: 'left'
            });
        });

        // Linha separadora
        doc.moveTo(50, tableTop + rowHeight)
            .lineTo(550, tableTop + rowHeight)
            .stroke();

        // Dados
        doc.font('Helvetica');
        section.data.forEach((row, rowIndex) => {
            const y = tableTop + rowHeight + (rowIndex * rowHeight);
            section.columns!.forEach((col, colIndex) => {
                doc.text(String(row[col] || ''), 50 + colIndex * 100, y, {
                    width: colWidths[colIndex],
                    align: 'left'
                });
            });
        });
    }

    /**
     * Adiciona métricas ao PDF
     */
    private addMetricsToPDF(doc: PDFDocument, section: ReportSection): void {
        if (!section.metrics) return;

        section.metrics.forEach((metric, index) => {
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text(metric.label + ':', 50, doc.y);
            
            doc.font('Helvetica')
                .text(String(metric.value), 200, doc.y - 11);
            
            doc.moveDown(0.5);
        });
    }

    /**
     * Remove arquivo de export
     */
    async deleteExport(filepath: string): Promise<void> {
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                logger.info('ReportExportService', 'Arquivo de export removido', { filepath });
            }
        } catch (error: any) {
            logger.error('ReportExportService', 'Erro ao remover arquivo', {
                filepath,
                error: error.message
            });
        }
    }
}

