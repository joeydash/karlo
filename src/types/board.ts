export interface Board {
  id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'organization' | 'public';
  background_color?: string;
  background_image_url?: string;
  organization_id: string;
  created_by: string;
  auth_fullname?: {
    fullname: string;
    dp?: string;
    id: string;
  };
  created_at: string;
  updated_at: string;
  is_closed: boolean;
}

export interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
  
  fetchBoards: (organizationId: string) => Promise<void>;
  setCurrentBoard: (board: Board) => void;
  createBoard: (data: CreateBoardData, organizationId: string) => Promise<{ success: boolean; board?: Board; message?: string }>;
  updateBoard: (boardId: string, data: Partial<CreateBoardData>) => Promise<{ success: boolean; message?: string }>;
  deleteBoard: (boardId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface CreateBoardData {
  name: string;
  description?: string;
  visibility: 'private' | 'organization' | 'public';
  background_color?: string;
  background_image_url?: string;
}

export interface BoardsResponse {
  karlo_boards: Board[];
}