import React, { useState } from "react";
import { Building2, Plus, ChevronDown, Check } from "lucide-react";
import { useOrganization } from "../hooks/useOrganization";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";

const OrganizationSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
  } = useOrganization();
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
    // Clear any selected board when switching organizations
    // This ensures we don't show boards from the previous organization
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
        // Focus first option after opening
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
        // Return focus to trigger button
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
          className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Create Workspace</span>
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleToggleKeyDown}
          className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Current workspace: ${
            currentOrganization?.display_name || "Select Workspace"
          }. Click to switch workspace.`}
        >
          {currentOrganization?.logo_url ? (
            <img
              src={currentOrganization.logo_url}
              alt={currentOrganization.display_name}
              className="h-5 w-5 rounded object-cover"
            />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span className="max-w-32 truncate">
            {currentOrganization?.display_name || "Select Workspace"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 sm:right-0 left-1/2 sm:left-auto -translate-x-1/2 sm:translate-x-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="workspace-menu"
          >
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
              <h3
                className="text-sm font-semibold text-gray-900 dark:text-white"
                id="workspace-menu"
              >
                Switch Workspace
              </h3>
            </div>

            <div
              ref={scrollContainerRef}
              className="max-h-60 overflow-y-auto overflow-x-hidden p-2 pinned-boards-scroll"
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
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors duration-200 focus:outline-none"
                  role="menuitem"
                  tabIndex={-1}
                  aria-label={`Switch to ${org.display_name}${
                    currentOrganization?.id === org.id
                      ? " (currently selected)"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.display_name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {org.display_name}
                      </p>
                      {org.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-40">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <Check
                      className="h-4 w-4 text-blue-600"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 mt-2">
              <button
                onClick={handleCreateNew}
                onKeyDown={(e) => handleOptionKeyDown(e, handleCreateNew)}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 transition-colors duration-200 focus:outline-none"
                role="menuitem"
                tabIndex={-1}
                aria-label="Create a new workspace"
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Create New Workspace
                </span>
              </button>
            </div>
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

export default OrganizationSwitcher;
