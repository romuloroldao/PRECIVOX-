// components/dashboard/TutorialModal.tsx - Modal para exibir tutoriais passo-a-passo
import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Lightbulb, 
  Download, 
  ExternalLink, 
  MessageCircle,
  Play,
  Target,
  TrendingUp,
  Users,
  Brain,
  ArrowRight,
  ArrowLeft,
  BarChart3
} from 'lucide-react';
import { StepByStepTutorial, TutorialStep, insightTutorialService } from '../../services/insightTutorialService';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: StepByStepTutorial | null;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  tutorial
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (tutorial) {
      const completed = insightTutorialService.getCompletedSteps(tutorial.id);
      setCompletedSteps(completed);
      setProgress(insightTutorialService.getTutorialProgress(tutorial));
    }
  }, [tutorial]);

  if (!isOpen || !tutorial) return null;

  const currentStep = tutorial.steps[currentStepIndex];

  const handleStepComplete = (stepId: number) => {
    if (tutorial) {
      insightTutorialService.markStepCompleted(tutorial.id, stepId);
      const newCompleted = new Set(completedSteps);
      newCompleted.add(stepId);
      setCompletedSteps(newCompleted);
      setProgress(insightTutorialService.getTutorialProgress(tutorial));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'facil': '#22c55e',
      'medio': '#f59e0b', 
      'dificil': '#ef4444'
    };
    return colors[difficulty as keyof typeof colors] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'alta': '#ef4444',
      'media': '#f59e0b',
      'baixa': '#22c55e'
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  };

  const getResourceIcon = (type: string) => {
    const icons = {
      'link': <ExternalLink size={16} />,
      'download': <Download size={16} />,
      'contact': <MessageCircle size={16} />,
      'video': <Play size={16} />
    };
    return icons[type as keyof typeof icons] || <ExternalLink size={16} />;
  };

  return (
    <div 
      className="tutorial-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="tutorial-modal"
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '24px 32px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Brain size={24} />
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                margin: '0',
                color: '#fff' 
              }}>
                {tutorial.title}
              </h2>
            </div>
            
            <p style={{ 
              fontSize: '16px', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: '0 0 16px 0',
              lineHeight: '1.5'
            }}>
              {tutorial.description}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} />
                <span style={{ fontSize: '14px' }}>{tutorial.estimatedTime}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={16} />
                <span 
                  style={{ 
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: getDifficultyColor(tutorial.difficulty),
                    fontWeight: '600'
                  }}
                >
                  {tutorial.difficulty.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} />
                <span 
                  style={{ 
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: getPriorityColor(tutorial.priority),
                    fontWeight: '600'
                  }}
                >
                  PRIORIDADE {tutorial.priority.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Progresso</span>
                <span style={{ fontSize: '14px' }}>{Math.round(progress)}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#22c55e',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#fff',
              marginLeft: '16px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          display: 'flex', 
          flex: 1,
          overflow: 'hidden' 
        }}>
          {/* Steps Sidebar */}
          <div style={{
            width: '280px',
            borderRight: '1px solid #e5e7eb',
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: '#f8fafc'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: '0 0 16px 0',
              color: '#374151'
            }}>
              Passos ({tutorial.steps.length})
            </h3>
            
            {tutorial.steps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => setCurrentStepIndex(index)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  backgroundColor: currentStepIndex === index ? '#e0e7ff' : 'transparent',
                  border: currentStepIndex === index ? '2px solid #4f46e5' : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {completedSteps.has(step.id) ? (
                    <CheckCircle size={16} style={{ color: '#22c55e' }} />
                  ) : (
                    <Circle size={16} style={{ color: '#9ca3af' }} />
                  )}
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: currentStepIndex === index ? '#4f46e5' : '#374151'
                  }}>
                    {step.title}
                  </span>
                </div>
                <div style={{ 
                  marginTop: '4px', 
                  marginLeft: '24px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {step.duration}
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ 
            flex: 1,
            padding: '32px',
            overflowY: 'auto'
          }}>
            {/* Current Step */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  margin: '0',
                  color: '#111827'
                }}>
                  Passo {currentStepIndex + 1}: {currentStep.title}
                </h3>
                
                <button
                  onClick={() => handleStepComplete(currentStep.id)}
                  disabled={completedSteps.has(currentStep.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: completedSteps.has(currentStep.id) ? '#22c55e' : '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: completedSteps.has(currentStep.id) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {completedSteps.has(currentStep.id) ? (
                    <>
                      <CheckCircle size={16} />
                      Concluído
                    </>
                  ) : (
                    <>
                      <Circle size={16} />
                      Marcar como concluído
                    </>
                  )}
                </button>
              </div>

              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280', 
                lineHeight: '1.6',
                margin: '0 0 24px 0'  
              }}>
                {currentStep.description}
              </p>

              {/* Actions */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  margin: '0 0 12px 0',
                  color: '#374151'
                }}>
                  ✅ Ações a realizar:
                </h4>
                <div style={{ paddingLeft: '8px' }}>
                  {currentStep.actions.map((action, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#4f46e5',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        {index + 1}
                      </div>
                      <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {currentStep.tips.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 12px 0',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Lightbulb size={16} style={{ color: '#f59e0b' }} />
                    Dicas importantes:
                  </h4>
                  {currentStep.tips.map((tip, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '12px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#92400e' }}>💡 {tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {currentStep.warnings && currentStep.warnings.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 12px 0',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                    Atenção:
                  </h4>
                  {currentStep.warnings.map((warning, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '12px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #f87171',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#991b1b' }}>⚠️ {warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                style={{
                  padding: '10px 20px',
                  backgroundColor: currentStepIndex === 0 ? '#f3f4f6' : '#6b7280',
                  color: currentStepIndex === 0 ? '#9ca3af' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ArrowLeft size={16} />
                Passo Anterior
              </button>

              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                textAlign: 'center'
              }}>
                Passo {currentStepIndex + 1} de {tutorial.steps.length}
              </div>

              <button
                onClick={() => setCurrentStepIndex(Math.min(tutorial.steps.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex === tutorial.steps.length - 1}
                style={{
                  padding: '10px 20px',
                  backgroundColor: currentStepIndex === tutorial.steps.length - 1 ? '#f3f4f6' : '#4f46e5',
                  color: currentStepIndex === tutorial.steps.length - 1 ? '#9ca3af' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: currentStepIndex === tutorial.steps.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Próximo Passo
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Resources & Metrics Footer */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '24px 32px',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Resources */}
            <div>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                margin: '0 0 16px 0',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Download size={16} />
                Recursos de Apoio
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tutorial.resources.slice(0, 3).map((resource, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{resource.icon}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        {resource.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {resource.description}
                      </div>
                    </div>
                    {getResourceIcon(resource.type)}
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Results */}
            <div>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                margin: '0 0 16px 0',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <TrendingUp size={16} />
                Resultados Esperados
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tutorial.expectedResults.slice(0, 3).map((result, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      fontSize: '14px',
                      color: '#374151'
                    }}
                  >
                    <CheckCircle size={16} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} />
                    <span>{result}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;