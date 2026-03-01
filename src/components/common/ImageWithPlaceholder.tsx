import React, { useState } from 'react';
import { Image, View, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { Package } from 'lucide-react-native';
import { theme } from '../../theme';

interface Props {
  uri: string | null | undefined;
  style?: ImageStyle;
  placeholderStyle?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const ImageWithPlaceholder = ({
  uri,
  style,
  placeholderStyle,
  resizeMode = 'cover',
}: Props) => {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View style={[styles.placeholder, style, placeholderStyle]}>
        <Package size={24} color={theme.colors.border} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImageWithPlaceholder;
