import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import ChatBot from './ChatBot';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="pb-12">
        <Outlet />
      </main>
      <ChatBot />
    </div>
  );
};

export default AppLayout;