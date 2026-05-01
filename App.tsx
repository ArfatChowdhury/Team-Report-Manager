import React from 'react';
import { Provider } from 'react-redux';
import * as RN from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RN.View style={{ flex: 1, backgroundColor: '#020617' }}>
          <RN.StatusBar barStyle="light-content" backgroundColor="#020617" />
          <RootNavigator />
        </RN.View>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
