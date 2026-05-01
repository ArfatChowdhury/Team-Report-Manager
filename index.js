import 'react-native-gesture-handler';
/**
 * @format
 */

import { AppRegistry, Text, TextInput } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Global UI Consistency: Prevent layout breaks from system font scaling
if (Text.defaultProps) {
  Text.defaultProps.allowFontScaling = false;
} else {
  Text.defaultProps = { allowFontScaling: false };
}

if (TextInput.defaultProps) {
  TextInput.defaultProps.allowFontScaling = false;
} else {
  TextInput.defaultProps = { allowFontScaling: false };
}

AppRegistry.registerComponent(appName, () => App);
