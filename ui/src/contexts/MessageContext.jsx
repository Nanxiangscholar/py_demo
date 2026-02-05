import { createContext, useContext } from "react";
import { App } from "antd";

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const { message, modal, notification } = App.useApp();

  return (
    <MessageContext.Provider value={{ message, modal, notification }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within MessageProvider");
  }
  return context;
}
