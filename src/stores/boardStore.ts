import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BoardState, Board, CreateBoardData, BoardsResponse } from '../types/board';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_BOARDS: `
    query GetBoardsByOrganization($orgId: uuid!) {
      karlo_boards(
        where: {
          organization_id: {_eq: $orgId},
          is_closed: {_eq: false}
        },
        order_by: {created_at: desc}
      ) {
        id
        name
        description
        visibility
        background_color
        background_image_url
        organization_id
        created_by
        auth_fullname {
          fullname
          dp
          id
        }
        created_at
        updated_at
        is_closed
      }
    }
  `,
  CREATE_BOARD: `
    mutation CreateBoard(
      $name: String!,
      $description: String,
      $visibility: String!,
      $background_color: String,
      $background_image_url: String,
      $organization_id: uuid!,
      $created_by: uuid!
    ) {
      insert_karlo_boards_one(object: {
        name: $name,
        description: $description,
        visibility: $visibility,
        background_color: $background_color,
        background_image_url: $background_image_url,
        organization_id: $organization_id,
        created_by: $created_by,
        is_closed: false
      }) {
        id
        name
        description
        visibility
        background_color
        background_image_url
        organization_id
        created_by
        created_at
        updated_at
        is_closed
      }
    }
  `,
  UPDATE_BOARD: `
    mutation UpdateBoard(
      $id: uuid!,
      $name: String,
      $description: String,
      $visibility: String,
      $background_color: String,
      $background_image_url: String
    ) {
      update_karlo_boards_by_pk(
        pk_columns: {id: $id},
        _set: {
          name: $name,
          description: $description,
          visibility: $visibility,
          background_color: $background_color,
          background_image_url: $background_image_url
        }
      ) {
        id
        name
        description
        visibility
        background_color
        background_image_url
        updated_at
      }
    }
  `,
  DELETE_BOARD: `
    mutation DeleteBoard($id: uuid!) {
      update_karlo_boards_by_pk(
        pk_columns: {id: $id},
        _set: {is_closed: true}
      ) {
        id
        is_closed
      }
    }
  `
};

const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      currentBoard: null,
      isLoading: false,
      error: null,

      fetchBoards: async (organizationId: string) => {
        const currentState = get();
        
        // Create a unique key for this fetch operation
        const fetchKey = `fetch_${organizationId}`;
        
        // Prevent multiple simultaneous fetches for the same organization
        if (currentState.isLoading || (window as any)[fetchKey]) {
          return;
        }
        
        // Mark this organization as being fetched
        (window as any)[fetchKey] = true;
        
        set({ isLoading: true, error: null });
        
        const { data, error } = await graphqlRequest<BoardsResponse>(
          QUERIES.GET_BOARDS,
          { orgId: organizationId }
        );

        // Clear the fetch flag and set loading to false
        delete (window as any)[fetchKey];
        set({ isLoading: false });

        if (error) {
          console.error('❌ Error fetching boards:', error);
          set({ error });
          return;
        }

        const boards = data?.karlo_boards || [];
        set({ 
          boards, 
          currentBoard: null
        });
      },

      setCurrentBoard: (board: Board) => {
        set({ currentBoard: board });
      },

      createBoard: async (data: CreateBoardData, organizationId: string) => {
        set({ isLoading: true, error: null });

        // Get current user from auth store
        const authStore = (window as any).__authStore;
        if (!authStore?.user?.id) {
          set({ isLoading: false, error: 'User not authenticated' });
          return { success: false, message: 'User not authenticated' };
        }

        const variables = {
          name: data.name,
          description: data.description,
          visibility: data.visibility,
          background_color: data.background_color,
          background_image_url: data.background_image_url,
          organization_id: organizationId,
          created_by: authStore.user.id
        };

        console.log('🔍 Creating board with variables:', variables);

        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.CREATE_BOARD,
          variables
        );

        console.log('📤 GraphQL result:', result);
        console.log('📤 Created board data:', result?.insert_karlo_boards_one);

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const newBoard = result?.insert_karlo_boards_one;
        if (newBoard) {
          const currentState = get();
          const updatedBoards = [newBoard, ...currentState.boards];
          set({ 
            boards: updatedBoards,
            currentBoard: newBoard
          });
          return { success: true, board: newBoard };
        }

        return { success: false, message: 'Failed to create board' };
      },

      updateBoard: async (boardId: string, data: Partial<CreateBoardData>) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.UPDATE_BOARD,
          {
            id: boardId,
            ...data
          }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const updatedBoard = result?.update_karlo_boards_by_pk;
        if (updatedBoard) {
          const currentState = get();
          const updatedBoards = currentState.boards.map(board => 
            board.id === boardId ? { ...board, ...updatedBoard } : board
          );
          set({ 
            boards: updatedBoards,
            currentBoard: currentState.currentBoard?.id === boardId 
              ? { ...currentState.currentBoard, ...updatedBoard }
              : currentState.currentBoard
          });
          return { success: true };
        }

        return { success: false, message: 'Failed to update board' };
      },

      deleteBoard: async (boardId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.DELETE_BOARD,
          { id: boardId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        if (result?.update_karlo_boards_by_pk) {
          const currentState = get();
          const updatedBoards = currentState.boards.filter(board => board.id !== boardId);
          set({ 
            boards: updatedBoards,
            currentBoard: currentState.currentBoard?.id === boardId 
              ? (updatedBoards.length > 0 ? updatedBoards[0] : null)
              : currentState.currentBoard
          });
          return { success: true };
        }

        return { success: false, message: 'Failed to delete board' };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'board-storage',
      partialize: (state) => ({
        boards: state.boards,
        currentBoard: state.currentBoard,
      }),
    }
  )
);

export default useBoardStore;