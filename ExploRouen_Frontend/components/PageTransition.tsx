import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  animationType?: 'slide' | 'fade' | 'scale' | 'slideUp' | 'slideDown';
  duration?: number;
  onAnimationComplete?: () => void;
}

export default function PageTransition({ 
  children, 
  isVisible, 
  animationType = 'slide',
  duration = 400,
  onAnimationComplete 
}: PageTransitionProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Animation d'entrée fluide avec spring naturel
      progress.value = withSpring(1, {
        damping: 25,
        stiffness: 120,
        mass: 0.8,
        overshootClamping: false,
        restSpeedThreshold: 0.01,
        restDisplacementThreshold: 0.01,
      });
      
      // Callback après animation
      if (onAnimationComplete) {
        setTimeout(() => runOnJS(onAnimationComplete)(), duration);
      }
    } else {
      // Animation de sortie rapide et fluide
      progress.value = withTiming(0, { 
        duration: duration * 0.6,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      });
    }
  }, [isVisible, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    switch (animationType) {
      case 'slide':
        const translateX = interpolate(
          progress.value,
          [0, 1],
          [30, 0],
          Extrapolate.CLAMP
        );
        return {
          opacity,
          transform: [{ translateX }],
        };

      case 'slideUp':
        const translateY = interpolate(
          progress.value,
          [0, 1],
          [50, 0],
          Extrapolate.CLAMP
        );
        return {
          opacity,
          transform: [{ translateY }],
        };

      case 'slideDown':
        const translateYDown = interpolate(
          progress.value,
          [0, 1],
          [-50, 0],
          Extrapolate.CLAMP
        );
        return {
          opacity,
          transform: [{ translateY: translateYDown }],
        };

      case 'scale':
        const scale = interpolate(
          progress.value,
          [0, 1],
          [0.92, 1],
          Extrapolate.CLAMP
        );
        return {
          opacity,
          transform: [{ scale }],
        };

      case 'fade':
      default:
        return { opacity };
    }
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
