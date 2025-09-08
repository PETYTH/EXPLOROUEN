import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  color?: string;
  textColor?: string;
}

export default function StarRating({ 
  rating, 
  size = 'small', 
  showText = true, 
  color = '#FBBF24',
  textColor 
}: StarRatingProps) {
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { starSize: 12, fontSize: 12 };
      case 'medium':
        return { starSize: 16, fontSize: 14 };
      case 'large':
        return { starSize: 20, fontSize: 16 };
      default:
        return { starSize: 12, fontSize: 12 };
    }
  };

  const { starSize, fontSize } = getSizeConfig();

  return (
    <View style={styles.container}>
      <Star 
        size={starSize} 
        color={color} 
        fill={color} 
        strokeWidth={2} 
      />
      {showText && (
        <Text style={[
          styles.ratingText, 
          { fontSize, color: textColor || color }
        ]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontWeight: '600',
  },
});
