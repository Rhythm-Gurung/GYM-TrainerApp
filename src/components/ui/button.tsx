// import {
//     ActivityIndicator,
//     Text,
//     TouchableOpacity,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// interface ButtonProps {
//     title: string;
//     onPress: () => void;
//     loading?: boolean;
//     disabled?: boolean;
//     icon?: IoniconName;
// }

// export function Button({
//     title,
//     onPress,
//     loading = false,
//     disabled = false,
//     icon,
// }: ButtonProps) {
//     const isDisabled = disabled || loading;

//     return (
//         <TouchableOpacity
//             onPress={onPress}
//             disabled={isDisabled}
//             activeOpacity={0.8}
//             accessibilityRole="button"
//             className={
//         w-full
//         h-12
//         rounded-lg
//         flex-row
//         items-center
//         justify-center
//         gap-2
//         ${isDisabled ? 'bg-purple-300' : 'bg-purple-600'}
//       `}
//         >
//             {loading ? (
//                 <ActivityIndicator size="small" color="#fff" />
//             ) : (
//                 <>
//                     {icon && <Ionicons name={icon} size={20} color="#fff" />}
//                     <Text className="text-white font-semibold text-base">
//                         {title}
//                     </Text>
//                 </>
//             )}
//         </TouchableOpacity>
//     );
// }
