import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ImageCaptchaProps {
  onVerify: (isValid: boolean) => void;
  onRefresh?: () => void;
}

interface CaptchaChallenge {
  id: string;
  question: string;
  images: string[];
  correctAnswers: number[];
}

const { width } = Dimensions.get('window');

export default function ImageCaptcha({ onVerify, onRefresh }: ImageCaptchaProps) {
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<CaptchaChallenge | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Captcha data avec images d'Unsplash - 9 images par défi, 3 bonnes réponses
  const captchaData = [
    {
      question: "Sélectionnez toutes les images contenant des voitures",
      correctAnswers: [0, 3, 6],
      images: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop', // nature
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop', // nature
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop' // bicycle
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des chiens",
      correctAnswers: [1, 4, 7],
      images: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop', // nature
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=150&h=150&fit=crop' // car
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des fleurs",
      correctAnswers: [2, 5, 8],
      images: [
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop', // nature
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' // flowers
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des bâtiments",
      correctAnswers: [0, 4, 7],
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop', // nature
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop' // flowers
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des feux de circulation",
      correctAnswers: [1, 3, 6],
      images: [
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop', // traffic light
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?w=150&h=150&fit=crop', // traffic light
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop', // traffic light
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop' // nature
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des vélos",
      correctAnswers: [0, 4, 8],
      images: [
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop', // traffic light
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop', // nature
        'https://images.unsplash.com/photo-1544191696-15693072e0c5?w=150&h=150&fit=crop' // bicycle
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des panneaux de signalisation",
      correctAnswers: [2, 5, 7],
      images: [
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=150&h=150&fit=crop', // sign
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?w=150&h=150&fit=crop', // sign
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop', // sign
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop' // nature
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des bus",
      correctAnswers: [1, 4, 6],
      images: [
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&h=150&fit=crop', // bus
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=150&h=150&fit=crop', // bus
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150&h=150&fit=crop', // bus
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop' // nature
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des ponts",
      correctAnswers: [0, 3, 7],
      images: [
        'https://images.unsplash.com/photo-1520637836862-4d197d17c52a?w=150&h=150&fit=crop', // bridge
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1520637836862-4d197d17c52a?w=150&h=150&fit=crop', // bridge
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1520637836862-4d197d17c52a?w=150&h=150&fit=crop', // bridge
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop' // nature
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des arbres",
      correctAnswers: [2, 5, 8],
      images: [
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop', // tree
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=150&h=150&fit=crop', // tree
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1520637836862-4d197d17c52a?w=150&h=150&fit=crop', // bridge
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=150&h=150&fit=crop' // tree
      ]
    },
    {
      question: "Sélectionnez toutes les images contenant des motos",
      correctAnswers: [1, 4, 6],
      images: [
        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop', // dog
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop', // motorcycle
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=150&fit=crop', // car
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop', // building
        'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=150&h=150&fit=crop', // motorcycle
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=150&h=150&fit=crop', // flowers
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop', // motorcycle
        'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=150&h=150&fit=crop', // bicycle
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=150&fit=crop' // nature
      ]
    }
  ];


  useEffect(() => {
    generateNewChallenge();
  }, []);

  const generateNewChallenge = () => {
    const randomIndex = Math.floor(Math.random() * captchaData.length);
    const selectedChallenge = captchaData[randomIndex];
    
    setCurrentChallenge({
      id: `challenge_${randomIndex}`,
      question: selectedChallenge.question,
      images: selectedChallenge.images,
      correctAnswers: selectedChallenge.correctAnswers
    });
    
    setSelectedImages([]);
    setIsVerified(false);
  };

  const handleRobotCheck = () => {
    if (!isRobotChecked) {
      setIsRobotChecked(true);
      setShowModal(true);
      generateNewChallenge();
    }
  };

  const toggleImageSelection = (index: number) => {
    if (isVerified) return;

    setSelectedImages(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const verifySelection = () => {
    if (!currentChallenge) return;

    setIsLoading(true);
    
    // Simuler un délai de vérification
    setTimeout(() => {
      const isCorrect = 
        selectedImages.length === currentChallenge.correctAnswers.length &&
        selectedImages.every(index => currentChallenge.correctAnswers.includes(index)) &&
        currentChallenge.correctAnswers.every(index => selectedImages.includes(index));

      setIsVerified(isCorrect);
      setIsLoading(false);
      
      if (isCorrect) {
        setTimeout(() => {
          setShowModal(false);
          onVerify(true);
        }, 1500);
      } else {
        Alert.alert('Erreur', 'Sélection incorrecte. Veuillez réessayer.', [
          { text: 'OK', onPress: () => generateNewChallenge() }
        ]);
      }
    }, 1000);
  };

  const refreshChallenge = () => {
    generateNewChallenge();
    onRefresh?.();
  };

  const closeModal = () => {
    setShowModal(false);
    setIsRobotChecked(false);
    onVerify(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={handleRobotCheck}
        disabled={isVerified && !showModal}
      >
        <View style={[styles.checkbox, isRobotChecked && isVerified && styles.checkboxVerified]}>
          {isRobotChecked && isVerified && (
            <Ionicons name="checkmark" size={16} color="#10B981" />
          )}
        </View>
        <Text style={styles.checkboxText}>Je ne suis pas un robot</Text>
        <View style={styles.captchaLogo}>
          <Text style={styles.captchaLogoText}>reCAPTCHA</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vérification de sécurité</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {currentChallenge && (
              <>
                <View style={styles.questionContainer}>
                  <Text style={styles.question}>{currentChallenge.question}</Text>
                  <TouchableOpacity onPress={refreshChallenge} style={styles.refreshButton}>
                    <Ionicons name="refresh-outline" size={20} color="#8B5CF6" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.imageScrollView}>
                  <View style={styles.imageGrid}>
                    {currentChallenge.images.map((imageUrl, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.imageItem,
                          selectedImages.includes(index) && styles.selectedImage,
                          isVerified && currentChallenge.correctAnswers.includes(index) && styles.correctImage,
                          isVerified && selectedImages.includes(index) && !currentChallenge.correctAnswers.includes(index) && styles.incorrectImage,
                        ]}
                        onPress={() => toggleImageSelection(index)}
                        disabled={isVerified || isLoading}
                      >
                        <Image 
                          source={{ uri: imageUrl }} 
                          style={styles.captchaImage}
                        />
                        {selectedImages.includes(index) && (
                          <View style={styles.checkmark}>
                            <Ionicons 
                              name="checkmark" 
                              size={16} 
                              color={isVerified ? (currentChallenge.correctAnswers.includes(index) ? "#10B981" : "#EF4444") : "#8B5CF6"} 
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  {!isVerified && (
                    <TouchableOpacity 
                      style={[styles.verifyButton, (selectedImages.length === 0 || isLoading) && styles.verifyButtonDisabled]}
                      onPress={verifySelection}
                      disabled={selectedImages.length === 0 || isLoading}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#8B5CF6']}
                        style={styles.verifyButtonGradient}
                      >
                        <Text style={styles.verifyButtonText}>
                          {isLoading ? 'Vérification...' : 'Vérifier'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {isVerified && (
                    <View style={styles.successContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      <Text style={styles.successText}>Vérification réussie !</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxVerified: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  captchaLogo: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  captchaLogoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#8B5CF6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  question: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
  },
  imageScrollView: {
    maxHeight: 300,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  imageItem: {
    width: (width * 0.9 - 48) / 3,
    height: 80,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedImage: {
    borderColor: '#8B5CF6',
  },
  correctImage: {
    borderColor: '#10B981',
  },
  incorrectImage: {
    borderColor: '#EF4444',
  },
  captchaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  verifyButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  successText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
