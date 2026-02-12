import { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);

    const showToast = (msg, subMsg, icon) => {
        setNotification({ msg, subMsg, icon });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <UIContext.Provider value={{ notification, showToast }}>
            {children}
        </UIContext.Provider>
    );
};
