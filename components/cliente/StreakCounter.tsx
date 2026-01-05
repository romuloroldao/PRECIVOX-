/**
 * StreakCounter Component
 * 
 * Exibe dias consecutivos de uso do usuário
 * Integra com /api/streaks/check
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface StreakData {
    streak: number;
    longestStreak: number;
    isNew?: boolean;
    isNewRecord?: boolean;
    broken?: boolean;
    previousStreak?: number;
}

interface StreakCounterProps {
    userId?: string;
}

export function StreakCounter({ userId }: StreakCounterProps) {
    const { data: session } = useSession();
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnimation, setShowAnimation] = useState(false);

    const effectiveUserId = userId || session?.user?.id;

    useEffect(() => {
        if (!effectiveUserId) {
            setLoading(false);
            return;
        }

        checkStreak();
    }, [effectiveUserId]);

    async function checkStreak() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/streaks/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: effectiveUserId }),
            });

            const result = await response.json();

            if (result.success) {
                setStreakData(result.data);

                // Log events (callbacks removidos para evitar erros de serialização)
                if (result.data.broken) {
                    console.log(`Streak quebrado! Anterior: ${result.data.previousStreak} dias`);
                }
                if (result.data.isNewRecord) {
                    console.log(`Novo recorde! ${result.data.streak} dias consecutivos!`);
                }

                // Animação de comemoração
                if (result.data.streak >= 3) {
                    setShowAnimation(true);
                    setTimeout(() => setShowAnimation(false), 2000);
                }
            } else {
                setError(result.message || 'Erro ao carregar streak');
            }
        } catch (err) {
            console.error('Error checking streak:', err);
            setError('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (error || !streakData) {
        return null; // Não exibir se erro
    }

    const { streak, longestStreak, broken, isNewRecord } = streakData;

    return (
        <div className={`relative bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border-2 ${showAnimation ? 'border-orange-500 animate-bounce' : 'border-orange-200'
            } transition-all duration-300`}>
            {/* Fogo animado */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <span className={`text-4xl transition-transform duration-300 ${showAnimation ? 'scale-125' : 'scale-100'
                        }`}>
                        🔥
                    </span>
                    {showAnimation && (
                        <div className="absolute -top-2 -right-2 text-2xl animate-ping">✨</div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-orange-600">
                            {streak}
                        </span>
                        <span className="text-sm text-gray-600">
                            {streak === 1 ? 'dia' : 'dias'} consecutivos
                        </span>
                    </div>

                    {/* Recorde pessoal */}
                    {longestStreak > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-500">
                                🏆 Melhor: {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}
                            </span>
                            {isNewRecord && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                                    NOVO RECORDE!
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Notificação de streak quebrado */}
            {broken && streakData.previousStreak && streakData.previousStreak > 1 && (
                <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                    ⚠️ Seu streak de {streakData.previousStreak} dias foi interrompido. Comece novamente!
                </div>
            )}

            {/* Mensagem motivacional */}
            {streak >= 5 && !broken && (
                <div className="mt-3 text-xs text-orange-700 font-medium">
                    {streak >= 30 ? '🎉 Incrível! Continue assim!' :
                        streak >= 15 ? '💪 Você está arrasando!' :
                            streak >= 7 ? '🌟 Uma semana completa!' :
                                '🚀 Você está no caminho certo!'}
                </div>
            )}

            {/* Próximo marco */}
            {streak < 30 && (
                <div className="mt-2 text-xs text-gray-500">
                    {getNextMilestone(streak)}
                </div>
            )}
        </div>
    );
}

function getNextMilestone(currentStreak: number): string {
    if (currentStreak < 7) {
        return `Faltam ${7 - currentStreak} dias para 1 semana 🎯`;
    }
    if (currentStreak < 15) {
        return `Faltam ${15 - currentStreak} dias para 15 dias 🏅`;
    }
    if (currentStreak < 30) {
        return `Faltam ${30 - currentStreak} dias para 1 mês 👑`;
    }
    return 'Você alcançou o nível máximo! 🌟';
}
