'use client';

import { ReactNode } from 'react';
import { Box } from '@mui/material';
import Navbar from './navbar';
import Footer from './footer';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showNavbar?: boolean;
  showFooter?: boolean;
}

export default function Layout({ 
  children, 
  title = 'Resume Customizer Pro',
  showNavbar = true,
  showFooter = true 
}: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showNavbar && <Navbar title={title} />}
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      
      {showFooter && <Footer />}
    </Box>
  );
}
