import { useState, useEffect, useCallback, useRef } from 'react';

export type BottomSheetPosition = 'minimized' | 'half' | 'full';

export const useBottomSheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<BottomSheetPosition>('minimized');
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setPosition('half');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPosition('minimized');
  }, []);

  const setToPosition = useCallback((newPosition: BottomSheetPosition) => {
    setPosition(newPosition);
    if (newPosition !== 'minimized') {
      setIsOpen(true);
    }
  }, []);

  // Gestão de gestos touch
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!sheetRef.current) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setCurrentY(e.touches[0].clientY);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaY = currentY - startY;
    const threshold = 50;

    if (deltaY > threshold) {
      // Swipe down
      if (position === 'full') {
        setPosition('half');
      } else if (position === 'half') {
        setPosition('minimized');
      }
    } else if (deltaY < -threshold) {
      // Swipe up
      if (position === 'minimized') {
        setPosition('half');
      } else if (position === 'half') {
        setPosition('full');
      }
    }
  }, [isDragging, currentY, startY, position]);

  // Mouse events para desktop
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!sheetRef.current) return;
    setIsDragging(true);
    setStartY(e.clientY);
    setCurrentY(e.clientY);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setCurrentY(e.clientY);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaY = currentY - startY;
    const threshold = 50;

    if (deltaY > threshold) {
      // Drag down
      if (position === 'full') {
        setPosition('half');
      } else if (position === 'half') {
        setPosition('minimized');
      }
    } else if (deltaY < -threshold) {
      // Drag up
      if (position === 'minimized') {
        setPosition('half');
      } else if (position === 'half') {
        setPosition('full');
      }
    }
  }, [isDragging, currentY, startY, position]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Touch events
    sheet.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Mouse events (para desktop)
    sheet.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      sheet.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Auto-show quando há conteúdo
  const autoShow = useCallback(() => {
    if (position === 'minimized') {
      setToPosition('half');
    }
  }, [position, setToPosition]);

  return {
    isOpen,
    position,
    isDragging,
    sheetRef,
    open,
    close,
    setToPosition,
    autoShow
  };
};