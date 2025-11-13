import React from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Paperclip,
  MessageSquare,
  User,
  Check,
  Plus,
  FileText,
  MoreHorizontal,
  Trash2,
  Move,
  Flag,
  Tag as TagIcon,
} from "lucide-react";
import { KanbanCard as KanbanCardType } from "../../types/kanban";

interface KanbanCardProps {
  card: KanbanCardType;
  onClick?: () => void;
  onMembersClick?: () => void;
  onArchiveCard?: (cardId: string) => void;
  onMoveCard?: (cardId: string, cardTitle: string) => void;
  onDragStart?: (e: React.DragEvent, card: KanbanCardType) => void;
  onDragEnd?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  onClick,
  onMembersClick,
  onArchiveCard,
  onMoveCard,
  onDragStart,
  onDragEnd,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = card.due_date && new Date(card.due_date) < new Date();
  const isCompleted = card.is_completed;

  // Helper function to check if description has actual content
  const hasDescriptionContent = (description?: string) => {
    if (!description || !description.trim()) return false;

    try {
      const parsed = JSON.parse(description);
      // Check if EditorJS data has any non-empty blocks
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        return parsed.blocks.some((block: any) => {
          // Check if block has actual content
          if (block.type === "paragraph" && block.data?.text) {
            return block.data.text.trim().length > 0;
          }
          if (block.type === "header" && block.data?.text) {
            return block.data.text.trim().length > 0;
          }
          if (block.type === "list" && block.data?.items) {
            return block.data.items.some(
              (item: string) => item.trim().length > 0
            );
          }
          if (block.type === "checklist" && block.data?.items) {
            return block.data.items.some(
              (item: any) => item.text && item.text.trim().length > 0
            );
          }
          // For other block types, assume they have content if they exist
          return block.data && Object.keys(block.data).length > 0;
        });
      }
      return false;
    } catch {
      // If it's not valid JSON, treat as plain text
      return description.trim().length > 0;
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(e, card);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 120, // Align right edge
      });
    }

    setShowMenu(!showMenu);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchiveCard?.(card.id);
    setShowMenu(false);
    setMenuPosition(null);
  };

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveCard?.(card.id, card.title);
    setShowMenu(false);
    setMenuPosition(null);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleMembersKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onMembersClick?.();
    }
  };

  const renderMemberAvatars = () => {
    const totalMembers =
      card.karlo_card_members_aggregate?.aggregate?.count || 0;
    const visibleMembers = card.karlo_card_members || [];
    const remainingCount = totalMembers - visibleMembers.length;

    const getInitials = (fullname: string) => {
      return fullname
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    if (totalMembers === 0) {
      // Show + icon when no members assigned
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMembersClick?.();
          }}
          onKeyDown={handleMembersKeyDown}
          className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:bg-gray-300 dark:focus:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Add members to this card"
          tabIndex={0}
        >
          <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600 dark:text-gray-300" />
        </button>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMembersClick?.();
        }}
        onKeyDown={handleMembersKeyDown}
        className="flex items-center -space-x-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
        aria-label={`Manage card members (${totalMembers} assigned)`}
        tabIndex={0}
      >
        {visibleMembers.map((member, index) => (
          <div
            key={member.authFullnameByUserId.id}
            className="relative"
            style={{ zIndex: visibleMembers.length - index }}
          >
            <div
              className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
              title={member.authFullnameByUserId.fullname}
            >
              <span className="text-[9px] sm:text-xs font-medium text-white">
                {getInitials(member.authFullnameByUserId.fullname)}
              </span>
            </div>
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-500 dark:bg-gray-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
            title={`+${remainingCount} more members`}
          >
            <span className="text-[9px] sm:text-xs font-medium text-white">
              +{remainingCount}
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isCompleted ? "opacity-75" : ""
      }`}
      aria-label={`Card: ${card.title}${
        card.description
          ? `. ${card.description.slice(0, 100)}${
              card.description.length > 100 ? "..." : ""
            }`
          : ""
      }`}
    >
      {/* Cover Image or Color */}
      {(card.cover_image_url || card.cover_color) && (
        <div
          className="h-4 rounded-t-lg bg-cover bg-center"
          style={{
            backgroundColor: card.cover_color || undefined,
            backgroundImage: card.cover_image_url
              ? `url(${card.cover_image_url})`
              : undefined,
          }}
        />
      )}

      {/* Card Content */}
      <div className="p-2 sm:p-2.5">
        <div className="flex items-start justify-between mb-1.5 sm:mb-2">
          <h4
            className="text-xs sm:text-sm font-medium line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 flex-1 text-gray-900 dark:text-white"
            id={`card-title-${card.id}`}
          >
            {card.title}
          </h4>
          <div className="relative ml-1.5 sm:ml-2">
            <button
              ref={menuButtonRef}
              onClick={handleMenuClick}
              className="opacity-100 group-hover:opacity-100 p-0.5 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200"
              aria-label="Card options"
            >
              <MoreHorizontal className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
            {card.priority && (
              <div
                className={`flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium ${
                  card.priority === "urgent"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : card.priority === "high"
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                    : card.priority === "normal"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <Flag
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
                <span className="capitalize">{card.priority}</span>
              </div>
            )}
            {card.story_points && (
              <div className="flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                <span className="font-semibold">{card.story_points}</span>
                <span className="hidden sm:inline">pts</span>
              </div>
            )}
            {card.due_date && (
              <div
                className={`flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium ${
                  isOverdue
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                <Calendar
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">
                  {formatDate(card.due_date)}
                </span>
                <span className="sm:hidden">
                  {new Date(card.due_date).getDate()}
                </span>
              </div>
            )}
            {(card.karlo_card_tags?.length ?? 0) > 0 && (
              <div className="flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                <TagIcon
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
                <span>{card.karlo_card_tags?.length ?? 0}</span>
              </div>
            )}
            {(card.karlo_attachments_aggregate?.aggregate?.count || 0) > 0 && (
              <div className="flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Paperclip
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
                <span>
                  {card.karlo_attachments_aggregate?.aggregate?.count || 0}
                </span>
              </div>
            )}
            {hasDescriptionContent(card.description) && (
              <div className="flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <FileText
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
              </div>
            )}
            {(card.karlo_card_comments?.length || 0) > 0 && (
              <div className="flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <MessageSquare
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                  aria-hidden="true"
                />
                <span>{card.karlo_card_comments?.length || 0}</span>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>Done</span>
              </div>
            )}
          </div>

          {renderMemberAvatars()}
        </div>
      </div>

      {/* Portal-rendered dropdown menu */}
      {showMenu &&
        menuPosition &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                e.stopPropagation();
                setShowMenu(false);
                setMenuPosition(null);
              }}
            />
            <div
              style={{
                position: "absolute",
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-[9999] min-w-[120px]"
            >
              <button
                onClick={handleMoveClick}
                className="w-full flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <Move className="h-3 w-3" />
                <span>Move</span>
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                <Trash2 className="h-3 w-3" />
                <span>Archive</span>
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default KanbanCard;
