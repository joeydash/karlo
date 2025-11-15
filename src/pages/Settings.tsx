import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Palette,
  Fingerprint,
} from "lucide-react";
import SideNavigation from "../components/SideNavigation";
import SkipLink from "../components/SkipLink";
import ThemeToggle from "../components/ThemeToggle";
import { PasskeySettingsSection } from "../components/PasskeySettingsSection";
import EditProfileModal from "../components/EditProfileModal";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "appearance" | "security"
  >("profile");

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "security" as const, label: "Security", icon: Fingerprint },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <SkipLink />
      <SideNavigation />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Settings
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <nav className="flex flex-col">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Profile Information
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        {user?.dp ? (
                          <img
                            src={user.dp}
                            alt={user.fullname || "Profile"}
                            className="w-20 h-20 rounded-full object-cover border-4 border-purple-500"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user?.fullname?.charAt(0) ||
                              user?.phone?.slice(-2) ||
                              "?"}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user?.fullname || "User"}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {user?.phone}
                          </p>
                          {user?.email && (
                            <p className="text-gray-600 dark:text-gray-400">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setIsEditProfileModalOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-all shadow-lg shadow-purple-500/20"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Appearance Settings
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Theme
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Choose between light and dark mode
                          </p>
                        </div>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && user && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Security Settings
                    </h2>
                    <PasskeySettingsSection
                      userId={user.id}
                      authToken={localStorage.getItem("auth_token") || ""}
                      userPhone={user.phone || ""}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />
    </div>
  );
};

export default Settings;
