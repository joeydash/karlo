import React from "react";
import { X, Download, ExternalLink } from "lucide-react";

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: string[];
  expenseName: string;
  // initial index to open viewer at
  initialIndex?: number;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  attachments,
  expenseName,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState<number>(initialIndex);
  const thumbnailRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  React.useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex ?? 0);
  }, [isOpen, initialIndex]);

  // Scroll active thumbnail into view when currentIndex changes
  React.useEffect(() => {
    const btn = thumbnailRefs.current[currentIndex];
    if (btn && typeof btn.scrollIntoView === "function") {
      try {
        (btn as Element).scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        } as ScrollIntoViewOptions);
      } catch {
        // ignore
      }
    }
  }, [currentIndex]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      // cleanup after a short delay to ensure the download has been initiated
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch {
          /* ignore */
        }
        try {
          window.URL.revokeObjectURL(downloadUrl);
        } catch {
          /* ignore */
        }
      }, 1500);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const getFileName = (url: string) => {
    try {
      return decodeURIComponent(
        url.split("/").pop()?.split("?")[0] || "attachment"
      );
    } catch {
      return "attachment";
    }
  };
  const prev = React.useCallback(() => {
    if (!attachments || attachments.length === 0) return;
    setCurrentIndex((i) => (i - 1 + attachments.length) % attachments.length);
  }, [attachments]);

  const next = React.useCallback(() => {
    if (!attachments || attachments.length === 0) return;
    setCurrentIndex((i) => (i + 1) % attachments.length);
  }, [attachments]);

  const renderAttachment = (url: string) => {
    const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
    const isImage = /png|jpe?g|gif|webp|avif|svg/.test(ext);
    const isVideo = /mp4|webm|ogg/.test(ext);
    const isAudio = /mp3|wav|m4a|aac|oga/.test(ext);
    const isPdf = ext === "pdf";

    if (isImage) {
      return (
        <img
          src={url}
          alt={getFileName(url)}
          className="w-auto h-auto max-w-[900px] max-h-[70vh] object-contain rounded-lg shadow-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      );
    }

    if (isPdf) {
      // Render PDFs page-by-page using pdfjs (dynamically loaded). This component
      // will create canvases for pages and lazily render them when scrolled into view.
      const PdfViewer: React.FC<{ url: string }> = ({ url }) => {
        const containerRef = React.useRef<HTMLDivElement | null>(null);
        const [numPages, setNumPages] = React.useState<number>(0);
        const pdfRef = React.useRef<any>(null);

        React.useEffect(() => {
          let cancelled = false;
          (async () => {
            try {
              const pdfjs = await import("pdfjs-dist/legacy/build/pdf");
              // Use a CDN worker; if your build provides a worker, replace this.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (pdfjs as any).GlobalWorkerOptions.workerSrc =
                "https://unpkg.com/pdfjs-dist@3.10.111/build/pdf.worker.min.js";
              const loadingTask = (pdfjs as any).getDocument(url);
              const pdf = await loadingTask.promise;
              if (cancelled) return;
              pdfRef.current = pdf;
              setNumPages(pdf.numPages || 0);
            } catch (err) {
              console.error("Failed to load PDF:", err);
            }
          })();

          return () => {
            cancelled = true;
            if (pdfRef.current && pdfRef.current.destroy) {
              try {
                pdfRef.current.destroy();
              } catch {
                /* ignore */
              }
            }
          };
        }, [url]);

        React.useEffect(() => {
          const container = containerRef.current;
          if (!container) return;

          const canvases = Array.from(
            container.querySelectorAll("canvas[data-page]")
          ) as HTMLCanvasElement[];
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  const canvas = entry.target as HTMLCanvasElement;
                  const pageNum = Number(canvas.getAttribute("data-page"));
                  renderPage(pageNum, canvas).catch((e) => {
                    /* ignore */
                  });
                }
              });
            },
            { root: container, rootMargin: "200px 0px" }
          );

          canvases.forEach((c) => observer.observe(c));

          return () => observer.disconnect();
        }, [numPages]);

        const renderPage = async (
          pageNum: number,
          canvas: HTMLCanvasElement
        ) => {
          const pdf = pdfRef.current;
          if (!pdf) return;
          // if already rendered, skip
          if (canvas.getAttribute("data-rendered") === "1") return;
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1 });
            const container = containerRef.current;
            const maxWidth = Math.min(container?.clientWidth || 900, 900);
            const scale = Math.min(1.5, maxWidth / viewport.width);
            const vp = page.getViewport({ scale });
            canvas.width = Math.round(vp.width);
            canvas.height = Math.round(vp.height);
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const renderContext = { canvasContext: ctx, viewport: vp } as any;
            await page.render(renderContext).promise;
            canvas.setAttribute("data-rendered", "1");
          } catch (err) {
            console.error("Error rendering PDF page:", err);
          }
        };

        return (
          <div
            ref={containerRef}
            className="w-full max-w-[900px] h-[70vh] overflow-y-auto rounded-lg border bg-white dark:bg-gray-800 p-4"
          >
            {numPages === 0 && (
              <div className="text-center text-sm text-gray-500">
                Loading PDF...
              </div>
            )}
            {Array.from({ length: numPages }).map((_, i) => (
              <div key={i} className="mb-6 flex justify-center">
                <canvas
                  data-page={i + 1}
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
                />
              </div>
            ))}
          </div>
        );
      };

      return <PdfViewer url={url} />;
    }

    if (isVideo) {
      return (
        <video
          controls
          src={url}
          className="w-auto h-auto max-w-[900px] max-h-[70vh] rounded-lg"
        />
      );
    }

    if (isAudio) {
      return <audio controls src={url} className="w-full max-w-[900px]" />;
    }

    // Fallback for other file types
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h10v10H7z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {getFileName(url)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Preview not available
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => window.open(url, "_blank")}
            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Open
          </button>
          <button
            onClick={() => handleDownload(url, getFileName(url))}
            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            Download
          </button>
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, prev, next, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                Attachments - {expenseName}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {attachments.length}{" "}
                {attachments.length === 1 ? "file" : "files"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        {/* Content - focused viewer with prev/next controls */}
        <div className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col items-center justify-center">
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Prev button */}
            <button
              onClick={() => prev()}
              aria-label="Previous"
              title="Previous"
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 shadow-md z-20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="sr-only">Previous</span>
            </button>

            {/* Next button */}
            <button
              onClick={() => next()}
              aria-label="Next"
              title="Next"
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 shadow-md z-20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="sr-only">Next</span>
            </button>

            <div className="max-w-full max-h-[60vh] sm:max-h-[70vh] w-full flex items-center justify-center">
              {renderAttachment(attachments[currentIndex])}
            </div>
          </div>

          {/* (Caption and actions moved into footer) */}
        </div>

        {/* Footer: caption above thumbnails, thumbnails, and action buttons */}
        <div className="w-full border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="px-3 sm:px-6 py-2 flex items-start justify-between">
            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
              {getFileName(attachments[currentIndex])}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
              {currentIndex + 1} of {attachments.length}
            </p>
          </div>

          {/* Thumbnails carousel */}
          <div className="w-full flex overflow-x-auto justify-between py-2 sm:py-3 px-3 sm:px-6 mb-2 gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              {attachments.map((url, idx) => {
                const ext =
                  url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
                const isImage = /png|jpe?g|gif|webp|avif|svg/.test(ext);
                return (
                  <button
                    key={url + idx}
                    ref={(el) => (thumbnailRefs.current[idx] = el)}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Open attachment ${idx + 1}`}
                    className={`h-12 w-16 sm:h-16 sm:w-24 flex-shrink-0 rounded-md overflow-hidden border transition-shadow duration-150 focus:outline-none ${
                      idx === currentIndex
                        ? "ring-2 ring-blue-500 border-transparent"
                        : "border-gray-200 bg-white dark:bg-gray-800"
                    }`}
                  >
                    {isImage ? (
                      <img
                        src={url}
                        alt={getFileName(url)}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-[10px] sm:text-xs text-gray-700 dark:text-gray-200">
                        <span className="uppercase">{ext || "FILE"}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                onClick={() => window.open(attachments[currentIndex], "_blank")}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap"
              >
                Open
              </button>
              <button
                onClick={() =>
                  handleDownload(
                    attachments[currentIndex],
                    getFileName(attachments[currentIndex])
                  )
                }
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 inline-flex items-center space-x-1 sm:space-x-2 whitespace-nowrap"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">DL</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewerModal;
