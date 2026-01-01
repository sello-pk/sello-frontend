import { createContext, useContext, useState } from "react";

const SupportChatContext = createContext();

export const useSupportChat = () => {
  const context = useContext(SupportChatContext);
  if (!context) {
    throw new Error("useSupportChat must be used within SupportChatProvider");
  }
  return context;
};

export const SupportChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const openSupportChat = (chatId = null) => {
    setIsOpen(true);
    if (chatId) {
      setSelectedChat(chatId);
      setShowCreateForm(false);
    } else {
      setShowCreateForm(true);
      setSelectedChat(null);
    }
  };

  const closeSupportChat = () => {
    setIsOpen(false);
    setSelectedChat(null);
    setShowCreateForm(false);
  };

  return (
    <SupportChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        selectedChat,
        setSelectedChat,
        showCreateForm,
        setShowCreateForm,
        openSupportChat,
        closeSupportChat,
      }}
    >
      {children}
    </SupportChatContext.Provider>
  );
};
