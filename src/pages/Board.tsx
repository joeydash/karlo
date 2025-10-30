import React from 'react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import SideNavigation from '../components/SideNavigation';

const Board: React.FC = () => {
  return (
    <>
      <SideNavigation />
      <KanbanBoard />
    </>
  );
};

export default Board;