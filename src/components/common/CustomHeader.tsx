import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@city-market/mobile-ui';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, subtitle, showBack, rightComponent }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <ScreenHeader
      title={title}
      subtitle={subtitle}
      onBack={showBack ? () => navigation.goBack() : undefined}
      backLabel={t('common.back')}
      right={rightComponent}
    />
  );
};

export default CustomHeader;
