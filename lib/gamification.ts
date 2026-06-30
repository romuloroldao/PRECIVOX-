/**
 * Gamification Helper - Lógica de Desbloqueio Automático
 * 
 * SQUAD B - Backend
 * 
 * Funções auxiliares para desbloquear badges automaticamente
 * baseado em ações do usuário
 */

/**
 * Desbloqueia badges automaticamente após ação do usuário
 * 
 * Uso:
 * await autoUnlockBadges(userId, 'list_created');
 * await autoUnlockBadges(userId, 'savings_added', 5000); // R$ 50,00
 */
export async function autoUnlockBadges(
  userId: string,
  action: 'list_created' | 'savings_added' | 'referral_made' | 'daily_login',
  value?: number
): Promise<void> {
  try {
    const response = await fetch('/api/gamification/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action,
        value,
      }),
    });

    const result = await response.json();

    if (result.success && result.data.newlyUnlocked.length > 0) {
      // Mostrar notificação de badge desbloqueado
      showBadgeNotification(result.data.newlyUnlocked);
    }
  } catch (error) {
    console.error('Error auto-unlocking badges:', error);
    // Não bloquear fluxo principal se gamificação falhar
  }
}

/**
 * Mostra notificação visual de badge desbloqueado
 */
function showBadgeNotification(badges: any[]): void {
  // TODO: Implementar toast/modal de notificação
  console.log('🎉 Badges desbloqueados:', badges);
  
  // Exemplo de notificação:
  badges.forEach((badge) => {
    console.log(`
      🎉 Novo Badge Desbloqueado!
      ${badge.icon} ${badge.name}
      ${badge.description}
      +${badge.points} pontos
    `);
  });
}

/**
 * Hook para usar em componentes React
 * 
 * Uso:
 * const { badges, totalPoints, unlock } = useGamification(userId);
 */
export function useGamification(userId: string) {
  // TODO: Implementar hook React
  return {
    badges: [],
    totalPoints: 0,
    unlock: autoUnlockBadges,
  };
}
