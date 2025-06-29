import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto p-6 text-gray-900 dark:text-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;