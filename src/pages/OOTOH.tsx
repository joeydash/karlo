import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  Clock,
  Edit,
  Trash2,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOOTOH } from "../hooks/useOOTOH";
import { useOrganization } from "../hooks/useOrganization";
import { useMember } from "../hooks/useMember";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import SideNavigation from "../components/SideNavigation";
import UpdateOOTOHModal from "../components/UpdateOOTOHModal";
import RecordOOTOHModal from "../components/RecordOOTOHModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { OOTOH as OOTOHType } from "../types/ootoh";

const OOTOH: React.FC = () => {
  const navigate = useNavigate();
  const {
    ootohRecords,
    total,
    isLoading,
    error,
    fetchOOTOHRecords,
    fetchAllOOTOHRecords,
    updateOOTOH,
    deleteOOTOH,
    recordOOTOH,
    approveOOTOH,
    rejectOOTOH,
  } = useOOTOH();
  const { currentOrganization } = useOrganization();
  const { members } = useMember();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showConfirmApproveModal, setShowConfirmApproveModal] = useState(false);
  const [showConfirmRejectModal, setShowConfirmRejectModal] = useState(false);
  const [selectedOOTOH, setSelectedOOTOH] = useState<OOTOHType | null>(null);
  const [ootohToDelete, setOOTOHToDelete] = useState<string | null>(null);
  const [ootohToApprove, setOOTOHToApprove] = useState<string | null>(null);
  const [ootohToReject, setOOTOHToReject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    return currentUser?.id || "";
  });
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today's date
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const isCurrentUserAdmin = currentOrganization?.user_role === "admin";

  useEffect(() => {
    if (!currentOrganization?.id) return;

    if (isCurrentUserAdmin) {
      if (selectedMemberId === "") {
        fetchAllOOTOHRecords(currentOrganization.id, currentPage, itemsPerPage);
      } else {
        fetchOOTOHRecords(
          currentOrganization.id,
          currentPage,
          itemsPerPage,
          selectedMemberId
        );
      }
    } else {
      fetchOOTOHRecords(
        currentOrganization.id,
        currentPage,
        itemsPerPage,
        currentUser?.id
      );
    }
  }, [currentOrganization?.id, selectedMemberId, currentPage, itemsPerPage]);

  const handleDeleteOOTOH = (ootohId: string) => {
    setOOTOHToDelete(ootohId);
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteOOTOH = async () => {
    if (!ootohToDelete) return;

    const result = await deleteOOTOH(ootohToDelete);
    if (result.success) {
      showSuccess("OOTOH record deleted successfully");
    } else {
      showError(result.message || "Failed to delete OOTOH record");
    }
    setShowConfirmDeleteModal(false);
    setOOTOHToDelete(null);
  };

  const handleUpdateOOTOH = (ootoh: OOTOHType) => {
    setSelectedOOTOH(ootoh);
    setShowUpdateModal(true);
  };

  const handleApproveOOTOH = (ootohId: string) => {
    setOOTOHToApprove(ootohId);
    setShowConfirmApproveModal(true);
  };

  const confirmApproveOOTOH = async () => {
    if (!ootohToApprove) return;

    const result = await approveOOTOH(ootohToApprove);
    if (result.success) {
      showSuccess("OOTOH record approved successfully");
    } else {
      showError(result.message || "Failed to approve OOTOH record");
    }
    setShowConfirmApproveModal(false);
    setOOTOHToApprove(null);
  };

  const handleRejectOOTOH = (ootohId: string) => {
    setOOTOHToReject(ootohId);
    setShowConfirmRejectModal(true);
  };

  const confirmRejectOOTOH = async () => {
    if (!ootohToReject) return;

    const result = await rejectOOTOH(ootohToReject);
    if (result.success) {
      showSuccess("OOTOH record rejected");
    } else {
      showError(result.message || "Failed to reject OOTOH record");
    }
    setShowConfirmRejectModal(false);
    setOOTOHToReject(null);
  };

  const handleRecordOOTOH = async (
    startTime: string,
    startDate: string,
    endTime: string | null,
    endDate: string | null,
    workDone: string | null,
    targetMemberId?: string
  ) => {
    if (!currentOrganization?.id || !currentUser?.id) return;

    // Use targetMemberId if provided (admin recording for another member), otherwise use current user
    const userId = targetMemberId || currentUser.id;
    const member = members.find((m) => m.user_id === userId);
    if (!member) {
      showError("Member not found");
      return;
    }

    const result = await recordOOTOH(
      currentOrganization.id,
      member.id,
      userId,
      startTime,
      startDate,
      endTime,
      endDate,
      workDone,
      member.auth_fullname?.fullname,
      member.auth_fullname?.dp
    );

    if (result.success) {
      if (endTime) {
        showSuccess("Office hours recorded successfully");
      } else {
        showSuccess("Office entry time recorded successfully");
      }
      setShowRecordModal(false);
    } else {
      showError(result.message || "Failed to record office hours");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    if (!endTime) return "-";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  // Server already handles pagination, just apply frontend filters if needed
  const filteredOOTOH = ootohRecords.filter((record) => {
    const matchesSearch =
      selectedMemberId === ""
        ? record.auth_fullname?.fullname
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) || false
        : true;

    // Apply month/year filters for both All Members and individual member views
    const recordDate = new Date(record.start_date);
    const recordMonth = recordDate.getMonth();
    const recordYear = recordDate.getFullYear();

    const matchesMonth =
      selectedMonth === "all" || recordMonth === parseInt(selectedMonth);
    const matchesYear =
      selectedYear === "all" || recordYear === parseInt(selectedYear);

    return matchesSearch && matchesMonth && matchesYear;
  });

  // Use server-side pagination - records are already paginated from server
  const paginatedRecords = filteredOOTOH;
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMemberId, selectedMonth, selectedYear]);

  // For normal users, only show current user and All Members option
  // For admins, show all members
  const filteredMembers = isCurrentUserAdmin
    ? members.filter((member) =>
        member.auth_fullname.fullname
          .toLowerCase()
          .includes(memberSearchTerm.toLowerCase())
      )
    : members.filter((member) => member.user_id === currentUser?.id);

  const monthOptions = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const availableYears = Array.from(
    new Set(
      ootohRecords.map((record) => new Date(record.start_date).getFullYear())
    )
  ).sort((a, b) => b - a);

  const yearOptions = [
    { value: "all", label: "All Years" },
    ...availableYears.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
  ];

  const ShimmerRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-8 w-16 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
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
                onClick={() => navigate("/leaves")}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
                    Out of Office Hours
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                    {currentOrganization?.display_name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to load OOTOH records
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => navigate("/leaves")}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Leaves</span>
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">
              <div className="flex items-center w-full sm:w-auto">
                <button
                  onClick={() => navigate("/leaves")}
                  className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                      Out Of The Office Hours
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                      Track office entry and exit times
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                  className="flex items-center justify-between sm:justify-start space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm w-full sm:w-auto"
                >
                  <Users className="h-4 w-4" />
                  <span>
                    {selectedMemberId
                      ? (() => {
                          if (selectedMemberId === "") {
                            return "All Members";
                          }
                          const member = members.find(
                            (m) => m.user_id === selectedMemberId
                          );
                          if (!member) return "Select Member";
                          const isCurrentUser =
                            member.user_id === currentUser?.id;
                          return isCurrentUser
                            ? `${member.auth_fullname.fullname} (Me)`
                            : member.auth_fullname.fullname;
                        })()
                      : "All Members"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showMemberDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-20 max-h-60 overflow-y-auto">
                    {isCurrentUserAdmin && (
                      <div className="px-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search members..."
                            value={memberSearchTerm}
                            onChange={(e) =>
                              setMemberSearchTerm(e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            autoFocus
                          />
                          {memberSearchTerm && (
                            <button
                              onClick={() => setMemberSearchTerm("")}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {(!isCurrentUserAdmin ||
                      !memberSearchTerm ||
                      "all members".includes(
                        memberSearchTerm.toLowerCase()
                      )) && (
                      <button
                        onClick={() => {
                          setSelectedMemberId("");
                          setShowMemberDropdown(false);
                          setMemberSearchTerm("");
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          selectedMemberId === ""
                            ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                            <Users className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            All Members
                          </p>
                        </div>
                        {selectedMemberId === "" && (
                          <CheckCircle className="h-4 w-4 text-orange-600" />
                        )}
                      </button>
                    )}

                    {filteredMembers.map((member) => (
                      <button
                        key={member.user_id}
                        onClick={() => {
                          setSelectedMemberId(member.user_id);
                          setShowMemberDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          selectedMemberId === member.user_id
                            ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {member.auth_fullname.dp ? (
                            <img
                              src={member.auth_fullname.dp}
                              alt={member.auth_fullname.fullname}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-100"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center border-2 border-gray-100">
                              <span className="text-xs font-bold text-white">
                                {member.auth_fullname.fullname
                                  .split(" ")
                                  .map((name) => name.charAt(0))
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.auth_fullname.fullname}
                            {member.user_id === currentUser?.id && " (Me)"}
                          </p>
                        </div>
                        {selectedMemberId === member.user_id && (
                          <CheckCircle className="h-4 w-4 text-orange-600" />
                        )}
                      </button>
                    ))}

                    {memberSearchTerm &&
                      filteredMembers.length === 0 &&
                      !"all members".includes(
                        memberSearchTerm.toLowerCase()
                      ) && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-600">
                          No members found for "{memberSearchTerm}"
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {ootohRecords.length > 0 && (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {(() => {
                    if (isCurrentUserAdmin && selectedMemberId === "") {
                      return "All OOTOH Records";
                    } else if (
                      isCurrentUserAdmin &&
                      selectedMemberId &&
                      selectedMemberId !== currentUser?.id
                    ) {
                      const member = members.find(
                        (m) => m.user_id === selectedMemberId
                      );
                      return `${
                        member?.auth_fullname.fullname || "Member"
                      }'s OOTOH Records`;
                    } else {
                      return "My OOTOH Records";
                    }
                  })()}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {searchTerm ||
                  selectedMonth !== "all" ||
                  selectedYear !== "all" ? (
                    <>
                      {filteredOOTOH.length} of {ootohRecords.length} record
                      {ootohRecords.length !== 1 ? "s" : ""}
                      {filteredOOTOH.length > 0 &&
                        searchTerm &&
                        ` matching "${searchTerm}"`}
                      {selectedMonth !== "all" &&
                        ` in ${
                          monthOptions.find((m) => m.value === selectedMonth)
                            ?.label
                        }`}
                      {selectedYear !== "all" && ` for year ${selectedYear}`}
                    </>
                  ) : (
                    `${ootohRecords.length} record${
                      ootohRecords.length !== 1 ? "s" : ""
                    }`
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:flex-shrink-0">
                {selectedMemberId !== "" && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowMonthDropdown(!showMonthDropdown);
                          setShowYearDropdown(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                      >
                        <Clock className="h-4 w-4" />
                        <span>
                          {
                            monthOptions.find(
                              (opt) => opt.value === selectedMonth
                            )?.label
                          }
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {showMonthDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-20 max-h-56 overflow-y-auto custom-scrollbar">
                          {monthOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedMonth(option.value);
                                setShowMonthDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                                selectedMonth === option.value
                                  ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <span>{option.label}</span>
                              {selectedMonth === option.value && (
                                <CheckCircle className="h-4 w-4 text-orange-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowYearDropdown(!showYearDropdown);
                          setShowMonthDropdown(false);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-sm"
                      >
                        <Clock className="h-4 w-4" />
                        <span>
                          {
                            yearOptions.find(
                              (opt) => opt.value === selectedYear
                            )?.label
                          }
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {showYearDropdown && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-20 max-h-56 overflow-y-auto custom-scrollbar">
                          {yearOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedYear(option.value);
                                setShowYearDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                                selectedYear === option.value
                                  ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <span>{option.label}</span>
                              {selectedYear === option.value && (
                                <CheckCircle className="h-4 w-4 text-orange-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedMemberId === "" && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                        className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between min-w-[120px]"
                      >
                        <span>
                          {
                            monthOptions.find(
                              (opt) => opt.value === selectedMonth
                            )?.label
                          }
                        </span>
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </button>
                      {showMonthDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                          {monthOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSelectedMonth(option.value);
                                setShowMonthDropdown(false);
                                setCurrentPage(1);
                              }}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                                selectedMonth === option.value
                                  ? "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <span className="text-sm">{option.label}</span>
                              {selectedMonth === option.value && (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}

                {(!isCurrentUserAdmin ||
                  (isCurrentUserAdmin &&
                    selectedMemberId &&
                    selectedMemberId !== "")) && (
                  <button
                    onClick={() => setShowRecordModal(true)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Record Office Hours</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {isLoading && ootohRecords.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Entry Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Exit Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
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
          ) : ootohRecords.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No OOTOH records yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Record your first office hours to get started
              </p>
              {(!isCurrentUserAdmin ||
                (isCurrentUserAdmin &&
                  selectedMemberId &&
                  selectedMemberId !== "")) && (
                <button
                  onClick={() => setShowRecordModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Entry Time</span>
                </button>
              )}
            </div>
          ) : filteredOOTOH.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No records found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                No records match your current filters
                {searchTerm && ` for "${searchTerm}"`}
                {selectedMonth !== "all" &&
                  ` in ${
                    monthOptions.find((m) => m.value === selectedMonth)?.label
                  }`}
                {selectedYear !== "all" && ` for year ${selectedYear}`}
              </p>
              <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Search</span>
                  </button>
                )}
                {selectedMonth !== "all" && (
                  <button
                    onClick={() => setSelectedMonth("all")}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Month</span>
                  </button>
                )}
                {selectedYear !== "all" && (
                  <button
                    onClick={() => setSelectedYear("all")}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-xl transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Year</span>
                  </button>
                )}
                {(searchTerm ||
                  selectedMonth !== "all" ||
                  selectedYear !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedMonth("all");
                      setSelectedYear("all");
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl transition-all duration-200"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                          Date
                        </th>
                        {isCurrentUserAdmin && selectedMemberId === "" && (
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                            Member
                          </th>
                        )}
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                          Start Time
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                          End Time
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                          Duration
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                          Work Done
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(record.start_date)}
                            </div>
                          </td>
                          {isCurrentUserAdmin &&
                            selectedMemberId === "" &&
                            record.auth_fullname && (
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  {record.auth_fullname.dp ? (
                                    <img
                                      src={record.auth_fullname.dp}
                                      alt={record.auth_fullname.fullname}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold text-white">
                                        {record.auth_fullname.fullname
                                          .split(" ")
                                          .map((name) => name.charAt(0))
                                          .join("")
                                          .toUpperCase()
                                          .slice(0, 2)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {record.auth_fullname.fullname}
                                  </div>
                                </div>
                              </td>
                            )}
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                              {formatTime(record.start_time)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div
                                className={`text-sm font-medium ${
                                  record.end_time
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-400 dark:text-gray-500"
                                }`}
                              >
                                {formatTime(record.end_time)}
                              </div>
                              {record.end_date &&
                                record.end_date !== record.start_date && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(record.end_date)}
                                  </div>
                                )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div
                              className={`text-sm font-medium ${
                                record.end_time
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {calculateDuration(
                                record.start_time,
                                record.end_time
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {record.status === "pending" ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                <AlertCircle className="h-3 w-3" />
                                <span>Pending</span>
                              </span>
                            ) : record.status === "approved" ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                <span>Approved</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                <XCircle className="h-3 w-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 max-w-xs">
                            <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {record.work_done || (
                                <span className="text-gray-400 dark:text-gray-500">
                                  No description
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {isCurrentUserAdmin &&
                                record.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleApproveOOTOH(record.id)
                                      }
                                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded-lg transition-all duration-200"
                                      title="Approve record"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRejectOOTOH(record.id)
                                      }
                                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                                      title="Reject record"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              {(record.user_id === currentUser?.id ||
                                isCurrentUserAdmin) && (
                                <button
                                  onClick={
                                    record.status === "pending"
                                      ? () => handleUpdateOOTOH(record)
                                      : undefined
                                  }
                                  disabled={record.status !== "pending"}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    record.status === "pending"
                                      ? "text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                  }`}
                                  title={
                                    record.status === "pending"
                                      ? !record.end_time
                                        ? "Add end time"
                                        : "Edit record"
                                      : `Cannot edit ${record.status} record`
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {(record.user_id === currentUser?.id ||
                                isCurrentUserAdmin) && (
                                <button
                                  onClick={
                                    record.status !== "approved"
                                      ? () => handleDeleteOOTOH(record.id)
                                      : undefined
                                  }
                                  disabled={record.status === "approved"}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    record.status !== "approved"
                                      ? "text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                  }`}
                                  title={
                                    record.status !== "approved"
                                      ? "Delete record"
                                      : "Cannot delete approved record"
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredOOTOH.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{" "}
                        <span className="font-semibold">{startIndex + 1}</span>{" "}
                        to{" "}
                        <span className="font-semibold">
                          {Math.min(endIndex, filteredOOTOH.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">
                          {filteredOOTOH.length}
                        </span>{" "}
                        results
                      </span>
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor="itemsPerPage"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Per page:
                        </label>
                        <select
                          id="itemsPerPage"
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <div className="flex items-center space-x-1">
                        {(() => {
                          const pages = [];
                          const maxVisiblePages = 5;
                          let startPage = Math.max(
                            1,
                            currentPage - Math.floor(maxVisiblePages / 2)
                          );
                          let endPage = Math.min(
                            totalPages,
                            startPage + maxVisiblePages - 1
                          );

                          if (endPage - startPage < maxVisiblePages - 1) {
                            startPage = Math.max(
                              1,
                              endPage - maxVisiblePages + 1
                            );
                          }

                          if (startPage > 1) {
                            pages.push(
                              <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                              >
                                1
                              </button>
                            );
                            if (startPage > 2) {
                              pages.push(
                                <span
                                  key="ellipsis1"
                                  className="px-2 text-gray-500 dark:text-gray-400"
                                >
                                  ...
                                </span>
                              );
                            }
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                                  currentPage === i
                                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold shadow-md"
                                    : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }

                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              pages.push(
                                <span
                                  key="ellipsis2"
                                  className="px-2 text-gray-500 dark:text-gray-400"
                                >
                                  ...
                                </span>
                              );
                            }
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                              >
                                {totalPages}
                              </button>
                            );
                          }

                          return pages;
                        })()}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:hidden space-y-3">
                {paginatedRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {formatDate(record.start_date)}
                          </h3>
                          {isCurrentUserAdmin &&
                            selectedMemberId === "" &&
                            record.auth_fullname && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {record.auth_fullname.fullname}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Start Time
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatTime(record.start_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          End Time
                        </span>
                        <div className="text-right">
                          <div
                            className={`font-medium ${
                              record.end_time
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {formatTime(record.end_time)}
                          </div>
                          {record.end_date &&
                            record.end_date !== record.start_date && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {formatDate(record.end_date)}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Duration
                        </span>
                        <span
                          className={`font-medium ${
                            record.end_time
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {calculateDuration(
                            record.start_time,
                            record.end_time
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Status
                        </span>
                        {record.status === "pending" ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>Pending</span>
                          </span>
                        ) : record.status === "approved" ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <XCircle className="h-3 w-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>
                      {record.work_done && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                            Work Done:
                          </p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {record.work_done}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {isCurrentUserAdmin && record.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveOOTOH(record.id)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectOOTOH(record.id)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      {(record.user_id === currentUser?.id ||
                        isCurrentUserAdmin) && (
                        <>
                          <button
                            onClick={
                              record.status === "pending"
                                ? () => handleUpdateOOTOH(record)
                                : undefined
                            }
                            disabled={record.status !== "pending"}
                            className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                              record.status === "pending"
                                ? "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                                : "text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            }`}
                            title={
                              record.status === "pending"
                                ? !record.end_time
                                  ? "Add end time"
                                  : "Edit record"
                                : `Cannot edit ${record.status} record`
                            }
                          >
                            <Edit className="h-3 w-3" />
                            <span>
                              {!record.end_time ? "Add End Time" : "Edit"}
                            </span>
                          </button>
                          <button
                            onClick={
                              record.status !== "approved"
                                ? () => handleDeleteOOTOH(record.id)
                                : undefined
                            }
                            disabled={record.status === "approved"}
                            className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                              record.status !== "approved"
                                ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                : "text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            }`}
                            title={
                              record.status !== "approved"
                                ? "Delete record"
                                : "Cannot delete approved record"
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {filteredOOTOH.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                      <span>
                        {startIndex + 1}-
                        {Math.min(endIndex, filteredOOTOH.length)} of{" "}
                        {filteredOOTOH.length}
                      </span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={5}>5/page</option>
                        <option value={10}>10/page</option>
                        <option value={20}>20/page</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {showMonthDropdown && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMonthDropdown(false)}
          />
        )}

        {showYearDropdown && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowYearDropdown(false)}
          />
        )}

        {showMemberDropdown && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowMemberDropdown(false);
              setMemberSearchTerm("");
            }}
          />
        )}

        <UpdateOOTOHModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedOOTOH(null);
          }}
          ootoh={selectedOOTOH}
        />

        <RecordOOTOHModal
          isOpen={showRecordModal}
          onClose={() => setShowRecordModal(false)}
          onConfirm={handleRecordOOTOH}
          isLoading={isLoading}
          selectedMemberId={selectedMemberId}
        />

        <ConfirmationModal
          isOpen={showConfirmDeleteModal}
          onClose={() => {
            setShowConfirmDeleteModal(false);
            setOOTOHToDelete(null);
          }}
          onConfirm={confirmDeleteOOTOH}
          title="Delete OOTOH Record"
          message="Are you sure you want to delete this OOTOH record? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          isLoading={isLoading}
        />

        <ConfirmationModal
          isOpen={showConfirmApproveModal}
          onClose={() => {
            setShowConfirmApproveModal(false);
            setOOTOHToApprove(null);
          }}
          onConfirm={confirmApproveOOTOH}
          title="Approve OOTOH Record"
          message="Are you sure you want to approve this OOTOH record?"
          confirmText="Approve"
          cancelText="Cancel"
          type="success"
          isLoading={isLoading}
        />

        <ConfirmationModal
          isOpen={showConfirmRejectModal}
          onClose={() => {
            setShowConfirmRejectModal(false);
            setOOTOHToReject(null);
          }}
          onConfirm={confirmRejectOOTOH}
          title="Reject OOTOH Record"
          message="Are you sure you want to reject this OOTOH record?"
          confirmText="Reject"
          cancelText="Cancel"
          type="danger"
          isLoading={isLoading}
        />
      </div>
    </>
  );
};

export default OOTOH;
