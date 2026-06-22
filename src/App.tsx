/**
 * ASH POINT POS - MAIN ORCHESTRATOR
 * Enterprise Retail Command System
 */

import { useAppStore } from './store/app-store';
import { LoginScreen } from './components/LoginScreen';
import { POSScreen } from './components/POSScreen.v2';
import { BackOffice } from './components/BackOffice';
import { GodModeScreen } from './components/GodModeScreen';

function App() {
  const { currentScreen } = useAppStore();

  return (
    <>
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'pos' && <POSScreen />}
      {currentScreen === 'backoffice' && <BackOffice />}
      {currentScreen === 'god-mode' && <GodModeScreen />}
    </>
  );
}

export default App;
