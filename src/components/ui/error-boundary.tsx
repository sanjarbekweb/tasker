import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME_COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from "../../constants/theme";
import { logger } from "../../utils/logger";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  isRoot?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("ErrorBoundary", error.message, {
      componentStack: errorInfo.componentStack,
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      const isRoot = this.props.isRoot ?? false;
      return (
        <View style={[styles.container, isRoot && styles.rootContainer]}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {this.props.fallbackTitle ?? "Something went wrong"}
            </Text>
            <Text style={styles.message}>
              {this.props.fallbackMessage ??
                this.state.error?.message ??
                "An unexpected error occurred. Please try again."}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  rootContainer: {
    flex: 1,
    backgroundColor: THEME_COLORS.light.bgCanvas,
  },
  card: {
    backgroundColor: THEME_COLORS.light.bgSurfaceCard,
    borderRadius: BORDER_RADIUS["2xl"],
    borderColor: THEME_COLORS.light.borderDefault,
    borderWidth: 1,
    padding: SPACING.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: THEME_COLORS.light.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  message: {
    ...TYPOGRAPHY.body,
    color: THEME_COLORS.light.textMuted,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: THEME_COLORS.light.textPrimary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
  },
  retryText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: THEME_COLORS.dark.textPrimary,
  },
});
