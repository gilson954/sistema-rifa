import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col md:flex-row transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-gray-900 dark:text-white custom-scrollbar">
          <div className="w-full max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;