import React from 'react';
import { Award, X, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Certificate } from '../types/certificate';

interface CertificateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
}

const CertificateDetailsModal: React.FC<CertificateDetailsModalProps> = ({ isOpen, onClose, certificate }) => {
  const { user } = useAuth();
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const certificateRef = React.useRef<HTMLDivElement>(null);

  if (!isOpen || !certificate) return null;

  // Calculate font size based on name length
  const getNameFontSize = (name: string): number => {
    const length = name.length;
    if (length <= 20) return 50;
    if (length <= 30) return 42;
    if (length <= 40) return 36;
    if (length <= 50) return 32;
    return 28;
  };

  const fullName = certificate.auth_fullname?.fullname || 'Certificate Holder';
  const nameFontSize = getNameFontSize(fullName);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (fromDate: string, toDate: string) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths > 0) {
        return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
      }
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  };

  const generatePDF = async () => {
    if (!certificateRef.current) return;

    setIsGeneratingPDF(true);

    try {
      // Dynamic import to reduce bundle size
      const [jsPDF, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      const canvas = await html2canvas.default(certificateRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      // Create PDF in landscape mode with dimensions matching the certificate
      const pdf = new jsPDF.default('l', 'mm', 'a4');

      const pdfWidth = 297; // A4 landscape width in mm
      const pdfHeight = 210; // A4 landscape height in mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate scaling to fit perfectly
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

      if (imgHeight > pdfHeight) {
        // Scale down to fit
        const scaleFactor = pdfHeight / imgHeight;
        finalWidth = imgWidth * scaleFactor;
        finalHeight = pdfHeight;
      }

      // Center the certificate
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Generate filename
      const orgName = certificate.org_name.replace(/\s+/g, '_');
      const userName = (certificate.auth_fullname?.fullname || 'Certificate').replace(/\s+/g, '_');
      const filename = `Certificate_${orgName}_${userName}_${new Date().toISOString().split('T')[0]}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[98vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Certificate Preview</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Download professional certificate</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Certificate Content */}
        <div className="p-2 sm:p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <div
              ref={certificateRef}
              className="bg-white mx-auto"
              style={{
                width: '1050px',
                height: '750px',
                position: 'relative',
                fontFamily: 'Georgia, serif',
                padding: '60px 80px',
                minWidth: '1050px'
              }}
          >
            {/* Elegant Border */}
            <div
              style={{
                position: 'absolute',
                inset: '30px',
                border: '3px solid #d4af37',
                borderRadius: '4px'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '8px',
                  border: '1px solid #d4af37'
                }}
              />
            </div>

            {/* Certificate Content */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
              {/* Award Icon */}
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #d4af37 0%, #f4e4a3 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)'
              }}>
                <div style={{ width: '50px', height: '50px', color: '#fff' }}>
                  <Award style={{ width: '100%', height: '100%', strokeWidth: 2 }} />
                </div>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                marginBottom: '10px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontFamily: 'Georgia, serif'
              }}>
                Certificate of Excellence
              </h1>

              <div style={{
                width: '200px',
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                margin: '20px auto 40px'
              }} />

              {/* Subtitle */}
              <p style={{
                fontSize: '20px',
                color: '#666',
                marginBottom: '20px',
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif'
              }}>
                This certificate is proudly presented to
              </p>

              {/* Recipient Name */}
              <h2 style={{
                fontSize: `${nameFontSize}px`,
                fontWeight: 'bold',
                color: '#d4af37',
                marginBottom: '20px',
                fontFamily: 'Georgia, serif',
                letterSpacing: '1px',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '800px',
                margin: '0 auto 15px',
                lineHeight: '1.2'
              }}>
                {fullName}
              </h2>

              <div style={{
                width: '400px',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
                margin: '15px auto 35px'
              }} />
              

              {/* Body Text */}
              <p style={{
                fontSize: '18px',
                color: '#333',
                lineHeight: '1.8',
                maxWidth: '700px',
                margin: '0 auto 30px',
                fontFamily: 'Georgia, serif'
              }}>
                For successfully completing the role of <strong style={{ color: '#d4af37' }}>{certificate.designation || 'Associate'}</strong>
                <br />
                at <strong style={{ color: '#d4af37' }}>{certificate.org_name}</strong>
              </p>

              {/* Duration Info and Signature Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                paddingTop: '10px',
              }}>
                <div style={{ textAlign: 'left' }}>
                  
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '5px'
                  }}>
                    {certificate.org_name}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Issuing Organization
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: '15px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    <strong>Period:</strong> {formatDate(certificate.from_date)} - {formatDate(certificate.to_date)}
                  </p>
                  <p style={{ fontSize: '13px', color: '#999' }}>
                    Duration: {calculateDuration(certificate.from_date, certificate.to_date)}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: '5px'
                  }}>
                    {formatDate(certificate.created_at)}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Date Issued
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetailsModal;
