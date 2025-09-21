import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface RefreshContextType {
  registerRefreshCallback: (path: string, callback: () => void) => void;
  unregisterRefreshCallback: (path: string) => void;
  triggerRefresh: (path: string) => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

interface RefreshProviderProps {
  children: ReactNode;
}

export const RefreshProvider: React.FC<RefreshProviderProps> = ({ children }) => {
  const refreshCallbacks = useRef<Map<string, () => void>>(new Map());

  const registerRefreshCallback = (path: string, callback: () => void) => {
    refreshCallbacks.current.set(path, callback);
  };

  const unregisterRefreshCallback = (path: string) => {
    refreshCallbacks.current.delete(path);
  };

  const triggerRefresh = (path: string) => {
    const callback = refreshCallbacks.current.get(path);
    if (callback) {
      callback();
    }
  };

  return (
    <RefreshContext.Provider
      value={{
        registerRefreshCallback,
        unregisterRefreshCallback,
        triggerRefresh,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

// Hook để register refresh callback cho từng page
export const useRefreshCallback = (path: string, callback: () => void) => {
  const { registerRefreshCallback, unregisterRefreshCallback } = useRefresh();

  React.useEffect(() => {
    registerRefreshCallback(path, callback);
    return () => unregisterRefreshCallback(path);
  }, [path, callback, registerRefreshCallback, unregisterRefreshCallback]);
};
