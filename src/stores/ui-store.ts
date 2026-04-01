import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  notificationPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;
}

/**
 * Global UI store — sidebar, notification panel, and other layout state.
 * Sidebar state is persisted to localStorage (survives refresh).
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      notificationPanelOpen: false,

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleNotificationPanel: () =>
        set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),

      closeNotificationPanel: () => set({ notificationPanelOpen: false }),
    }),
    {
      name: "ims-ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
