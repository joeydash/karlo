import React from 'react';
import { User, Briefcase, Calendar, Building2, Users } from 'lucide-react';

interface OrgChartNodeProps {
  nodeDatum: {
    name: string;
    attributes?: {
      designation?: string;
      role?: string;
      joining_date?: string;
      id?: string;
      isOrganization?: boolean;
      memberCount?: number;
      hierarchyCount?: number;
    };
  };
  toggleNode: () => void;
  onNodeClick: (nodeId: string) => void;
}

const OrgChartNode: React.FC<OrgChartNodeProps> = ({ nodeDatum, toggleNode, onNodeClick }) => {
  const isOrganization = nodeDatum.attributes?.isOrganization || false;

  const handleClick = () => {
    if (nodeDatum.attributes?.id && !isOrganization) {
      onNodeClick(nodeDatum.attributes.id);
    }
  };

  return (
    <g>
      <foreignObject
        width={isOrganization ? "320" : "280"}
        height={isOrganization ? "160" : "140"}
        x={isOrganization ? -160 : -140}
        y={isOrganization ? -80 : -70}
        className="overflow-visible"
      >
        <div className="flex items-center justify-center h-full">
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
              isOrganization ? 'cursor-default' : 'cursor-pointer'
            } border-2 ${
              isOrganization 
                ? 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600' 
                : 'border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500'
            } w-full`}
            onClick={handleClick}
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-10 h-10 bg-gradient-to-br ${
                  isOrganization ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-purple-600'
                } ${
                  isOrganization ? 'rounded-xl' : 'rounded-full'
                } flex items-center justify-center flex-shrink-0`}>
                  {isOrganization ? (
                    <Building2 className="h-5 w-5 text-white" />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm text-gray-900 dark:text-white truncate ${
                    isOrganization ? 'text-base' : ''
                  }`}>
                    {nodeDatum.name}
                  </h3>
                  {nodeDatum.attributes?.role && !isOrganization && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 inline-block">
                      {nodeDatum.attributes.role}
                    </span>
                  )}
                  {isOrganization && (
                    <div className="flex items-center space-x-4 mt-1">
                      {nodeDatum.attributes?.memberCount && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {nodeDatum.attributes.memberCount} members
                        </span>
                      )}
                      {nodeDatum.attributes?.hierarchyCount && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {nodeDatum.attributes.hierarchyCount} hierarchies
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {nodeDatum.attributes?.designation && !isOrganization && (
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <Briefcase className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{nodeDatum.attributes.designation}</span>
                </div>
              )}

              {nodeDatum.attributes?.joining_date && !isOrganization && (
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span>Joined {nodeDatum.attributes.joining_date}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

export default OrgChartNode;