import { isTablet } from '@/constants/responsive';
import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface RoleSelectorCardProps {
  title: string;
  description: string;
  icon: IoniconName;
  onPress: () => void;
  selected?: boolean;
  accentColor?: string;
  accentBg?: string;
  badge?: string;
}

export function RoleSelectorCard({
  title,
  description,
  icon,
  onPress,
  selected = false,
  accentColor = colors.primaryBtn,
  accentBg = colors.actionBg,
  badge,
}: RoleSelectorCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: selected ? accentColor : colors.white,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: selected ? accentColor : colors.surfaceBorder,
        padding: isTablet ? wp('4%') : wp('5%'),
        marginBottom: hp('2.5%'),
        shadowColor: selected ? accentColor : '#000',
        shadowOffset: { width: 0, height: selected ? 8 : 2 },
        shadowOpacity: selected ? 0.3 : 0.07,
        shadowRadius: selected ? 16 : 6,
        elevation: selected ? 10 : 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp('4%'),
      }}
    >
      {/* Icon circle */}
      <View
        style={{
          width: isTablet ? wp('12%') : wp('15%'),
          height: isTablet ? wp('12%') : wp('15%'),
          borderRadius: isTablet ? wp('6%') : wp('7.5%'),
          backgroundColor: selected ? 'rgba(255,255,255,0.22)' : accentBg,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={icon}
          size={isTablet ? wp('6%') : wp('7.5%')}
          color={selected ? colors.white : accentColor}
        />
      </View>

      {/* Text block */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: hp('0.6%'),
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <Text
            style={{
              color: selected ? colors.white : colors.textPrimary,
              fontWeight: '700',
              fontSize: isTablet ? wp('2.8%') : wp('4.8%'),
            }}
          >
            {title}
          </Text>
          {badge && (
            <View
              style={{
                backgroundColor: selected
                  ? 'rgba(255,255,255,0.28)'
                  : accentBg,
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: selected ? colors.white : accentColor,
                  fontSize: isTablet ? wp('1.6%') : wp('2.8%'),
                  fontWeight: '600',
                }}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            color: selected ? 'rgba(255,255,255,0.82)' : colors.textMuted,
            fontSize: isTablet ? wp('2%') : wp('3.5%'),
            lineHeight: isTablet ? wp('3.2%') : wp('5.2%'),
          }}
        >
          {description}
        </Text>
      </View>

      {/* Trailing icon */}
      <Ionicons
        name={selected ? 'checkmark-circle' : 'chevron-forward-outline'}
        size={isTablet ? wp('5%') : wp('6%')}
        color={selected ? colors.white : colors.textSubtle}
      />
    </TouchableOpacity>
  );
}
