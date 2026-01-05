/**
 * Referral Page - Sistema de Indicação
 * 
 * Features:
 * - Código único de convite
 * - Compartilhamento via WhatsApp
 * - Copiar código para clipboard
 * - Lista de referidos
 * - Recompensas acumuladas
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { TOKENS } from '@/styles/tokens';

interface ReferralStats {
    code: string;
    totalReferred: number;
    activeReferred: number;
    totalRewards: number; // em centavos
    referrals: Array<{
        id: string;
        refereeName: string | null;
        status: 'pending' | 'completed';
        createdAt: string;
        completedAt: string | null;
    }>;
}

export default function ReferralPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const userId = (session?.user as any)?.id || 'temp-user-id';

    useEffect(() => {
        fetchReferralStats();
    }, [userId]);

    async function fetchReferralStats() {
        try {
            setLoading(true);

            // TODO: Substituir por API real quando implementada
            // const response = await fetch(`/api/referral/stats?userId=${userId}`);
            // const data = await response.json();

            // Mock data para desenvolvimento
            const mockData: ReferralStats = {
                code: `PRECI${userId.slice(0, 6).toUpperCase()}`,
                totalReferred: 5,
                activeReferred: 3,
                totalRewards: 2500, // R$ 25,00
                referrals: [
                    {
                        id: '1',
                        refereeName: 'João Silva',
                        status: 'completed',
                        createdAt: '2025-12-20T10:00:00Z',
                        completedAt: '2025-12-21T15:30:00Z',
                    },
                    {
                        id: '2',
                        refereeName: 'Maria Santos',
                        status: 'completed',
                        createdAt: '2025-12-18T14:00:00Z',
                        completedAt: '2025-12-19T09:15:00Z',
                    },
                    {
                        id: '3',
                        refereeName: 'Pedro Oliveira',
                        status: 'completed',
                        createdAt: '2025-12-15T08:30:00Z',
                        completedAt: '2025-12-16T11:45:00Z',
                    },
                    {
                        id: '4',
                        refereeName: null,
                        status: 'pending',
                        createdAt: '2025-12-28T16:20:00Z',
                        completedAt: null,
                    },
                    {
                        id: '5',
                        refereeName: null,
                        status: 'pending',
                        createdAt: '2025-12-29T12:10:00Z',
                        completedAt: null,
                    },
                ],
            };

            setStats(mockData);
        } catch (error) {
            console.error('Error fetching referral stats:', error);
        } finally {
            setLoading(false);
        }
    }

    function copyToClipboard() {
        if (!stats) return;

        const referralLink = `https://precivox.com.br/registrar?ref=${stats.code}`;
        navigator.clipboard.writeText(referralLink);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function shareWhatsApp() {
        if (!stats) return;

        const referralLink = `https://precivox.com.br/registrar?ref=${stats.code}`;
        const message = encodeURIComponent(
            `🛒 Use o PRECIVOX e economize nas compras!\n\n` +
            `Cadastre-se com meu código ${stats.code} e ganhe R$ 5,00 de desconto na primeira compra!\n\n` +
            `${referralLink}`
        );

        window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    if (loading) {
        return (
            <main style={styles.main}>
                <div style={styles.container}>
                    <div style={styles.loading}>Carregando...</div>
                </div>
            </main>
        );
    }

    if (!stats) {
        return (
            <main style={styles.main}>
                <div style={styles.container}>
                    <div style={styles.error}>Erro ao carregar dados</div>
                </div>
            </main>
        );
    }

    return (
        <main style={styles.main}>
            <div style={styles.container}>
                {/* Header */}
                <header style={styles.header}>
                    <h1 style={styles.title}>🎁 Indique e Ganhe</h1>
                    <p style={styles.subtitle}>
                        Convide seus amigos e ganhe recompensas a cada indicação!
                    </p>
                </header>

                {/* Código de Convite */}
                <section style={styles.codeCard}>
                    <h2 style={styles.sectionTitle}>Seu Código de Convite</h2>
                    <div style={styles.codeBox}>
                        <span style={styles.code}>{stats.code}</span>
                    </div>

                    <div style={styles.buttonGroup}>
                        <button
                            onClick={copyToClipboard}
                            style={{
                                ...styles.button,
                                ...(copied ? styles.buttonSuccess : styles.buttonPrimary),
                            }}
                        >
                            {copied ? '✓ Copiado!' : '📋 Copiar Link'}
                        </button>

                        <button
                            onClick={shareWhatsApp}
                            style={{ ...styles.button, ...styles.buttonWhatsApp }}
                        >
                            💬 Compartilhar no WhatsApp
                        </button>
                    </div>
                </section>

                {/* Estatísticas */}
                <section style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <span style={styles.statIcon}>👥</span>
                        <div>
                            <p style={styles.statValue}>{stats.totalReferred}</p>
                            <p style={styles.statLabel}>Total de Indicados</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <span style={styles.statIcon}>✅</span>
                        <div>
                            <p style={styles.statValue}>{stats.activeReferred}</p>
                            <p style={styles.statLabel}>Ativos</p>
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <span style={styles.statIcon}>💰</span>
                        <div>
                            <p style={styles.statValue}>
                                R$ {(stats.totalRewards / 100).toFixed(2)}
                            </p>
                            <p style={styles.statLabel}>Recompensas</p>
                        </div>
                    </div>
                </section>

                {/* Como Funciona */}
                <section style={styles.howItWorks}>
                    <h2 style={styles.sectionTitle}>Como Funciona?</h2>
                    <div style={styles.stepsList}>
                        <div style={styles.step}>
                            <span style={styles.stepNumber}>1</span>
                            <div>
                                <h3 style={styles.stepTitle}>Compartilhe seu código</h3>
                                <p style={styles.stepText}>
                                    Envie seu código de convite para amigos e familiares
                                </p>
                            </div>
                        </div>

                        <div style={styles.step}>
                            <span style={styles.stepNumber}>2</span>
                            <div>
                                <h3 style={styles.stepTitle}>Amigo se cadastra</h3>
                                <p style={styles.stepText}>
                                    Seu amigo usa seu código ao criar a conta
                                </p>
                            </div>
                        </div>

                        <div style={styles.step}>
                            <span style={styles.stepNumber}>3</span>
                            <div>
                                <h3 style={styles.stepTitle}>Ambos ganham!</h3>
                                <p style={styles.stepText}>
                                    Você ganha R$ 5,00 e seu amigo também!
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Lista de Indicados */}
                <section style={styles.referralsList}>
                    <h2 style={styles.sectionTitle}>Suas Indicações</h2>

                    {stats.referrals.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p style={styles.emptyText}>
                                Você ainda não indicou ninguém. Comece agora!
                            </p>
                        </div>
                    ) : (
                        <div style={styles.table}>
                            {stats.referrals.map((referral) => (
                                <div key={referral.id} style={styles.tableRow}>
                                    <div style={styles.tableCell}>
                                        <span style={styles.tableCellLabel}>Nome:</span>
                                        <span style={styles.tableCellValue}>
                                            {referral.refereeName || 'Aguardando cadastro'}
                                        </span>
                                    </div>

                                    <div style={styles.tableCell}>
                                        <span style={styles.tableCellLabel}>Data:</span>
                                        <span style={styles.tableCellValue}>
                                            {new Date(referral.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>

                                    <div style={styles.tableCell}>
                                        <span
                                            style={{
                                                ...styles.statusBadge,
                                                ...(referral.status === 'completed'
                                                    ? styles.statusCompleted
                                                    : styles.statusPending),
                                            }}
                                        >
                                            {referral.status === 'completed' ? '✓ Completo' : '⏳ Pendente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

// Estilos - Mobile-First
const styles = {
    main: {
        minHeight: '100vh',
        backgroundColor: TOKENS.colors.surface,
        paddingBottom: TOKENS.spacing[8],
    },

    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: TOKENS.spacing[4],
    },

    loading: {
        textAlign: 'center' as const,
        padding: TOKENS.spacing[8],
        color: TOKENS.colors.text.secondary,
    },

    error: {
        textAlign: 'center' as const,
        padding: TOKENS.spacing[8],
        color: TOKENS.colors.error,
    },

    header: {
        textAlign: 'center' as const,
        marginBottom: TOKENS.spacing[6],
    },

    title: {
        fontSize: TOKENS.typography.fontSize['3xl'],
        fontWeight: TOKENS.typography.fontWeight.extrabold,
        color: TOKENS.colors.text.primary,
        margin: 0,
        marginBottom: TOKENS.spacing[2],
    },

    subtitle: {
        fontSize: TOKENS.typography.fontSize.base,
        color: TOKENS.colors.text.secondary,
        margin: 0,
    },

    codeCard: {
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: TOKENS.borderRadius.xl,
        padding: TOKENS.spacing[6],
        marginBottom: TOKENS.spacing[6],
        textAlign: 'center' as const,
    },

    sectionTitle: {
        fontSize: TOKENS.typography.fontSize.xl,
        fontWeight: TOKENS.typography.fontWeight.bold,
        color: TOKENS.colors.background,
        margin: 0,
        marginBottom: TOKENS.spacing[4],
    },

    codeBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: TOKENS.borderRadius.lg,
        padding: TOKENS.spacing[4],
        marginBottom: TOKENS.spacing[4],
    },

    code: {
        fontSize: '32px',
        fontWeight: TOKENS.typography.fontWeight.extrabold,
        color: TOKENS.colors.background,
        letterSpacing: '4px',
        fontFamily: 'monospace',
    },

    buttonGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: TOKENS.spacing[3],
    },

    button: {
        padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
        borderRadius: TOKENS.borderRadius.md,
        border: 'none',
        fontSize: TOKENS.typography.fontSize.base,
        fontWeight: TOKENS.typography.fontWeight.semibold,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },

    buttonPrimary: {
        backgroundColor: TOKENS.colors.background,
        color: TOKENS.colors.primary[600],
    },

    buttonSuccess: {
        backgroundColor: '#10b981',
        color: TOKENS.colors.background,
    },

    buttonWhatsApp: {
        backgroundColor: '#25d366',
        color: TOKENS.colors.background,
    },

    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: TOKENS.spacing[4],
        marginBottom: TOKENS.spacing[6],
    },

    statCard: {
        display: 'flex',
        alignItems: 'center',
        gap: TOKENS.spacing[3],
        padding: TOKENS.spacing[4],
        backgroundColor: TOKENS.colors.background,
        borderRadius: TOKENS.borderRadius.lg,
        border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    },

    statIcon: {
        fontSize: '32px',
    },

    statValue: {
        fontSize: TOKENS.typography.fontSize.xl,
        fontWeight: TOKENS.typography.fontWeight.bold,
        color: TOKENS.colors.text.primary,
        margin: 0,
        marginBottom: TOKENS.spacing[1],
    },

    statLabel: {
        fontSize: TOKENS.typography.fontSize.sm,
        color: TOKENS.colors.text.secondary,
        margin: 0,
    },

    howItWorks: {
        backgroundColor: TOKENS.colors.background,
        borderRadius: TOKENS.borderRadius.xl,
        padding: TOKENS.spacing[6],
        marginBottom: TOKENS.spacing[6],
    },

    stepsList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: TOKENS.spacing[4],
    },

    step: {
        display: 'flex',
        gap: TOKENS.spacing[3],
    },

    stepNumber: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: TOKENS.colors.primary[600],
        color: TOKENS.colors.background,
        fontSize: TOKENS.typography.fontSize.lg,
        fontWeight: TOKENS.typography.fontWeight.bold,
        flexShrink: 0,
    },

    stepTitle: {
        fontSize: TOKENS.typography.fontSize.base,
        fontWeight: TOKENS.typography.fontWeight.bold,
        color: TOKENS.colors.text.primary,
        margin: 0,
        marginBottom: TOKENS.spacing[1],
    },

    stepText: {
        fontSize: TOKENS.typography.fontSize.sm,
        color: TOKENS.colors.text.secondary,
        margin: 0,
    },

    referralsList: {
        backgroundColor: TOKENS.colors.background,
        borderRadius: TOKENS.borderRadius.xl,
        padding: TOKENS.spacing[6],
    },

    table: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: TOKENS.spacing[3],
    },

    tableRow: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: TOKENS.spacing[3],
        padding: TOKENS.spacing[3],
        backgroundColor: TOKENS.colors.surface,
        borderRadius: TOKENS.borderRadius.md,
        alignItems: 'center',
    },

    tableCell: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: TOKENS.spacing[1],
    },

    tableCellLabel: {
        fontSize: TOKENS.typography.fontSize.xs,
        color: TOKENS.colors.text.secondary,
        textTransform: 'uppercase' as const,
    },

    tableCellValue: {
        fontSize: TOKENS.typography.fontSize.sm,
        color: TOKENS.colors.text.primary,
        fontWeight: TOKENS.typography.fontWeight.medium,
    },

    statusBadge: {
        display: 'inline-block',
        padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
        borderRadius: TOKENS.borderRadius.md,
        fontSize: TOKENS.typography.fontSize.xs,
        fontWeight: TOKENS.typography.fontWeight.semibold,
    },

    statusCompleted: {
        backgroundColor: '#d1fae5',
        color: '#047857',
    },

    statusPending: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
    },

    emptyState: {
        textAlign: 'center' as const,
        padding: TOKENS.spacing[8],
    },

    emptyText: {
        fontSize: TOKENS.typography.fontSize.base,
        color: TOKENS.colors.text.secondary,
        margin: 0,
    },
};
