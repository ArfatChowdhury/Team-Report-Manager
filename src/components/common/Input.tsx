import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextInputProps 
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  containerStyle, 
  ...props 
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer, 
        error ? styles.inputError : null,
        props.multiline ? styles.inputContainerMultiline : null
      ]}>
        <TextInput
          style={[
            styles.input,
            props.multiline ? styles.inputMultiline : null,
            props.style // Allow custom style overrides
          ]}
          placeholderTextColor="#94A3B8"
          textAlignVertical={props.multiline ? 'top' : 'center'}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  inputContainer: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputContainerMultiline: {
    height: 'auto',
    minHeight: 100,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputMultiline: {
    minHeight: 80,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
