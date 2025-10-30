import React, { useState, useRef, useMemo } from 'react';
import { X, FileText, Download, Loader2, Mail, Phone, Calendar, User, IndianRupee, Building2, Users } from 'lucide-react';
import { Member } from '../types/member';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../hooks/useAuth';
import { useMember } from '../hooks/useMember';

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

const OfferLetterModal: React.FC<OfferLetterModalProps> = ({ isOpen, onClose, member }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { members } = useMember();
  const offerLetterRef = useRef<HTMLDivElement>(null);

  const mentorName = useMemo(() => {
    if (!member?.mentor_id) return null;
    const mentor = members.find(m => m.id === member.mentor_id);
    return mentor?.auth_fullname.fullname || null;
  }, [member?.mentor_id, members]);

  if (!isOpen || !member) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const generatePDF = async () => {
    if (!offerLetterRef.current) return;

    setIsGeneratingPDF(true);
    
    try {
      // Dynamic import to reduce bundle size
      const [jsPDF, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      const canvas = await html2canvas.default(offerLetterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF.default('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
     
     // Scale content to fit on single page if necessary
     let finalWidth = imgWidth;
     let finalHeight = imgHeight;
     
     if (imgHeight > pageHeight) {
       // Scale down to fit in single page
       const scaleFactor = pageHeight / imgHeight;
       finalWidth = imgWidth * scaleFactor;
       finalHeight = pageHeight;
     }
     
     // Center the content horizontally if scaled down
     const xOffset = (imgWidth - finalWidth) / 2;
     
     pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);

      // Generate filename
      const memberName = member.auth_fullname.fullname.replace(/\s+/g, '_');
      const filename = `Offer_Letter_${memberName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  const memberData = {
    fullname: member.auth_fullname.fullname,
    designation: member.designation || '[Designation]',
    email: user?.email || '[Email]',
    phone: user?.phone || '[Phone]',
    compensation: member.compensation || '[Compensation]',
    joining_date: formatDate(member.joining_date || member.created_at)
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Offer Letter</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{member.auth_fullname.fullname}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">PDF</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Save as PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg sm:rounded-xl transition-colors duration-200"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Offer Letter Content */}
        <div className="p-4 sm:p-6 md:p-8">
          <div
            ref={offerLetterRef}
            className="bg-white p-4 sm:p-6 md:p-8 max-w-3xl mx-auto"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.6',
              color: '#000'
            }}
          >
            {/* Header with Logo */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Offer of Employment</h1>
              <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto"></div>
            </div>

            {/* Letter Content */}
            <div className="space-y-4 sm:space-y-6 text-gray-800">
              <p className="text-base sm:text-lg">
                Dear <span className="font-semibold text-blue-600">{memberData.fullname}</span>,
              </p>

              <p className="text-sm sm:text-base">
                We are delighted to extend this offer of employment as a <span className="font-semibold">{memberData.designation}</span> at <span className="font-semibold">{currentOrganization?.display_name || 'Vocallabs'}</span>. Your skills and expertise will significantly contribute to our team and projects. Please review the terms and conditions of your employment below:
              </p>

              {/* Employment Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  Employment Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Position Title</p>
                      <p className="font-semibold text-sm sm:text-base truncate">{memberData.designation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-sm sm:text-base truncate">{memberData.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Phone Number</p>
                      <p className="font-semibold text-sm sm:text-base truncate">{memberData.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">CTC</p>
                      <p className="font-semibold text-sm sm:text-base truncate">{memberData.compensation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600">Started From</p>
                      <p className="font-semibold text-sm sm:text-base truncate">{memberData.joining_date}</p>
                    </div>
                  </div>

                  {mentorName && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Mentor</p>
                        <p className="font-semibold text-sm sm:text-base truncate">{mentorName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms of Employment */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Terms of Employment:</h3>
                <ul className="space-y-2 pl-3 sm:pl-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                    <span className="text-sm sm:text-base">You will begin your employment on <span className="font-semibold">{memberData.joining_date}</span>, and your initial employment period will be [Probationary Period, if applicable].</span>
                  </li>
                  {member.is_intern && (
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                      <span className="text-sm sm:text-base">You are being offered this position as an <span className="font-semibold text-blue-600">Intern</span> and will be on a probationary period. Based on your performance during this period, a Pre-Placement Offer (PPO) for a full-time position may be extended to you.</span>
                    </li>
                  )}
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                    <span className="text-sm sm:text-base">Your employment with {currentOrganization?.display_name || 'Vocallabs'} is "at-will," meaning that you or the company may terminate the employment relationship at any time, with or without cause or notice.</span>
                  </li>
                </ul>
              </div>

              {/* NDA Section */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">Non-Disclosure Agreement (NDA):</h3>
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-sm sm:text-base">
                    As a condition of your employment, you must adhere to our Non-Disclosure Agreement (NDA) incorporated herein by reference. The NDA outlines the confidentiality obligations you must follow while working with {currentOrganization?.display_name || 'Vocallabs'}. By accepting this offer, you acknowledge your understanding of and agreement to the terms and conditions of the NDA.
                  </p>
                  <p className="text-sm sm:text-base">
                    Please note that the NDA prohibits the unauthorized disclosure of any confidential information, trade secrets, or proprietary information belonging to the company, both during your employment and after its termination.
                  </p>
                </div>
              </div>

              {/* <p>
                If you have any questions or require further clarification regarding this offer, please do not hesitate to contact <span className="font-semibold">Subspace Official</span>.
              </p> */}

              {/* Signature */}
              <div className="mt-6 sm:mt-8">
                <p className="font-semibold text-sm sm:text-base">Regards,</p>
                <p className="font-bold text-base sm:text-lg text-blue-600">{currentOrganization?.display_name || 'Vocallabs'}</p>
              </div>

              {/* Footer Disclaimer */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-[10px] sm:text-xs text-gray-500 leading-relaxed">
                  This message and any attachments (the "message") are confidential, intended solely for the addressee, and may contain legally privileged information. Any unauthorized use or dissemination is prohibited. Websites are susceptible to alteration. {currentOrganization?.display_name || 'Vocallabs'} shall not be liable for the message if altered, changed, or falsified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferLetterModal;