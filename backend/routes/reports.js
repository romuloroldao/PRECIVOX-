/**
 * Routes para exportação de relatórios
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { ReportExportService } from '../../core/services/report-export.service.js';
import * as path from 'path';
import * as fs from 'fs';

const router = express.Router();
const reportService = new ReportExportService();

// Middleware de autenticação
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, error: 'Token inválido' });
    }
};

/**
 * POST /api/reports/export/pdf
 * Exporta relatório em PDF
 */
router.post('/export/pdf', authenticateJWT, async (req, res) => {
    try {
        const reportData = req.body;

        const filepath = await reportService.exportToPDF(reportData);

        res.download(filepath, path.basename(filepath), (err) => {
            if (err) {
                console.error('[REPORTS] Erro ao enviar PDF:', err);
            } else {
                // Opcional: remover arquivo após download
                // fs.unlinkSync(filepath);
            }
        });
    } catch (error) {
        console.error('[REPORTS] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao gerar PDF'
        });
    }
});

/**
 * POST /api/reports/export/excel
 * Exporta relatório em Excel
 */
router.post('/export/excel', authenticateJWT, async (req, res) => {
    try {
        const reportData = req.body;

        const filepath = await reportService.exportToExcel(reportData);

        res.download(filepath, path.basename(filepath), (err) => {
            if (err) {
                console.error('[REPORTS] Erro ao enviar Excel:', err);
            }
        });
    } catch (error) {
        console.error('[REPORTS] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao gerar Excel'
        });
    }
});

export default router;

