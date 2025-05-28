'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isSidebarOpen: false,
  toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

const SIDEBAR_STATE_KEY = 'sidebar-state';

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (savedState !== null) {
      setIsSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(newState));
  };

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
} 