import { isTablet } from "@/constants/responsive";
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import backgroundOnboarding from '../../assets/images/backgroundUnboarding.webp';
import onboardingImage1 from '../../assets/images/onboardinImage1.webp';
import onboardingImage2 from '../../assets/images/onboardinImage2.webp';
import onboardingImage3 from '../../assets/images/onboardinImage3.webp';


export const slides = [
    {
        id: "1",
        title: "Become a Buyer",
        subtitle: "Discover the best products from\nall available supplier.",
        image: onboardingImage1,
        backgroundImage: backgroundOnboarding,
        imageWidth: isTablet ? wp('80%') : wp('75%'),
        imageHeight: isTablet ? wp('60%') : wp('75%'),
    },
    {
        id: "2",
        title: "Become a Seller",
        subtitle: "Upload various of products for customers\n around the platform with best range.",
        image: onboardingImage2,
        backgroundImage: backgroundOnboarding,
        imageWidth: isTablet ? wp('75%') : wp('85%'),
        imageHeight: isTablet ? wp('48%') : wp('70%'),
    },
    {
        id: "3",
        title: "Create your own S& C List",
        subtitle: "Add & Remove suppliers/customers in your\n list for easy access. .",
        image: onboardingImage3,
        backgroundImage: backgroundOnboarding,
        imageWidth: isTablet ? wp('85%') : wp('90%'),
        imageHeight: isTablet ? wp('65%') : wp('65%'),
    },
];