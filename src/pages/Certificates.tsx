import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Award,
  Search,
  X,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Users,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCertificate } from "../hooks/useCertificate";
import { useOrganization } from "../hooks/useOrganization";
import { useMember } from "../hooks/useMember";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import CertificateDetailsModal from "../components/CertificateDetailsModal";
import CreateCertificateModal from "../components/CreateCertificateModal";
import EditCertificateModal from "../components/EditCertificateModal";
import ConfirmationModal from "../components/ConfirmationModal";
import SideNavigation from "../components/SideNavigation";
import { Certificate } from "../types/certificate";

const Certificates: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    certificates,
    isLoading,
    error,
    fetchCertificates,
    fetchMemberCertificates,
    deleteCertificate,
  } = useCertificate(true);
  const { currentOrganization } = useOrganization();
  const { members } = useMember();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(
    null
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    () => currentUser?.id || ""
  );
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const memberSearchInputRef = useRef<HTMLInputElement>(null);

  const isCurrentUserAdmin = currentOrganization?.user_role === "admin";

  // Check if we came from the members page
  const fromMembers = location.state?.from === "/members";

  // Handle back navigation
  const handleBack = () => {
    if (fromMembers) {
      navigate("/members");
    } else {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    if (!currentUser?.id || !currentOrganization?.id) return;

    if (isCurrentUserAdmin && selectedMemberId) {
      fetchMemberCertificates(selectedMemberId, currentOrganization.id);
    } else if (currentUser?.id) {
      fetchCertificates(currentUser.id, currentOrganization.id);
    }
  }, [
    selectedMemberId,
    currentUser?.id,
    currentOrganization?.id,
    isCurrentUserAdmin,
  ]);

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (showMemberDropdown && memberSearchInputRef.current) {
      memberSearchInputRef.current.focus();
    }
  }, [showMemberDropdown]);

  const handleCertificateClick = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowDetailsModal(true);
  };

  const handleEditClick = (e: React.MouseEvent, certificate: Certificate) => {
    e.stopPropagation();
    setSelectedCertificate(certificate);
    setShowEditModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, certificateId: string) => {
    e.stopPropagation();
    setCertificateToDelete(certificateId);
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteCertificate = async () => {
    if (!certificateToDelete) return;

    const result = await deleteCertificate(certificateToDelete);
    if (result.success) {
      showSuccess("Certificate deleted successfully");
    } else {
      showError(result.message || "Failed to delete certificate");
    }
    setShowConfirmDeleteModal(false);
    setCertificateToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateDuration = (fromDate: string, toDate: string) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? "s" : ""}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths > 0) {
        return `${years} year${
          years !== 1 ? "s" : ""
        }, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
      }
      return `${years} year${years !== 1 ? "s" : ""}`;
    }
  };

  const filteredCertificates = certificates.filter(
    (certificate) =>
      certificate.org_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (certificate.designation &&
        certificate.designation
          .toLowerCase()
          .includes(searchTerm.toLowerCase()))
  );

  const filteredMembers = members.filter((member) =>
    member.auth_fullname.fullname
      .toLowerCase()
      .includes(memberSearchTerm.toLowerCase())
  );

  const selectedMember = members.find((m) => m.user_id === selectedMemberId);

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-xl"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32"></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-16"></div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center py-3 sm:py-4">
              <button
                onClick={handleBack}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                    Certificates
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                    Your professional certificates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center py-8 sm:py-12 px-4">
            <Award className="h-12 w-12 sm:h-16 sm:w-16 text-red-300 dark:text-red-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to load certificates
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              {error}
            </p>
            <button
              onClick={handleBack}
              className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Back to {fromMembers ? "Members" : "Dashboard"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideNavigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center justify-between py-3 sm:py-4">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={handleBack}
                  className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                      Certificates
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                      Professional certificates and achievements
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        From Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        To Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <ShimmerRow key={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {isCurrentUserAdmin
                      ? "Manage Certificates"
                      : "My Certificates"}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    {searchTerm ? (
                      <>
                        {filteredCertificates.length} of {certificates.length}{" "}
                        certificate{certificates.length !== 1 ? "s" : ""}
                        {filteredCertificates.length > 0 &&
                          ` matching "${searchTerm}"`}
                      </>
                    ) : (
                      `${certificates.length} certificate${
                        certificates.length !== 1 ? "s" : ""
                      }`
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  {isCurrentUserAdmin && (
                    <>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMemberDropdown(!showMemberDropdown)
                          }
                          className="flex items-center justify-between space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 w-full sm:w-auto"
                        >
                          <Users className="h-4 w-4" />
                          <span>
                            {selectedMember?.auth_fullname.fullname ||
                              "Select Member"}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {showMemberDropdown && (
                          <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-80 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                              <input
                                ref={memberSearchInputRef}
                                type="text"
                                placeholder="Search members..."
                                value={memberSearchTerm}
                                onChange={(e) =>
                                  setMemberSearchTerm(e.target.value)
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2">
                              {filteredMembers.map((member) => (
                                <button
                                  key={member.user_id}
                                  onClick={() => {
                                    setSelectedMemberId(member.user_id);
                                    setShowMemberDropdown(false);
                                    setMemberSearchTerm("");
                                  }}
                                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                                    selectedMemberId === member.user_id
                                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                      : "hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {member.auth_fullname.fullname}
                                    </p>
                                  </div>
                                </button>
                              ))}
                              {filteredMembers.length === 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                  No members found
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedMemberId && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg w-full sm:w-auto"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Certificate</span>
                        </button>
                      )}
                    </>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search certificates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredCertificates.length === 0 && !searchTerm ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Award className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No certificates yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    {isCurrentUserAdmin
                      ? "Create certificates for team members"
                      : "Your professional certificates will appear here"}
                  </p>
                </div>
              ) : filteredCertificates.length === 0 && searchTerm ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No certificates found
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                    No certificates match "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Clear Search</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                              Organization
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                              Designation
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                              From Date
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                              To Date
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                              Duration
                            </th>
                            {isCurrentUserAdmin && (
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredCertificates.map((certificate) => (
                            <tr
                              key={certificate.id}
                              onClick={() =>
                                handleCertificateClick(certificate)
                              }
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                            >
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Award className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {certificate.org_name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Added {formatDate(certificate.created_at)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {certificate.designation || "N/A"}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDate(certificate.from_date)}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatDate(certificate.to_date)}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                  {calculateDuration(
                                    certificate.from_date,
                                    certificate.to_date
                                  )}
                                </span>
                              </td>
                              {isCurrentUserAdmin && (
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={(e) =>
                                      handleEditClick(e, certificate)
                                    }
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) =>
                                      handleDeleteClick(e, certificate.id)
                                    }
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredCertificates.map((certificate) => (
                      <div
                        key={certificate.id}
                        onClick={() => handleCertificateClick(certificate)}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Award className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {certificate.org_name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {certificate.designation || "N/A"}
                            </p>
                          </div>
                          {isCurrentUserAdmin && (
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                onClick={(e) => handleEditClick(e, certificate)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) =>
                                  handleDeleteClick(e, certificate.id)
                                }
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">
                              From Date
                            </p>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {new Date(
                                certificate.from_date
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">
                              To Date
                            </p>
                            <p className="text-gray-900 dark:text-white font-medium">
                              {new Date(certificate.to_date).toLocaleDateString(
                                "en-US",
                                { month: "short", year: "numeric" }
                              )}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 dark:text-gray-400 mb-1">
                              Duration
                            </p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              {calculateDuration(
                                certificate.from_date,
                                certificate.to_date
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Added{" "}
                            {new Date(
                              certificate.created_at
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <CertificateDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCertificate(null);
          }}
          certificate={selectedCertificate}
        />

        {isCurrentUserAdmin && (
          <>
            <CreateCertificateModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              selectedMemberId={selectedMemberId}
            />

            <EditCertificateModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setSelectedCertificate(null);
              }}
              certificate={selectedCertificate}
            />

            <ConfirmationModal
              isOpen={showConfirmDeleteModal}
              onClose={() => {
                setShowConfirmDeleteModal(false);
                setCertificateToDelete(null);
              }}
              onConfirm={confirmDeleteCertificate}
              title="Delete Certificate"
              message="Are you sure you want to delete this certificate? This action cannot be undone."
              confirmText="Delete"
              confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
            />
          </>
        )}
      </div>
    </>
  );
};

export default Certificates;
