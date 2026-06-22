/**
 * ASH POINT POS - MAIN ORCHESTRATOR
 * Enterprise Retail Command System
 */

import { useAppStore } from './store/app-store.v3';
import { LoginScreen } from './components/LoginScreen';
import { POSTerminal } from './components/POSTerminal';
import { BackOffice } from './components/BackOffice';
import { GodModeScreen } from './components/GodModeScreen';

function App() {
  const { currentScreen } = useAppStore();

  return (
    <>
      {currentScreen === 'login' && <LoginScreen />}
      {currentScreen === 'pos' && <POSTerminal />}
      {currentScreen === 'backoffice' && <BackOffice />}
      {currentScreen === 'god-mode' && <GodModeScreen />}
    </>
  );
}

export default App;
