/**
 * Onboarding - 3 Telas em 30 Segundos
 * 
 * SQUAD A - Frontend/UX
 * 
 * Objetivo: Usuário cria primeira lista em < 30 segundos
 * Meta: Taxa de ativação 20% → 60%
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared';
import { TOKENS } from '@/styles/tokens';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

type OnboardingStep = 1 | 2 | 3;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  // Auto-avançar após login (simulado)
  useEffect(() => {
    if (currentStep === 2 && userName) {
      // Simular delay de autenticação
      setTimeout(() => {
        setCurrentStep(3);
      }, 1000);
    }
  }, [currentStep, userName]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleSkip = () => {
    router.push('/cliente/home');
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    
    try {
      // NextAuth social login
      // await signIn(provider, { callbackUrl: '/onboarding?step=3' });
      
      // SIMULAÇÃO para desenvolvimento
      setUserName(provider === 'google' ? 'Usuário Google' : 'Usuário Facebook');
      setCurrentStep(3);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFirstList = async () => {
    setIsLoading(true);
    
    try {
      // Buscar produtos populares
      const productsResponse = await fetch('/api/products/popular?limit=10');
      const productsData = await productsResponse.json();
      
      if (productsData.success) {
        // Criar lista automática
        const createResponse = await fetch('/api/lists/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'temp-user-id', // TODO: usar userId real do NextAuth
            name: 'Minha Primeira Lista',
            products: productsData.data.products.slice(0, 5).map((p: any) => p.id),
          }),
        });
        
        const listData = await createResponse.json();
        
        if (listData.success) {
          // Redirecionar para dashboard com a lista criada
          router.push(`/cliente/listas?new=${listData.data.listId}`);
        }
      }
    } catch (error) {
      console.error('Error creating list:', error);
      // Fallback: redirecionar mesmo com erro
      router.push('/cliente/listas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      {/* Progress Indicator */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${(currentStep / 3) * 100}%`,
            }}
          />
        </div>
        <p style={styles.progressText}>
          {currentStep}/3
        </p>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {currentStep === 1 && <Step1 onNext={handleNext} onSkip={handleSkip} />}
        {currentStep === 2 && <Step2 onSocialLogin={handleSocialLogin} isLoading={isLoading} />}
        {currentStep === 3 && <Step3 onCreate={handleCreateFirstList} isLoading={isLoading} />}
      </div>

      {/* Skip Button (apenas nas 2 primeiras telas) */}
      {currentStep < 3 && (
        <button onClick={handleSkip} style={styles.skipButton}>
          Pular Tutorial
        </button>
      )}
    </main>
  );
}

// ==========================================
// STEP 1: Bem-vindo + Proposta de Valor
// ==========================================
function Step1({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div style={styles.stepContainer}>
      <div style={styles.iconContainer}>
        <span style={styles.icon}>👋</span>
      </div>
      
      <h1 style={styles.title}>
        Bem-vindo ao PRECIVOX!
      </h1>
      
      <p style={styles.description}>
        Monte sua lista de compras e descubra onde comprar mais barato.
        <br /><br />
        <strong>Economize até R$ 200/mês</strong> sem esforço!
      </p>

      <div style={styles.features}>
        <Feature icon="🔍" text="Compare preços em segundos" />
        <Feature icon="📍" text="Encontre mercados perto de você" />
        <Feature icon="💰" text="Economize em cada compra" />
      </div>

      <div style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onNext}
        >
          Começar
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// STEP 2: Login Social (1 Clique)
// ==========================================
function Step2({ 
  onSocialLogin, 
  isLoading 
}: { 
  onSocialLogin: (provider: 'google' | 'facebook') => void;
  isLoading: boolean;
}) {
  return (
    <div style={styles.stepContainer}>
      <div style={styles.iconContainer}>
        <span style={styles.icon}>🔐</span>
      </div>
      
      <h1 style={styles.title}>
        Entre em 1 Clique
      </h1>
      
      <p style={styles.description}>
        Use sua conta Google ou Facebook.
        <br />
        Rápido, seguro e sem senhas para lembrar!
      </p>

      <div style={styles.socialButtonsContainer}>
        {/* Google Login */}
        <button
          onClick={() => onSocialLogin('google')}
          disabled={isLoading}
          style={styles.socialButton}
        >
          <span style={styles.socialIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </span>
          <span style={styles.socialButtonText}>
            {isLoading ? 'Entrando...' : 'Continuar com Google'}
          </span>
        </button>

        {/* Facebook Login */}
        <button
          onClick={() => onSocialLogin('facebook')}
          disabled={isLoading}
          style={{...styles.socialButton, backgroundColor: '#1877F2'}}
        >
          <span style={styles.socialIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </span>
          <span style={styles.socialButtonText}>
            {isLoading ? 'Entrando...' : 'Continuar com Facebook'}
          </span>
        </button>
      </div>

      <p style={styles.privacyText}>
        🔒 Seus dados estão seguros. Não compartilhamos com terceiros.
      </p>
    </div>
  );
}

// ==========================================
// STEP 3: Primeira Lista Automática
// ==========================================
function Step3({ 
  onCreate, 
  isLoading 
}: { 
  onCreate: () => void;
  isLoading: boolean;
}) {
  return (
    <div style={styles.stepContainer}>
      <div style={styles.iconContainer}>
        <span style={styles.icon}>🎉</span>
      </div>
      
      <h1 style={styles.title}>
        Tudo Pronto!
      </h1>
      
      <p style={styles.description}>
        Vamos criar sua primeira lista com produtos populares.
        <br /><br />
        Você pode editar depois!
      </p>

      <div style={styles.previewList}>
        <h3 style={styles.previewTitle}>Sua primeira lista terá:</h3>
        <ul style={styles.previewItems}>
          <li style={styles.previewItem}>✓ Arroz</li>
          <li style={styles.previewItem}>✓ Feijão</li>
          <li style={styles.previewItem}>✓ Óleo</li>
          <li style={styles.previewItem}>✓ Açúcar</li>
          <li style={styles.previewItem}>✓ Café</li>
        </ul>
      </div>

      <div style={styles.savingsPreview}>
        <span style={styles.savingsIcon}>💰</span>
        <div>
          <p style={styles.savingsText}>Economia estimada</p>
          <p style={styles.savingsAmount}>R$ 15-25</p>
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onCreate}
          loading={isLoading}
        >
          {isLoading ? 'Criando...' : 'Criar Minha Lista'}
        </Button>
      </div>
    </div>
  );
}

// Componente auxiliar
function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={styles.feature}>
      <span style={styles.featureIcon}>{icon}</span>
      <span style={styles.featureText}>{text}</span>
    </div>
  );
}

// ==========================================
// ESTILOS - Mobile-First usando TOKENS
// ==========================================
const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: TOKENS.colors.background,
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
  },
  
  progressContainer: {
    padding: TOKENS.spacing[4],
    backgroundColor: TOKENS.colors.surface,
  },
  
  progressBar: {
    height: '4px',
    backgroundColor: TOKENS.colors.gray[200],
    borderRadius: TOKENS.borderRadius.full,
    overflow: 'hidden' as const,
    marginBottom: TOKENS.spacing[2],
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: TOKENS.colors.primary[600],
    transition: 'width 0.3s ease',
  },
  
  progressText: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
    textAlign: 'center' as const,
    margin: 0,
  },
  
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TOKENS.spacing[4],
  },
  
  stepContainer: {
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center' as const,
  },
  
  iconContainer: {
    marginBottom: TOKENS.spacing[6],
  },
  
  icon: {
    fontSize: '80px',
    display: 'block',
  },
  
  title: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    color: TOKENS.colors.text.primary,
    marginBottom: TOKENS.spacing[4],
  },
  
  description: {
    fontSize: TOKENS.typography.fontSize.lg,
    color: TOKENS.colors.text.secondary,
    lineHeight: TOKENS.typography.lineHeight.relaxed,
    marginBottom: TOKENS.spacing[8],
  },
  
  features: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: TOKENS.spacing[3],
    marginBottom: TOKENS.spacing[8],
  },
  
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
    padding: TOKENS.spacing[3],
    backgroundColor: TOKENS.colors.surface,
    borderRadius: TOKENS.borderRadius.lg,
  },
  
  featureIcon: {
    fontSize: '24px',
  },
  
  featureText: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.primary,
    textAlign: 'left' as const,
  },
  
  buttonContainer: {
    marginTop: TOKENS.spacing[6],
  },
  
  skipButton: {
    position: 'absolute' as const,
    top: TOKENS.spacing[4],
    right: TOKENS.spacing[4],
    background: 'none',
    border: 'none',
    color: TOKENS.colors.text.secondary,
    fontSize: TOKENS.typography.fontSize.sm,
    cursor: 'pointer',
    padding: TOKENS.spacing[2],
  },
  
  // Step 2 - Social Login
  socialButtonsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: TOKENS.spacing[3],
    marginBottom: TOKENS.spacing[6],
  },
  
  socialButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TOKENS.spacing[3],
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
    backgroundColor: TOKENS.colors.background,
    border: `${TOKENS.borderWidth[2]} solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.lg,
    fontSize: TOKENS.typography.fontSize.base,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: TOKENS.transitions.base,
    minHeight: '48px',
  },
  
  socialIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  
  socialButtonText: {
    color: TOKENS.colors.text.primary,
  },
  
  privacyText: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },
  
  // Step 3 - First List
  previewList: {
    backgroundColor: TOKENS.colors.surface,
    padding: TOKENS.spacing[4],
    borderRadius: TOKENS.borderRadius.lg,
    marginBottom: TOKENS.spacing[4],
  },
  
  previewTitle: {
    fontSize: TOKENS.typography.fontSize.base,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.primary,
    marginBottom: TOKENS.spacing[3],
  },
  
  previewItems: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: TOKENS.spacing[2],
  },
  
  previewItem: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    textAlign: 'left' as const,
  },
  
  savingsPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TOKENS.spacing[3],
    padding: TOKENS.spacing[4],
    backgroundColor: TOKENS.colors.secondary[50],
    borderRadius: TOKENS.borderRadius.lg,
    marginBottom: TOKENS.spacing[6],
  },
  
  savingsIcon: {
    fontSize: '32px',
  },
  
  savingsText: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },
  
  savingsAmount: {
    fontSize: TOKENS.typography.fontSize['2xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    color: TOKENS.colors.secondary[700],
    margin: 0,
  },
};
