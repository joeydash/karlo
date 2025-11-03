import { create } from "zustand";
import { graphqlRequest } from "../utils/graphql";
import {
  KanbanState,
  KanbanBoard,
  KanbanList,
  KanbanCard,
  BoardDataResponse,
} from "../types/kanban";

const QUERIES = {
  GET_BOARD_DATA: `
    query GetBoardData($board_id: uuid!) {
      karlo_boards(where: {id: {_eq: $board_id}}) {
        id
        name
        description
        background_color
        background_image_url
      }
      karlo_lists(
        where: {board_id: {_eq: $board_id}, is_archived: {_eq: false}},
        order_by: {position: asc}
      ) {
        id
        name
        position
        board_id
        is_archived
        created_at
        updated_at
        created_by
        auth_fullname {
          fullname
          dp
          id
        }
        color
        confetti
        is_final
        karlo_cards(
          where: {is_archived: {_eq: false}},
          order_by: {position: asc}
        ) {
          id
          title
          description
          cover_color
          cover_image_url
          due_date
          story_points
          is_archived
          created_at
          created_by
          auth_fullname {
            fullname
            dp
            id
          }
          position
          list_id
          is_completed
          priority
          karlo_card_members_aggregate {
            aggregate {
              count
            }
          }
          karlo_card_members {
            id
            user_id
            authFullnameByUserId {
              fullname
              dp
              id
            }
          }
          karlo_attachments_aggregate {
            aggregate {
              count
            }
          }
          karlo_attachments {
            id
            filename
            original_filename
            mime_type
            file_size
            url
            uploaded_by
            created_at
          }
          karlo_card_comments {
            id
          }
        }
      }
    }
  `,
  CREATE_LIST: `
    mutation CreateList($board_id: uuid!, $name: String!, $position: numeric!, $color: String, $created_by: uuid!) {
      insert_karlo_lists_one(object: {
        board_id: $board_id,
        name: $name,
        position: $position,
        color: $color,
        created_by: $created_by,
        is_archived: false
      }) {
        id
        name
        position
        board_id
        is_archived
        created_at
        updated_at
        created_by
        auth_fullname {
          fullname
          dp
          id
        }
        color
        confetti
        is_final
        karlo_cards {
          id
          title
          description
          cover_color
          cover_image_url
          due_date
          story_points
          priority
          is_archived
          created_at
          created_by
          auth_fullname {
            fullname
            dp
            id
          }
          position
          list_id
          is_completed
        }
      }
    }
  `,
  CREATE_CARD: `
    mutation CreateCard($list_id: uuid!, $title: String!, $position: numeric!, $created_by: uuid!) {
      insert_karlo_cards_one(object: {
        list_id: $list_id,
        title: $title,
        position: $position,
        created_by: $created_by,
        is_archived: false
      }) {
        id
        title
        description
        cover_color
        cover_image_url
        due_date
        story_points
        priority
        is_archived
        created_at
        created_by
        position
        list_id
        is_completed
        auth_fullname {
          fullname
          dp
          id
        }
      }
    }
  `,
  UPDATE_CARD_POSITION_ONLY: `
    mutation UpdateCardPositionOnly($id: uuid!, $list_id: uuid!, $position: numeric!) {
      update_karlo_cards_by_pk(
        pk_columns: {id: $id},
        _set: {
          list_id: $list_id,
          position: $position
        }
      ) {
        id
        list_id
        position
        is_completed
      }
    }
  `,
  UPDATE_CARD_POSITION_WITH_COMPLETED: `
    mutation UpdateCardPositionWithCompleted($id: uuid!, $list_id: uuid!, $position: numeric!, $is_completed: Boolean!) {
      update_karlo_cards_by_pk(
        pk_columns: {id: $id},
        _set: {
          list_id: $list_id,
          position: $position,
          is_completed: $is_completed
        }
      ) {
        id
        list_id
        position
        is_completed
      }
    }
  `,
  UPDATE_LIST: `
    mutation UpdateList($id: uuid!, $name: String, $color: String, $confetti: Boolean, $is_final: Boolean) {
      update_karlo_lists_by_pk(
        pk_columns: {id: $id},
        _set: {
          name: $name,
          color: $color,
          confetti: $confetti,
          is_final: $is_final
        }
      ) {
        id
        name
        color
        confetti
        is_final
      }
    }
  `,
  DELETE_LIST: `
    mutation DeleteList($id: uuid!) {
      update_karlo_lists_by_pk(
        pk_columns: {id: $id},
        _set: {is_archived: true}
      ) {
        id
        is_archived
      }
    }
  `,
  UPDATE_CARD: `
    mutation UpdateCard(
      $id: uuid!,
      $title: String,
      $description: String,
      $due_date: timestamptz,
      $is_completed: Boolean,
      $is_archived: Boolean,
      $cover_color: String,
      $story_points: Int,
      $priority: String
    ) {
      update_karlo_cards_by_pk(
        pk_columns: {id: $id},
        _set: {
          title: $title,
          description: $description,
          due_date: $due_date,
          is_completed: $is_completed,
          is_archived: $is_archived,
          cover_color: $cover_color,
          story_points: $story_points,
          priority: $priority
        }
      ) {
        id
        title
        description
        cover_color
        cover_image_url
        due_date
        is_archived
        is_completed
        created_at
        created_by
        position
        list_id
        story_points
        priority
      }
    }
  `,
  BATCH_UPDATE_POSITIONS: `
    mutation BatchUpdatePositions($updates: [karlo_cards_updates!]!) {
      update_karlo_cards_many(updates: $updates) {
        affected_rows
      }
    }
  `,
  DELETE_CARD: `
    mutation ArchiveCard($id: uuid!) {
      update_karlo_cards_by_pk(
        pk_columns: {id: $id},
        _set: {is_archived: true}
      ) {
        id
        is_archived
      }
    }
  `,
  GET_CARD_MEMBERS: `
    query GetCardMembers($card_id: uuid!) {
      karlo_card_members(where: {card_id: {_eq: $card_id}}) {
        id
        card_id
        user_id
        assigned_at
        created_at
        updated_at
        authFullnameByUserId {
          fullname
          dp
          blurhash
        }
      }
    }
  `,
  GET_ORGANIZATION_MEMBERS: `
    query GetOrganizationMembers($organization_id: uuid!) {
      karlo_organization_members(where: {organization_id: {_eq: $organization_id}}) {
        id
        user_id
        auth_fullname {
          fullname
          dp
          blurhash
          last_active
        }
      }
    }
  `,
  ADD_CARD_MEMBER: `
    mutation AddCardMember($card_id: uuid!, $user_id: uuid!) {
      insert_karlo_card_members_one(object: {
        card_id: $card_id,
        user_id: $user_id
      }) {
        id
        card_id
        user_id
        assigned_at
        authFullnameByUserId {
          fullname
          dp
          blurhash
        }
      }
    }
  `,
  REMOVE_CARD_MEMBER: `
    mutation RemoveCardMember($id: uuid!) {
      delete_karlo_card_members_by_pk(id: $id) {
        id
      }
    }
  `,
  INSERT_ATTACHMENT: `
    mutation InsertKarloAttachments($file_size: Int, $card_id: uuid, $uploaded_by: uuid, $filename: String, $original_filename: String, $mime_type: String, $url: String) {
      insert_karlo_attachments(objects: {file_size: $file_size, card_id: $card_id, uploaded_by: $uploaded_by, filename: $filename, original_filename: $original_filename, mime_type: $mime_type, url: $url}) {
        affected_rows
        returning {
          filename
          mime_type
          original_filename
          url
          file_size
          created_at
          card_id
          id
          uploaded_by
        }
      }
    }
  `,
  DELETE_ATTACHMENT: `
    mutation DeleteAttachment($id: uuid!) {
      delete_karlo_attachments_by_pk(id: $id) {
        id
      }
    }
  `,
};

// Predefined colors for lists
const LIST_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
];

const DEFAULT_TEMPLATE_COLOR = "#6B7280"; // Gray for template lists

// Helper function to get random color
const getRandomListColor = () => {
  return LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)];
};
const useKanbanStore = create<KanbanState>((set, get) => ({
  currentBoard: null,
  lists: [],
  isLoading: false,
  error: null,

  fetchBoardData: async (boardId: string) => {
    set({ isLoading: true, error: null });

    const { data, error } = await graphqlRequest<BoardDataResponse>(
      QUERIES.GET_BOARD_DATA,
      { board_id: boardId }
    );

    set({ isLoading: false });

    if (error) {
      set({ error });
      return;
    }

    const board = data?.karlo_boards?.[0] || null;
    const lists = data?.karlo_lists || [];

    set({
      currentBoard: board,
      lists: lists,
    });
  },

  createList: async (boardId: string, name: string, color?: string) => {
    const currentState = get();
    const position = currentState.lists.length;
    const listColor = color || getRandomListColor();

    // Get current user from auth store
    const authStore = (window as any).__authStore;
    if (!authStore?.user?.id) {
      return { success: false, message: "User not authenticated" };
    }

    const { data, error } = await graphqlRequest<any>(QUERIES.CREATE_LIST, {
      board_id: boardId,
      name,
      position,
      color: listColor,
      created_by: authStore.user.id,
    });

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    const newList = data?.insert_karlo_lists_one;
    if (newList) {
      set({ lists: [...currentState.lists, newList] });
      return { success: true };
    }

    return { success: false, message: "Failed to create list" };
  },

  updateList: async (
    listId: string,
    data: Partial<Pick<KanbanList, "name" | "color" | "confetti" | "is_final">>
  ) => {
    const currentState = get();

    const { data: result, error } = await graphqlRequest<any>(
      QUERIES.UPDATE_LIST,
      {
        id: listId,
        name: data.name,
        color: data.color,
        confetti: data.confetti ?? false,
        is_final: data.is_final ?? false,
      }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    const updatedList = result?.update_karlo_lists_by_pk;
    if (updatedList) {
      // Update local state with the updated list
      const updatedLists = currentState.lists.map((list) =>
        list.id === listId ? { ...list, ...updatedList } : list
      );
      set({ lists: updatedLists });
      return { success: true };
    }

    return { success: false, message: "Failed to update list" };
  },

  deleteList: async (listId: string) => {
    const currentState = get();

    const { data: result, error } = await graphqlRequest<any>(
      QUERIES.DELETE_LIST,
      { id: listId }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    if (result?.update_karlo_lists_by_pk) {
      // Remove list from local state
      const updatedLists = currentState.lists.filter(
        (list) => list.id !== listId
      );
      set({ lists: updatedLists });
      return { success: true };
    }

    return { success: false, message: "Failed to delete list" };
  },

  createCard: async (listId: string, data: Partial<KanbanCard>) => {
    const currentState = get();

    // Get current user from auth store
    const authStore = (window as any).__authStore;
    if (!authStore?.user?.id) {
      set({ error: "User not authenticated" });
      return { success: false, message: "User not authenticated" };
    }

    // Find the list to get current card count for position
    const list = currentState.lists.find((l) => l.id === listId);
    if (!list) {
      set({ error: "List not found" });
      return { success: false, message: "List not found" };
    }

    const position = list.karlo_cards.length;

    const { data: result, error } = await graphqlRequest<any>(
      QUERIES.CREATE_CARD,
      {
        list_id: listId,
        title: data.title || "Untitled Card",
        position,
        created_by: authStore.user.id,
      }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    const newCard = result?.insert_karlo_cards_one;
    if (newCard) {
      // Update the lists state with the new card
      const updatedLists = currentState.lists.map((list) =>
        list.id === listId
          ? { ...list, karlo_cards: [...list.karlo_cards, newCard] }
          : list
      );
      set({ lists: updatedLists });
      return { success: true, card: newCard };
    }

    return { success: false, message: "Failed to create card" };
  },

  updateCard: async (cardId: string, data: Partial<KanbanCard>) => {
    const currentState = get();

    // If only updating position/list, use the position update mutation
    if (
      Object.keys(data).length <= 2 &&
      ("list_id" in data || "position" in data)
    ) {
      // Check if moving to a final list and set is_completed accordingly
      let isCompleted: boolean | undefined = undefined;
      if (data.list_id) {
        // Find the card to check if it's already completed
        const card = currentState.lists
          .flatMap((list) => list.karlo_cards)
          .find((c) => c.id === cardId);

        // Only update is_completed if card is not already completed
        if (card && !card.is_completed) {
          const targetList = currentState.lists.find(
            (list) => list.id === data.list_id
          );
          if (targetList?.is_final) {
            isCompleted = true;
          }
        }
      }

      // Choose the correct mutation based on whether is_completed needs to be updated
      const queryToUse =
        isCompleted !== undefined
          ? QUERIES.UPDATE_CARD_POSITION_WITH_COMPLETED
          : QUERIES.UPDATE_CARD_POSITION_ONLY;

      const variables: any = {
        id: cardId,
        list_id: data.list_id,
        position: data.position,
      };

      if (isCompleted !== undefined) {
        variables.is_completed = isCompleted;
      }

      const { data: result, error } = await graphqlRequest<any>(
        queryToUse,
        variables
      );

      if (error) {
        set({ error });
        return { success: false, message: error };
      }

      if (result?.update_karlo_cards_by_pk) {
        // Update local state for position changes
        const updatedData = { ...data };
        if (isCompleted !== undefined) {
          updatedData.is_completed = isCompleted;
        }

        const updatedLists = currentState.lists.map((list) => ({
          ...list,
          karlo_cards: list.karlo_cards
            .map((card) =>
              card.id === cardId ? { ...card, ...updatedData } : card
            )
            .filter((card) => card.list_id === list.id),
        }));

        // Add card to new list if it was moved
        if (data.list_id) {
          const cardToMove = currentState.lists
            .flatMap((list) => list.karlo_cards)
            .find((card) => card.id === cardId);

          if (cardToMove) {
            const updatedCard = { ...cardToMove, ...updatedData };
            updatedLists.forEach((list) => {
              if (list.id === data.list_id) {
                const cardExists = list.karlo_cards.some(
                  (card) => card.id === cardId
                );
                if (!cardExists) {
                  list.karlo_cards.push(updatedCard);
                }
              }
            });
          }
        }

        set({ lists: updatedLists });
        return { success: true };
      }
    } else {
      // Use the full card update mutation for other fields
      // Only include fields that are actually defined in the update
      const variables: any = { id: cardId };
      if (data.title !== undefined) variables.title = data.title;
      if (data.description !== undefined)
        variables.description = data.description;
      if (data.due_date !== undefined) variables.due_date = data.due_date;
      if (data.is_completed !== undefined)
        variables.is_completed = data.is_completed;
      if (data.is_archived !== undefined)
        variables.is_archived = data.is_archived;
      if (data.cover_color !== undefined)
        variables.cover_color = data.cover_color;
      if (data.story_points !== undefined)
        variables.story_points = data.story_points;
      if (data.priority !== undefined) variables.priority = data.priority;

      const { data: result, error } = await graphqlRequest<any>(
        QUERIES.UPDATE_CARD,
        variables
      );

      if (error) {
        set({ error });
        return { success: false, message: error };
      }

      const updatedCard = result?.update_karlo_cards_by_pk;
      if (updatedCard) {
        // Update local state with the updated card
        const updatedLists = currentState.lists.map((list) => ({
          ...list,
          karlo_cards: list.karlo_cards.map((card) =>
            card.id === cardId ? { ...card, ...updatedCard } : card
          ),
        }));

        set({ lists: updatedLists });
        return { success: true };
      }
    }

    return { success: false, message: "Failed to update card" };
  },

  deleteCard: async (cardId: string) => {
    const currentState = get();

    const { data, error } = await graphqlRequest<any>(QUERIES.DELETE_CARD, {
      id: cardId,
    });

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    if (data?.update_karlo_cards_by_pk) {
      // Remove card from local state since it's archived
      const updatedLists = currentState.lists.map((list) => ({
        ...list,
        karlo_cards: list.karlo_cards.filter((card) => card.id !== cardId),
      }));

      set({ lists: updatedLists });
      return { success: true };
    }

    return { success: false, message: "Failed to archive card" };
  },

  clearError: () => set({ error: null }),

  // Drag and drop helper functions
  moveCard: async (
    cardId: string,
    sourceListId: string,
    targetListId: string,
    newPosition: number
  ) => {
    const currentState = get();

    // Find source list and card
    const sourceList = currentState.lists.find(
      (list) => list.id === sourceListId
    );
    if (!sourceList) {
      return { success: false, message: "Source list not found" };
    }

    const cardIndex = sourceList.karlo_cards.findIndex(
      (card) => card.id === cardId
    );
    if (cardIndex === -1) {
      return { success: false, message: "Card not found" };
    }

    const card = sourceList.karlo_cards[cardIndex];

    if (sourceListId === targetListId) {
      // Moving within the same list
      if (cardIndex === newPosition) {
        return { success: true }; // No change needed
      }

      // Create new array with card moved to new position
      const cards = [...sourceList.karlo_cards];
      const [movedCard] = cards.splice(cardIndex, 1);
      cards.splice(newPosition, 0, movedCard);

      // Prepare batch updates for all cards with new positions
      const updates = cards.map((c, index) => ({
        where: { id: { _eq: c.id } },
        _set: { position: index },
      }));

      try {
        // Execute batch update
        const { error } = await graphqlRequest<any>(
          QUERIES.BATCH_UPDATE_POSITIONS,
          { updates }
        );

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        // Update local state
        const updatedLists = currentState.lists.map((list) => {
          if (list.id === sourceListId) {
            return {
              ...list,
              karlo_cards: cards.map((card, index) => ({
                ...card,
                position: index,
              })),
            };
          }
          return list;
        });

        set({ lists: updatedLists });
        return { success: true };
      } catch (error) {
        console.error("Error updating card positions:", error);
        return { success: false, message: "Failed to update positions" };
      }
    } else {
      // Moving between different lists
      const targetList = currentState.lists.find(
        (list) => list.id === targetListId
      );
      if (!targetList) {
        return { success: false, message: "Target list not found" };
      }

      // Check if moving to a final list and set is_completed accordingly
      // Only update if card is not already completed
      const isCompleted =
        !card.is_completed && targetList.is_final ? true : undefined;

      // Choose the correct mutation based on whether is_completed needs to be updated
      const queryToUse =
        isCompleted !== undefined
          ? QUERIES.UPDATE_CARD_POSITION_WITH_COMPLETED
          : QUERIES.UPDATE_CARD_POSITION_ONLY;

      const variables: any = {
        id: cardId,
        list_id: targetListId,
        position: newPosition,
      };

      if (isCompleted !== undefined) {
        variables.is_completed = isCompleted;
      }

      // Update the card's list and position
      const { error } = await graphqlRequest<any>(queryToUse, variables);

      if (error) {
        set({ error });
        return { success: false, message: error };
      }

      // Update local state - move card between lists
      const updatedLists = currentState.lists.map((list) => {
        if (list.id === sourceListId) {
          // Remove card from source list
          return {
            ...list,
            karlo_cards: list.karlo_cards.filter((c) => c.id !== cardId),
          };
        } else if (list.id === targetListId) {
          // Add card to target list at correct position
          const updatedCard = {
            ...card,
            list_id: targetListId,
            position: newPosition,
            ...(isCompleted !== undefined && { is_completed: isCompleted }),
          };
          const newCards = [...list.karlo_cards];
          newCards.splice(newPosition, 0, updatedCard);

          return {
            ...list,
            karlo_cards: newCards,
          };
        }
        return list;
      });

      set({ lists: updatedLists });

      // Trigger confetti if target list has confetti enabled
      if (targetList?.confetti) {
        // Trigger confetti animation with dynamic import
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 300,
            spread: 360,
            startVelocity: 50,
            gravity: 0.6,
            drift: 2,
            scalar: 1.5,
            origin: { x: 0.5, y: -0.2 },
            colors: [
              "#3B82F6",
              "#EF4444",
              "#10B981",
              "#F59E0B",
              "#8B5CF6",
              "#EC4899",
            ],
          });
        } catch (error) {
          console.warn("Failed to load confetti animation:", error);
        }
      }

      return { success: true };
    }
  },

  // Card member management functions
  getCardMembers: async (cardId: string) => {
    const { data, error } = await graphqlRequest<any>(
      QUERIES.GET_CARD_MEMBERS,
      { card_id: cardId }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    const members = data?.karlo_card_members || [];
    return { success: true, members };
  },

  getOrganizationMembers: async (organizationId: string) => {
    const { data, error } = await graphqlRequest<any>(
      QUERIES.GET_ORGANIZATION_MEMBERS,
      { organization_id: organizationId }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    const members = data?.karlo_organization_members || [];
    return { success: true, members };
  },

  addCardMember: async (cardId: string, userId: string) => {
    const { data, error } = await graphqlRequest<any>(QUERIES.ADD_CARD_MEMBER, {
      card_id: cardId,
      user_id: userId,
    });

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    if (data?.insert_karlo_card_members_one) {
      // Update local state directly instead of refreshing entire board
      const currentState = get();
      const newMember = data.insert_karlo_card_members_one;

      // Update the specific card in local state
      const updatedLists = currentState.lists.map((list) => ({
        ...list,
        karlo_cards: list.karlo_cards.map((card) => {
          if (card.id === cardId) {
            return {
              ...card,
              karlo_card_members: [
                ...(card.karlo_card_members || []),
                newMember,
              ],
              karlo_card_members_aggregate: {
                aggregate: {
                  count:
                    (card.karlo_card_members_aggregate?.aggregate?.count || 0) +
                    1,
                },
              },
            };
          }
          return card;
        }),
      }));

      set({ lists: updatedLists });
      return { success: true };
    }

    return { success: false, message: "Failed to add member to card" };
  },

  removeCardMember: async (memberId: string) => {
    const { data, error } = await graphqlRequest<any>(
      QUERIES.REMOVE_CARD_MEMBER,
      { id: memberId }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    if (data?.delete_karlo_card_members_by_pk) {
      // Update local state directly instead of refreshing entire board
      const currentState = get();

      // Find the card that had this member removed
      let targetCardId: string | null = null;

      for (const list of currentState.lists) {
        for (const card of list.karlo_cards) {
          if (
            card.karlo_card_members?.some((member) => member.id === memberId)
          ) {
            targetCardId = card.id;
            break;
          }
        }
        if (targetCardId) break;
      }

      if (targetCardId) {
        // Update the specific card in local state
        const updatedLists = currentState.lists.map((list) => ({
          ...list,
          karlo_cards: list.karlo_cards.map((card) => {
            if (card.id === targetCardId) {
              const updatedMembers =
                card.karlo_card_members?.filter(
                  (member) => member.id !== memberId
                ) || [];
              return {
                ...card,
                karlo_card_members: updatedMembers,
                karlo_card_members_aggregate: {
                  aggregate: {
                    count: updatedMembers.length,
                  },
                },
              };
            }
            return card;
          }),
        }));

        set({ lists: updatedLists });
      }

      return { success: true };
    }

    return { success: false, message: "Failed to remove member from card" };
  },

  // File attachment functions
  uploadFile: async (file: File, cardId: string) => {
    const currentState = get();

    // Get current user from auth store
    const authStore = (window as any).__authStore;
    if (!authStore?.user?.id) {
      set({ error: "User not authenticated" });
      return { success: false, message: "User not authenticated" };
    }

    try {
      // Sanitize file name for headers
      const sanitizedFileName = encodeURIComponent(file.name);
      console.log("📤 Preparing file upload:", {
        originalName: file.name,
        sanitizedName: sanitizedFileName,
        type: file.type,
        size: file.size,
        cardId,
      });

      // Upload file using media service
      const { hostMediaGoService } = await import("../utils/imageUpload");

      const uploadResult = await hostMediaGoService(
        file,
        "karlo_card_attachments",
        authStore.token
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "File upload failed");
      }

      const fileUrl = uploadResult.url;
      console.log("📥 Upload successful:", fileUrl);

      // Save attachment info to database
      const { data, error } = await graphqlRequest<any>(
        QUERIES.INSERT_ATTACHMENT,
        {
          file_size: file.size,
          card_id: cardId,
          uploaded_by: authStore.user.id,
          filename: sanitizedFileName,
          original_filename: file.name,
          mime_type: file.type,
          url: fileUrl,
        }
      );

      if (error) {
        set({ error });
        return { success: false, message: error };
      }

      const newAttachment = data?.insert_karlo_attachments?.returning?.[0];
      if (newAttachment) {
        // Update local state
        const updatedLists = currentState.lists.map((list) => ({
          ...list,
          karlo_cards: list.karlo_cards.map((card) => {
            if (card.id === cardId) {
              const updatedAttachments = [
                ...(card.karlo_attachments || []),
                newAttachment,
              ];
              return {
                ...card,
                karlo_attachments: updatedAttachments,
                karlo_attachments_aggregate: {
                  aggregate: {
                    count: updatedAttachments.length,
                  },
                },
              };
            }
            return card;
          }),
        }));

        set({ lists: updatedLists });
        return { success: true, attachment: newAttachment };
      }

      return { success: false, message: "Failed to save attachment info" };
    } catch (error) {
      console.error("Error uploading file:", error);
      set({
        error: error instanceof Error ? error.message : "File upload failed",
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : "File upload failed",
      };
    }
  },

  deleteAttachment: async (attachmentId: string) => {
    const currentState = get();

    const { data, error } = await graphqlRequest<any>(
      QUERIES.DELETE_ATTACHMENT,
      { id: attachmentId }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    if (data?.delete_karlo_attachments_by_pk) {
      // Update local state to remove attachment
      const updatedLists = currentState.lists.map((list) => ({
        ...list,
        karlo_cards: list.karlo_cards.map((card) => {
          const updatedAttachments =
            card.karlo_attachments?.filter((att) => att.id !== attachmentId) ||
            [];
          return {
            ...card,
            karlo_attachments: updatedAttachments,
            karlo_attachments_aggregate: {
              aggregate: {
                count: updatedAttachments.length,
              },
            },
          };
        }),
      }));

      set({ lists: updatedLists });
      return { success: true };
    }

    return { success: false, message: "Failed to delete attachment" };
  },

  // Add function to remove card from local state without database call
  removeCardFromLocalState: (cardId: string) => {
    const currentState = get();
    const updatedLists = currentState.lists.map((list) => ({
      ...list,
      karlo_cards: list.karlo_cards.filter((card) => card.id !== cardId),
    }));
    set({ lists: updatedLists });
  },

  // Update comment count for a card
  addCommentToCard: (cardId: string, commentId: string) => {
    const currentState = get();
    const updatedLists = currentState.lists.map((list) => ({
      ...list,
      karlo_cards: list.karlo_cards.map((card) => {
        if (card.id === cardId) {
          const currentComments = card.karlo_card_comments || [];
          return {
            ...card,
            karlo_card_comments: [...currentComments, { id: commentId }],
          };
        }
        return card;
      }),
    }));
    set({ lists: updatedLists });
  },

  removeCommentFromCard: (cardId: string, commentId: string) => {
    const currentState = get();
    const updatedLists = currentState.lists.map((list) => ({
      ...list,
      karlo_cards: list.karlo_cards.map((card) => {
        if (card.id === cardId) {
          const currentComments = card.karlo_card_comments || [];
          return {
            ...card,
            karlo_card_comments: currentComments.filter(
              (c) => c.id !== commentId
            ),
          };
        }
        return card;
      }),
    }));
    set({ lists: updatedLists });
  },
}));

export default useKanbanStore;
