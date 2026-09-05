import React, { createContext, useCallback, useContext, useState } from "react";

type NotificationType = "success" | "error";
type Notification = {
  id: number;
  message: string;
  type: NotificationType;
};

const NotificationContext = createContext<{
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
} | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Notification[]>([]);

  const remove = useCallback((id: number) => {
    setList((current) => current.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (message: string, type: NotificationType = "success", duration = 3500) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setList((current) => [...current, { id, message, type }]);
      window.setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col items-end gap-3">
        {list.map((n) => (
          <div
            key={n.id}
            role="status"
            className={`max-w-md w-full rounded-lg border px-4 py-3 text-sm shadow-md transition-opacity duration-200 ` +
              (n.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200")}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx.showNotification;
}

export default NotificationProvider;
