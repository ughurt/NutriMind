import React from 'react';
import { IconButton as PaperIconButton } from 'react-native-paper';

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  color?: string;
  size?: number;
}

export const IconButton = ({ 
  icon, 
  onPress, 
  color,
  size = 24
}: IconButtonProps) => {
  return (
    <PaperIconButton 
      icon={icon}
      onPress={onPress}
      size={size}
      iconColor={color}
    />
  );
}; 