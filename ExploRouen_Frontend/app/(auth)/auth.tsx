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
        router.replace('/(tabs)');
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

  const switchMode = () => {
    setIsLogin(!isLogin);
    // Clear fields when switching
    setEmailAddress('');
    setPassword('');
    setLastName('');
    setFirstName('');
    setConfirmPassword('');
    setCode('');
    setPendingVerification(false);
    setCaptchaVerified(false);
    setLoginError('');
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
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
        if (completeSignUp.createdSessionId) {
          await setActive({ session: completeSignUp.createdSessionId });
        }
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
                <Ionicons name="mail-outline" size={64} color="#8B5CF6" style={{ marginBottom: 20 }} />
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
                    colors={['#8B5CF6', '#8B5CF6']}
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
        source={require('../../assets/images/cathedrale-rouen.png')}
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
                    onPress={() => setIsLogin(true)}
                  >
                    <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                      Connexion
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                    onPress={() => setIsLogin(false)}
                  >
                    <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                      Inscription
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* First Name Input - Only for Register */}
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={handleRememberMeToggle}
                    >
                      <Ionicons
                        name={rememberMe ? "checkbox" : "square-outline"}
                        size={20}
                        color={rememberMe ? "#8B5CF6" : "#666"}
                      />
                    </TouchableOpacity>
                    <Text style={styles.checkboxText}>Se souvenir de moi</Text>
                  </View>
                )}

                {/* Image Captcha - For both Login and Register */}
                <ImageCaptcha 
                  onVerify={(verified) => {
                    setCaptchaVerified(verified);
                    if (verified && errors.captcha) {
                      setErrors(prev => ({ ...prev, captcha: '' }));
                    }
                  }}
                  onRefresh={() => setCaptchaVerified(false)}
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
                  <LinearGradient
                    colors={['#8B5CF6', '#8B5CF6']}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>
                      {loading 
                        ? (isLogin ? 'Connexion...' : 'Inscription...') 
                        : (isLogin ? 'Se connecter' : 'S\'inscrire')
                      }
                    </Text>
                  </LinearGradient>
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
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
    color: '#8B5CF6',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 12,
    shadowColor: '#8B5CF6',
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
    color: '#8B5CF6',
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
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
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
});
