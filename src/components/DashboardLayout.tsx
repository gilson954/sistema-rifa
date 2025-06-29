import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 max-w-screen-lg mx-auto py-6 px-4">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;