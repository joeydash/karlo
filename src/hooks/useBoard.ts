import { useEffect, useRef } from 'react';
import useBoardStore from '../stores/boardStore';
import { useOrganization } from './useOrganization';

export const useBoard = () => {
  const boardStore = useBoardStore();
  const { currentOrganization } = useOrganization();
  const lastFetchedOrgRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentOrganization?.id && currentOrganization.id !== lastFetchedOrgRef.current) {
      lastFetchedOrgRef.current = currentOrganization.id;
      // Clear current board when switching organizations
      boardStore.setCurrentBoard(null);
      // Small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        boardStore.fetchBoards(currentOrganization.id);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentOrganization?.id, boardStore]);

  return {
    ...boardStore,
    fetchBoards: boardStore.fetchBoards
  };
};