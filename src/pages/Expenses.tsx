import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Calendar,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  X,
  Users,
} from "lucide-react";
import { useExpense } from "../hooks/useExpense";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";
import { useMember } from "../hooks/useMember";
import { useToast } from "../contexts/ToastContext";
import AddExpenseModal from "../components/AddExpenseModal";
import UpdateExpenseModal from "../components/UpdateExpenseModal";
import ConfirmationModal from "../components/ConfirmationModal";
import AttachmentViewerModal from "../components/AttachmentViewerModal";
import SideNavigation from "../components/SideNavigation";
import { Expense } from "../types/expense";

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const {
    expenses,
    total,
    isLoading,
    fetchExpenses,
    fetchMemberExpenses,
    fetchAllExpenses,
    deleteExpense,
    approveExpense,
    rejectExpense,
  } = useExpense();
  const { user: currentUser } = useAuth();
  const { currentOrganization } = useOrganization();
  const { members } = useMember();
  const { showSuccess, showError } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [attachmentViewerExpense, setAttachmentViewerExpense] =
    useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    return currentUser?.id || "";
  });
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const itemsPerPage = 10;
  const memberDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const dayDropdownRef = useRef<HTMLDivElement>(null);

  const isCurrentUserAdmin = currentOrganization?.user_role === "admin";

  useEffect(() => {
    if (!currentOrganization?.id) return;

    loadExpenses(currentPage);
  }, [currentOrganization?.id, selectedMemberId, currentPage, members]);

  const loadExpenses = async (page: number) => {
    const currentMember = members.find((m) => m.user_id === currentUser?.id);

    if (isCurrentUserAdmin) {
      if (selectedMemberId === "") {
        await fetchAllExpenses(page, itemsPerPage);
      } else if (selectedMemberId && selectedMemberId !== currentUser?.id) {
        const targetMember = members.find(
          (m) => m.user_id === selectedMemberId
        );
        if (targetMember?.id) {
          await fetchMemberExpenses(targetMember.id, page, itemsPerPage);
        }
      } else {
        if (currentMember?.id) {
          await fetchExpenses(page, itemsPerPage, currentMember.id);
        }
      }
    } else {
      if (currentMember?.id) {
        await fetchExpenses(page, itemsPerPage, currentMember.id);
      }
    }
  };

  const handleRefresh = () => {
    loadExpenses(currentPage);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    const result = await deleteExpense(expenseToDelete);
    if (result.success) {
      showSuccess("Expense deleted successfully");
      loadExpenses(currentPage); // Reload to update the list
    } else {
      showError(result.message || "Failed to delete expense");
    }
    setShowConfirmDeleteModal(false);
    setExpenseToDelete(null);
  };

  const handleApproveExpense = async (expenseId: string) => {
    const result = await approveExpense(expenseId);
    if (result.success) {
      showSuccess("Expense approved successfully");
      loadExpenses(currentPage); // Reload to update status
    } else {
      showError(result.message || "Failed to approve expense");
    }
  };

  const handleRejectExpense = async (expenseId: string) => {
    const result = await rejectExpense(expenseId);
    if (result.success) {
      showSuccess("Expense rejected");
      loadExpenses(currentPage); // Reload to update status
    } else {
      showError(result.message || "Failed to reject expense");
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsUpdateModalOpen(true);
  };

  const handleViewAttachments = (expense: Expense) => {
    setAttachmentViewerExpense(expense);
    setShowAttachmentViewer(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string; icon: React.ReactNode }
    > = {
      pending: {
        label: "Pending",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        icon: <AlertCircle className="h-4 w-4" />,
      },
      approved: {
        label: "Approved",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      rejected: {
        label: "Rejected",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        icon: <XCircle className="h-4 w-4" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Server already handles pagination, just apply frontend filters if needed
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.details &&
        expense.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || expense.status === statusFilter;

    const expenseDate = new Date(expense.created_at);
    const expenseMonth = expenseDate.getMonth();
    const expenseYear = expenseDate.getFullYear();
    const expenseDay = expenseDate.getDate();

    const matchesMonth =
      selectedMonth === "all" || expenseMonth === parseInt(selectedMonth);
    const matchesYear =
      selectedYear === "all" || expenseYear === parseInt(selectedYear);
    const matchesDay =
      selectedDay === "all" || expenseDay === parseInt(selectedDay);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMonth &&
      matchesYear &&
      matchesDay
    );
  });

  // Use server-side pagination - expenses are already paginated from server
  const paginatedExpenses = filteredExpenses;
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    selectedMemberId,
    selectedMonth,
    selectedYear,
    selectedDay,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMemberDropdown(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setShowMonthDropdown(false);
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setShowYearDropdown(false);
      }
      if (
        dayDropdownRef.current &&
        !dayDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDayDropdown(false);
      }
    };

    if (
      showMemberDropdown ||
      showStatusDropdown ||
      showMonthDropdown ||
      showYearDropdown ||
      showDayDropdown
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showMemberDropdown,
    showStatusDropdown,
    showMonthDropdown,
    showYearDropdown,
    showDayDropdown,
  ]);

  const filteredMembers = members.filter(
    (member) =>
      member.user_id !== currentUser?.id &&
      member.auth_fullname.fullname
        .toLowerCase()
        .includes(memberSearchTerm.toLowerCase())
  );

  const getSelectedMemberName = () => {
    if (selectedMemberId === "") return "All Members";
    if (selectedMemberId === currentUser?.id) return "My Expenses";
    const member = members.find((m) => m.user_id === selectedMemberId);
    return member?.auth_fullname.fullname || "Unknown Member";
  };

  const totalExpenses = filteredExpenses.length;
  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const pendingExpenses = filteredExpenses.filter(
    (e) => e.status === "pending"
  ).length;
  const approvedExpenses = filteredExpenses.filter(
    (e) => e.status === "approved"
  ).length;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Expenses
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {total} {total === 1 ? "expense" : "expenses"} total
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {totalExpenses}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mt-1">
                  {pendingExpenses}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Approved
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-200 mt-1">
                  {approvedExpenses}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Member Filter (Admin Only) */}
              {isCurrentUserAdmin && (
                <div className="relative" ref={memberDropdownRef}>
                  <button
                    onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    className="flex items-center justify-between w-full sm:w-64 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getSelectedMemberName()}
                      </span>
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </button>

                  {showMemberDropdown && (
                    <div className="absolute top-full mt-2 w-full sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto flex-1">
                        <button
                          onClick={() => {
                            setSelectedMemberId("");
                            setShowMemberDropdown(false);
                            setMemberSearchTerm("");
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                All Members
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                View all expenses
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMemberId(currentUser?.id || "");
                            setShowMemberDropdown(false);
                            setMemberSearchTerm("");
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-white">
                                Me
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                My Expenses
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                View your expenses
                              </p>
                            </div>
                          </div>
                        </button>
                        {filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => {
                              setSelectedMemberId(member.user_id);
                              setShowMemberDropdown(false);
                              setMemberSearchTerm("");
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={
                                  member.auth_fullname.dp ||
                                  "https://cdn.subspace.money/whatsub_images/user-3711850-3105265+1.png"
                                }
                                alt={member.auth_fullname.fullname}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {member.auth_fullname.fullname}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {member.auth_fullname.email}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Filter */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center justify-between w-full sm:w-48 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {statusFilter === "all"
                        ? "All Status"
                        : statusFilter.charAt(0).toUpperCase() +
                          statusFilter.slice(1)}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                    {["all", "pending", "approved", "rejected"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status as typeof statusFilter);
                            setShowStatusDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {status === "all"
                              ? "All Status"
                              : status.charAt(0).toUpperCase() +
                                status.slice(1)}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Month Filter */}
              <div className="relative" ref={monthDropdownRef}>
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center justify-between w-full sm:w-48 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedMonth === "all"
                        ? "All Months"
                        : new Date(
                            2024,
                            parseInt(selectedMonth),
                            1
                          ).toLocaleDateString("en-US", { month: "long" })}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>

                {showMonthDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedMonth("all");
                        setShowMonthDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        All Months
                      </span>
                    </button>
                    {Array.from({ length: 12 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedMonth(i.toString());
                          setShowMonthDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(2024, i, 1).toLocaleDateString("en-US", {
                            month: "long",
                          })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Filter */}
              <div className="relative" ref={yearDropdownRef}>
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center justify-between w-full sm:w-48 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedYear === "all" ? "All Years" : selectedYear}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>

                {showYearDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedYear("all");
                        setShowYearDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        All Years
                      </span>
                    </button>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year.toString());
                            setShowYearDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {year}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Day Filter */}
              <div className="relative" ref={dayDropdownRef}>
                <button
                  onClick={() => setShowDayDropdown(!showDayDropdown)}
                  className="flex items-center justify-between w-full sm:w-48 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedDay === "all"
                        ? "All Days"
                        : `Day ${selectedDay}`}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>

                {showDayDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedDay("all");
                        setShowDayDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        All Days
                      </span>
                    </button>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDay(day.toString());
                          setShowDayDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Day {day}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Loading expenses...
                  </p>
                </div>
              </div>
            ) : paginatedExpenses.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No expenses found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Get started by adding your first expense"}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Your First Expense</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Attachments
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedExpenses.map((expense: Expense) => (
                          <tr
                            key={expense.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {expense.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                {expense.details || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(expense.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {getStatusBadge(expense.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {expense.attachments &&
                                expense.attachments.length > 0 ? (
                                  <button
                                    onClick={() =>
                                      handleViewAttachments(expense)
                                    }
                                    className="flex items-center space-x-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors duration-200"
                                  >
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                      {expense.attachments.length}{" "}
                                      {expense.attachments.length === 1
                                        ? "file"
                                        : "files"}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    -
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(expense.created_at)}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {isCurrentUserAdmin &&
                                  expense.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleApproveExpense(expense.id)
                                        }
                                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                                        title="Approve"
                                      >
                                        <CheckCircle className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleRejectExpense(expense.id)
                                        }
                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                        title="Reject"
                                      >
                                        <XCircle className="h-5 w-5" />
                                      </button>
                                    </>
                                  )}
                                {expense.user_id === currentUser?.id &&
                                  expense.status === "pending" && (
                                    <button
                                      onClick={() => handleEditExpense(expense)}
                                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                                      title="Edit"
                                    >
                                      <Edit className="h-5 w-5" />
                                    </button>
                                  )}
                                {(expense.user_id === currentUser?.id ||
                                  isCurrentUserAdmin) && (
                                  <button
                                    onClick={() =>
                                      handleDeleteExpense(expense.id)
                                    }
                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1 || isLoading}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages || isLoading}
                        className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setCurrentPage(1);
          loadExpenses(1); // Reload to show the new expense
        }}
        selectedMemberId={selectedMemberId}
      />

      <UpdateExpenseModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={() => {
          loadExpenses(currentPage); // Reload to show the updated expense
        }}
        expense={selectedExpense}
      />

      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => {
          setShowConfirmDeleteModal(false);
          setExpenseToDelete(null);
        }}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      <AttachmentViewerModal
        isOpen={showAttachmentViewer}
        onClose={() => {
          setShowAttachmentViewer(false);
          setAttachmentViewerExpense(null);
        }}
        attachments={attachmentViewerExpense?.attachments || []}
        expenseName={attachmentViewerExpense?.name || ""}
      />
    </div>
  );
};

export default Expenses;
