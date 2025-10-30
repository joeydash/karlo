import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, FileText, Calendar, Paperclip, MessageSquare, Loader2, ArrowRight, Hash, Folder } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../utils/graphql';
import { useOrganization } from '../hooks/useOrganization';
import { useFocusManagement } from '../hooks/useKeyboardNavigation';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  cover_color?: string;
  due_date?: string;
  is_completed?: boolean;
  list_id: string;
  karlo_list: {
    id: string;
    name: string;
    board_id: string;
    karlo_board: {
      id: string;
      name: string;
    };
  };
  karlo_attachments_aggregate?: {
    aggregate: {
      count: number;
    };
  };
  karlo_card_comments?: Array<{
    id: string;
  }>;
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_QUERY = `
  query SearchCards($organization_id: uuid!, $search_term: String!) {
    karlo_cards(
      where: {
        _and: [
          { is_archived: { _eq: false } }
          {
            karlo_list: {
              karlo_board: {
                organization_id: { _eq: $organization_id }
              }
            }
          }
          {
            _or: [
              { title: { _ilike: $search_term } }
              { description: { _ilike: $search_term } }
            ]
          }
        ]
      }
      order_by: [
        { is_completed: asc }
        { created_at: desc }
      ]
      limit: 20
    ) {
      id
      title
      description
      cover_color
      due_date
      is_completed
      list_id
      karlo_list {
        id
        name
        board_id
        karlo_board {
          id
          name
        }
      }
      karlo_attachments_aggregate {
        aggregate {
          count
        }
      }
      karlo_card_comments {
        id
      }
    }
  }
`;

const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useFocusManagement(isOpen, modalRef);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setResults([]);
      setHasSearched(false);
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim() || !currentOrganization?.id) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    try {
      const { data, error } = await graphqlRequest<{ karlo_cards: SearchResult[] }>(
        SEARCH_QUERY,
        {
          organization_id: currentOrganization.id,
          search_term: `%${term}%`
        }
      );

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults(data?.karlo_cards || []);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm.trim()) {
      // Show loading state immediately when user types
      setIsSearching(true);
      setHasSearched(true);

      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchTerm);
      }, 300);
    } else {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  const handleCardClick = (card: SearchResult) => {
    navigate(`/board/${card.karlo_list.board_id}?cardId=${card.id}&listId=${card.list_id}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleCardClick(results[selectedIndex]);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setHasSearched(false);
    setSelectedIndex(0);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const resultsContainer = resultsRef.current;
      const selectedElement = resultsContainer.querySelector(`[data-result-index="${selectedIndex}"]`) as HTMLElement;

      if (selectedElement) {
        const containerRect = resultsContainer.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();

        const isAboveView = elementRect.top < containerRect.top;
        const isBelowView = elementRect.bottom > containerRect.bottom;

        if (isAboveView || isBelowView) {
          selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [selectedIndex, results.length]);

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;

    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getDescriptionPreview = (description?: string, maxLength = 100) => {
    if (!description) return '';

    try {
      const parsed = JSON.parse(description);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        const textBlocks = parsed.blocks
          .filter((block: any) => block.type === 'paragraph' || block.type === 'header')
          .map((block: any) => block.data?.text || '')
          .join(' ');

        const plainText = textBlocks.replace(/<[^>]*>/g, '').trim();
        return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
      }
    } catch {
      const plainText = description.replace(/<[^>]*>/g, '').trim();
      return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
    }

    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mt-20 animate-slideDown overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Search Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 bg-white dark:bg-gray-800/50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
            <div className="p-1 sm:p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cards across all boards..."
              className="flex-1 min-w-0 text-sm sm:text-base bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0"
              aria-label="Search cards"
              id="search-modal-title"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-spin flex-shrink-0" />
            )}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto search-results-scroll"
        >
          {!hasSearched && !searchTerm.trim() && (
            <div className="p-8 text-center h-[240px] flex flex-col items-center justify-center">
              <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Universal Search
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Search for cards across all boards in your organization
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                  ↑↓
                </kbd>
                <span>Navigate</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                  Enter
                </kbd>
                <span>Select</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                  Esc
                </kbd>
                <span>Close</span>
              </div>
            </div>
          )}

          {isSearching && results.length === 0 && (
            <div className="p-4 h-[240px] flex flex-col justify-center">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="mb-3 last:mb-0"
                >
                  <div className="flex items-start space-x-3 animate-pulse">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-md w-3/4"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded w-full"></div>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="h-5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded w-20"></div>
                        <div className="h-5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasSearched && results.length === 0 && !isSearching && (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No cards found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search terms
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((card, index) => {
                const isSelected = index === selectedIndex;
                const descriptionPreview = getDescriptionPreview(card.description);
                const isOverdue = card.due_date && new Date(card.due_date) < new Date();

                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    data-result-index={index}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {card.cover_color && (
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: card.cover_color }}
                            />
                          )}
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {highlightText(card.title, searchTerm)}
                          </h4>
                        </div>

                        {descriptionPreview && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {highlightText(descriptionPreview, searchTerm)}
                          </p>
                        )}

                        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Folder className="h-3 w-3" />
                            <span className="truncate max-w-32">{card.karlo_list.karlo_board.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Hash className="h-3 w-3" />
                            <span className="truncate max-w-32">{card.karlo_list.name}</span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight className={`h-5 w-5 flex-shrink-0 ml-3 transition-transform duration-200 ${
                        isSelected ? 'text-blue-600 translate-x-1' : 'text-gray-400'
                      }`} />
                    </div>

                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      {card.is_completed && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Completed
                        </span>
                      )}

                      {(card.karlo_attachments_aggregate?.aggregate?.count || 0) > 0 && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <Paperclip className="h-3 w-3" />
                          <span>{card.karlo_attachments_aggregate.aggregate.count}</span>
                        </div>
                      )}

                      {(card.karlo_card_comments?.length || 0) > 0 && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          <MessageSquare className="h-3 w-3" />
                          <span>{card.karlo_card_comments.length}</span>
                        </div>
                      )}

                      {card.due_date && (
                        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                          isOverdue
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(card.due_date)}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{results.length} {results.length === 1 ? 'result' : 'results'} found</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-xs">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 text-xs">
                    Enter
                  </kbd>
                  <span>Open</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalSearchModal;
