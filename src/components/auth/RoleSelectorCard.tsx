import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface RoleSelectorCardProps {
  title: string;
  description: string;
  icon: IoniconName;
  onPress: () => void;
  selected?: boolean;
}

export function RoleSelectorCard({
  title,
  description,
  icon,
  onPress,
  selected = false,
}: RoleSelectorCardProps) {
  return (
    <TouchableOpacity
      className={`rounded-2xl p-6 mb-4 ${
        selected ? 'bg-[#73C2FB] border-2 border-[#73C2FB]' : 'bg-white border-2 border-gray-200'
      }`}
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name={icon}
              size={wp('8%')}
              color={selected ? '#FFFFFF' : '#73C2FB'}
            />
            <Text
              className={`ml-3 font-bold ${
                selected ? 'text-white' : 'text-gray-900'
              }`}
              style={{ fontSize: wp('5%') }}
            >
              {title}
            </Text>
          </View>
          <Text
            className={`${selected ? 'text-white' : 'text-gray-600'}`}
            style={{ fontSize: wp('3.5%') }}
          >
            {description}
          </Text>
        </View>
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={wp('7%')}
            color="#FFFFFF"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}
