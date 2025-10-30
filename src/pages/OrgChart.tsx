import React, { useEffect, useState, useMemo, useRef } from 'react';
import Tree from 'react-d3-tree';
import { useNavigate } from 'react-router-dom';
import { Network, ZoomIn, ZoomOut, Users, AlertCircle, Loader2, UserX, Briefcase, UserCheck, ChevronDown, ChevronUp, ArrowLeft, Maximize } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../contexts/ToastContext';
import useMemberStore from '../stores/memberStore';
import { buildOrgTrees, convertToD3TreeFormat, OrgChartNode, optimizeTreeLayout } from '../utils/orgChart';
import OrgChartNodeComponent from '../components/OrgChartNode';
import MemberDetailsModal from '../components/MemberDetailsModal';
import SelectMentorModal from '../components/SelectMentorModal';
import SideNavigation from '../components/SideNavigation';

const OrgChart: React.FC = () => {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const { showSuccess, showError } = useToast();
  const { members, fetchMembers, isLoading } = useMemberStore();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.6);
  const [isUnassignedCollapsed, setIsUnassignedCollapsed] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [memberToAssignMentor, setMemberToAssignMentor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchMembers(currentOrganization.id);
    }
  }, [currentOrganization?.id]);

  const { orgTreeData, unassignedMembers } = useMemo(() => {
    if (members.length === 0) {
      return { orgTreeData: null, unassignedMembers: [] };
    }

    const { founders, unassigned } = buildOrgTrees(members);

    // Convert founder nodes to D3 tree format
    const founderTrees = founders.map(convertToD3TreeFormat);

    // Always create organization as root with hierarchies as children
    const orgTreeData: OrgChartNode = {
      name: currentOrganization?.name || 'Organization',
      attributes: { 
        isOrganization: true,
        memberCount: members.length,
        hierarchyCount: founderTrees.length
      },
      children: founderTrees.length > 0 ? founderTrees : undefined
    };

    // Optimize the tree layout for large organizations
    const optimizedTree = optimizeTreeLayout(orgTreeData);

    return {
      orgTreeData: optimizedTree,
      unassignedMembers: unassigned
    };
  }, [members, currentOrganization]);

  useEffect(() => {
    if (containerRef.current && orgTreeData) {
      const dimensions = containerRef.current.getBoundingClientRect();
      setTranslate({
        x: dimensions.width / 2,
        y: 100,
      });

      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        svgRef.current = svg;
      }
    }
  }, [orgTreeData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (containerRef.current && !svgRef.current) {
        const svg = containerRef.current.querySelector('svg');
        if (svg) {
          svgRef.current = svg;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Function to calculate tree depth for optimization
  const calculateTreeDepth = (node: OrgChartNode): number => {
    if (!node.children || node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map(calculateTreeDepth));
  };

  // Function to calculate tree width for optimization
  const calculateTreeWidth = (node: OrgChartNode): number => {
    if (!node.children || node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + calculateTreeWidth(child), 0);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedMemberId(nodeId);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleFitToScreen = () => {
    if (containerRef.current && orgTreeData && svgRef.current) {
      try {
        const svgElement = svgRef.current;
        const gElement = svgElement.querySelector('g');

        if (gElement) {
          const bbox = gElement.getBBox();
          const containerDimensions = containerRef.current.getBoundingClientRect();

          const padding = 50;
          const scaleX = (containerDimensions.width - padding * 2) / bbox.width;
          const scaleY = (containerDimensions.height - padding * 2) / bbox.height;
          const newZoom = Math.min(scaleX, scaleY, 1);

          const centerX = containerDimensions.width / 2;
          const centerY = containerDimensions.height / 2;

          setZoom(newZoom);
          setTranslate({
            x: centerX - (bbox.x + bbox.width / 2) * newZoom,
            y: centerY - (bbox.y + bbox.height / 2) * newZoom,
          });
        }
      } catch (error) {
        const dimensions = containerRef.current.getBoundingClientRect();
        setTranslate({
          x: dimensions.width / 2,
          y: 100,
        });
        setZoom(0.6);
      }
    }
  };


  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const selectedMemberMentor = selectedMember?.mentor_id
    ? members.find(m => m.id === selectedMember.mentor_id)
    : null;

  const handleAssignMentor = (memberId: string) => {
    setMemberToAssignMentor(memberId);
    setSelectedMemberId(null);
    setIsMentorModalOpen(true);
  };

  const handleMentorModalClose = () => {
    setIsMentorModalOpen(false);
    setMemberToAssignMentor(null);
  };

  const handleMentorSelect = async (mentorId: string) => {
    if (memberToAssignMentor) {
      const { updateMemberMentor } = useMemberStore.getState();
      const result = await updateMemberMentor(memberToAssignMentor, mentorId);

      if (result.success) {
        const member = members.find(m => m.id === memberToAssignMentor);
        const mentor = members.find(m => m.id === mentorId);
        showSuccess('Mentor assigned', `${mentor?.auth_fullname.fullname || 'Mentor'} has been assigned to ${member?.auth_fullname.fullname || 'member'}`);
      } else {
        showError('Assignment failed', result.message || 'Failed to assign mentor');
      }

      handleMentorModalClose();
      if (currentOrganization?.id) {
        fetchMembers(currentOrganization.id);
      }
    }
  };

  const handleRemoveMentor = async (memberId: string) => {
    const { updateMemberMentor } = useMemberStore.getState();
    const member = members.find(m => m.id === memberId);

    const result = await updateMemberMentor(memberId, undefined);

    if (result.success) {
      showSuccess('Mentor removed', `Mentor has been removed from ${member?.auth_fullname.fullname || 'member'}`);
    } else {
      showError('Removal failed', result.message || 'Failed to remove mentor');
    }

    setSelectedMemberId(null);
    if (currentOrganization?.id) {
      fetchMembers(currentOrganization.id);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Please select an organization</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideNavigation />
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <button
                onClick={() => navigate('/members')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Network className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Organization Chart</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">
                  {currentOrganization.name} - {members.length} members
                  {orgTreeData?.children && orgTreeData.children.length > 1 && ` - ${orgTreeData.children.length} hierarchies`}
                  {unassignedMembers.length > 0 && ` - ${unassignedMembers.length} unassigned`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                onClick={handleZoomOut}
                className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={handleFitToScreen}
                className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hidden sm:inline-flex"
                title="Fit to Screen"
              >
                <Maximize className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Hierarchy Trees Content */}
          {orgTreeData && (
            <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading organization chart...</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full">
                  <div className="relative w-full h-full">
                    <Tree
                      data={orgTreeData}
                      translate={translate}
                      zoom={zoom}
                      onUpdate={(state) => {
                        if (state.zoom !== zoom) {
                          setZoom(state.zoom);
                        }
                        if (state.translate.x !== translate.x || state.translate.y !== translate.y) {
                          setTranslate(state.translate);
                        }
                      }}
                      svgClassName="org-chart-svg"
                      rootNodeClassName="org-chart-root"
                      orientation="vertical"
                      pathFunc="step"
                      separation={{ siblings: 1.2, nonSiblings: 1.5 }}
                      nodeSize={{ x: 300, y: 160 }}
                      renderCustomNodeElement={(rd3tProps) => (
                        <OrgChartNodeComponent
                          nodeDatum={rd3tProps.nodeDatum as any}
                          toggleNode={rd3tProps.toggleNode}
                          onNodeClick={handleNodeClick}
                        />
                      )}
                      pathClassFunc={() => 'org-chart-link'}
                      enableLegacyTransitions={true}
                      transitionDuration={300}
                      scaleExtent={{ min: 0.1, max: 3 }}
                      zoomable={true}
                      collapsible={false} // Keep all nodes expanded for export
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unassigned Members Section */}
          {unassignedMembers.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <button
                onClick={() => setIsUnassignedCollapsed(!isUnassignedCollapsed)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    Unassigned Members ({unassignedMembers.length})
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                    - No mentor assigned or mentor not found
                  </span>
                </div>
                {isUnassignedCollapsed ? (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {!isUnassignedCollapsed && (
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex flex-wrap gap-2">
                    {unassignedMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className="flex items-center space-x-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">
                            {getInitials(member.auth_fullname.fullname)}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.auth_fullname.fullname}
                          </p>
                          {member.designation && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {member.designation}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedMember && (
        <MemberDetailsModal
          isOpen={!!selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
          member={selectedMember}
          mentorInfo={selectedMemberMentor}
          onAssignMentor={handleAssignMentor}
          onRemoveMentor={handleRemoveMentor}
        />
      )}

      {memberToAssignMentor && (
        <SelectMentorModal
          isOpen={isMentorModalOpen}
          onClose={handleMentorModalClose}
          onSelect={handleMentorSelect}
          members={members}
          currentMemberId={memberToAssignMentor}
        />
      )}

      <style>{`
        .org-chart-link {
          stroke: #3b82f6;
          stroke-width: 2;
          fill: none;
        }

        .dark .org-chart-link {
          stroke: #60a5fa;
        }

        .rd3t-tree {
          min-width: 100%;
          min-height: 100%;
        }

        /* Ensure foreignObject content renders properly */
        foreignObject {
          overflow: visible !important;
        }

        foreignObject > div {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
    </div>
    </>
  );
};

export default OrgChart;