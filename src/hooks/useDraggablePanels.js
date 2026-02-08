import { useState, useCallback } from 'react';

export function useDraggablePanels(initialPanels) {
  const [panels, setPanels] = useState(initialPanels);
  const [dragIndex, setDragIndex] = useState(null);

  const handleDragStart = useCallback((index) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
  }, [dragIndex]);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }

    const newPanels = [...panels];
    const [draggedPanel] = newPanels.splice(dragIndex, 1);
    newPanels.splice(dropIndex, 0, draggedPanel);
    
    setPanels(newPanels);
    setDragIndex(null);
  }, [dragIndex, panels]);

  return { panels, handleDragStart, handleDragOver, handleDrop };
}
