export interface KanbanList {
  id: string;
  name: string;
  position: number;
  board_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  auth_fullname?: {
    fullname: string;
    dp?: string;
    id: string;
  };
  color?: string;
  confetti?: boolean;
  is_final?: boolean;
  karlo_cards: KanbanCard[];
}

interface CardMember {
  authFullnameByUserId: {
    fullname: string;
    dp?: string;
    id: string;
  };
}

interface CardMembersAggregate {
  aggregate: {
    count: number;
  };
}

interface CardMember {
  id: string;
  card_id: string;
  user_id: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  authFullnameByUserId: {
    fullname: string;
    dp?: string;
    blurhash?: string;
  };
}

interface OrganizationMember {
  user_id: string;
  auth_fullname: {
    fullname: string;
    dp?: string;
    blurhash?: string;
    last_active?: string;
  };
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  cover_color?: string;
  cover_image_url?: string;
  due_date?: string;
  is_archived: boolean;
  created_at: string;
  created_by: string;
  auth_fullname?: {
    fullname: string;
    dp?: string;
    id: string;
  };
  position: number;
  list_id: string;
  is_completed?: boolean;
  story_points: number | null
  karlo_card_members_aggregate?: CardMembersAggregate;
  karlo_card_members?: CardMember[];
  karlo_attachments?: CardAttachment[];
  karlo_attachments_aggregate?: {
    aggregate: {
      count: number;
    };
  };
  karlo_card_comments?: Array<{
    id: string;
  }>;
}

interface CardAttachment {
  id: string;
  card_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  url: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  background_color?: string;
  background_image_url?: string;
}

export interface KanbanState {
  currentBoard: KanbanBoard | null;
  lists: KanbanList[];
  isLoading: boolean;
  error: string | null;
  
  fetchBoardData: (boardId: string) => Promise<void>;
  createList: (boardId: string, name: string) => Promise<{ success: boolean; message?: string }>;
  updateList: (listId: string, data: Partial<Pick<KanbanList, 'name' | 'color' | 'confetti' | 'is_final'>>) => Promise<{ success: boolean; message?: string }>;
  deleteList: (listId: string) => Promise<{ success: boolean; message?: string }>;
  createCard: (listId: string, data: Partial<KanbanCard>) => Promise<{ success: boolean; message?: string }>;
  updateCard: (cardId: string, data: Partial<KanbanCard>) => Promise<{ success: boolean; message?: string }>;
  deleteCard: (cardId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  moveCard: (cardId: string, sourceListId: string, targetListId: string, newPosition: number) => Promise<{ success: boolean; message?: string }>;
  
  // Card member management
  getCardMembers: (cardId: string) => Promise<{ success: boolean; members?: any[]; message?: string }>;
  getOrganizationMembers: (organizationId: string) => Promise<{ success: boolean; members?: any[]; message?: string }>;
  addCardMember: (cardId: string, userId: string) => Promise<{ success: boolean; message?: string }>;
  removeCardMember: (memberId: string) => Promise<{ success: boolean; message?: string }>;
  
  // File attachment management
  uploadFile: (file: File, cardId: string) => Promise<{ success: boolean; attachment?: CardAttachment; message?: string }>;
  deleteAttachment: (attachmentId: string) => Promise<{ success: boolean; message?: string }>;
  
  // Local state management
  removeCardFromLocalState: (cardId: string) => void;

  // Comment management
  addCommentToCard: (cardId: string, commentId: string) => void;
  removeCommentFromCard: (cardId: string, commentId: string) => void;
}

export interface BoardDataResponse {
  karlo_boards: KanbanBoard[];
  karlo_lists: KanbanList[];
}