'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { X } from 'lucide-react';

// Tipo interno para evitar problemas de serialização do Next.js
type OnCloseHandler = (() => void) | undefined;

export interface ModalProps {
  isOpen: boolean;
  /**
   * Função de callback para fechar o modal.
   * Pode ser passada diretamente ou será gerenciada internamente se não fornecida.
   */
  onClose?: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

// Componente interno que recebe a função através de uma ref para evitar serialização
function ModalContent({
  isOpen,
  onCloseRef,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}: Omit<ModalProps, 'onClose'> & { onCloseRef: React.MutableRefObject<OnCloseHandler> }) {
  // Função estável que usa a ref para evitar problemas de serialização
  const handleClose = useCallback(() => {
    if (onCloseRef.current) {
      onCloseRef.current();
    }
  }, [onCloseRef]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className={cn(
          'bg-bg-paper rounded-lg shadow-xl w-full animate-in zoom-in-95 duration-200',
          'max-h-[90vh] overflow-hidden flex flex-col',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <div className="flex-1">
              {title && (
                <h2 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h2>
              )}
              {description && (
                <p className="text-sm md:text-base text-text-secondary mt-2">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={handleClose}
                className="ml-4"
                aria-label="Fechar"
              >
                <span className="sr-only">Fechar</span>
              </Button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
        {footer && (
          <div className="border-t border-gray-200 p-4 md:p-6 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente wrapper que gerencia a ref para evitar problemas de serialização
export function Modal(props: ModalProps) {
  const onCloseRef = useRef<OnCloseHandler>(props.onClose);
  
  // Atualiza a referência quando onClose mudar
  useEffect(() => {
    onCloseRef.current = props.onClose;
  }, [props.onClose]);

  useEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [props.isOpen]);

  const { onClose, ...restProps } = props;
  
  return (
    <ModalContent
      {...restProps}
      onCloseRef={onCloseRef}
    />
  );
}
