import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageBackground,
  Keyboard,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSignIn, useSignUp, useOAuth, useUser } from '@clerk/clerk-expo';
import ImageCaptcha from '../../components/ImageCaptcha';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Validation helpers
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string) => {
  return password.length >= 8;
};

const validateName = (name: string) => {
  return name.trim().length >= 2;
};

export default function AuthScreen() {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { user } = useUser();
  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: facebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  
  // Login fields
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register fields
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [showRgpdModal, setShowRgpdModal] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  
  // Error state
  const [loginError, setLoginError] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Refs for inputs
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  // Load remember me preference and saved email on component mount
  useEffect(() => {
    loadRememberMeData();
  }, []);

  const loadRememberMeData = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      
      if (savedRememberMe === 'true' && savedEmail) {
        setRememberMe(true);
        setEmailAddress(savedEmail);
      }
    } catch (error) {
      // Error loading remember me data
    }
  };

  const saveRememberMeData = async (email: string, remember: boolean) => {
    try {
      await AsyncStorage.setItem('rememberMe', remember.toString());
      if (remember) {
        await AsyncStorage.setItem('savedEmail', email);
      } else {
        await AsyncStorage.removeItem('savedEmail');
      }
    } catch (error) {
      // Error saving remember me data
    }
  };

  const saveUserData = async (userData: any) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        emailAddress: userData.emailAddress || '',
        id: userData.id || '',
        createdAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const onSocialSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      // Prevent multiple simultaneous OAuth attempts
      if (loading) return;
      
      setLoading(true);
      setLoginError('');

      let oAuthFlow;
      switch (provider) {
        case 'google':
          oAuthFlow = googleOAuth;
          break;
        case 'apple':
          oAuthFlow = appleOAuth;
          break;
        case 'facebook':
          oAuthFlow = facebookOAuth;
          break;
        default:
          return;
      }

      const { createdSessionId, setActive } = await oAuthFlow();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        
        // Délai pour éviter les conflits de redirection avec _layout.tsx
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      }
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err);
      
      // Handle specific OAuth errors
      if (err.message?.includes('Another web browser is already open')) {
        setLoginError('Une session de connexion est déjà en cours. Veuillez fermer les autres onglets et réessayer.');
      } else if (err.message?.includes('User cancelled')) {
        setLoginError('Connexion annulée par l\'utilisateur');
      } else {
        setLoginError('Erreur de connexion, veuillez essayer autrement');
      }
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!signInLoaded || !emailAddress.trim()) {
      setLoginError('Veuillez saisir votre adresse email');
      return;
    }

    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress.trim(),
      });
      
      Alert.alert(
        'Code envoyé', 
        'Un code de réinitialisation a été envoyé à votre email. Vérifiez votre boîte de réception.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/forgot-password')
          }
        ]
      );
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setLoginError('Impossible d\'envoyer le code. Vérifiez votre adresse email.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: boolean) => {
    if (newMode === isLogin) return;
    
    const updateState = () => {
      setIsLogin(newMode);
      setEmailAddress('');
      setPassword('');
      setLastName('');
      setFirstName('');
      setConfirmPassword('');
      setCode('');
      setPendingVerification(false);
      setCaptchaVerified(false);
      setRgpdConsent(false);
      setLoginError('');
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    };
    
    // Animation simplifiée pour éviter les erreurs
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      updateState();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const validateLoginForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!emailAddress.trim()) {
      newErrors.email = 'L\'adresse email est requise';
    } else if (!validateEmail(emailAddress)) {
      newErrors.email = 'Adresse email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    }

    if (!captchaVerified) {
      newErrors.captcha = 'Veuillez compléter la vérification de sécurité';
    }

    if (!rgpdConsent) {
      newErrors.rgpd = 'Veuillez accepter les conditions de RGPD';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUpForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (!validateName(firstName)) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!emailAddress.trim()) {
      newErrors.email = 'L\'adresse email est requise';
    } else if (!validateEmail(emailAddress)) {
      newErrors.email = 'Adresse email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!captchaVerified) {
      newErrors.captcha = 'Veuillez compléter la vérification de sécurité';
    }

    if (!rgpdConsent) {
      newErrors.rgpd = 'Veuillez accepter les conditions de RGPD';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSignInPress = async () => {
    if (!signInLoaded) return;

    Keyboard.dismiss();
    setLoginError('');

    if (!validateLoginForm()) {
      return;
    }

    if (!captchaVerified) {
      setLoginError('Veuillez compléter la vérification de sécurité');
      return;
    }

    setLoading(true);
    
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress.trim(),
        password: password,
      });

      if (signInAttempt.status === 'complete') {
        // Save remember me preference
        await saveRememberMeData(emailAddress.trim(), rememberMe);
        
        // Set active session first
        if (setActive && signInAttempt.createdSessionId) {
          await setActive({ session: signInAttempt.createdSessionId });
          
          // Wait a bit for user data to be available after session activation
          setTimeout(async () => {
            try {
              // Use the user from useUser hook (will be available after session is set)
              const userData = {
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                emailAddress: emailAddress.trim(),
                id: user?.id || signInAttempt.identifier || '',
              };
              
              await saveUserData(userData);
            } catch (error) {
              console.log('Erreur récupération données utilisateur:', error);
            }
          }, 100);
        }
        
        router.replace('/(tabs)');
      } else {
        console.log('SignIn status:', signInAttempt.status);
        Alert.alert('Erreur', 'Connexion incomplète. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('SignIn error:', err);
      
      let errorMessage = 'Email ou mot de passe incorrect';
      
      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        switch (errorCode) {
          case 'form_identifier_not_found':
            errorMessage = 'Aucun compte trouvé avec cette adresse email';
            break;
          case 'form_password_incorrect':
            errorMessage = 'Mot de passe incorrect';
            break;
          case 'session_exists':
          case 'already_signed_in':
            // User is already signed in, redirect to tabs
            router.replace('/(tabs)');
            return;
          case 'too_many_requests':
            errorMessage = 'Trop de tentatives. Veuillez attendre avant de réessayer.';
            break;
          default:
            errorMessage = err.errors[0].message || errorMessage;
        }
      }
      
      setLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSignUpPress = async () => {
    if (!signUpLoaded) return;

    Keyboard.dismiss();

    if (!validateSignUpForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Configuration pour Clerk - utiliser seulement les champs supportés
      const signUpData: any = {
        emailAddress: emailAddress.trim(),
        password: password,
      };

      // Ajouter firstName seulement s'il est configuré dans Clerk
      if (firstName.trim()) {
        signUpData.firstName = firstName.trim();
      }

      // Ajouter lastName seulement s'il est configuré dans Clerk et s'il est fourni
      if (lastName.trim()) {
        signUpData.lastName = lastName.trim();
      }

      console.log('SignUp data:', signUpData);

      await signUp.create(signUpData);

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      Alert.alert(
        'Vérification requise', 
        'Un code de vérification a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception et vos spams.'
      );
    } catch (err: any) {
      console.error('SignUp error:', err);
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        
        switch (errorCode) {
          case 'form_identifier_exists':
            errorMessage = 'Un compte existe déjà avec cette adresse email';
            break;
          case 'form_password_pwned':
            errorMessage = 'Ce mot de passe a été compromis. Veuillez en choisir un autre.';
            break;
          case 'form_password_validation_failed':
            errorMessage = 'Le mot de passe ne respecte pas les critères de sécurité';
            break;
          case 'form_param_nil':
            errorMessage = 'Tous les champs requis doivent être remplis';
            break;
          default:
            errorMessage = err.errors[0].longMessage || err.errors[0].message || 'Erreur lors de l\'inscription';
        }
        
        Alert.alert('Erreur d\'inscription', errorMessage);
      } else {
        Alert.alert('Erreur d\'inscription', 'Une erreur inattendue s\'est produite');
      }
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!signUpLoaded || !signUp) return;

    if (!code.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le code de vérification');
      return;
    }

    setLoading(true);
    
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === 'complete') {
        // Save user data after successful verification
        const userData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          emailAddress: emailAddress.trim(),
          id: completeSignUp.createdSessionId || '',
        };
        
        await saveUserData(userData);
        
        // Set active session
        await setActive!({ session: completeSignUp.createdSessionId! });
        
        router.replace('/(tabs)');
      } else {
        console.log('Verification status:', completeSignUp.status);
        Alert.alert('Erreur', 'Vérification incomplète. Veuillez réessayer.');
      }
    } catch (err: any) {
      let errorMessage = 'Code de vérification incorrect';
      
      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        switch (errorCode) {
          case 'form_code_incorrect':
            errorMessage = 'Code de vérification incorrect';
            break;
          case 'verification_expired':
            errorMessage = 'Le code de vérification a expiré. Veuillez demander un nouveau code.';
            break;
          default:
            errorMessage = err.errors[0].message || errorMessage;
        }
      }
      
      Alert.alert('Erreur de vérification', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    if (!signUp) return;

    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code renvoyé', 'Un nouveau code de vérification a été envoyé à votre email');
    } catch (err: any) {
      console.error('Resend error:', err);
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleRememberMeToggle = () => {
    const newRememberMe = !rememberMe;
    setRememberMe(newRememberMe);
    
    // If turning off remember me, clear saved data immediately
    if (!newRememberMe) {
      saveRememberMeData('', false);
    }
  };

  const handleRgpdConsentToggle = () => {
    setRgpdConsent(!rgpdConsent);
  };

  const toggleRgpdConsent = () => {
    setRgpdConsent(!rgpdConsent);
  };

  // Style animé pour le formulaire
  const animatedFormStyle = {
    opacity: fadeAnim,
    transform: [{ scale: scaleAnim }],
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <Ionicons name="mail-outline" size={64} color="#1E40AF" style={{ marginBottom: 20 }} />
                <Text style={styles.title}>Vérifiez votre email</Text>
                <Text style={styles.subtitle}>
                  Entrez le code de vérification à 6 chiffres envoyé à {emailAddress}
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="000000"
                    placeholderTextColor="#666"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={onPressVerify}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#1E40AF', '#3B82F6']}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>
                      {loading ? 'Vérification...' : 'Vérifier'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.resendButton}
                  onPress={resendVerificationCode}
                  disabled={loading}
                >
                  <Text style={styles.resendButtonText}>
                    Renvoyer le code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setPendingVerification(false)}
                >
                  <Text style={styles.backButtonText}>
                    ← Retour à l'inscription
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../../assets/images/cathedrale-rouen.jpg')}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay} />
      
      {/* Bottom Shadow Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        style={styles.bottomShadow}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {isLogin ? 'Connexion' : 'Inscription'}
                </Text>
                <Text style={styles.subtitle}>
                  {isLogin 
                    ? 'Connectez-vous pour continuer' 
                    : 'Créez votre compte pour commencer'
                  }
                </Text>
              </View>

              {/* Login/Register Toggle */}
              <View style={styles.toggleContainer}>
                <View style={styles.switchBackground}>
                  <TouchableOpacity
                    style={[styles.toggleButton, isLogin && styles.activeToggle]}
                    onPress={() => switchMode(true)}
                  >
                    <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                      Connexion
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                    onPress={() => switchMode(false)}
                  >
                    <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                      Inscription
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form */}
              <Animated.View style={[styles.form, animatedFormStyle]}>
                {/* First Name Input - Only for Register */}
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                    <TextInput
                      ref={firstNameRef}
                      style={styles.input}
                      placeholder="Prénom"
                      placeholderTextColor="#9CA3AF"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                      }}
                      autoComplete="given-name"
                      returnKeyType="next"
                      onSubmitEditing={() => lastNameRef.current?.focus()}
                    />
                  </View>
                )}
                {errors.firstName && <Text style={styles.fieldErrorText}>{errors.firstName}</Text>}

                {/* Last Name Input - Only for Register */}
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                    <TextInput
                      ref={lastNameRef}
                      style={styles.input}
                      placeholder="Nom (optionnel)"
                      placeholderTextColor="#9CA3AF"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                      }}
                      autoComplete="family-name"
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </View>
                )}
                {errors.lastName && <Text style={styles.fieldErrorText}>{errors.lastName}</Text>}

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    value={emailAddress}
                    onChangeText={(text) => {
                      setEmailAddress(text);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
                {errors.email && <Text style={styles.fieldErrorText}>{errors.email}</Text>}

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Mot de passe"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    returnKeyType={isLogin ? "done" : "next"}
                    onSubmitEditing={() => {
                      if (isLogin) {
                        onSignInPress();
                      } else {
                        confirmPasswordRef.current?.focus();
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.fieldErrorText}>{errors.password}</Text>}

                {/* Confirm Password - Only for Register */}
                {!isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                      <TextInput
                        ref={confirmPasswordRef}
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor="#9CA3AF"
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        secureTextEntry={!showConfirmPassword}
                        returnKeyType="done"
                        onSubmitEditing={onSignUpPress}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#9CA3AF" 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && <Text style={styles.fieldErrorText}>{errors.confirmPassword}</Text>}
                  </>
                )}

                {/* Remember Me - Only for Login */}
                {isLogin && (
                  <TouchableOpacity
                    style={[styles.checkboxFullContainer, { borderColor: rememberMe ? "#1E40AF" : "#666" }]}
                    onPress={handleRememberMeToggle}
                  >
                    <View style={[styles.checkboxButton, { borderColor: rememberMe ? "#1E40AF" : "#666" }]}>
                      {rememberMe && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#1E40AF"
                        />
                      )}
                    </View>
                    <Text style={[styles.checkboxText, styles.checkboxTextBold]}>Se souvenir de moi</Text>
                  </TouchableOpacity>
                )}

                {/* RGPD Consent */}
                <View style={styles.rgpdConsentRow}>
                  <TouchableOpacity
                    style={[styles.checkboxFullContainerFlex, { borderColor: rgpdConsent ? "#1E40AF" : "#666" }]}
                    onPress={handleRgpdConsentToggle}
                  >
                    <View style={[styles.checkboxButton, { borderColor: rgpdConsent ? "#1E40AF" : "#666" }]}>
                      {rgpdConsent && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#1E40AF"
                        />
                      )}
                    </View>
                    <Text style={[styles.checkboxText, styles.checkboxTextBold]}>J'accepte les conditions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewConditionsButton}
                    onPress={() => {
                      setShowRgpdModal(true);
                      setHasScrolledToEnd(false);
                    }}
                  >
                    <Ionicons name="document-text-outline" size={18} color="#1E40AF" />
                    <Text style={styles.viewConditionsText}>Voir</Text>
                  </TouchableOpacity>
                </View>
                {errors.rgpd && <Text style={styles.fieldErrorText}>{errors.rgpd}</Text>}

                {/* Image CAPTCHA - For both Login and Register */}
                <ImageCaptcha 
                  onVerify={(isValid) => {
                    setCaptchaVerified(isValid);
                    if (isValid && errors.captcha) {
                      setErrors(prev => ({ ...prev, captcha: '' }));
                    }
                  }}
                />
                {errors.captcha && <Text style={styles.fieldErrorText}>{errors.captcha}</Text>}

                {/* Login Error Message */}
                {loginError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorMessage}>{loginError}</Text>
                  </View>
                )}

                {/* Primary Button */}
                <TouchableOpacity 
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={isLogin ? onSignInPress : onSignUpPress}
                  disabled={loading}
                >
                  <View
                    style={[styles.primaryButtonGradient, { backgroundColor: '#1E40AF' }]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {loading 
                        ? (isLogin ? 'Connexion...' : 'Inscription...') 
                        : (isLogin ? 'Se connecter' : 'S\'inscrire')
                      }
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Forgot Password Link - Only for Login */}
                {isLogin && (
                  <TouchableOpacity 
                    style={styles.forgotPasswordContainer}
                    onPress={() => router.push('/forgot-password')}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Mot de passe oublié ?
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Social Login Buttons */}
                <View style={styles.socialContainer}>
                  <Text style={styles.orText}>ou continuez avec</Text>
                  
                  <View style={styles.socialButtons}>
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={() => onSocialSignIn('google')}
                  >
                    <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={() => onSocialSignIn('apple')}
                  >
                    <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={() => onSocialSignIn('facebook')}
                  >
                    <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* RGPD Modal */}
        <Modal
          visible={showRgpdModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRgpdModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Conditions RGPD</Text>
                <TouchableOpacity
                  onPress={() => setShowRgpdModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                onScroll={(event) => {
                  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                  const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                  if (isCloseToBottom && !hasScrolledToEnd) {
                    setHasScrolledToEnd(true);
                  }
                }}
                scrollEventThrottle={400}
              >
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Protection des données personnelles</Text>
                  <Text style={styles.modalSectionText}>
                    Conformément au Règlement Général sur la Protection des Données (RGPD), nous nous engageons à protéger vos données personnelles. Les informations collectées sont utilisées uniquement dans le cadre du fonctionnement de l'application et ne sont jamais partagées avec des tiers sans votre consentement explicite.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Données collectées</Text>
                  <Text style={styles.modalSectionText}>
                    • Nom et prénom{'\n'}
                    • Adresse email{'\n'}
                    • Photo de profil (optionnelle){'\n'}
                    • Données de localisation (si autorisées){'\n'}
                    • Historique d'activités dans l'application{'\n'}
                    • Messages et interactions
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Utilisation des données</Text>
                  <Text style={styles.modalSectionText}>
                    Vos données sont utilisées pour :{'\n'}
                    • Créer et gérer votre compte utilisateur{'\n'}
                    • Personnaliser votre expérience{'\n'}
                    • Vous permettre d'interagir avec d'autres utilisateurs{'\n'}
                    • Améliorer nos services{'\n'}
                    • Vous envoyer des notifications importantes
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Vos droits</Text>
                  <Text style={styles.modalSectionText}>
                    Vous disposez des droits suivants :{'\n'}
                    • Droit d'accès à vos données{'\n'}
                    • Droit de rectification{'\n'}
                    • Droit à l'effacement{'\n'}
                    • Droit à la portabilité{'\n'}
                    • Droit d'opposition{'\n'}
                    • Droit de limitation du traitement
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Sécurité</Text>
                  <Text style={styles.modalSectionText}>
                    Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Contact</Text>
                  <Text style={styles.modalSectionText}>
                    Pour toute question concernant vos données ou l'exercice de vos droits, vous pouvez nous contacter via la section "Nous contacter" de l'application.
                  </Text>
                </View>

                <View style={styles.bottomSpacingModal} />
              </ScrollView>

              <View style={styles.modalFooter}>
                {hasScrolledToEnd ? (
                  <TouchableOpacity
                    style={[styles.modalAcceptButton, { backgroundColor: '#1E40AF' }]}
                    onPress={() => {
                      setRgpdConsent(true);
                      setShowRgpdModal(false);
                      setHasScrolledToEnd(false);
                      if (errors.rgpd) {
                        setErrors(prev => ({ ...prev, rgpd: '' }));
                      }
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.modalAcceptButtonText}>J'accepte les conditions</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.modalScrollHint}>
                    <Ionicons name="arrow-down" size={20} color="#666" />
                    <Text style={styles.modalScrollHintText}>Faites défiler jusqu'en bas pour accepter</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  switchBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 4,
    width: 340,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 21,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#1E40AF',
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  activeToggleText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontWeight: '600',
  },
  activeTab: {
    backgroundColor: '#1E40AF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldErrorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxFullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  checkboxFullContainerFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  checkboxButton: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  checkboxTextBold: {
    fontWeight: 'bold',
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 12,
    shadowColor: '#1E40AF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 40,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  socialContainer: {
    alignItems: 'center',
  },
  orText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  errorContainer: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  errorMessage: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  rgpdConsentRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 16,
  },
  viewConditionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E40AF',
    minWidth: 80,
  },
  viewConditionsText: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.85,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  modalSection: {
    marginTop: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomSpacingModal: {
    height: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalAcceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalScrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  modalScrollHintText: {
    color: '#666',
    fontSize: 14,
  },
});
