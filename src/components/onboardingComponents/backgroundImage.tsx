import React from 'react';
import { type DimensionValue, Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

interface BackgroundImageProps {
    source: ImageSourcePropType;
    children?: React.ReactNode;
    width?: DimensionValue;
    height?: DimensionValue;
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
});

function BackgroundImage({
    source,
    children,
    width = '90%',
    height = '50%'
}: BackgroundImageProps) {
    return (
        <View style={[styles.container, { width, height }]}>
            <Image
                source={source}
                style={styles.backgroundImage}
                resizeMode="cover"
            />
            <View style={styles.contentContainer}>
                {children}
            </View>
        </View>
    );
}


export default BackgroundImage;