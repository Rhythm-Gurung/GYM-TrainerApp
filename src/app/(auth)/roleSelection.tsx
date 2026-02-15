import { RoleSelectorCard } from '@/components/auth/RoleSelectorCard';
import { isTablet } from '@/constants/responsive';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/formComponent';
import iconImage from '../../../assets/images/icon.webp';

type UserRole = 'client' | 'trainer' | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const handleContinue = () => {
    if (!selectedRole) return;

    if (selectedRole === 'client') {
      // Navigate to normal client registration
      router.push('/(auth)/register');
    } else {
      // Navigate to trainer registration
      router.push('/(auth)/trainerRegister');
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFB]" edges={['top']}>
      <Animated.View
        entering={FadeIn.duration(600)}
        className="flex-1"
        style={{
          paddingHorizontal: isTablet ? wp('15%') : wp('8%'),
          paddingTop: hp('4%'),
        }}
      >
        {/* Icon */}
        <View className="items-center" style={{ marginBottom: hp('4%') }}>
          <Image
            source={iconImage}
            style={{
              width: isTablet ? wp('15%') : wp('20%'),
              height: isTablet ? wp('15%') : wp('20%'),
            }}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{ marginBottom: hp('2%') }}
        >
          <Text
            className="text-gray-900 font-bold text-center"
            style={{ fontSize: isTablet ? wp('4%') : wp('6.5%') }}
          >
            Choose Your Role
          </Text>
          <Text
            className="text-gray-600 text-center mt-2"
            style={{ fontSize: isTablet ? wp('2.5%') : wp('4%') }}
          >
            Select how you want to continue with SETu
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={{ flex: 1, marginTop: hp('3%') }}
        >
          <RoleSelectorCard
            title="Continue as Client"
            description="Find and book the best trainers for your fitness journey"
            icon="person-outline"
            onPress={() => setSelectedRole('client')}
            selected={selectedRole === 'client'}
          />

          <RoleSelectorCard
            title="Continue as Trainer"
            description="Share your expertise and help clients achieve their fitness goals"
            icon="barbell-outline"
            onPress={() => setSelectedRole('trainer')}
            selected={selectedRole === 'trainer'}
          />
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          className="items-center"
          style={{
            paddingBottom: hp('3%'),
            gap: hp('1.5%'),
          }}
        >
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedRole}
            width={isTablet ? wp('50%') : wp('75%')}
          />

          {/* Back to Login */}
          <Text
            className="text-gray-600 text-center"
            style={{ fontSize: isTablet ? wp('2.3%') : wp('3.8%') }}
          >
            Already have an account?
{' '}
            <Text
              className="text-[#73C2FB] font-medium"
              onPress={handleBackToLogin}
            >
              Sign In
            </Text>
          </Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}
