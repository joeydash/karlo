import React, { useState, useEffect } from "react";
import { X, Clock, Save, Calendar } from "lucide-react";
import { useOOTOH } from "../hooks/useOOTOH";
import { useToast } from "../contexts/ToastContext";
import { OOTOH } from "../types/ootoh";

interface UpdateOOTOHModalProps {
  isOpen: boolean;
  onClose: () => void;
  ootoh: OOTOH | null;
}

const UpdateOOTOHModal: React.FC<UpdateOOTOHModalProps> = ({
  isOpen,
  onClose,
  ootoh,
}) => {
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateOOTOH, isLoading } = useOOTOH();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (ootoh && isOpen) {
      if (ootoh.end_time) {
        // Editing existing record with end time
        const endDateTime = new Date(ootoh.end_time);
        const hours = endDateTime.getHours().toString().padStart(2, "0");
        const minutes = endDateTime.getMinutes().toString().padStart(2, "0");
        setEndTime(`${hours}:${minutes}`);
        setEndDate(ootoh.end_date || "");
      } else {
        // Adding end time to new record
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        setEndTime(`${hours}:${minutes}`);
        setEndDate("");
      }
      setWorkDone(ootoh.work_done || "");
      setErrors({});
    }
  }, [ootoh, isOpen]);

  if (!isOpen || !ootoh) return null;

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!endTime) {
      newErrors.endTime = "Exit time is required";
      setErrors(newErrors);
      return false;
    }

    const effectiveEndDate = endDate || ootoh.start_date;
    const startDateTime = new Date(ootoh.start_time);
    const [hours, minutes] = endTime.split(":").map(Number);
    const endDateTime = new Date(effectiveEndDate);
    endDateTime.setHours(hours, minutes, 0, 0);

    if (endDateTime <= startDateTime) {
      newErrors.endTime = "Exit date/time must be after entry date/time";
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const effectiveEndDate = endDate || ootoh.start_date;
    const [hours, minutes] = endTime.split(":").map(Number);
    const endDateTime = new Date(effectiveEndDate);
    endDateTime.setHours(hours, minutes, 0, 0);
    const endTimeISO = endDateTime.toISOString();

    const result = await updateOOTOH(
      ootoh.id,
      endTimeISO,
      effectiveEndDate,
      workDone || null
    );

    if (result.success) {
      showSuccess(
        ootoh.end_time
          ? "OOTOH record updated successfully"
          : "Office exit time added successfully"
      );
      setEndTime("");
      setWorkDone("");
      setErrors({});
      onClose();
    } else {
      showError(result.message || "Failed to update OOTOH record");
      setErrors({ endTime: result.message || "Failed to update OOTOH record" });
    }
  };

  const handleClose = () => {
    setEndDate("");
    setEndTime("");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {ootoh?.end_time ? "Edit OOTOH Record" : "Add Exit Time"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                Record when you leave the office
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Entry Time:
              </span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatTime(ootoh.start_time)}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              End Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                min={ootoh.start_date}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:light] dark:[color-scheme:dark] ${
                  errors.endDate
                    ? "border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400"
                    : "border-gray-200 dark:border-gray-600 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500"
                }`}
              />
            </div>
            {errors.endDate && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.endDate}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Exit date (leave empty if same as start date:{" "}
              {formatDate(ootoh.start_date)})
            </p>
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Exit Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.endTime
                    ? "border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400"
                    : "border-gray-200 dark:border-gray-600 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500"
                }`}
                required
              />
            </div>
            {errors.endTime && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.endTime}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Enter the time you left the office
            </p>
          </div>

          <div>
            <label
              htmlFor="workDone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Work Done Today
            </label>
            <textarea
              id="workDone"
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              disabled={isLoading}
              rows={4}
              placeholder="Describe what you worked on today..."
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Brief description of tasks completed (optional)
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start">
              <span className="mr-1.5">ℹ️</span>
              <span>
                Once you update the exit time, this record will be marked as
                complete and can no longer be modified.
              </span>
            </p>
          </div>
        </form>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Update Exit Time</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateOOTOHModal;
