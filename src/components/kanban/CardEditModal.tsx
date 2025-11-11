import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Palette,
  Check,
  Archive,
  Loader2,
  AlertCircle,
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  Image,
  Video,
  Music,
  Archive as ArchiveIcon,
  Type,
  Maximize2,
  Minimize2,
  Users,
  Plus,
  Hash,
  Flag,
  Tag,
} from "lucide-react";
import { KanbanCard } from "../../types/kanban";
import { useKanban } from "../../hooks/useKanban";
import { useToast } from "../../contexts/ToastContext";
import { useTag } from "../../hooks/useTag";
import ConfirmationModal from "../ConfirmationModal";
import AttachmentViewerModal from "../AttachmentViewerModal";
import CardMemberModal from "./CardMemberModal";
import CardTagModal from "./CardTagModal";
import CommentSection from "../CommentSection";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Embed from "@editorjs/embed";
import Paragraph from "@editorjs/paragraph";
import Quote from "@editorjs/quote";
import Table from "@editorjs/table";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";
import Delimiter from "@editorjs/delimiter";
import Warning from "@editorjs/warning";
import Raw from "@editorjs/raw";
import Code from "@editorjs/code";
import Underline from "@editorjs/underline";
import TextVariantTune from "@editorjs/text-variant-tune";

interface CardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  card: KanbanCard;
}

const CardEditModal: React.FC<CardEditModalProps> = ({
  isOpen,
  onClose,
  cardId,
}) => {
  const {
    lists,
    updateCard,
    uploadFile,
    deleteAttachment,
    removeCardMember,
    syncCardTags,
  } = useKanban();
  const { showSuccess, showError } = useToast();
  const { tags } = useTag();

  // Get current user from auth store to check role
  const authStore = (window as any).__authStore;
  const isAdmin = authStore?.user?.role === "admin";

  const card =
    lists
      .flatMap((list) => list.karlo_cards)
      .find((card) => card.id === cardId) || null;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    is_completed: false,
    is_archived: false,
    cover_color: "",
    story_points: "",
    priority: null as string | null,
  });
  const [originalData, setOriginalData] = useState({
    title: "",
    description: "",
    due_date: "",
    is_completed: false,
    is_archived: false,
    cover_color: "",
    story_points: "",
    priority: null as string | null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showExpandedEditor, setShowExpandedEditor] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [originalTagIds, setOriginalTagIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const expandedEditorRef = useRef<EditorJS | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const expandedEditorContainerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const expandedEditorInitializedRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const expandedObserverRef = useRef<MutationObserver | null>(null);
  const colorScrollRef = useRef<HTMLDivElement>(null);

  // Attachment viewer state
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [attachmentViewerIndex, setAttachmentViewerIndex] = useState(0);

  const openAttachmentViewer = (index: number) => {
    setAttachmentViewerIndex(index);
    setIsAttachmentViewerOpen(true);
  };

  const closeAttachmentViewer = () => setIsAttachmentViewerOpen(false);

  const coverColors = [
    "",
    "#EF4444",
    "#DC2626",
    "#B91C1C",
    "#991B1B",
    "#F97316",
    "#EA580C",
    "#C2410C",
    "#9A3412",
    "#F59E0B",
    "#D97706",
    "#B45309",
    "#92400E",
    "#EAB308",
    "#CA8A04",
    "#A16207",
    "#854D0E",
    "#84CC16",
    "#65A30D",
    "#4D7C0F",
    "#3F6212",
    "#22C55E",
    "#16A34A",
    "#15803D",
    "#166534",
    "#10B981",
    "#059669",
    "#047857",
    "#065F46",
    "#14B8A6",
    "#0D9488",
    "#0F766E",
    "#115E59",
    "#06B6D4",
    "#0891B2",
    "#0E7490",
    "#155E75",
    "#0EA5E9",
    "#0284C7",
    "#0369A1",
    "#075985",
    "#3B82F6",
    "#2563EB",
    "#1D4ED8",
    "#1E40AF",
    "#6366F1",
    "#4F46E5",
    "#4338CA",
    "#3730A3",
    "#8B5CF6",
    "#7C3AED",
    "#6D28D9",
    "#5B21B6",
    "#A855F7",
    "#9333EA",
    "#7E22CE",
    "#6B21A8",
    "#D946EF",
    "#C026D3",
    "#A21CAF",
    "#86198F",
    "#EC4899",
    "#DB2777",
    "#BE185D",
    "#9D174D",
    "#F43F5E",
    "#E11D48",
    "#BE123C",
    "#9F1239",
  ];

  // Initialize form data and Editor.js sequentially
  useEffect(() => {
    if (card && isOpen) {
      isInitializedRef.current = false;

      // Initialize selected tags from card
      const cardTagIds = card.karlo_card_tags?.map((ct) => ct.tag_id) || [];
      setSelectedTagIds(cardTagIds);
      setOriginalTagIds(cardTagIds);

      // Step 1: Set form data
      const initialData = {
        title: card.title || "",
        description: card.description || "",
        due_date: card.due_date
          ? new Date(card.due_date).toISOString().slice(0, 16)
          : "",
        is_completed: card.is_completed || false,
        is_archived: card.is_archived || false,
        cover_color: card.cover_color || "",
        story_points: card.story_points?.toString() || "",
        priority: card.priority || null,
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setErrors({});

      // Step 2: Initialize Editor.js after form data is set
      if (editorContainerRef.current && !editorRef.current) {
        console.log("🔧 Initializing Editor.js");
        // Inside the useEffect hook, replace the EditorJS initialization with this
        editorRef.current = new EditorJS({
          holder: editorContainerRef.current,
          tools: {
            header: Header,
            list: List,
            embed: Embed,
            paragraph: {
              class: Paragraph,
              inlineToolbar: true,
            },
            quote: Quote,
            table: Table,
            marker: Marker,
            inlineCode: InlineCode,
            delimiter: Delimiter,
            warning: Warning,
            raw: Raw,
            code: Code,
            underline: Underline,
            textVariant: TextVariantTune,
          },
          placeholder: "Add a detailed description...",
          data: createEditorData(initialData.description),
          onReady: () => {
            console.log("✅ Editor.js ready");
            isInitializedRef.current = true;

            // Style the toolbar
            const toolbar =
              editorContainerRef.current?.querySelector(".ce-toolbar");
            if (toolbar) {
              const htmlToolbar = toolbar as HTMLElement;
              htmlToolbar.style.position = "absolute";
              htmlToolbar.style.top = "-50px";
              htmlToolbar.style.left = "0";
              htmlToolbar.style.zIndex = "1000";
            }

            // Fix z-index for popovers without moving them
            observerRef.current = new MutationObserver(() => {
              const popovers =
                editorContainerRef.current?.querySelectorAll(".ce-popover");
              popovers?.forEach((popover) => {
                const htmlPopover = popover as HTMLElement;
                if (!htmlPopover.hasAttribute("data-styled")) {
                  htmlPopover.setAttribute("data-styled", "true");
                  htmlPopover.style.zIndex = "10000";
                }
              });
            });

            if (editorContainerRef.current) {
              observerRef.current.observe(editorContainerRef.current, {
                childList: true,
                subtree: true,
              });
            }
          },
          onChange: async () => {
            if (!isInitializedRef.current) {
              console.log("⏭️ Ignoring Editor.js change during initialization");
              return;
            }
            console.log("📝 Editor.js content changed");
            try {
              if (editorRef.current) {
                const outputData = await editorRef.current.save();
                handleFormChange("description", JSON.stringify(outputData));
              }
            } catch (error) {
              console.error("Error saving editor data:", error);
            }
          },
          minHeight: 300,
          logLevel: "ERROR" as any,
        });
      }
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (editorRef.current) {
        try {
          if (typeof editorRef.current.destroy === "function") {
            editorRef.current.destroy();
          }
          editorRef.current = null;
        } catch (error) {
          console.error("Error destroying Editor.js:", error);
        }
      }
      isInitializedRef.current = false;
    };
  }, [card, isOpen]);

  // Initialize expanded editor when it opens
  useEffect(() => {
    if (
      showExpandedEditor &&
      expandedEditorContainerRef.current &&
      !expandedEditorRef.current
    ) {
      console.log("🔧 Initializing Expanded Editor.js");

      // Get current content from main editor
      const initialContent = createEditorData(formData.description);

      expandedEditorRef.current = new EditorJS({
        holder: expandedEditorContainerRef.current,
        tools: {
          header: Header,
          list: List,
          embed: Embed,
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
          quote: Quote,
          table: Table,
          marker: Marker,
          inlineCode: InlineCode,
          delimiter: Delimiter,
          warning: Warning,
          raw: Raw,
          code: Code,
          underline: Underline,
          textVariant: TextVariantTune,
        },
        inlineToolbar: true,
        placeholder: "Add a detailed description...",
        data: initialContent,
        toolbox: {
          class: "editorjs-toolbox",
        },
        onReady: () => {
          console.log("✅ Expanded Editor.js ready");
          expandedEditorInitializedRef.current = true;

          // Style the toolbar
          const toolbar =
            expandedEditorContainerRef.current?.querySelector(".ce-toolbar");
          if (toolbar) {
            const htmlToolbar = toolbar as HTMLElement;
            htmlToolbar.style.position = "absolute";
            htmlToolbar.style.top = "-50px";
            htmlToolbar.style.left = "0";
            htmlToolbar.style.zIndex = "1000";
          }

          // Fix z-index for popovers without moving them
          expandedObserverRef.current = new MutationObserver(() => {
            const popovers =
              expandedEditorContainerRef.current?.querySelectorAll(
                ".ce-popover"
              );
            popovers?.forEach((popover) => {
              const htmlPopover = popover as HTMLElement;
              if (!htmlPopover.hasAttribute("data-styled-expanded")) {
                htmlPopover.setAttribute("data-styled-expanded", "true");
                htmlPopover.style.zIndex = "10000";
              }
            });
          });

          if (expandedEditorContainerRef.current) {
            expandedObserverRef.current.observe(
              expandedEditorContainerRef.current,
              {
                childList: true,
                subtree: true,
              }
            );
          }
        },
        onChange: async () => {
          if (!expandedEditorInitializedRef.current) {
            console.log(
              "⏭️ Ignoring Expanded Editor.js change during initialization"
            );
            return;
          }
          console.log("📝 Expanded Editor.js content changed");
          // Don't auto-save from expanded editor - we'll save when collapsing
        },
        minHeight: 200,
        logLevel: "ERROR" as any,
        i18n: {
          direction: "ltr",
        },
      });
    }

    // Cleanup expanded editor
    return () => {
      if (!showExpandedEditor && expandedEditorRef.current) {
        console.log("🧹 Cleaning up Expanded Editor.js");
        if (expandedObserverRef.current) {
          expandedObserverRef.current.disconnect();
          expandedObserverRef.current = null;
        }
        try {
          if (typeof expandedEditorRef.current.destroy === "function") {
            expandedEditorRef.current.destroy();
          }
          expandedEditorRef.current = null;
        } catch (error) {
          console.error("Error destroying Expanded Editor.js:", error);
        }
        expandedEditorInitializedRef.current = false;
      }
    };
  }, [showExpandedEditor, formData.description]);

  // Handle expanding description editor
  const handleExpandDescription = () => {
    setShowExpandedEditor(true);
  };

  // Handle collapsing description editor and syncing changes
  const handleCollapseDescription = async () => {
    if (expandedEditorRef.current && expandedEditorInitializedRef.current) {
      try {
        console.log("💾 Saving expanded editor content before collapse");
        const outputData = await expandedEditorRef.current.save();
        const newDescription = JSON.stringify(outputData);

        // Update form data
        setFormData((prev) => ({ ...prev, description: newDescription }));

        // Update main editor with new content
        if (editorRef.current && isInitializedRef.current) {
          await editorRef.current.render(outputData);
        }

        console.log("✅ Description synced from expanded editor");
      } catch (error) {
        console.error("Error saving expanded editor content:", error);
      }
    }

    setShowExpandedEditor(false);
  };

  // Handle Escape key for expanded editor
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showExpandedEditor) {
        e.preventDefault();
        handleCollapseDescription();
      }
    };

    if (showExpandedEditor) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [showExpandedEditor]);

  // Handle wheel events for color scroll to prevent card scrolling
  useEffect(() => {
    if (!colorScrollRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      // Check if the event target is inside our color scroll container
      if (colorScrollRef.current?.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Handle the scroll ourselves
        if (colorScrollRef.current) {
          colorScrollRef.current.scrollLeft += e.deltaY * 2;
        }
        return false;
      }
    };

    // Use capture phase to catch the event early
    document.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      document.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);

  // Handle browser back button to close modal instead of navigating
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleMobileSaveAndClose();
      // Push state back so we don't navigate
      window.history.pushState(null, "", window.location.href);
    };

    // Push a new state when modal opens
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

  // Handle outside click for expanded editor
  const handleExpandedEditorOutsideClick = async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log("🖱️ Outside click detected on expanded editor");
      await handleCollapseDescription();
    }
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    if (!isInitializedRef.current) {
      console.log("⏭️ Ignoring form change during initialization:", field);
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Handle tag selection (without saving)
  const handleToggleTag = (tagId: string) => {
    const newSelectedTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];

    setSelectedTagIds(newSelectedTagIds);
  };

  // Check for changes
  const hasUnsavedChanges =
    JSON.stringify(formData) !== JSON.stringify(originalData);

  const hasTagChanges =
    JSON.stringify(selectedTagIds.sort()) !==
    JSON.stringify(originalTagIds.sort());

  // Save tags if they have changed
  const saveTags = async () => {
    if (!hasTagChanges || !card) {
      return true;
    }

    console.log("💾 Saving tags...");
    const result = await syncCardTags(card.id, selectedTagIds);

    if (result.success) {
      setOriginalTagIds(selectedTagIds);
      showSuccess("Tags saved", "Card tags have been updated successfully");
      return true;
    } else {
      showError("Save failed", result.message || "Failed to save tags");
      return false;
    }
  };

  // Auto-save function
  const autoSave = async () => {
    console.log("💾 Auto-save triggered");
    if (!isInitializedRef.current) {
      console.log("⏭️ Skipping auto-save during initialization");
      return true;
    }

    setIsSaving(true);

    if (!card) {
      setIsSaving(false);
      return true;
    }

    if (!formData.title.trim()) {
      setErrors({ title: "Card title is required" });
      setIsSaving(false);
      return false;
    }

    if (!hasUnsavedChanges) {
      setIsSaving(false);
      return true;
    }

    const updateData: Partial<KanbanCard> = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      due_date: formData.due_date
        ? new Date(formData.due_date).toISOString()
        : null,
      is_completed: formData.is_completed,
      is_archived: formData.is_archived,
      cover_color: formData.cover_color || null,
      story_points: formData.story_points
        ? parseInt(formData.story_points)
        : null,
      priority:
        (formData.priority as "urgent" | "high" | "normal" | "low" | null) ||
        null,
    };

    const result = await updateCard(card.id, updateData);

    setIsSaving(false);

    if (result.success) {
      setOriginalData(formData);
      return true;
    } else {
      showError("Save failed", result.message || "Failed to save changes");
      setErrors({ title: result.message || "Failed to update card" });
      return false;
    }
  };

  // Handle outside click
  const handleOutsideClick = async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log("🖱️ Outside click detected");
      if (hasUnsavedChanges || hasTagChanges) {
        console.log("💾 Auto-saving before close...");
        const saved = await autoSave();
        const tagsSaved = await saveTags();
        if (saved && tagsSaved) {
          console.log("✅ Auto-save successful, closing modal");
          onClose();
        } else {
          console.log("❌ Auto-save failed, keeping modal open");
        }
      } else {
        console.log("✅ No changes, closing modal");
        onClose();
      }
    }
  };

  // Handle mobile save and close
  const handleMobileSaveAndClose = async () => {
    if (hasUnsavedChanges || hasTagChanges) {
      const saved = await autoSave();
      const tagsSaved = await saveTags();
      if (saved && tagsSaved) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen || !card) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Card title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced fallback function for EditorJS data
  const createEditorData = (description: string) => {
    if (!description || !description.trim()) {
      return undefined;
    }

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(description);
      // Validate that it's a proper EditorJS structure
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.blocks &&
        Array.isArray(parsed.blocks)
      ) {
        return parsed;
      }
      // If it's JSON but not EditorJS format, treat as plain text
      throw new Error("Not EditorJS format");
    } catch (error) {
      // If parsing fails or it's not EditorJS format, treat as plain text
      console.log(
        "Converting plain text to EditorJS format:",
        description.slice(0, 50) + "..."
      );

      // Handle HTML entities and special characters
      const cleanText = description
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      return {
        time: Date.now(),
        blocks: [
          {
            type: "paragraph",
            data: {
              text: cleanText.trim(),
            },
          },
        ],
        version: "2.28.2",
      };
    }
  };
  const handleClose = async () => {
    console.log("🚪 Close button clicked");
    if (hasUnsavedChanges || hasTagChanges) {
      console.log("💾 Auto-saving before close...");
      await autoSave();
      await saveTags();
    }
    setErrors({});
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log(file);

    e.target.value = "";
    setIsUploading(true);

    try {
      const result = await uploadFile(file, card!.id);
      console.log(result);
      if (!result.success) {
        showError("Upload failed", result.message || "Failed to upload file");
      } else {
        showSuccess(
          "File Uploaded",
          `"${result.attachment.original_filename}" has been added to the card`
        );
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showError("Upload failed", "An unexpected error occurred");
    }

    setIsUploading(false);
  };

  const handleDeleteAttachment = async (
    attachmentId: string,
    filename: string
  ) => {
    setAttachmentToDelete({ id: attachmentId, filename });
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    setIsDeletingAttachment(true);

    try {
      const result = await deleteAttachment(attachmentToDelete.id);
      if (result.success) {
        showSuccess(
          "File deleted",
          `"${attachmentToDelete.filename}" has been removed from the card`
        );
        setShowDeleteConfirmation(false);
        setAttachmentToDelete(null);
      } else {
        showError(
          "Delete failed",
          result.message || "Failed to delete attachment"
        );
      }
    } catch (error) {
      showError("Delete failed", "An unexpected error occurred");
    } finally {
      setIsDeletingAttachment(false);
    }
  };

  const cancelDeleteAttachment = () => {
    setShowDeleteConfirmation(false);
    setAttachmentToDelete(null);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType === "application/pdf") return FileText;
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar")
    )
      return ArchiveIcon;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return FileText;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return FileText;
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return FileText;
    return File;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith("image/"))
      return "bg-gradient-to-br from-green-500 to-emerald-600";
    if (mimeType.startsWith("video/"))
      return "bg-gradient-to-br from-purple-500 to-violet-600";
    if (mimeType.startsWith("audio/"))
      return "bg-gradient-to-br from-pink-500 to-rose-600";
    if (mimeType === "application/pdf")
      return "bg-gradient-to-br from-red-500 to-red-600";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar")
    )
      return "bg-gradient-to-br from-orange-500 to-amber-600";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "bg-gradient-to-br from-blue-500 to-blue-600";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "bg-gradient-to-br from-green-500 to-green-600";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "bg-gradient-to-br from-orange-500 to-orange-600";
    return "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("video/")) return "Video";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType === "application/pdf") return "PDF";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar")
    )
      return "Archive";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "Document";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "Spreadsheet";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "Presentation";
    return "File";
  };

  const getFileTypeBadgeColor = (mimeType: string) => {
    if (mimeType.startsWith("image/"))
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (mimeType.startsWith("video/"))
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    if (mimeType.startsWith("audio/"))
      return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
    if (mimeType === "application/pdf")
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar")
    )
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const isVideoFile = (mimeType: string) => {
    return mimeType.startsWith("video/");
  };

  const isPdfFile = (mimeType: string) => {
    return mimeType === "application/pdf";
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setRemovingMemberId(memberId);

    const result = await removeCardMember(memberId);

    if (result.success) {
      showSuccess(
        "Member removed",
        `${memberName} has been removed from this card`
      );
    } else {
      showError(
        "Remove failed",
        result.message || "Failed to remove member from card"
      );
    }

    setRemovingMemberId(null);
  };

  const handleToggleComplete = () => {
    handleFormChange("is_completed", !formData.is_completed);
  };

  const renderTagBadges = () => {
    const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

    if (selectedTags.length === 0) {
      // Show + icon when no tags assigned
      return (
        <button
          onClick={() => setShowTagModal(true)}
          className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:bg-gray-300 dark:focus:bg-gray-500 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Add tags to this card"
          title="Add tags to this card"
        >
          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      );
    }

    return (
      <div className="flex items-center flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <div
            key={tag.id}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800 relative"
          >
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
              title={`Remove ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowTagModal(true)}
          className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 focus:bg-blue-200 dark:focus:bg-blue-900/50 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Manage card tags"
          title="Manage card tags"
        >
          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    );
  };

  const renderMemberAvatars = () => {
    const totalMembers =
      card?.karlo_card_members_aggregate?.aggregate?.count || 0;
    const visibleMembers = card?.karlo_card_members || [];
    const remainingCount = totalMembers - visibleMembers.length;

    if (totalMembers === 0) {
      // Show + icon when no members assigned
      return (
        <button
          onClick={() => setShowMemberModal(true)}
          className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:bg-gray-300 dark:focus:bg-gray-500 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Add members to this card"
          title="Add members to this card"
        >
          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center -space-x-1">
          {visibleMembers.map((member, index) => (
            <div
              key={member.authFullnameByUserId.id}
              className="relative group"
              style={{ zIndex: visibleMembers.length - index }}
              title={member.authFullnameByUserId.fullname}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                <span className="text-xs font-medium text-white">
                  {getInitials(member.authFullnameByUserId.fullname)}
                </span>
              </div>

              {/* Cross icon to remove member - appears on hover */}
              <button
                onClick={() =>
                  handleRemoveMember(
                    member.id,
                    member.authFullnameByUserId.fullname
                  )
                }
                disabled={removingMemberId === member.id}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 shadow-sm"
                title={`Remove ${member.authFullnameByUserId.fullname} from card`}
              >
                {removingMemberId === member.id ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <X className="h-2.5 w-2.5" />
                )}
              </button>
            </div>
          ))}

          {remainingCount > 0 && (
            <div
              className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
              title={`+${remainingCount} more members`}
            >
              <span className="text-xs font-medium text-white">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowMemberModal(true)}
          className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 focus:bg-blue-200 dark:focus:bg-blue-900/50 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Manage card members"
          title="Manage card members"
        >
          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOutsideClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {formData.cover_color && (
          <div
            className="h-6 rounded-t-3xl"
            style={{ backgroundColor: formData.cover_color }}
          />
        )}

        <div className="flex-1 overflow-y-auto card-edit-scroll pr-4 pl-5 py-6 pb-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Card Title *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleToggleComplete}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      formData.is_completed
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 focus:ring-green-500"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500"
                    }`}
                    title={
                      formData.is_completed
                        ? "Mark as incomplete"
                        : "Mark as complete"
                    }
                  >
                    <Check
                      className={`h-3.5 w-3.5 ${
                        formData.is_completed ? "" : "opacity-50"
                      }`}
                    />
                    <span>{formData.is_completed ? "Done" : "Mark Done"}</span>
                  </button>
                  {/* Mobile Close Button */}
                  <button
                    onClick={handleMobileSaveAndClose}
                    disabled={isSaving}
                    className="sm:hidden  z-20 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    aria-label="Close modal"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 text-gray-600 dark:text-gray-400 animate-spin" />
                    ) : (
                      <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => {
                  handleFormChange("title", e.target.value);
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  errors.title
                    ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="Enter card title..."
              />
              {errors.title && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.title}
                </div>
              )}

              {/* Created By Info */}
              {card?.auth_fullname && (
                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <span className="mr-2">Created by:</span>
                  <div className="flex items-center space-x-2">
                    {card.auth_fullname.dp ? (
                      <img
                        src={card.auth_fullname.dp}
                        alt={card.auth_fullname.fullname}
                        className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-medium text-white">
                          {getInitials(card.auth_fullname.fullname)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {card.auth_fullname.fullname}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Type className="h-4 w-4 inline mr-1" />
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleExpandDescription}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 border border-blue-200 dark:border-blue-800"
                  title="Open full-screen editor"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Full Editor</span>
                </button>
              </div>
              <div className="relative">
                <div className="editor-toolbox-container border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
                  <div
                    ref={editorContainerRef}
                    className="text-gray-900 dark:text-white prose dark:prose-invert word-break-break-word"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-start gap-5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Users className="h-4 w-4 inline mr-1" />
                Assignees{" "}
                {card?.karlo_card_members &&
                  card.karlo_card_members.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({card.karlo_card_members.length})
                    </span>
                  )}
              </label>
              {renderMemberAvatars()}
            </div>

            {/* Tags Section */}
            <div className="flex items-center justify-start gap-5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags{" "}
                {selectedTagIds.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({selectedTagIds.length})
                  </span>
                )}
              </label>
              {renderTagBadges()}
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-7 sm:items-center">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex-shrink-0">
                <Hash className="h-4 w-4 inline mr-1" />
                Story Points
              </label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide p-2">
                {[
                  { value: "", label: "None", special: true, days: 0 },
                  { value: "1", label: "1", days: 0 },
                  { value: "2", label: "2", days: 1 },
                  { value: "3", label: "3", days: 2 },
                  { value: "5", label: "5", days: 3 },
                  { value: "8", label: "8", days: 4 },
                  { value: "13", label: "13", days: 5 },
                  { value: "20", label: "20", days: 7 },
                  { value: "40", label: "40", days: 14 },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (!isAdmin) return;

                      handleFormChange("story_points", option.value);

                      // Auto-update due date based on story points
                      if (option.value !== "") {
                        const futureDate = new Date();
                        futureDate.setDate(futureDate.getDate() + option.days);
                        futureDate.setHours(23, 59, 0, 0);
                        const localDateTime = new Date(
                          futureDate.getTime() -
                            futureDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16);
                        handleFormChange("due_date", localDateTime);
                      } else {
                        // Clear due date when "None" is selected
                        handleFormChange("due_date", "");
                      }
                    }}
                    disabled={!isAdmin}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                      !isAdmin ? "cursor-not-allowed opacity-60" : ""
                    } ${
                      formData.story_points === option.value
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-300 dark:ring-purple-700"
                        : option.special
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:bg-gradient-to-br dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700"
                    }`}
                    title={
                      !isAdmin
                        ? "Only admins can edit story points"
                        : option.value && option.days > 0
                        ? `Due in ${option.days} day${
                            option.days > 1 ? "s" : ""
                          }`
                        : undefined
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:gap-7 sm:items-center">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex-shrink-0">
                <Flag className="h-4 w-4 inline mr-1" />
                Priority
              </label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide p-2">
                {[
                  { value: null, label: "None" },
                  { value: "low", label: "Low" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ].map((option) => (
                  <button
                    key={option.value || "none"}
                    type="button"
                    onClick={() => handleFormChange("priority", option.value)}
                    className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      formData.priority === option.value
                        ? option.value === "urgent"
                          ? "bg-red-500 text-white shadow-md scale-105 ring-2 ring-red-300 dark:ring-red-700"
                          : option.value === "high"
                          ? "bg-orange-500 text-white shadow-md scale-105 ring-2 ring-orange-300 dark:ring-orange-700"
                          : option.value === "normal"
                          ? "bg-blue-500 text-white shadow-md scale-105 ring-2 ring-blue-300 dark:ring-blue-700"
                          : option.value === "low"
                          ? "bg-gray-500 text-white shadow-md scale-105 ring-2 ring-gray-300 dark:ring-gray-700"
                          : "bg-gray-400 text-white shadow-md scale-105 ring-2 ring-gray-300 dark:ring-gray-700"
                        : option.value === "urgent"
                        ? "bg-white dark:bg-gray-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-2 border-red-500 dark:border-red-500"
                        : option.value === "high"
                        ? "bg-white dark:bg-gray-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-2 border-orange-500 dark:border-orange-500"
                        : option.value === "normal"
                        ? "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-500"
                        : option.value === "low"
                        ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 border-2 border-gray-500 dark:border-gray-500"
                        : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 border-2 border-gray-400 dark:border-gray-500"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="due_date"
                className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Due Date
                </div>
                {formData.due_date && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, due_date: "" }))
                    }
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-2 py-1 rounded-md transition-all duration-200"
                  >
                    Clear
                  </button>
                )}
              </label>
              <input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, due_date: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                style={{
                  colorScheme: document.documentElement.classList.contains(
                    "dark"
                  )
                    ? "dark"
                    : "light",
                }}
              />
              {formData.due_date && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Due: {formatDate(formData.due_date)}
                </p>
              )}

              <div className="mt-3">
                <div className="flex gap-2 p-2 min-w-0 overflow-x-auto scrollbar-hide sm:justify-between">
                  {(() => {
                    // Calculate days difference between now and due date
                    const getDaysDifference = () => {
                      if (!formData.due_date) return null;
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const dueDate = new Date(formData.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      const diffTime = dueDate.getTime() - now.getTime();
                      const diffDays = Math.round(
                        diffTime / (1000 * 60 * 60 * 24)
                      );
                      return diffDays;
                    };

                    const daysDiff = getDaysDifference();

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            today.setHours(23, 59, 0, 0);
                            const localDateTime = new Date(
                              today.getTime() -
                                today.getTimezoneOffset() * 60000
                            )
                              .toISOString()
                              .slice(0, 16);
                            handleFormChange("due_date", localDateTime);
                          }}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                            daysDiff === 0
                              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-2 border-blue-600 shadow-md scale-105"
                              : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          Today
                        </button>
                        {[
                          { label: "1 day", days: 1 },
                          { label: "2 days", days: 2 },
                          { label: "3 days", days: 3 },
                          { label: "4 days", days: 4 },
                          { label: "5 days", days: 5 },
                          { label: "1 week", days: 7 },
                          { label: "2 weeks", days: 14 },
                        ].map((option) => (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => {
                              const futureDate = new Date();
                              futureDate.setDate(
                                futureDate.getDate() + option.days
                              );
                              futureDate.setHours(23, 59, 0, 0);
                              const localDateTime = new Date(
                                futureDate.getTime() -
                                  futureDate.getTimezoneOffset() * 60000
                              )
                                .toISOString()
                                .slice(0, 16);
                              handleFormChange("due_date", localDateTime);
                            }}
                            className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                              daysDiff === option.days
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-2 border-blue-600 shadow-md scale-105"
                                : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Paperclip className="h-4 w-4 inline mr-1" />
                  Attachments{" "}
                  {card?.karlo_attachments &&
                    card.karlo_attachments.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({card.karlo_attachments.length})
                      </span>
                    )}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {card?.karlo_attachments && card.karlo_attachments.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {card.karlo_attachments.map((attachment, index) => {
                      const FileIcon = getFileIcon(attachment.mime_type);
                      const fileExtension =
                        attachment.original_filename
                          .split(".")
                          .pop()
                          ?.toUpperCase() || "";

                      return (
                        <div
                          key={attachment.id}
                          className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center p-4 space-x-4">
                            <div className="flex-shrink-0">
                              {isImageFile(attachment.mime_type) ? (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600">
                                  <img
                                    src={attachment.url}
                                    alt={attachment.original_filename}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => openAttachmentViewer(index)}
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                      const fallback =
                                        target.nextElementSibling as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }}
                                  />
                                  <div className="hidden w-full h-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <FileIcon className="h-6 w-6 text-blue-500" />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${getFileTypeColor(
                                    attachment.mime_type
                                  )}`}
                                >
                                  <FileIcon className="h-5 w-5 text-white mb-0.5" />
                                  <span className="text-xs font-bold text-white leading-none">
                                    {fileExtension.slice(0, 3)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => openAttachmentViewer(index)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                                    {attachment.original_filename}
                                  </h4>
                                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center space-x-1">
                                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                      <span>
                                        {formatFileSize(attachment.file_size)}
                                      </span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                      <span>
                                        {new Date(
                                          attachment.created_at
                                        ).toLocaleDateString()}
                                      </span>
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getFileTypeBadgeColor(
                                        attachment.mime_type
                                      )}`}
                                    >
                                      {getFileTypeLabel(attachment.mime_type)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 ml-3">
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 group"
                                    title="Download file"
                                  >
                                    <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleDeleteAttachment(
                                        attachment.id,
                                        attachment.original_filename
                                      )
                                    }
                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 group"
                                    title="Delete attachment"
                                  >
                                    <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Attachment viewer modal for card attachments */}
                  <AttachmentViewerModal
                    isOpen={isAttachmentViewerOpen}
                    onClose={closeAttachmentViewer}
                    attachments={(card.karlo_attachments || []).map(
                      (a) => a.url
                    )}
                    initialIndex={attachmentViewerIndex}
                    expenseName={card.title || "Card Attachments"}
                  />
                </>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                  <Paperclip className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No attachments yet
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:underline focus:outline-none"
                  >
                    Upload your first file
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <CommentSection cardId={cardId} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Palette className="h-4 w-4 inline mr-1" />
                Cover Color
              </label>
              <div className="relative overflow-hidden">
                <div
                  ref={colorScrollRef}
                  className="flex gap-3 p-2 min-w-0 overflow-x-auto scrollbar-hide hover:cursor-grab active:cursor-grabbing"
                  style={{
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {coverColors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, cover_color: color }))
                      }
                      className={`w-10 h-10 flex-shrink-0 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        formData.cover_color === color
                          ? "border-gray-400 dark:border-gray-500 scale-110"
                          : "border-gray-200 dark:border-gray-600 hover:scale-105"
                      } ${!color ? "bg-gray-100" : ""}`}
                      style={{ backgroundColor: color || undefined }}
                      title={!color ? "No color" : color}
                    >
                      {!color && (
                        <X className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(hasUnsavedChanges || hasTagChanges || isSaving) && (
              <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 bg-yellow-500 rounded-full ${
                      isSaving ? "animate-spin" : "animate-pulse"
                    }`}
                  ></div>
                  <span>
                    {isSaving
                      ? "Saving changes..."
                      : "Changes will be saved when you close the modal"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Description Editor Modal */}
      {showExpandedEditor && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]"
          onClick={handleExpandedEditorOutsideClick}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Close Button for Expanded Editor */}
            <button
              onClick={handleCollapseDescription}
              className="sm:hidden absolute top-3 right-3 z-20 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close expanded editor"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Expanded Editor Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <label
                htmlFor="expanded-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Card Title *
              </label>
              <input
                id="expanded-title"
                type="text"
                value={formData.title}
                onChange={(e) => {
                  handleFormChange("title", e.target.value);
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                  errors.title
                    ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400"
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xl font-semibold`}
                placeholder="Enter card title..."
              />
              {errors.title && (
                <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.title}
                </div>
              )}
            </div>

            {/* Expanded Editor Content */}
            <div className="flex-1 relative">
              <div
                ref={expandedEditorContainerRef}
                className="absolute m-3 rounded-lg inset-0 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white prose dark:prose-invert max-w-none expanded-editor-container overflow-visible word-break-break-word"
              />
            </div>

            {/* Expanded Editor Footer */}
            <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Full-screen editing mode</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                  <span>Press Escape or click outside to return</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={cancelDeleteAttachment}
        onConfirm={confirmDeleteAttachment}
        title="Delete Attachment"
        message={`Are you sure you want to delete "${attachmentToDelete?.filename}"? This action cannot be undone.`}
        confirmText="Delete File"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingAttachment}
      />

      <CardMemberModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        cardId={cardId}
        cardTitle={card?.title || ""}
      />

      <CardTagModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        cardTitle={card?.title || ""}
        selectedTagIds={selectedTagIds}
        onToggleTag={handleToggleTag}
      />
    </div>
  );
};

export default CardEditModal;
