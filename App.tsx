import { StatusBar } from 'expo-status-bar';
import { DiarioProvider } from './src/context/DiarioContext';
import { SesionProvider } from './src/context/SesionContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App(): React.JSX.Element {
  return (
    <SesionProvider>
      <DiarioProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </DiarioProvider>
    </SesionProvider>
  );
}
