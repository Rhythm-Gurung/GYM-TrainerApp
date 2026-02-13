import BackgroundImage from "@/components/onboardingComponents/backgroundImage";
import { slides } from "@/constants/onboardingSlides";
import { isIOS, isTablet, screenWidth } from "@/constants/responsive";
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from "react-native-safe-area-context";
import iconImage from '../../assets/images/icon.webp';
import logoImage from '../../assets/images/logo.webp';



function OnboardingScreen() {
    const router = useRouter();
    const { completeOnboarding } = useOnboarding();

    // State management for carousel visibility and current slide
    const [showCarousel, setShowCarousel] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Refs for controlling FlatList scroll behavior

    const flatListRef = useRef<FlatList>(null);
    const scrollBeginDrag = useRef(false);

    // Helper functions for responsive spacing
    const getIconMarginBottom = () => {
        if (isTablet) return hp('3%');
        return isIOS ? hp('4%') : hp('5%');
    };

    const getImageMarginBottom = () => {
        if (isTablet) return hp('0.5%');
        return isIOS ? hp('0.3%') : hp('0.3%');
    };

    const getTitleMarginBottom = () => {
        if (isTablet) return hp('1%');
        return isIOS ? hp('1%') : hp('1.5%');
    };

    const getDotsMarginBottom = () => {
        if (isTablet) return hp('2%');
        return isIOS ? hp('3%') : hp('3%');
    };

    const getButtonsGap = () => {
        if (isTablet) return hp('2%');
        return isIOS ? hp('1%') : hp('1.5%');
    };

    const getButtonsPaddingBottom = () => {
        if (isTablet) return hp('2%');
        return isIOS ? hp('2%') : hp('3%');
    };

    const getContainerPaddingTop = () => {
        if (isTablet) return hp('1%');
        return isIOS ? hp('1%') : hp('2%');
    };

    // Navigate to next slide or complete onboarding on last slide
    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            const nextIndex = currentIndex + 1;
            scrollBeginDrag.current = false;
            setCurrentIndex(nextIndex);

            // Programmatically scroll to next slide
            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });
        } else {
            // Last slide reached - complete onboarding and navigate to login
            await completeOnboarding();
            router.replace("/(auth)/login");
        }
    };

    // Skip onboarding and go directly to login
    const handleSkip = async () => {
        await completeOnboarding();
        router.replace("/(auth)/login");
    };

    // Transition from initial logo screen to carousel
    const handleInitialGetStarted = () => {
        setShowCarousel(true);
    };


    const renderItem = ({ item }: { item: (typeof slides)[0] }) => (
        <Animated.View
            entering={FadeIn.duration(600)}
            className="items-center justify-center flex-1"
            style={{ width: screenWidth }}
        >
            {/* Icon */}
            <View style={{ marginBottom: getIconMarginBottom() }}>
                <Image
                    source={iconImage}
                    style={{
                        width: isTablet ? wp('12%') : wp('18%'),
                        height: isTablet ? wp('12%') : wp('18%'),
                    }}
                    resizeMode="contain"
                />
            </View>

            {/* Background with Image */}
            <View
                className="justify-center items-center"
                style={{ marginBottom: getImageMarginBottom(), width: '100%' }}
            >
                <BackgroundImage
                    source={item.backgroundImage}
                    width={isTablet ? '85%' : '95%'}
                    height={isTablet ? hp('50%') : hp('45%')}
                >
                    <Image
                        source={item.image}
                        style={{
                            width: item.imageWidth,
                            height: item.imageHeight
                        }}
                        resizeMode="contain"
                    />
                </BackgroundImage>
            </View>

            {/* Text Content */}
            <View style={{ paddingHorizontal: isTablet ? wp('15%') : wp('8%') }}>
                <Animated.Text
                    entering={FadeInDown.delay(200).duration(500)}
                    style={{
                        color: '#333333',
                        textAlign: 'center',
                        fontSize: isTablet ? wp('3.5%') : wp('5.5%'),
                        fontWeight: '700',
                        marginBottom: getTitleMarginBottom(),
                    }}
                >
                    {item.title}
                </Animated.Text>

                <Animated.Text
                    entering={FadeInDown.delay(300).duration(500)}
                    style={{
                        color: '#AAAAAA',
                        textAlign: 'center',
                        fontSize: isTablet ? wp('2.2%') : wp('3.5%'),
                        fontWeight: '400',
                        lineHeight: isTablet ? wp('3.5%') : wp('5.5%'),
                    }}
                >
                    {item.subtitle}
                </Animated.Text>
            </View>
        </Animated.View>
    );

    // Initial Logo Screen - shown before carousel
    if (!showCarousel) {
        return (
            <SafeAreaView className="flex-1 bg-[#FBFBFB]" edges={['top']}>
                <Animated.View
                    entering={FadeIn.duration(800)}
                    className="flex-1 justify-center items-center"
                    style={{ paddingHorizontal: wp('10%') }}
                >
                    {/* Logo */}
                    <Image
                        source={logoImage}
                        style={{
                            width: isTablet ? wp('60%') : wp('80%'),
                            height: isTablet ? hp('15%') : hp('12%'),
                            marginBottom: hp('8%')
                        }}
                        resizeMode="contain"
                    />

                    {/* Get Started Button */}
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(600)}
                        style={{
                            width: '75%',
                            paddingHorizontal: isTablet ? wp('15%') : wp('5%')
                        }}
                    >
                        <TouchableOpacity
                            className="bg-[#73C2FB] rounded-lg items-center"
                            style={{ paddingVertical: isTablet ? hp('1.5%') : hp('2%') }}
                            onPress={handleInitialGetStarted}
                            activeOpacity={0.8}
                        >
                            <Text
                                className="text-white font-semibold"
                                style={{ fontSize: isTablet ? wp('2.5%') : wp('4.2%') }}
                            >
                                Get Started
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </SafeAreaView>
        );
    }

    // Carousel Screen
    return (
        <SafeAreaView className="flex-1 bg-[#FBFBFB]" edges={['top']}>
            <View style={{ flex: 1, paddingTop: getContainerPaddingTop() }}>
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={renderItem}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    onScrollBeginDrag={() => {
                        scrollBeginDrag.current = true;
                    }}
                    onScroll={(event) => {
                        if (scrollBeginDrag.current) {
                            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                            setCurrentIndex(index);
                        }
                    }}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={(event) => {
                        const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                        setCurrentIndex(index);
                    }}
                />

                {/* Pagination Dots */}
                <View
                    className="flex-row justify-center items-center"
                    style={{ marginBottom: getDotsMarginBottom() }}
                >
                    {slides.map((slide, index) => {
                        const isActive = currentIndex === index;
                        let dotWidth;
                        if (isActive) {
                            dotWidth = isTablet ? wp('4%') : wp('6%');
                        } else {
                            dotWidth = isTablet ? hp('0.6%') : hp('0.8%');
                        }

                        return (
                            <Animated.View
                                key={slide.id}
                                className={`rounded ${isActive ? "bg-[#73C2FB]" : "bg-[#73C2FB]"}`}
                                style={{
                                    height: isTablet ? hp('0.6%') : hp('0.8%'),
                                    width: dotWidth,
                                    marginHorizontal: isTablet ? wp('0.5%') : wp('1%')
                                }}
                            />
                        );
                    })}
                </View>

                {/* Buttons */}
                <Animated.View
                    entering={FadeInDown.delay(400).duration(600)}
                    style={{
                        paddingHorizontal: isTablet ? wp('20%') : wp('8%'),
                        paddingBottom: getButtonsPaddingBottom(),
                        gap: getButtonsGap()
                    }}
                >
                    <TouchableOpacity
                        className="bg-[#73C2FB] rounded-lg items-center"
                        style={{ paddingVertical: isTablet ? hp('1.5%') : hp('2%') }}
                        onPress={handleNext}
                        activeOpacity={0.8}
                        hitSlop={{ top: 10, bottom: 5, left: 10, right: 10 }}
                    >
                        <Text
                            className="text-white font-semibold"
                            style={{ fontSize: isTablet ? wp('2.5%') : wp('4.2%') }}
                        >
                            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSkip}
                        style={{ paddingVertical: hp('1%'), marginBottom: hp('3%'), marginTop: isTablet ? hp('1%') : 0 }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 5, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text
                            className="text-gray-500 text-center font-medium"
                            style={{ fontSize: isTablet ? wp('2.3%') : wp('4%') }}
                        >
                            Skip
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

export default OnboardingScreen;