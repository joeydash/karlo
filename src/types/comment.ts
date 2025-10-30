export interface Comment {
  id: string;
  card_id: string;
  member_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  auth_fullname?: {
    id: string;
    fullname: string;
    dp: string | null;
  };
}

export interface CreateCommentInput {
  card_id: string;
  member_id: string;
  user_id: string;
  comment: string;
}

export interface UpdateCommentInput {
  id: string;
  comment: string;
}
