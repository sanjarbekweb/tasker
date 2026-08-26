import React from "react";
import { Tabs, router } from "expo-router";
import { useUIStore, AppTab } from "../../stores/ui-store";
import { BottomTabBar } from "../../components/navigation/bottom-tab-bar";
import { THEME_COLORS } from "../../constants/theme";

export default function TabLayout() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const openQuickAddModal = useUIStore((s) => s.openQuickAddModal);

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab === "tasks") {
      router.replace("/(tabs)" as any);
    } else {
      router.replace(`/(tabs)/${tab}` as any);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={() => (
        <BottomTabBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onQuickAddPress={openQuickAddModal}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Tasks" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="focus" options={{ title: "Focus" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
