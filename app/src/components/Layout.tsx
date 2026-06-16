import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import {
  getAdminNotificationUnreadCount,
  getAdminNotifications,
  markAdminNotificationRead,
  type AdminNotification,
} from "@/lib/adminApi";
import Sidebar from "./Sidebar";
import ParticleOverlay from "./ParticleOverlay";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("founder_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem(
      "founder_sidebar_collapsed",
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        setIsNotificationsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadNotifications() {
      try {
        setNotificationsLoading(true);

        const [items, count] = await Promise.all([
          getAdminNotifications(),
          getAdminNotificationUnreadCount(),
        ]);

        if (!alive) return;

        setNotifications(items);
        setUnreadCount(count.unread_count);
      } catch (error) {
        console.error("Failed to load admin notifications", error);
      } finally {
        if (alive) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();

    const intervalId = window.setInterval(loadNotifications, 30000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const desktopLayoutClass = isSidebarCollapsed
    ? "lg:ml-[84px] lg:w-[calc(100%-84px)]"
    : "lg:ml-[240px] lg:w-[calc(100%-240px)]";

  async function handleNotificationClick(notification: AdminNotification) {
    try {
      if (!notification.is_read) {
        await markAdminNotificationRead(notification.id);

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      if (notification.link === "/support") {
        window.location.href = "/admin/support";
      }

      setIsNotificationsOpen(false);
    } catch (error) {
      console.error("Failed to mark admin notification as read", error);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0F" }}>
      <button
        type="button"
        className="fixed left-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          color: "#F0EDE6",
        }}
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed && !isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <ParticleOverlay />

      <main
        className={`relative min-h-screen w-full transition-all duration-300 ${desktopLayoutClass}`}
        style={{ background: "#0A0A0F" }}
      >
        <div className="absolute right-5 top-5 z-30">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all hover:scale-105"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#F0EDE6",
                boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
                backdropFilter: "blur(16px)",
              }}
              aria-label="Notifications"
            >
              <Bell size={18} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/40">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20"
                  onClick={() => setIsNotificationsOpen(false)}
                  aria-label="Close notifications"
                />

                <div
                  className="absolute right-0 top-14 z-30 w-80 overflow-hidden rounded-2xl"
                  style={{
                    background: "rgba(14, 14, 22, 0.98)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-sm font-semibold text-[#F0EDE6]">
                      Notifications
                    </p>
                    <p className="mt-1 text-xs text-[#A6A29A]">
                      {notificationsLoading
                        ? "Loading..."
                        : `${unreadCount} unread`}
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-white/10">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[#A6A29A]">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                        >
                          <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                            style={{
                              background: notification.is_read
                                ? "#6B7280"
                                : "#EF4444",
                              boxShadow: notification.is_read
                                ? "none"
                                : "0 0 8px rgba(239,68,68,0.8)",
                            }}
                          />

                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-[#F0EDE6]">
                              {notification.title}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-[#A6A29A]">
                              {notification.message}
                            </span>
                            <span className="mt-1 block text-[11px] text-[#6B7280]">
                              {notification.is_read ? "Read" : "Unread"}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
