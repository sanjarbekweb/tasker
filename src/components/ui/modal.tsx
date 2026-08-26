import React, { useEffect, useRef } from "react";
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ViewStyle,
} from "react-native";
import { BORDER_RADIUS, SPACING } from "../../constants/theme";
import { useTheme } from "../../hooks/use-theme";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children, style }) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.bgSurfaceCard,
                  borderColor: colors.borderDefault,
                  transform: [{ translateY: slideAnim }],
                },
                style,
              ]}
            >
              <View style={[styles.dragIndicator, { backgroundColor: colors.borderDefault }]} />
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS["3xl"],
    borderTopRightRadius: BORDER_RADIUS["3xl"],
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: SPACING.xl,
    paddingTop: SPACING.md,
    maxHeight: Dimensions.get("window").height * 0.85,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
});
