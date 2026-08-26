import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "../components/ui/error-boundary";
import { ToastContainer } from "../components/ui/toast";
import { THEME_COLORS } from "../constants/theme";
import { StartupManager } from "../services/startup";
import { logger } from "../utils/logger";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await StartupManager.executeCriticalStartup();
        setIsReady(true);
      } catch (err) {
        logger.error("RootLayout", "Startup initialization failed", err);
        setIsReady(true); // Allow ErrorBoundary to catch or show fallback
      }
    }

    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLORS.light.textPrimary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ErrorBoundary isRoot fallbackTitle="Numo Error" fallbackMessage="The application encountered a critical error.">
          <StatusBar barStyle="dark-content" backgroundColor={THEME_COLORS.light.bgCanvas} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <ToastContainer />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME_COLORS.light.bgCanvas,
    alignItems: "center",
    justifyContent: "center",
  },
});
