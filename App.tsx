import { StatusBar } from 'expo-status-bar';
import { DiarioProvider } from './src/context/DiarioContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App(): React.JSX.Element {
  return (
    <DiarioProvider>
      <RootNavigator />
      <StatusBar style="light" />
    </DiarioProvider>
  );
}
