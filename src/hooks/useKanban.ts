import { useEffect } from 'react';
import useKanbanStore from '../stores/kanbanStore';
import { useAuth } from './useAuth';

export const useKanban = (boardId?: string) => {
  const kanbanStore = useKanbanStore();
  const { token } = useAuth();

  useEffect(() => {
    if (boardId) {
      kanbanStore.fetchBoardData(boardId);
    }
  }, [boardId, token]);

  return kanbanStore;
};