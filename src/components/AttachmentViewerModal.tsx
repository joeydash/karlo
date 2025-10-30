import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: string[];
  expenseName: string;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  attachments,
  expenseName,
}) => {
  if (!isOpen) return null;

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getFileName = (url: string) => {
    try {
      return decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'attachment');
    } catch {
      return 'attachment';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Attachments - {expenseName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((url, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600"
              >
                <div className="aspect-video relative group">
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE2QzE0IDE3LjEgMTMuMSAxOCA5LjkgMTlIMTQuMUMxNS4xIDE5IDE2IDE4LjEgMTYgMTdWNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTggN0g4VjEwSDhWN1oiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTggMTJIOFYxNUg4VjEyWiIgZmlsbD0iIzlDQTQ5RiIvPgo8L3N2Zz4=';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg transition-all duration-200"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-900" />
                      </button>
                      <button
                        onClick={() => handleDownload(url, getFileName(url))}
                        className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg transition-all duration-200"
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-gray-900" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getFileName(url)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Attachment {index + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewerModal;
