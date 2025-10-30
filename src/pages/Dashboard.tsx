import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../hooks/useOrganization';
import { useBoard } from '../hooks/useBoard';
import ThemeToggle from '../components/ThemeToggle';
import OrganizationSwitcher from '../components/OrganizationSwitcher';
import BoardGrid from '../components/BoardGrid';
import EditWorkspaceModal from '../components/EditWorkspaceModal';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import EditProfileModal from '../components/EditProfileModal';
import UniversalSearchModal from '../components/UniversalSearchModal';
import SideNavigation from '../components/SideNavigation';
import SkipLink from '../components/SkipLink';
import { Shield, CheckCircle, Layout, User, RefreshCw, Smartphone, Lock, Zap, Clock, Edit, Search } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isRefreshing } = useAuth();
  const { organizations, currentOrganization } = useOrganization();
  const { boards, fetchBoards } = useBoard();
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = React.useState(false);
  const [isEditWorkspaceModalOpen, setIsEditWorkspaceModalOpen] = React.useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

  // Check if user profile needs completion
  const needsProfileCompletion = user && (!user.fullname || !user.email);

  // Default profile picture URL
  const DEFAULT_DP_URL = 'https://cdn.subspace.money/whatsub_images/user-3711850-3105265+1.png';

  // Check if user has a custom profile picture
  const hasCustomProfilePic = (user as any)?.dp && (user as any).dp !== DEFAULT_DP_URL;

  // Auto-fetch boards when dashboard loads or organization changes
  React.useEffect(() => {
    if (currentOrganization?.id) {
      fetchBoards(currentOrganization.id);
    }
  }, [currentOrganization?.id, fetchBoards]);

  // Global keyboard shortcut for search (Ctrl/Cmd + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <SkipLink />
      <SideNavigation />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <div className="w-8 h-8 sm:w-10 sm:h-10 shadow-lg flex-shrink-0">
                {currentOrganization?.logo_url ? (
                  <img
                    src={currentOrganization.logo_url}
                    alt={`${currentOrganization.display_name} Logo`}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <img
                    src="/icons/web-app-manifest-192x192.png"
                    alt="One Platform Logo"
                    className="w-full h-full rounded-xl object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    {currentOrganization?.display_name || 'One Board'}
                  </h1>
                  {currentOrganization && currentOrganization.user_role === 'admin' && (
                    <button
                      onClick={() => setIsEditWorkspaceModalOpen(true)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:text-gray-600 focus:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
                      aria-label="Edit workspace settings"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Learn. Perform. Grow</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2 sm:hidden">
                <ThemeToggle />
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Search cards"
                  title="Search (Ctrl+K)"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {isRefreshing && (
                <div className="flex items-center text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                  <span className="hidden sm:inline">Refreshing...</span>
                </div>
              )}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Search cards"
                title="Search (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                  ⌘K
                </kbd>
              </button>
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>
              <OrganizationSwitcher />
              {hasCustomProfilePic ? (
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="relative group focus:outline-none flex-shrink-0"
                  aria-label="View profile"
                >
                  <div className="flex items-center overflow-hidden transition-all duration-300 ease-in-out rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-focus:bg-blue-100 dark:group-focus:bg-blue-900/30 group-focus:ring-2 group-focus:ring-blue-500 group-focus:ring-offset-2">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-all duration-200 shadow-md group-hover:shadow-lg">
                        <img
                          src={(user as any).dp}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="hidden md:flex items-center max-w-0 group-hover:max-w-[100px] transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
                      <div className="flex items-center pl-2 pr-3 py-1">
                        <User className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Profile</span>
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="flex items-center text-xs sm:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
                  aria-label="Edit profile information"
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content">
        <h1 className="sr-only">Dashboard</h1>
        <BoardGrid />
      </main>
      
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />

      <EditWorkspaceModal
        isOpen={isEditWorkspaceModalOpen}
        onClose={() => setIsEditWorkspaceModalOpen(false)}
        workspace={currentOrganization}
      />

      <UniversalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <ProfileCompletionModal
        isOpen={!!needsProfileCompletion}
      />
    </div>
  );
};

export default Dashboard;