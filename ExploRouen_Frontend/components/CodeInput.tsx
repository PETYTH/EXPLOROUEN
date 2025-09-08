import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';

interface CodeInputProps {
  length: number;
  onCodeChange: (code: string) => void;
  value?: string;
  error?: string;
  autoFocus?: boolean;
}

export default function CodeInput({ length, onCodeChange, value = '', error, autoFocus = true }: CodeInputProps) {
  const [code, setCode] = useState(value);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    setCode(value);
  }, [value]);

  const handleChangeText = (text: string, index: number) => {
    // Filtrer seulement les chiffres
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Gérer la saisie de plusieurs chiffres
      const digits = numericText.split('');
      const newCode = code.split('');
      
      // Remplir les champs à partir de l'index actuel
      for (let i = 0; i < digits.length && (index + i) < length; i++) {
        newCode[index + i] = digits[i];
      }
      
      const updatedCode = newCode.join('');
      setCode(updatedCode);
      onCodeChange(updatedCode);
      
      // Focus sur le prochain champ vide ou le dernier
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      // Saisie d'un seul chiffre
      const newCode = code.split('');
      newCode[index] = numericText;
      const updatedCode = newCode.join('');
      
      setCode(updatedCode);
      onCodeChange(updatedCode);

      // Auto-focus sur le champ suivant si un chiffre est saisi
      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Gérer la suppression de droite à gauche
    if (key === 'Backspace') {
      const codeArray = code.split('');
      
      // Trouver le dernier chiffre rempli (de droite à gauche)
      let lastFilledIndex = -1;
      for (let i = length - 1; i >= 0; i--) {
        if (codeArray[i]) {
          lastFilledIndex = i;
          break;
        }
      }
      
      if (lastFilledIndex >= 0) {
        // Supprimer le dernier chiffre rempli
        codeArray[lastFilledIndex] = '';
        const updatedCode = codeArray.join('');
        setCode(updatedCode);
        onCodeChange(updatedCode);
        
        // Focus sur le champ qui vient d'être vidé
        inputRefs.current[lastFilledIndex]?.focus();
      }
    }
  };

  return (
    <View>
      <View style={styles.container}>
        {Array.from({ length }, (_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              code[index] ? styles.inputFilled : styles.inputEmpty,
              error ? styles.inputError : null
            ]}
            value={code[index] || ''}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="numeric"
            maxLength={10} // Permettre la saisie de plusieurs chiffres
            textAlign="center"
            selectTextOnFocus
            autoFocus={autoFocus && index === 0}
          />
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  input: {
    width: 45,
    height: 60,
    borderRadius: 16, // Correspondre aux boutons de contact (borderRadius: 16)
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputEmpty: {
    borderColor: '#E5E7EB',
  },
  inputFilled: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  errorText: {
    color: '#8B5CF6',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    textAlign: 'center',
  },
});
