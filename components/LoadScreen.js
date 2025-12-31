import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';

const LoadScreen = ({ navigation }) => {
  const [animations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2000);

    // Create bouncing animation
    const createBounceAnimation = (index, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animations[index], {
              toValue: -15,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(animations[index], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(200),
          ])
        )
      ]);
    };

    // Start all animations
    const anim1 = createBounceAnimation(0, 0).start();
    const anim2 = createBounceAnimation(1, 100).start();
    const anim3 = createBounceAnimation(2, 200).start();

    return () => {
      clearTimeout(timer);
      animations.forEach(anim => anim.stopAnimation());
    };
  }, [navigation, animations]);

  return (
    <View style={styles.container}>
      {/* <Text style={styles.loadingText}>Loading</Text> */}
      <View style={styles.dotsContainer}>
        {animations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                transform: [{ translateY: anim }],
                backgroundColor: '#0254E8',
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default LoadScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    color: '#0254E8',
    fontWeight: '600',
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
});