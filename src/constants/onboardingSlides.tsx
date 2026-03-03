import { isTablet } from "@/constants/responsive";
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import backgroundOnboarding from '../../assets/images/backgroundUnboarding.webp';
// import onboardingImage1 from '../../assets/images/onboardinImage1.webp';
// import onboardingImage2 from '../../assets/images/onboardinImage2.webp';
// import onboardingImage3 from '../../assets/images/onboardinImage3.webp';
import onboardingImage1 from '../../assets/images/On1.png';
import onboardingImage2 from '../../assets/images/On2.png';
import onboardingImage3 from '../../assets/images/On3.png';


export const slides = [
    {
        id: "1",
        title: "Find Your Perfect Trainer",
        subtitle: "Browse top-rated personal trainers,\nbook sessions, and crush your goals.",
        image: onboardingImage1,
        backgroundImage: backgroundOnboarding,
        imageWidth: isTablet ? wp('90%') : wp('90%'),
        imageHeight: isTablet ? wp('70%') : wp('90%'),
    },
    {
        id: "2",
        title: "Grow as a Trainer",
        subtitle: "Showcase your expertise, manage bookings,\nand build your fitness business.",
        image: onboardingImage2,
        backgroundImage: backgroundOnboarding,
        imageWidth: isTablet ? wp('75%') : wp('85%'),
        imageHeight: isTablet ? wp('48%') : wp('70%'),
    },
    {
        id: "3",
        title: "Your Fitness Journey Starts Here",
        subtitle: "Book sessions with ease, connect with\nthe right trainer, and get moving.",
        image: onboardingImage3,
        backgroundImage: backgroundOnboarding,
        imageWidth: isTablet ? wp('85%') : wp('90%'),
        imageHeight: isTablet ? wp('65%') : wp('65%'),
    },
];