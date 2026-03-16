/**
 * Landing Screen Component
 * First screen users see with login/register options and contact support
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Linking,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NavigationProps } from '../../types/navigation';
import { Button } from '../common/Button';

interface LandingScreenProps extends NavigationProps {}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  setCurrentScreen,
}) => {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const titleSlideAnim = useRef(new Animated.Value(0)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(0)).current;
  const descriptionSlideAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(0)).current;
  const reachUsSliderAnim = useRef(new Animated.Value(0)).current;
  const sliderHeightAnim = useRef(new Animated.Value(80)).current;
  const contactIconsOpacity = useRef(new Animated.Value(0)).current;

  const [showContactIcons, setShowContactIcons] = useState(false);

  // Start animations on mount
  useEffect(() => {
    // Reset all animations
    fadeAnim.setValue(0);
    slideAnim.setValue(0);
    scaleAnim.setValue(0.8);
    titleSlideAnim.setValue(0);
    subtitleSlideAnim.setValue(0);
    descriptionSlideAnim.setValue(0);
    buttonSlideAnim.setValue(0);

    // Start animations with staggered timing
    setTimeout(() => {
      // Main container animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered element animations
      setTimeout(() => {
        Animated.timing(titleSlideAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 200);

      setTimeout(() => {
        Animated.timing(subtitleSlideAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 400);

      setTimeout(() => {
        Animated.timing(descriptionSlideAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 600);

      setTimeout(() => {
        Animated.timing(buttonSlideAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 800);
    }, 100);
  }, []);

  const toggleContactIcons = () => {
    const newValue = !showContactIcons;
    setShowContactIcons(newValue);

    Animated.parallel([
      Animated.spring(sliderHeightAnim, {
        toValue: newValue ? 200 : 80,
        useNativeDriver: false,
      }),
      Animated.timing(contactIconsOpacity, {
        toValue: newValue ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@wyaparpay.com');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/911234567890');
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => showContactIcons && toggleContactIcons()}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
                {
                  scale: scaleAnim,
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateY: titleSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
              opacity: titleSlideAnim,
            }}
          >
            <Image
              source={require('../../../assets/wyaparpay-logo-horizontal.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={{
              transform: [
                {
                  translateY: subtitleSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, 0],
                  }),
                },
              ],
              opacity: subtitleSlideAnim,
            }}
          >
            <Text style={styles.subtitle}>{t('tagline')}</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: descriptionSlideAnim,
              transform: [
                {
                  translateY: descriptionSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={styles.description}>{t('welcome')}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonSlideAnim,
                transform: [
                  {
                    translateY: buttonSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Button
              title={tc('login')}
              variant="primary"
              onPress={() => setCurrentScreen('login')}
              style={styles.button}
            />

            <Button
              title={tc('register')}
              variant="secondary"
              onPress={() => setCurrentScreen('register')}
              style={styles.button}
            />
          </Animated.View>
        </Animated.View>

        {/* Reach Us Slider */}
        <TouchableWithoutFeedback onPress={() => {}}>
          <Animated.View
            style={[
              styles.reachUsSlider,
              {
                height: sliderHeightAnim,
                transform: [{ translateY: reachUsSliderAnim }],
              },
            ]}
          >
            <View style={styles.sliderHandle} />
            <View style={styles.sliderContent}>
              <TouchableOpacity
                style={styles.reachUsButton}
                onPress={toggleContactIcons}
                activeOpacity={0.7}
              >
                <Text style={styles.reachUsText}>💬 {tc('contact')}</Text>
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.contactIconsContainer,
                  {
                    opacity: contactIconsOpacity,
                    display: showContactIcons ? 'flex' : 'none',
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.contactIcon}
                  onPress={handlePhoneCall}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactIconEmoji}>📞</Text>
                  <Text style={styles.contactIconText}>{tc('phone')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactIcon}
                  onPress={handleEmail}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactIconEmoji}>✉️</Text>
                  <Text style={styles.contactIconText}>{tc('email')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactIcon}
                  onPress={handleWhatsApp}
                  activeOpacity={0.7}
                >
                  <Text style={styles.contactIconEmoji}>💬</Text>
                  <Text style={styles.contactIconText}>WhatsApp</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light gray background (matching website)
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#202124', // Dark text (matching website)
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#5F6368', // Gray text (matching website)
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
  },
  reachUsSlider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: 'center',
  },
  sliderHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(15, 15, 35, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
  },
  sliderContent: {
    width: '100%',
    alignItems: 'center',
  },
  reachUsButton: {
    backgroundColor: '#F97316', // Orange-500
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
  },
  reachUsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
  },
  contactIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)', // Orange with opacity
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  contactIconEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  contactIconText: {
    color: '#F97316', // Orange-500
    fontSize: 12,
    fontWeight: '600',
  },
});
