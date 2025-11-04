import { useEffect, useRef } from "react";
import useKanbanStore from "../stores/kanbanStore";
import { useAuth } from "./useAuth";
import { useOrganization } from "./useOrganization";

export const useKanban = (boardId?: string) => {
  const kanbanStore = useKanbanStore();
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();
  const previousOrgIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (boardId && currentOrganization?.id) {
      // Check if organization changed
      const orgChanged =
        previousOrgIdRef.current !== null &&
        previousOrgIdRef.current !== currentOrganization.id;

      if (orgChanged) {
        // Clear current board data immediately when organization changes
        // Access the zustand store's setState directly
        useKanbanStore.setState({
          currentBoard: null,
          lists: [],
          isLoading: true,
        });
      }

      // Update the ref
      previousOrgIdRef.current = currentOrganization.id;

      // Fetch board data
      kanbanStore.fetchBoardData(boardId);
    }
  }, [boardId, token, currentOrganization?.id]);

  return kanbanStore;
};
