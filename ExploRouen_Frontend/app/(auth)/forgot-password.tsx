import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

// Validation helpers
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string) => password.length >= 8;

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  
  // State management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1: email, 2: code, 3: password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Input refs
  const emailRef = useRef<TextInput>(null);
  const codeRefs = useRef<TextInput[]>([]);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep - 1) / 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Validations
  const validateEmailStep = () => {
    const newErrors: {[key: string]: string} = {};
    if (!email.trim()) newErrors.email = "L'adresse email est requise";
    else if (!validateEmail(email)) newErrors.email = 'Adresse email invalide';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCodeStep = () => {
    const newErrors: {[key: string]: string} = {};
    if (!code.trim()) newErrors.code = 'Veuillez entrer le code de vérification';
    else if (code.length !== 6) newErrors.code = 'Le code doit contenir 6 chiffres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordStep = () => {
    const newErrors: {[key: string]: string} = {};
    if (!password.trim()) newErrors.password = 'Le nouveau mot de passe est requis';
    else if (!validatePassword(password)) newErrors.password = 'Au moins 8 caractères';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Confirmez le mot de passe';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Request reset code
  const onRequestReset = async () => {
    if (!isLoaded) return;
    if (!validateEmailStep()) return;

    setLoading(true);
    try {
      // Optionnel : si une session existe, on la ferme pour éviter already_signed_in
      try { if (isSignedIn) await signOut(); } catch {}

      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });

      setCurrentStep(2);
      Alert.alert(
        'Code envoyé', 
        'Un code de réinitialisation a été envoyé à votre adresse email. Vérifiez aussi vos spams.',
        [{ text: 'Compris', onPress: () => codeRefs.current[0]?.focus() }]
      );
    } catch (err: any) {
      let errorMessage = "Impossible d'envoyer le code";
      if (err.errors?.length) {
        const ec = err.errors[0].code;
        if (ec === 'form_identifier_not_found') errorMessage = 'Aucun compte trouvé avec cette adresse email';
        else if (ec === 'too_many_requests') errorMessage = 'Trop de tentatives. Réessayez plus tard.';
        else errorMessage = err.errors[0].message || errorMessage;
      }
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code with Clerk before moving to password step
  const onVerifyCode = async () => {
    if (!isLoaded) return;
    if (!validateCodeStep()) return;

    setLoading(true);
    try {
      // Tenter de vérifier le code avec Clerk
      const res = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: 'temp_password_for_verification', // Mot de passe temporaire juste pour la vérification
      });

      // Si le code est correct, on passe à l'étape suivante
      setCurrentStep(3);
      setErrors({});
      Alert.alert('Code vérifié', 'Définissez votre nouveau mot de passe.', [
        { text: 'Continuer', onPress: () => passwordRef.current?.focus() },
      ]);
    } catch (err: any) {
      let errorMessage = 'Code de vérification incorrect';
      if (err.errors?.length) {
        const ec = err.errors[0].code;
        if (ec === 'form_code_incorrect') errorMessage = 'Code de vérification incorrect';
        else if (ec === 'session_exists') {
          // Le code est correct mais il y a déjà une session, on continue
          setCurrentStep(3);
          setErrors({});
          Alert.alert('Code vérifié', 'Définissez votre nouveau mot de passe.', [
            { text: 'Continuer', onPress: () => passwordRef.current?.focus() },
          ]);
          return;
        }
        else errorMessage = err.errors[0].message || errorMessage;
      }
      setErrors({ code: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle code input changes
  const handleCodeChange = (text: string, index: number) => {
    const numeric = text.replace(/[^0-9]/g, '');
    if (numeric.length <= 1) {
      const newCode = code.split('');
      newCode[index] = numeric;
      setCode(newCode.join(''));
      if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
      if (numeric && index < 5) codeRefs.current[index + 1]?.focus();
    }
  };

  // Step 3: Reset password -> activate session if created, then route to app
  const onResetPassword = async () => {
    if (!isLoaded) return;
    if (!validatePasswordStep()) return;

    try {
      setLoading(true);
      setErrors({});

      const res = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: password,
      });

      // Si complete, Clerk retourne souvent createdSessionId => on active et on route
      if (res?.status === 'complete') {
        if (res.createdSessionId) {
          await setActive!({ session: res.createdSessionId });
          router.replace('/(tabs)');
          return;
        }
        // Pas de session ? on renvoie vers auth.
        Alert.alert('Succès', 'Mot de passe réinitialisé. Vous pouvez vous connecter.');
        router.replace('/(auth)/auth');
        return;
      }

      // Status non-complete (rare dans ce flux) : on informe et renvoie auth
      Alert.alert('Information', 'Mot de passe mis à jour. Veuillez vous reconnecter.');
      router.replace('/(auth)/auth');
    } catch (err: any) {
      let errorMessage = "Impossible de réinitialiser le mot de passe";
      if (err.errors?.length) {
        const ec = err.errors[0].code;
        if (ec === 'form_code_incorrect') errorMessage = 'Code de vérification incorrect';
        else if (ec === 'form_password_pwned') errorMessage = 'Mot de passe compromis, choisissez-en un autre.';
        else if (ec === 'form_password_length_too_short') errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
        else errorMessage = err.errors[0].message || errorMessage;
      }
      setErrors({ general: errorMessage });
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!signIn || !email.trim()) return;
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé à votre adresse email.');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de renvoyer le code');
    }
  };

  const goBack = () => {
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
    else router.back();
  };

  // ---- UI (raccourcie : garde l’essentiel et ton style) ----
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={require('../../assets/images/colombage.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.darkOverlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.topHeader}>
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>
                  {currentStep === 1 ? 'Récupération' : currentStep === 2 ? 'Vérification' : 'Nouveau mot de passe'}
                </Text>
                <Text style={styles.mainSubtitle}>
                  {currentStep === 1 ? 'Entrez votre email' : currentStep === 2 ? 'Code de sécurité' : 'Définir le mot de passe'}
                </Text>
              </View>
            </View>

            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.modernProgressContainer}>
                <View style={styles.modernProgressTrack}>
                  <Animated.View
                    style={[
                      styles.modernProgressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['33.33%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressSteps}>
                  {[1, 2, 3].map((step) => (
                    <View key={step} style={[styles.progressStep, currentStep >= step && styles.progressStepActive]}>
                      <Text style={[styles.progressStepText, currentStep >= step && styles.progressStepTextActive]}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formContainer}>
                {currentStep === 1 && (
                  <View style={styles.stepContainer}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="mail-outline" size={48} color="#8B5CF6" />
                    </View>
                    <Text style={styles.subtitle}>Entrez votre adresse email pour recevoir un code de réinitialisation</Text>
                    <View style={styles.form}>
                      <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
                        <TextInput
                          ref={emailRef}
                          style={[styles.input, errors.email && styles.inputError]}
                          placeholder="Email"
                          placeholderTextColor="#9CA3AF"
                          value={email}
                          onChangeText={(t) => { setEmail(t); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          returnKeyType="next"
                          onSubmitEditing={onRequestReset}
                        />
                      </View>
                      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                      <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={onRequestReset} disabled={loading}>
                        <LinearGradient colors={['#8B5CF6', '#8B5CF6']} style={styles.primaryButtonGradient}>
                          {loading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="small" color="#FFFFFF" />
                              <Text style={styles.primaryButtonText}>Envoi en cours...</Text>
                            </View>
                          ) : (
                            <Text style={styles.primaryButtonText}>Envoyer le code</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {currentStep === 2 && (
                  <View style={styles.stepContainer}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="shield-checkmark-outline" size={48} color="#8B5CF6" />
                    </View>
                    <Text style={styles.subtitle}>Entrez le code de vérification à 6 chiffres envoyé à votre email</Text>
                    <View style={styles.form}>
                      <View style={styles.modernCodeContainer}>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <TextInput
                            key={i}
                            style={[styles.modernCodeInput, code[i] && styles.modernCodeInputFilled]}
                            value={code[i] || ''}
                            onChangeText={(txt) => handleCodeChange(txt, i)}
                            keyboardType="numeric"
                            maxLength={1}
                            textAlign="center"
                            ref={(ref) => { if (ref) codeRefs.current[i] = ref; }}
                          />
                        ))}
                      </View>
                      {errors.code ? <Text style={styles.errorText}>{errors.code}</Text> : null}

                      <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={onVerifyCode} disabled={loading}>
                        <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.primaryButtonGradient}>
                          {loading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="small" color="#FFFFFF" />
                              <Text style={styles.primaryButtonText}>Vérification...</Text>
                            </View>
                          ) : (
                            <Text style={styles.primaryButtonText}>Vérifier le code</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.secondaryButton} onPress={onResendCode} disabled={loading}>
                        <Text style={styles.secondaryButtonText}>Renvoyer le code</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {currentStep === 3 && (
                  <View style={styles.stepContainer}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="lock-closed-outline" size={48} color="#8B5CF6" />
                    </View>
                    <Text style={styles.subtitle}>Créez votre nouveau mot de passe</Text>
                    <View style={styles.form}>
                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          ref={passwordRef}
                          style={[styles.modernInput, errors.password && styles.inputError]}
                          placeholder="Nouveau mot de passe"
                          placeholderTextColor="#9CA3AF"
                          value={password}
                          onChangeText={(t) => { setPassword(t); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          returnKeyType="next"
                          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8B5CF6" />
                        </TouchableOpacity>
                      </View>
                      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                      <View style={styles.passwordInputContainer}>
                        <TextInput
                          ref={confirmPasswordRef}
                          style={[styles.modernInput, errors.confirmPassword && styles.inputError]}
                          placeholder="Confirmer le mot de passe"
                          placeholderTextColor="#9CA3AF"
                          value={confirmPassword}
                          onChangeText={(t) => { setConfirmPassword(t); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' })); }}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={onResetPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                          <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#8B5CF6" />
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                      {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

                      <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={onResetPassword} disabled={loading}>
                        <LinearGradient colors={['#8B5CF6', '#8B5CF6']} style={styles.primaryButtonGradient}>
                          {loading ? (
                            <View style={styles.loadingContainer}>
                              <ActivityIndicator size="small" color="#FFFFFF" />
                              <Text style={styles.primaryButtonText}>Mise à jour...</Text>
                            </View>
                          ) : (
                            <Text style={styles.primaryButtonText}>Réinitialiser le mot de passe</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// --- Styles (tu peux réutiliser les tiens) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F23' },
  backgroundImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  darkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  topHeader: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 30 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  titleContainer: { alignItems: 'center' },
  mainTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  mainSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  contentContainer: { flex: 1, paddingHorizontal: 20 },
  modernProgressContainer: { paddingHorizontal: 24, paddingVertical: 20 },
  modernProgressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  modernProgressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 2 },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStep: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  progressStepActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  progressStepText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  progressStepTextActive: { color: '#FFFFFF' },
  formContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  stepContainer: { paddingVertical: 32, alignItems: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(139,92,246,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(139,92,246,0.3)' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 16 },
  form: { width: '100%' },
  modernInput: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: '#374151', borderWidth: 2, borderColor: '#E5E7EB', marginBottom: 16 },
  modernCodeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 24, paddingHorizontal: 10, gap: 8 },
  modernCodeInput: { width: 45, height: 60, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E7EB', textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#374151' },
  modernCodeInputFilled: { borderColor: '#10B981', backgroundColor: '#FFFFFF' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 50 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#333', backgroundColor: 'transparent' },
  passwordInputContainer: { position: 'relative', marginBottom: 16 },
  eyeButton: { position: 'absolute', right: 16, top: 16, padding: 4, zIndex: 1 },
  inputError: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 16, paddingVertical: 16, marginTop: 16 },
  secondaryButtonText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  errorText: { color: '#8B5CF6', fontSize: 12, marginBottom: 16, marginLeft: 4 },
  primaryButton: { borderRadius: 16, marginBottom: 16, marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
});
