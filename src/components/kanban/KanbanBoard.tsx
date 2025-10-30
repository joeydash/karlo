import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Edit, LayoutGrid as Layout, Search, X, Users, UserCheck, Menu } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useKanban } from '../../hooks/useKanban';
import { useBoard } from '../../hooks/useBoard';
import { useToast } from '../../contexts/ToastContext';
import KanbanList from './KanbanList';
import EditBoardModal from '../EditBoardModal';
import CardEditModal from './CardEditModal';
import CardMemberModal from './CardMemberModal';
import FilterMembersModal from './FilterMembersModal';
import TemplateModal from './TemplateModal';
import MoveCardModal from './MoveCardModal';
import ListOrderModal from './ListOrderModal';
import AttendanceModal from './AttendanceModal';
import ConfirmationModal from '../ConfirmationModal';
import SkipLink from '../SkipLink';
import AccessibleButton from '../AccessibleButton';
import UniversalSearchModal from '../UniversalSearchModal';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { KanbanCard } from '../../types/kanban';

const KanbanBoard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { boardId } = useParams<{ boardId: string }>();
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const { currentBoard, lists, isLoading, createList, fetchBoardData, removeCardFromLocalState } = useKanban(boardId);
  const { deleteCard } = useKanban(boardId);
  const { boards } = useBoard();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCardForMembers, setSelectedCardForMembers] = useState<{ id: string; title: string } | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedCardForMove, setSelectedCardForMove] = useState<{ id: string; title: string } | null>(null);
  const [showListOrderModal, setShowListOrderModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState(() => {
    // Load search term from localStorage
    try {
      return localStorage.getItem(`kanban-search-${boardId}`) || '';
    } catch {
      return '';
    }
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => {
    // Load member filters from localStorage
    try {
      const saved = localStorage.getItem(`kanban-member-filter-${boardId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Save search term to localStorage whenever it changes
  React.useEffect(() => {
    if (boardId) {
      try {
        if (searchTerm) {
          localStorage.setItem(`kanban-search-${boardId}`, searchTerm);
        } else {
          localStorage.removeItem(`kanban-search-${boardId}`);
        }
      } catch (error) {
        console.error('Failed to save search term to localStorage:', error);
      }
    }
  }, [searchTerm, boardId]);

  // Save member filters to localStorage whenever they change
  React.useEffect(() => {
    if (boardId) {
      try {
        if (selectedMemberIds.length > 0) {
          localStorage.setItem(`kanban-member-filter-${boardId}`, JSON.stringify(selectedMemberIds));
        } else {
          localStorage.removeItem(`kanban-member-filter-${boardId}`);
        }
      } catch (error) {
        console.error('Failed to save member filter to localStorage:', error);
      }
    }
  }, [selectedMemberIds, boardId]);

  // Global keyboard shortcut for universal search (Ctrl/Cmd + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsUniversalSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for card moved events to refresh board data
  React.useEffect(() => {
    const handleCardMoved = (event: CustomEvent) => {
      const { cardId, fromBoardId } = event.detail;
      // If a card was moved FROM this board, refresh the board data
      if (fromBoardId === boardId) {
        // Remove the card from local state without database call
        removeCardFromLocalState(cardId);
      }
    };

    window.addEventListener('cardMoved', handleCardMoved as EventListener);
    return () => {
      window.removeEventListener('cardMoved', handleCardMoved as EventListener);
    };
  }, [boardId, removeCardFromLocalState]);

  // Scroll to card when navigating from universal search
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const cardId = searchParams.get('cardId');
    const listId = searchParams.get('listId');

    if (cardId && listId && lists.length > 0 && boardContainerRef.current) {
      // Check if filters need to be cleared
      const hasFilters = searchTerm !== '' || selectedMemberIds.length > 0;

      if (hasFilters) {
        // Clear filters and let React re-render
        setSearchTerm('');
        setSelectedMemberIds([]);
        return; // Exit and wait for re-render with cleared filters
      }

      // Wait for DOM to be ready with cleared filters
      const timer = setTimeout(() => {
        // Find the list element
        const listElement = document.querySelector(`[data-list-id="${listId}"]`);
        // Find the card element
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);

        if (listElement && cardElement && boardContainerRef.current) {
          // First scroll the board horizontally to the list
          const boardContainer = boardContainerRef.current;
          const listRect = listElement.getBoundingClientRect();
          const boardRect = boardContainer.getBoundingClientRect();

          // Calculate scroll position to center the list horizontally
          const scrollLeft = listElement.offsetLeft - (boardRect.width / 2) + (listRect.width / 2);
          boardContainer.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });

          // Wait for horizontal scroll to complete, then scroll vertically
          setTimeout(() => {
            const listContentElement = listElement.querySelector('[data-list-content]');
            if (listContentElement) {
              const cardRect = cardElement.getBoundingClientRect();
              const listContentRect = listContentElement.getBoundingClientRect();

              // Calculate scroll position to center the card vertically within the list
              const scrollTop = cardElement.offsetTop - (listContentRect.height / 2) + (cardRect.height / 2);
              listContentElement.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: 'smooth'
              });

              // Add highlight animation to the card
              cardElement.classList.add('card-highlight');
              setTimeout(() => {
                cardElement.classList.remove('card-highlight');
              }, 2000);
            }
          }, 500);

          // Clean up URL params
          navigate(`/board/${boardId}`, { replace: true });
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [location.search, lists, boardId, navigate, searchTerm, selectedMemberIds]);

  // Keyboard navigation for search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      (e.target as HTMLInputElement).blur();
    }
  };

  // Find the current board from the boards list for editing
  const editableBoard = boards.find(board => board.id === boardId) || null;

  // Filter lists based on search term and selected members
  const filteredLists = lists.map(list => ({
    ...list,
    karlo_cards: list.karlo_cards.filter(card => {
      // Search term filter
      const matchesSearch = card.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Member filter
      if (selectedMemberIds.length === 0) {
        return matchesSearch; // No filter selected, show all matching search
      }
      
      // Check if card matches member filter
      const cardMemberIds = card.karlo_card_members?.map(member => member.authFullnameByUserId?.id || member.user_id) || [];
      const isUnassigned = cardMemberIds.length === 0;
      
      const matchesMemberFilter = selectedMemberIds.some(memberId => {
        if (memberId === 'unassigned') {
          return isUnassigned;
        }
        return cardMemberIds.includes(memberId);
      });
      
      return matchesSearch && matchesMemberFilter;
    })
  }));

  const handleMemberFilterChange = (memberIds: string[]) => {
    console.log('🔍 Member filter changed:', memberIds);
    setSelectedMemberIds(memberIds);
  };

  const handleCardClick = (cardId: string) => {
    // Find the card in all lists
    const card = lists.flatMap(list => list.karlo_cards).find(c => c.id === cardId);
    if (card) {
      setSelectedCard(card);
      setSelectedCardId(cardId);
      setShowCardModal(true);
    }
  };

  const handleCardMembersClick = (cardId: string, cardTitle: string) => {
    setSelectedCardForMembers({ id: cardId, title: cardTitle });
    setShowMemberModal(true);
  };

  const handleMoveCard = (cardId: string, cardTitle: string) => {
    setSelectedCardForMove({ id: cardId, title: cardTitle });
    setShowMoveModal(true);
  };
  const handleArchiveCard = (cardId: string, cardTitle: string) => {
    setCardToDelete({ id: cardId, title: cardTitle });
    setShowDeleteConfirmation(true);
  };

  const confirmArchiveCard = async () => {
    if (!cardToDelete) return;

    const result = await deleteCard(cardToDelete.id);
    if (result.success) {
      showSuccess('Card archived successfully');
    } else {
      showError(result.message || 'Failed to archive card');
    }
    setShowDeleteConfirmation(false);
    setCardToDelete(null);
  };

  const handleAddList = async () => {
    if (newListName.trim() && boardId) {
      const result = await createList(boardId, newListName.trim());
      if (result.success) {
        showSuccess('List created successfully');
        setNewListName('');
        setIsAddingList(false);
      } else {
        showError(result.message || 'Failed to create list');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddList();
    } else if (e.key === 'Escape') {
      setIsAddingList(false);
      setNewListName('');
    }
  };

  const ShimmerList = () => (
    <div className="bg-white bg-opacity-20 rounded-2xl p-4 w-80 flex-shrink-0 self-start animate-pulse">
      {/* List Header Shimmer */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-white bg-opacity-30 rounded w-24"></div>
          <div className="h-5 w-8 bg-white bg-opacity-30 rounded-full"></div>
        </div>
        <div className="h-4 w-4 bg-white bg-opacity-30 rounded"></div>
      </div>
      
      {/* Cards Shimmer */}
      <div className="space-y-3 mb-4">
        {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, index) => (
          <div key={index} className="bg-white bg-opacity-40 rounded-xl p-3 shadow-sm">
            {/* Card Cover Shimmer (random) */}
            {Math.random() > 0.6 && (
              <div className="h-20 bg-white bg-opacity-30 rounded-lg mb-3"></div>
            )}
            
            {/* Card Title */}
            <div className="h-4 bg-white bg-opacity-30 rounded mb-2" style={{ width: `${60 + Math.random() * 30}%` }}></div>
            
            {/* Card Description (random) */}
            {Math.random() > 0.5 && (
              <div className="space-y-1 mb-3">
                <div className="h-3 bg-white bg-opacity-20 rounded" style={{ width: `${70 + Math.random() * 25}%` }}></div>
                <div className="h-3 bg-white bg-opacity-20 rounded" style={{ width: `${40 + Math.random() * 30}%` }}></div>
              </div>
            )}
            
            {/* Card Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                {/* Due Date Badge (random) */}
                {Math.random() > 0.7 && (
                  <div className="h-5 w-16 bg-white bg-opacity-30 rounded-md"></div>
                )}
              </div>
              
              {/* Member Avatars */}
              <div className="flex items-center -space-x-1">
                {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-white bg-opacity-30 rounded-full border-2 border-white"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Card Button Shimmer */}
      <div className="h-10 bg-white bg-opacity-20 rounded-xl"></div>
    </div>
  );

  if (isLoading) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: editableBoard?.background_color || '#0079BF',
          backgroundImage: editableBoard?.background_image_url ? `url(${editableBoard.background_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Header Shimmer */}
        <div className="bg-black bg-opacity-20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <div className="w-9 h-9 bg-white bg-opacity-30 rounded-lg animate-pulse"></div>
                <div className="flex items-center space-x-3">
                  <div className="h-6 bg-white bg-opacity-30 rounded w-48 animate-pulse"></div>
                  <div className="w-5 h-5 bg-white bg-opacity-30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Board Content Shimmer */}
        <div className="p-6">
          <div className="flex space-x-6 overflow-x-auto pb-6">
            {/* Multiple Shimmer Lists */}
            {Array.from({ length: 4 }).map((_, index) => (
              <ShimmerList key={index} />
            ))}
            
            {/* Add List Button Shimmer */}
            <div className="bg-white bg-opacity-20 rounded-2xl p-4 w-80 flex-shrink-0 self-start animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-white bg-opacity-30 rounded"></div>
                <div className="h-5 bg-white bg-opacity-30 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Board not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col"
      role="main"
      id="main-content"
      style={{
        backgroundColor: currentBoard.background_color || '#0079BF',
        backgroundImage: currentBoard.background_image_url ? `url(${currentBoard.background_image_url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <SkipLink />
      
      {/* Header */}
      <div className="bg-black bg-opacity-20 backdrop-blur-sm flex-shrink-0">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {/* <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 sm:p-2 text-white hover:bg-white hover:bg-opacity-20 focus:bg-white focus:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 flex-shrink-0"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button> */}
              <div className="flex items-center space-x-1.5 sm:space-x-3 flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-white truncate" id="board-title">{currentBoard.name}</h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 text-white hover:bg-white hover:bg-opacity-20 focus:bg-white focus:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 flex-shrink-0"
                  aria-label="Edit board settings"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Universal Search Button */}
              <button
                onClick={() => setIsUniversalSearchOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                aria-label="Universal search"
                title="Search all cards (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
                <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-xs bg-white bg-opacity-20 rounded border border-white border-opacity-30">
                  ⌘K
                </kbd>
              </button>

              {/* List Order Button */}
              <button
                onClick={() => setShowListOrderModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                aria-label="Reorder lists"
              >
                <Layout className="h-4 w-4" />
              </button>

              {/* Attendance Button */}
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                aria-label="Mark attendance"
              >
                <UserCheck className="h-4 w-4" />
              </button>

              {/* Member Filter Button */}
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200 '
                }`}
                aria-label={`Filter by assignee${selectedMemberIds.length > 0 ? ` (${selectedMemberIds.length} selected)` : ''}`}
              >
                <Users className="h-4 w-4" />
                <span className="text-sm">Assignee</span>
                {selectedMemberIds.length > 0 && (
                  <span className="bg-white bg-opacity-20 text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                    {selectedMemberIds.length}
                  </span>
                )}
              </button>

              {/* Search Input */}
              <div className="relative">
                <label htmlFor="search-cards" className="sr-only">
                  Search cards
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                  <Search className="h-4 w-4 text-white text-opacity-60" />
                </div>
                <input
                  id="search-cards"
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-64 pl-10 pr-10 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:bg-opacity-30 transition-all duration-200"
                  aria-describedby={searchTerm ? "search-results" : undefined}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white text-opacity-60 hover:text-opacity-100 focus:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 transition-opacity duration-200" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-white hover:bg-white hover:bg-opacity-20 focus:bg-white focus:bg-opacity-20 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Controls Dropdown */}
          {showMobileMenu && (
            <div className="lg:hidden pb-3 space-y-2">
              {/* Universal Search Button Mobile */}
              <button
                onClick={() => {
                  setIsUniversalSearchOpen(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                aria-label="Universal search"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search All Cards</span>
              </button>

              {/* Search Input Mobile */}
              <div className="relative">
                <label htmlFor="search-cards-mobile" className="sr-only">
                  Search cards
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                  <Search className="h-4 w-4 text-white text-opacity-60" />
                </div>
                <input
                  id="search-cards-mobile"
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-10 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:bg-opacity-30 transition-all duration-200"
                  aria-describedby={searchTerm ? "search-results" : undefined}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white text-opacity-60 hover:text-opacity-100 focus:text-opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4 transition-opacity duration-200" />
                  </button>
                )}
              </div>

              {/* Mobile Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowListOrderModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                  aria-label="Reorder lists"
                >
                  <Layout className="h-4 w-4" />
                  <span className="text-sm">Lists</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttendanceModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200"
                  aria-label="Mark attendance"
                >
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm">Attendance</span>
                </button>

                <button
                  onClick={() => {
                    setShowFilterModal(true);
                    setShowMobileMenu(false);
                  }}
                  className={`col-span-2 flex items-center justify-center space-x-2 px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-lg text-white hover:bg-opacity-30 focus:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-200 ${
                    selectedMemberIds.length > 0 ? 'bg-blue-500 bg-opacity-80' : ''
                  }`}
                  aria-label={`Filter by assignee${selectedMemberIds.length > 0 ? ` (${selectedMemberIds.length} selected)` : ''}`}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Assignee</span>
                  {selectedMemberIds.length > 0 && (
                    <span className="bg-white bg-opacity-20 text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                      {selectedMemberIds.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-hidden">
        {searchTerm && (
          <div className="sr-only" id="search-results" aria-live="polite">
            {filteredLists.reduce((total, list) => total + list.karlo_cards.length, 0)} cards found
            {selectedMemberIds.length > 0 && ` (filtered by ${selectedMemberIds.length} assignee${selectedMemberIds.length !== 1 ? 's' : ''})`}
          </div>
        )}
        
        {lists.length === 0 && !isAddingList ? (
          /* Empty Board - Show Template Options */
          <div className="h-full flex flex-col items-center justify-center px-4">
            <Layout className="h-12 w-12 sm:h-16 sm:w-16 text-white text-opacity-60 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-white mb-2 text-center">No lists yet</h3>
            <p className="text-sm sm:text-base text-white text-opacity-80 mb-4 sm:mb-6 text-center max-w-md">Get started quickly with a template or create your own lists</p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <AccessibleButton
                variant="ghost"
                onClick={() => setShowTemplateModal(true)}
                className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm w-full sm:w-auto justify-center"
                aria-label="Use a template to create lists"
              >
                <Layout className="h-4 w-4" />
                <span>Use Template</span>
              </AccessibleButton>
              <AccessibleButton
                variant="ghost"
                onClick={() => setIsAddingList(true)}
                className="text-white bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm w-full sm:w-auto justify-center"
                aria-label="Add a new list manually"
              >
                <Plus className="h-4 w-4" />
                <span>Add List</span>
              </AccessibleButton>
            </div>
          </div>
        ) : (
          /* Board with Lists */
          <div
            ref={boardContainerRef}
            className="flex space-x-3 sm:space-x-4 md:space-x-6 overflow-x-auto h-full pb-4 sm:pb-6 scrollbar-hide"
            role="region"
            aria-label="Kanban board lists"
          >
            {/* Lists */}
            {filteredLists.map((list) => (
              <KanbanList
                key={list.id}
                list={list}
                onCardClick={handleCardClick}
                onCardMembersClick={handleCardMembersClick}
                onArchiveCard={(cardId) => {
                  const card = list.karlo_cards.find(c => c.id === cardId);
                  handleArchiveCard(cardId, card?.title || 'this card');
                }}
                onMoveCard={handleMoveCard}
              />
            ))}

            {/* Add List */}
            {isAddingList ? (
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-3 sm:p-4 w-64 sm:w-72 md:w-80 flex-shrink-0 self-start">
                <label htmlFor="new-list-input" className="sr-only">
                  New list name
                </label>
                <input
                  id="new-list-input"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter list title..."
                  className="w-full p-2.5 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  autoFocus
                  aria-describedby="new-list-help"
                />
                <div id="new-list-help" className="sr-only">
                  Press Enter to create the list, or Escape to cancel
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-3">
                  <AccessibleButton
                    size="sm"
                    onClick={handleAddList}
                    disabled={!newListName.trim()}
                  >
                    Add list
                  </AccessibleButton>
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListName('');
                    }}
                  >
                    Cancel
                  </AccessibleButton>
                </div>
              </div>
            ) : lists.length > 0 && (
              <button
                onClick={() => setIsAddingList(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 focus:bg-opacity-30 rounded-2xl p-3 sm:p-4 w-64 sm:w-72 md:w-80 flex-shrink-0 self-start flex items-center space-x-2 sm:space-x-3 text-white transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                aria-label="Add another list to the board"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm sm:text-base font-medium">Add another list</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      <EditBoardModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        board={editableBoard}
      />
      
      <CardEditModal 
        isOpen={showCardModal} 
        onClose={() => {
          setShowCardModal(false);
          setSelectedCard(null);
        }}
        cardId={selectedCardId || ''}
        card={selectedCard}
      />
      
      <CardMemberModal 
        isOpen={showMemberModal} 
        onClose={() => {
          setShowMemberModal(false);
          setSelectedCardForMembers(null);
        }}
        cardId={selectedCardForMembers?.id || ''}
        cardTitle={selectedCardForMembers?.title || ''}
      />
      
      <FilterMembersModal 
        isOpen={showFilterModal} 
        onClose={() => setShowFilterModal(false)}
        selectedMemberIds={selectedMemberIds}
        onMembersChange={handleMemberFilterChange}
        boardId={boardId || ''}
      />
      
      <TemplateModal 
        isOpen={showTemplateModal} 
        onClose={() => setShowTemplateModal(false)}
        boardId={boardId || ''}
      />
      
      <MoveCardModal 
        isOpen={showMoveModal} 
        onClose={() => {
          setShowMoveModal(false);
          setSelectedCardForMove(null);
        }}
        cardId={selectedCardForMove?.id || ''}
        cardTitle={selectedCardForMove?.title || ''}
        currentBoardId={boardId || ''}
      />
      
      <ListOrderModal 
        isOpen={showListOrderModal} 
        onClose={() => setShowListOrderModal(false)}
        boardId={boardId || ''}
        lists={lists}
      />
      
      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        boardId={boardId || ''}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setCardToDelete(null);
        }}
        onConfirm={confirmArchiveCard}
        title="Archive Card"
        message={`Are you sure you want to archive "${cardToDelete?.title}"? You can restore it later from the archive.`}
        confirmText="Archive Card"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />

      <UniversalSearchModal
        isOpen={isUniversalSearchOpen}
        onClose={() => setIsUniversalSearchOpen(false)}
      />
    </div>
  );
};

export default KanbanBoard;