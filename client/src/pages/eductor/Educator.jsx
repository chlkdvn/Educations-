import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/educator/Navbar';
import Sidebar from '../../components/educator/Sidebar';
import Footer from '../../components/educator/Footer';

const Educator = () => (
  <div className='min-h-screen bg-gray-50 flex flex-col'>
    <Navbar />
    <div className='flex flex-1'>
      <Sidebar />
      <main className='flex-1 lg:ml-64 pt-16 min-h-[calc(100vh-64px)] flex flex-col'>
        <div className='flex-1 p-4 md:p-6 lg:p-8'><Outlet /></div>
        <Footer />
      </main>
    </div>
  </div>
);

export default Educator;