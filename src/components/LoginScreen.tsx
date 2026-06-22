/**
 * LOGIN FORTRESS
 * With hidden Ctrl+Shift+F12 God Mode interceptor
 */

import { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { db } from '../lib/db';
import { generateHardwareFingerprint, validateAMCExpiry } from '../lib/hardware-fingerprint';
import { getUserByPin, seedDefaultUsers } from '../lib/db-extended';
import { useAppStore } from '../store/app-store.v3';

export function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { setAuthenticated, setScreen } = useAppStore();

  // God Mode Interceptor
  useEffect(() => {
    const handleGodMode = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F12') {
        e.preventDefault();
        setScreen('god-mode');
      }
    };

    window.addEventListener('keydown', handleGodMode);
    return () => window.removeEventListener('keydown', handleGodMode);
  }, [setScreen]);

  // Initialize database and check AMC
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize DB with default password (for demo)
        await db.init('ash-point-master-key');
        
        // Seed default users if none exist
        await seedDefaultUsers();
        
        // Check if settings exist
        let settings = await db.getSettings();
        
        if (!settings) {
          // First time setup - generate hardware fingerprint
          const fingerprint = await generateHardwareFingerprint();
          
          // Demo: Set AMC expiry to 1 year from now
          const amcExpiry = Date.now() + (365 * 24 * 60 * 60 * 1000);
          
          settings = {
            id: '1',
            hardware_fingerprint: fingerprint,
            amc_expiry_date: amcExpiry,
            license_key: fingerprint.substring(0, 16).toUpperCase(),
            allow_stock_adjustments: true,
            enable_purchase_orders: false,
            enable_return_to_vendor: false,
            enable_loyalty_program: false,
            business: {
              store_name: 'Ash Point Store',
              address_line1: '123 Main Street',
              city: 'Business City',
              phone_number: '+1234567890',
              footer_text: 'Powered by Ash Point Solutions',
            },
            thermal_printer: {
              enabled: false,
              driver_type: 'ESC_POS',
              paper_width: 80,
              baud_rate: 9600,
            },
            cash_drawer: {
              enabled: false,
              connection_type: 'RJ11',
              kick_code: '1B7000FA',
            },
            smtp: {
              enabled: false,
              server: '',
              port: 587,
              sender_email: '',
              sender_password: '',
              auto_send_zreport: false,
              recipient_emails: [],
            },
            tax_config: {
              vat_enabled: false,
              vat_rate: 15,
              vat_inclusive: true,
              sscl_enabled: false,
              sscl_rate: 0,
            },
            costing_method: 'FIFO',
            cloud_sync: {
              enabled: false,
              sync_interval_minutes: 60,
            },
          };
          
          await db.updateSettings(settings);
        }
        
        // Validate hardware fingerprint
        const currentFingerprint = await generateHardwareFingerprint();
        if (currentFingerprint !== settings.hardware_fingerprint) {
          setError('HARDWARE MISMATCH: This license is locked to different hardware.');
          setIsInitializing(false);
          return;
        }
        
        // Validate AMC expiry
        if (!validateAMCExpiry(settings.amc_expiry_date)) {
          setError('AMC EXPIRED: Please contact your service provider.');
          setIsInitializing(false);
          return;
        }
        
        setIsInitializing(false);
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to initialize database');
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  const handleLogin = async () => {
    if (!pin) {
      setError('Please enter PIN');
      return;
    }

    try {
      // Dynamic user lookup from database
      const user = await getUserByPin(pin);
      
      if (!user) {
        setError('Invalid PIN - Access Denied');
        setPin('');
        return;
      }
      
      if (!user.is_active) {
        setError('Account Disabled - Contact Admin');
        setPin('');
        return;
      }
      
      // Store user info in state and authenticate
      setAuthenticated(user.name, user.pin, user.role);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-700 dark:text-gray-300">Initializing Secure Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-2xl shadow-blue-500/30 mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Ash Point POS
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Enterprise Retail Command</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              error={error}
              maxLength={4}
              autoFocus
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Lock}
            onClick={handleLogin}
            className="w-full"
          >
            Unlock
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Protected by AES-256 encryption
            </p>
          </div>
        </div>

        {/* Hidden Hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            v2.0.0 | Silicon AMC Active
          </p>
        </div>
      </div>
    </div>
  );
}
