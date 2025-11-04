import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Calendar,
  ChevronRight,
  Home,
  Layout,
  Sun,
  Moon,
  Monitor,
  GripVertical,
} from "lucide-react";
import { useBoard } from "../hooks/useBoard";
import { useTheme } from "../contexts/ThemeContext";
import { useOrganization } from "../hooks/useOrganization";
import { useToast } from "../contexts/ToastContext";

import { Building2, Plus, ChevronDown, Check, Users } from "lucide-react";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";

const CustomOrganizationSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
  } = useOrganization();
  const { showSuccess } = useToast();
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const selectedOrgRef = React.useRef<HTMLButtonElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useKeyboardNavigation(dropdownRef, () => setIsOpen(false));

  // Auto-scroll to selected organization when dropdown opens
  React.useEffect(() => {
    if (isOpen && selectedOrgRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        selectedOrgRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOrganizationSelect = (org: any) => {
    console.log("🏢 Switching to organization:", org.display_name);
    setCurrentOrganization(org);
    setIsOpen(false);

    // Show success toast with organization name
    showSuccess("Workspace Switched", `Switched to ${org.display_name}`);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    setShowCreateModal(true);
  };

  const handleToggleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => {
          const firstOption = dropdownRef.current?.querySelector(
            '[role="menuitem"]'
          ) as HTMLElement;
          firstOption?.focus();
        }, 50);
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent,
    callback: () => void
  ) => {
    const options = Array.from(
      dropdownRef.current?.querySelectorAll('[role="menuitem"]') || []
    );
    const currentIndex = options.indexOf(e.currentTarget);

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        callback();
        break;
      case "ArrowDown":
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % options.length;
        (options[nextIndex] as HTMLElement)?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        (options[prevIndex] as HTMLElement)?.focus();
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        const trigger = document.querySelector(
          '[aria-expanded="true"]'
        ) as HTMLElement;
        trigger?.focus();
        break;
    }
  };

  // If no organizations exist, show create workspace button
  if (organizations.length === 0 && !isLoading) {
    return (
      <>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center space-x-3 p-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
              Create Workspace
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Get started with a new workspace
            </p>
          </div>
        </button>
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Current Organization Display */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleToggleKeyDown}
          className="w-full flex items-center space-x-3 p-1 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Current workspace: ${
            currentOrganization?.display_name || "Select Workspace"
          }. Click to switch workspace.`}
        >
          {currentOrganization?.logo_url ? (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 overflow-hidden">
              <img
                src={currentOrganization.logo_url}
                alt={currentOrganization.display_name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
              {currentOrganization?.display_name || "Select Workspace"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentOrganization?.description || "Workspace"}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
            <ChevronDown
              className={`h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-80 overflow-hidden flex flex-col"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="workspace-menu"
          >
            {/* Header */}
            {/* <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold text-gray-900 dark:text-white"
                    id="workspace-menu"
                  >
                    Your Workspaces
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Switch between workspaces
                  </p>
                </div>
              </div>
            </div> */}

            {/* Organizations List */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-2 pinned-boards-scroll"
            >
              {organizations.map((org) => (
                <button
                  key={org.id}
                  ref={
                    currentOrganization?.id === org.id ? selectedOrgRef : null
                  }
                  onClick={() => handleOrganizationSelect(org)}
                  onKeyDown={(e) =>
                    handleOptionKeyDown(e, () => handleOrganizationSelect(org))
                  }
                  className="w-full flex items-center justify-between px-4 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-all duration-200 focus:outline-none group"
                  role="menuitem"
                  tabIndex={-1}
                  aria-label={`Switch to ${org.display_name}${
                    currentOrganization?.id === org.id
                      ? " (currently selected)"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {org.logo_url ? (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={org.logo_url}
                          alt={org.display_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                        {org.display_name}
                      </p>
                      {org.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {/* <span className="text-xs text-blue-600 font-medium">
                        Active
                      </span> */}
                      <Check
                        className="h-4 w-4 text-blue-600"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Create New Workspace Button */}
            {/* <div className="border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleCreateNew}
                onKeyDown={(e) => handleOptionKeyDown(e, handleCreateNew)}
                className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-all duration-200 focus:outline-none group"
                role="menuitem"
                tabIndex={-1}
                aria-label="Create a new workspace"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                    Create New Workspace
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Start a new workspace
                  </p>
                </div>
              </button>
            </div> */}
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
};

const SideNavigation: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isManuallyOpened, setIsManuallyOpened] = useState(false);
  const [pinnedBoards, setPinnedBoards] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { boards } = useBoard();
  const { theme, setTheme } = useTheme();
  const { currentOrganization } = useOrganization();

  // Helper function to get storage key for current organization
  const getPinnedBoardsKey = () => {
    const orgId = currentOrganization?.id;
    return orgId ? `pinnedBoards_${orgId}` : "pinnedBoards";
  };

  useEffect(() => {
    const storageKey = getPinnedBoardsKey();
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setPinnedBoards(JSON.parse(stored));
    } else {
      setPinnedBoards([]);
    }

    const handleStorageChange = () => {
      // Don't update from localStorage if we're in the middle of a drag operation
      if (isUpdating) return;

      const updated = localStorage.getItem(storageKey);
      if (updated) {
        const newBoards = JSON.parse(updated);
        setPinnedBoards(newBoards);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isUpdating, currentOrganization?.id]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let touchStartX = 0;
    let touchStartY = 0;

    const isMobile = () => window.innerWidth < 768;

    const handleMouseMove = (e: MouseEvent) => {
      // Disable auto-show on mobile
      if (isMobile()) return;

      // Don't auto-show if manually opened
      if (isManuallyOpened) return;

      // Show sidebar when cursor is within 50px of the left edge
      if (e.clientX <= 50) {
        setIsVisible(true);
        clearTimeout(timeoutId);
      } else if (e.clientX > 300) {
        // Add a delay before hiding to prevent flickering
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, 300);
      }
    };

    const handleMouseLeave = () => {
      // Don't auto-hide if manually opened
      if (isManuallyOpened) return;

      // Hide sidebar when mouse leaves the window
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 300);
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Only handle on mobile
      if (!isMobile()) return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only handle on mobile
      if (!isMobile()) return;

      // Don't auto-show if manually opened
      if (isManuallyOpened) return;

      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const deltaX = touchCurrentX - touchStartX;
      const deltaY = Math.abs(touchCurrentY - touchStartY);

      // Only trigger if:
      // 1. Swipe starts from left edge (within 20px)
      // 2. Horizontal swipe is significant (> 50px)
      // 3. Vertical movement is minimal (< 30px) to avoid conflicting with scroll
      if (touchStartX < 20 && deltaX > 50 && deltaY < 30) {
        setIsVisible(true);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      clearTimeout(timeoutId);
    };
  }, [isManuallyOpened]);

  const toggleNavigation = () => {
    if (isVisible && isManuallyOpened) {
      // Close manually opened sidebar
      setIsVisible(false);
      setIsManuallyOpened(false);
    } else {
      // Open sidebar manually
      setIsVisible(true);
      setIsManuallyOpened(true);
    }
  };
  const handleHomeClick = () => {
    navigate("/dashboard");
    setIsVisible(false);
    setIsManuallyOpened(false);
  };

  const handleMembersClick = () => {
    navigate("/members");
    setIsVisible(false);
    setIsManuallyOpened(false);
  };

  const handleLeavesClick = () => {
    navigate("/leaves");
    setIsVisible(false);
    setIsManuallyOpened(false);
  };

  const handleBoardClick = (boardId: string) => {
    navigate(`/board/${boardId}`);
    setIsVisible(false);
    setIsManuallyOpened(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedIndex(index);
    setIsUpdating(true);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the element
    if (e.currentTarget === e.target) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsUpdating(false);
      return;
    }

    const storageKey = getPinnedBoardsKey();

    const newPinnedBoards = [...pinnedBoards];
    const [draggedItem] = newPinnedBoards.splice(draggedIndex, 1);

    // Insert at the drop position
    // Since we already removed the item, the array is shorter by 1
    // If dropping after removal point, we need to account for the shift
    newPinnedBoards.splice(dropIndex, 0, draggedItem);

    // Update state first
    setPinnedBoards(newPinnedBoards);

    // Then update localStorage with organization-specific key
    localStorage.setItem(storageKey, JSON.stringify(newPinnedBoards));

    // Dispatch a custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("pinnedBoardsChanged", {
        detail: {
          pinnedBoards: newPinnedBoards,
          organizationId: currentOrganization?.id,
        },
      })
    );

    setDraggedIndex(null);
    setDragOverIndex(null);

    // Small delay before allowing polling again to ensure state has updated
    setTimeout(() => {
      setIsUpdating(false);
    }, 100);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsUpdating(false);
  };

  const pinnedBoardsList = pinnedBoards
    .map((id) => boards.find((board) => board.id === id))
    .filter((board) => board !== undefined);

  const navigationItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      onClick: handleHomeClick,
      description: "Go to Dashboard",
    },
    {
      id: "members",
      label: "Members",
      icon: UserPlus,
      onClick: handleMembersClick,
      description: "Manage workspace members",
    },
    {
      id: "leaves",
      label: "L&H",
      icon: Calendar,
      onClick: handleLeavesClick,
      description: "Leaves and Holidays",
    },
  ];

  return (
    <>
      {/* Navigation Toggle Button */}
      <button
        onClick={toggleNavigation}
        className={`fixed left-4 bottom-4 z-40 w-16 h-8 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group ${
          isVisible ? "translate-x-64" : "translate-x-0"
        }`}
        aria-label={
          isVisible ? "Close navigation menu" : "Open navigation menu"
        }
        title={isVisible ? "Close navigation" : "Open navigation"}
      >
        <div className="flex items-center space-x-1">
          <div className="flex flex-col space-y-0.5">
            <div
              className={`w-3 h-0.5 bg-white rounded-full transition-all duration-200 ${
                isVisible ? "rotate-45 translate-y-1" : ""
              }`}
            ></div>
            <div
              className={`w-3 h-0.5 bg-white rounded-full transition-all duration-200 ${
                isVisible ? "opacity-0" : ""
              }`}
            ></div>
            <div
              className={`w-3 h-0.5 bg-white rounded-full transition-all duration-200 ${
                isVisible ? "-rotate-45 -translate-y-1" : ""
              }`}
            ></div>
          </div>
          <div className="w-4 h-4 shadow-sm">
            <img
              src="/icons/web-app-manifest-192x192.png"
              alt="One Platform"
              className="w-full h-full rounded object-cover"
            />
          </div>
        </div>
      </button>

      {/* Trigger Area - Invisible area on the left edge (desktop only) */}
      <div
        className={`hidden md:block fixed left-0 top-0 w-12 h-full z-40 pointer-events-auto ${
          isManuallyOpened ? "pointer-events-none" : ""
        }`}
        style={{ pointerEvents: isVisible ? "none" : "auto" }}
      />

      {/* Side Navigation */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseEnter={() => {
          if (!isManuallyOpened) {
            setIsVisible(true);
          }
        }}
        onMouseLeave={() => {
          if (!isManuallyOpened) {
            setTimeout(() => setIsVisible(false), 300);
          }
        }}
      >
        {/* Main container with flex column */}
        <div className="flex flex-col h-full">
          {/* Header - Fixed height */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 shadow-lg">
                  <img
                    src="/icons/web-app-manifest-192x192.png"
                    alt="One Platform Logo"
                    className="w-full h-full rounded-xl object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Quick Access Menu
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    One Platform
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area - This will grow and scroll */}
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
            {/* Navigation Items - Fixed section */}
            <div className="flex-shrink-0 p-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title={item.description}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                </button>
              ))}
            </div>

            {/* Pinned Boards Section - Takes remaining space and scrolls */}
            {pinnedBoardsList.length > 0 && (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="mx-4 border-t border-gray-200 dark:border-gray-600"></div>
                <div className="px-4 pt-4 pb-2 flex-shrink-0">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pinned Boards
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-1 pb-4 pinned-boards-scroll">
                  {pinnedBoardsList.map((board, index) => (
                    <div
                      key={board.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={(e) => handleDragLeave(e)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group relative flex-shrink-0 transition-all duration-200 mb-2 ${
                        draggedIndex === index ? "opacity-50" : "opacity-100"
                      }`}
                    >
                      {/* Drag indicator line - show above the item when hovering */}
                      {dragOverIndex === index &&
                        draggedIndex !== null &&
                        draggedIndex !== index && (
                          <div className="absolute -top-1 left-3 right-3 h-1 bg-blue-500 rounded-full z-10 shadow-lg" />
                        )}

                      <button
                        onClick={() => handleBoardClick(board.id)}
                        className="w-full flex items-center space-x-3 p-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-0"
                        title={board.description || board.name}
                        style={{
                          pointerEvents:
                            draggedIndex === index ? "none" : "auto",
                        }}
                      >
                        {/* Drag handle - only show when more than one board is pinned */}
                        {pinnedBoardsList.length > 1 && (
                          <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-200 flex-shrink-0">
                            <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing" />
                          </div>
                        )}

                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
                          style={{
                            backgroundColor:
                              board.background_color || "#3B82F6",
                            backgroundImage: board.background_image_url
                              ? `url(${board.background_image_url})`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <Layout className="h-5 w-5 text-white drop-shadow" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                            {board.name}
                          </p>
                          {board.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {board.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                      </button>
                    </div>
                  ))}

                  {/* Drop zone at the end to allow dropping after the last item */}
                  {pinnedBoardsList.length > 0 && draggedIndex !== null && (
                    <div
                      onDragOver={(e) =>
                        handleDragOver(e, pinnedBoardsList.length)
                      }
                      onDrop={(e) => handleDrop(e, pinnedBoardsList.length)}
                      className="relative h-8 flex items-center justify-center"
                    >
                      {dragOverIndex === pinnedBoardsList.length && (
                        <div className="absolute top-0 left-3 right-3 h-1 bg-blue-500 rounded-full shadow-lg" />
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Drop here
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Bottom Sections */}
          <div className="flex-shrink-0">
            {/* Organization Switcher */}
            <div className="px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CustomOrganizationSwitcher />
            </div>

            {/* Theme Toggle Section */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    theme === "light"
                      ? "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  aria-label="Light theme"
                  title="Light theme"
                >
                  <Sun
                    className={`h-4 w-4 transition-colors duration-200 ${
                      theme === "light"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  aria-label="Dark theme"
                  title="Dark theme"
                >
                  <Moon
                    className={`h-4 w-4 transition-colors duration-200 ${
                      theme === "dark"
                        ? "text-slate-100"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                </button>

                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    theme === "system"
                      ? "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  aria-label="System theme"
                  title="Auto theme"
                >
                  <Monitor
                    className={`h-4 w-4 transition-colors duration-200 ${
                      theme === "system"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop - only show when manually opened */}
      {isVisible && isManuallyOpened && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
          onClick={toggleNavigation}
        />
      )}

      {/* Auto-show backdrop - lighter and non-clickable */}
      {isVisible && !isManuallyOpened && (
        <div className="fixed inset-0 bg-black bg-opacity-10 z-40 transition-opacity duration-300 pointer-events-none" />
      )}
    </>
  );
};

export default SideNavigation;
