import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
    hideBottomTabBar: boolean;
    setHideBottomTabBar: (hide: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModalContext must be used within a ModalProvider');
    }
    return context;
};

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
    const [hideBottomTabBar, setHideBottomTabBar] = useState(false);

    return (
        <ModalContext.Provider value={{ hideBottomTabBar, setHideBottomTabBar }}>
            {children}
        </ModalContext.Provider>
    );
};
