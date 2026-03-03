import { RoleSelectorCard } from '@/components/auth/RoleSelectorCard';
import { isTablet } from '@/constants/responsive';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { Button } from '@/components/ui/formComponent';

import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

import iconImage from '@/../assets/images/gym1.png';

type UserRole = 'client' | 'trainer' | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const handleContinue = () => {
    if (!selectedRole) return;
    if (selectedRole === 'client') {
      router.push('/(auth)/register');
    } else {
      router.push('/(auth)/trainerRegister');
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Accent bar */}
      <Animated.View
        entering={FadeIn.duration(600)}
        className="flex-1"
        style={{
          paddingHorizontal: isTablet ? wp('15%') : wp('6%'),
          paddingTop: hp('3%'),
        }}
      >
        {/* Logo + Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ alignItems: 'center', marginBottom: hp('5%') }}
        >
          {/* Icon in a tinted circle */}
          <View>
            <Image
              source={iconImage}
              style={{
                width: isTablet ? wp('12%') : wp('16%'),
                height: isTablet ? wp('12%') : wp('16%'),
              }}
              resizeMode="contain"
            />
          </View>

          <Text
            style={{
              color: colors.textPrimary,
              fontWeight: '800',
              fontSize: isTablet ? wp('4%') : wp('7%'),
              textAlign: 'center',
              letterSpacing: -0.5,
              marginBottom: hp('1%'),
            }}
          >
            Join as...
          </Text>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: isTablet ? wp('2.2%') : wp('3.8%'),
              textAlign: 'center',
            }}
          >
            Pick your role to get started
          </Text>
        </Animated.View>

        {/* Role Cards */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={{ flex: 1 }}
        >
          <RoleSelectorCard
            title="I'm a Client"
            description="Discover trainers, book sessions, and crush your fitness goals"
            icon="person-outline"
            onPress={() => setSelectedRole('client')}
            selected={selectedRole === 'client'}
            accentColor={colors.primaryBtn}
            accentBg={colors.actionBg}
            badge="Most Popular"
          />

          <RoleSelectorCard
            title="I'm a Trainer"
            description="Create your profile, manage your schedule, and grow your client base"
            icon="barbell-outline"
            onPress={() => setSelectedRole('trainer')}
            selected={selectedRole === 'trainer'}
            accentColor={colors.trainerPrimary}
            accentBg={colors.trainerSurface}
          />
        </Animated.View>

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={{
            paddingBottom: hp('2%'),
            gap: hp('1.5%'),
          }}
        >
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedRole}
            width={isTablet ? wp('70%') : wp('88%')}
          />

          <Text
            style={{
              color: colors.textMuted,
              textAlign: 'center',
              fontSize: isTablet ? wp('2.3%') : wp('3.8%'),
            }}
          >
            Already have an account?
            {' '}
            <Text
              style={{ color: colors.primaryBtn, fontWeight: '600' }}
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
