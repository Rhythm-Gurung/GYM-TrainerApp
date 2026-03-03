import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, radius, shadow } from '@/constants/theme';

// ─── What-happens-next steps ──────────────────────────────────────────────────

const STEPS = [
  {
    icon: 'search-outline' as const,
    title: 'Under Review',
    desc: 'Our team is verifying your credentials, ID proof, and certifications.',
  },
  {
    icon: 'checkmark-circle-outline' as const,
    title: 'Approval',
    desc: "You'll receive an email notification once your account is approved.",
  },
  {
    icon: 'rocket-outline' as const,
    title: 'Get Started',
    desc: 'Log in and start accepting client bookings right away.',
  },
] as const;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerPendingApprovalPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Gradient hero ───────────────────────────────────── */}
        <LinearGradient
          colors={[colors.trainerDark, colors.trainerPrimary, '#FDBA74']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 48,
            paddingBottom: 56,
            paddingHorizontal: 24,
            alignItems: 'center',
            borderBottomLeftRadius: radius.hero,
            borderBottomRightRadius: radius.hero,
          }}
        >
          {/* Icon ring */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.white,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              ...shadow.trainer,
            }}
          >
            <Ionicons name="hourglass-outline" size={48} color={colors.trainerPrimary} />
          </View>

          <Text
            style={{
              fontSize: fontSize.pageTitle,
              fontWeight: '800',
              color: colors.white,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Application Submitted!
          </Text>

          <Text
            style={{
              fontSize: fontSize.body,
              color: 'rgba(255,255,255,0.80)',
              textAlign: 'center',
              lineHeight: 22,
              paddingHorizontal: 16,
            }}
          >
            Your trainer profile is now under review by our team.
          </Text>

          {/* Status pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: colors.white15,
              borderRadius: radius.full,
              paddingHorizontal: 18,
              paddingVertical: 8,
              marginTop: 20,
              borderWidth: 1,
              borderColor: colors.white18,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.white,
              }}
            />
            <Text
              style={{
                fontSize: fontSize.caption,
                fontWeight: '700',
                color: colors.white,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
              }}
            >
              Pending Admin Approval
            </Text>
          </View>
        </LinearGradient>

        {/* ── Card body ──────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}>

          {/* Estimated time note */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: colors.trainerSurface,
              borderRadius: radius.md,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.trainerBorder,
              marginBottom: 28,
            }}
          >
            <Ionicons name="time-outline" size={18} color={colors.trainerPrimary} />
            <Text style={{ fontSize: fontSize.body, color: colors.trainerPrimary, fontWeight: '600', flex: 1 }}>
              {'Typically approved within '}
              <Text style={{ fontWeight: '800' }}>1–2 business days</Text>
            </Text>
          </View>

          {/* What happens next */}
          <Text
            style={{
              fontSize: fontSize.section,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: 16,
            }}
          >
            What happens next?
          </Text>

          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.card,
              padding: 20,
              gap: 0,
              ...shadow.card,
            }}
          >
            {STEPS.map((step, index) => (
              <View key={step.title}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                  {/* Step icon + connector */}
                  <View style={{ alignItems: 'center', width: 36 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.trainerMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={step.icon} size={18} color={colors.trainerPrimary} />
                    </View>
                    {/* Connector line */}
                    {index < STEPS.length - 1 && (
                      <View
                        style={{
                          width: 2,
                          height: 28,
                          backgroundColor: colors.trainerBorder,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </View>

                  {/* Text */}
                  <View style={{ flex: 1, paddingBottom: index < STEPS.length - 1 ? 28 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text
                        style={{
                          fontSize: fontSize.card,
                          fontWeight: '700',
                          color: colors.textPrimary,
                        }}
                      >
                        {step.title}
                      </Text>
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: colors.trainerPrimary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.white }}>
                          {index + 1}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: fontSize.tag,
                        color: colors.textMuted,
                        lineHeight: 19,
                      }}
                    >
                      {step.desc}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
            style={{
              marginTop: 28,
              borderRadius: radius.md,
              overflow: 'hidden',
            }}
          >
            <LinearGradient
              colors={[colors.trainerDark, colors.trainerPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Ionicons name="log-in-outline" size={18} color={colors.white} />
              <Text style={{ fontSize: fontSize.card, fontWeight: '700', color: colors.white }}>
                Back to Sign In
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Support note */}
          <Text
            style={{
              fontSize: fontSize.caption,
              color: colors.textSubtle,
              textAlign: 'center',
              marginTop: 16,
              lineHeight: 18,
            }}
          >
            {'Need help? '}
            <Text style={{ color: colors.trainerPrimary, fontWeight: '600' }}>Contact support</Text>
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}
