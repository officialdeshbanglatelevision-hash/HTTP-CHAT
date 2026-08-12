import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { MediaUploadProvider } from './hooks/useMediaUpload';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/Toast';
import { CallOverlay } from './components/common/CallOverlay';
import { AnimatePresence, motion } from 'motion/react';
import { UploadQueueBanner } from './components/chat/UploadQueueBanner';

// Modals
import { NewGroupModal } from './components/modals/NewGroupModal';
import { NewCommunityModal } from './components/modals/NewCommunityModal';
import { AddContactModal } from './components/modals/AddContactModal';
import { LanguageModal } from './components/modals/LanguageModal';

// Auth Screens
import { SplashScreen } from './screens/auth/SplashScreen';
import { WelcomeScreen } from './screens/auth/WelcomeScreen';
import { PhoneLoginScreen } from './screens/auth/PhoneLoginScreen';
import { OtpVerificationScreen } from './screens/auth/OtpVerificationScreen';
import { EmailLoginScreen } from './screens/auth/EmailLoginScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { ProfileSetupScreen } from './screens/auth/ProfileSetupScreen';

// Main App Screens
import { ChatsScreen } from './screens/ChatsScreen';
import { UpdatesScreen } from './screens/UpdatesScreen';
import { CommunitiesScreen } from './screens/CommunitiesScreen';
import { CallsScreen } from './screens/CallsScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { NewChatScreen } from './screens/NewChatScreen';
import { IndividualChatScreen } from './screens/IndividualChatScreen';
import { GroupChatScreen } from './screens/GroupChatScreen';
import { ChatInfoScreen } from './screens/ChatInfoScreen';
import { MediaViewerScreen } from './screens/MediaViewerScreen';
import { SearchScreen } from './screens/SearchScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import { SecurityScreen } from './screens/SecurityScreen';
import { StorageScreen } from './screens/StorageScreen';
import { MediaQualityScreen } from './screens/MediaQualityScreen';
import { AppearanceScreen } from './screens/AppearanceScreen';
import { HelpScreen } from './screens/HelpScreen';
import { AboutScreen } from './screens/AboutScreen';
import { ErrorStateScreen } from './screens/ErrorStateScreen';
import { QRProfileScreen } from './screens/QRProfileScreen';
import { ScanQRScreen } from './screens/ScanQRScreen';
import { LinkedDevicesScreen } from './screens/LinkedDevicesScreen';
import { SecondaryLinkDeviceScreen } from './screens/SecondaryLinkDeviceScreen';
import { AccountSettingsScreen } from './screens/AccountSettingsScreen';
import { SecurityActivityScreen } from './screens/SecurityActivityScreen';
import { FindPeopleScreen } from './screens/FindPeopleScreen';
import { WallpaperScreen } from './screens/WallpaperScreen';
import { StickersScreen } from './screens/StickersScreen';
import { PermissionsScreen } from './screens/PermissionsScreen';
import { CameraTestScreen } from './screens/CameraTestScreen';
import { MicTestScreen } from './screens/MicTestScreen';
import { NotificationDebugScreen } from './screens/NotificationDebugScreen';

const MainAppContent: React.FC = () => {
  const { activeScreen } = useTheme();
  const { loading, currentUser, userProfile } = useAuth();

  const [phoneAuthData, setPhoneAuthData] = useState<{
    confirmationResult: any;
    phone: string;
  }>({ confirmationResult: null, phone: '' });

  // Modals state
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newCommunityOpen, setNewCommunityOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  // 1. SPLASH / AUTH INITIALIZATION STATE
  if (loading) {
    return <SplashScreen />;
  }

  // 2. UNAUTHENTICATED USER FLOW
  if (!currentUser) {
    const renderAuthScreen = () => {
      switch (activeScreen) {
        case 'welcome':
          return <WelcomeScreen />;
        case 'phone_login':
          return (
            <PhoneLoginScreen
              onOtpSent={(confirmation, phone) => {
                setPhoneAuthData({ confirmationResult: confirmation, phone });
              }}
            />
          );
        case 'otp_verification':
          return (
            <OtpVerificationScreen
              confirmationResult={phoneAuthData.confirmationResult}
              phone={phoneAuthData.phone}
            />
          );
        case 'email_login':
          return <EmailLoginScreen />;
        case 'register':
          return <RegisterScreen />;
        case 'forgot_password':
          return <ForgotPasswordScreen />;
        case 'link_secondary':
          return <SecondaryLinkDeviceScreen />;
        default:
          return <WelcomeScreen />;
      }
    };

    return (
      <div className="flex h-screen w-full bg-slate-950 text-white antialiased overflow-hidden justify-center items-center">
        <div className="w-full h-full max-w-md mx-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderAuthScreen()}
            </motion.div>
          </AnimatePresence>
          <ToastContainer />
        </div>
      </div>
    );
  }

  // 3. AUTHENTICATED NEW USER PROFILE SETUP FLOW
  const needsProfileSetup =
    !userProfile?.username ||
    userProfile.username.startsWith('user_') ||
    activeScreen === 'profile_setup';

  if (needsProfileSetup) {
    return (
      <div className="flex h-screen w-full bg-slate-950 text-white antialiased overflow-hidden justify-center items-center">
        <div className="w-full h-full max-w-md mx-auto relative">
          <ProfileSetupScreen />
          <ToastContainer />
        </div>
      </div>
    );
  }

  // 4. MAIN CHAT APPLICATION FLOW
  const renderMainScreen = () => {
    switch (activeScreen) {
      case 'chats':
        return <ChatsScreen onOpenNewGroupModal={() => setNewGroupOpen(true)} />;
      case 'updates':
        return <UpdatesScreen />;
      case 'communities':
        return (
          <CommunitiesScreen
            onOpenNewCommunityModal={() => setNewCommunityOpen(true)}
          />
        );
      case 'calls':
        return <CallsScreen />;
      case 'contacts':
        return (
          <ContactsScreen
            onOpenAddContactModal={() => setAddContactOpen(true)}
            onOpenNewGroupModal={() => setNewGroupOpen(true)}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            onOpenLanguageModal={() => setLanguageModalOpen(true)}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      case 'new_chat':
        return (
          <NewChatScreen
            onOpenAddContactModal={() => setAddContactOpen(true)}
            onOpenNewGroupModal={() => setNewGroupOpen(true)}
            onOpenNewCommunityModal={() => setNewCommunityOpen(true)}
          />
        );
      case 'individual_chat':
        return <IndividualChatScreen />;
      case 'group_chat':
        return <GroupChatScreen />;
      case 'chat_info':
        return <ChatInfoScreen />;
      case 'media_viewer':
        return <MediaViewerScreen />;
      case 'search':
        return <SearchScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'privacy':
        return <PrivacyScreen />;
      case 'security':
        return <SecurityScreen />;
      case 'storage':
      case 'manage_storage':
        return <StorageScreen />;
      case 'media_quality':
        return <MediaQualityScreen />;
      case 'appearance':
        return <AppearanceScreen />;
      case 'help':
        return <HelpScreen />;
      case 'about':
        return <AboutScreen />;
      case 'error_demo':
        return <ErrorStateScreen />;
      case 'qr_profile':
        return <QRProfileScreen />;
      case 'scan_qr':
        return <ScanQRScreen />;
      case 'linked_devices':
        return <LinkedDevicesScreen />;
      case 'link_secondary':
        return <SecondaryLinkDeviceScreen />;
      case 'account_settings':
        return <AccountSettingsScreen />;
      case 'security_activity':
        return <SecurityActivityScreen />;
      case 'find_people':
        return <FindPeopleScreen />;
      case 'wallpaper':
        return <WallpaperScreen />;
      case 'stickers':
        return <StickersScreen />;
      case 'permissions':
        return <PermissionsScreen />;
      case 'camera_test':
        return <CameraTestScreen />;
      case 'mic_test':
        return <MicTestScreen />;
      case 'notification_debug':
        return <NotificationDebugScreen />;
      default:
        return <ChatsScreen onOpenNewGroupModal={() => setNewGroupOpen(true)} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto pb-16 md:pb-0 scrollbar-thin">
        <Header
          onOpenNewGroupModal={() => setNewGroupOpen(true)}
          onOpenNewCommunityModal={() => setNewCommunityOpen(true)}
        />

        <main className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              {renderMainScreen()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Upload Queue Overlay Banner */}
      <UploadQueueBanner />

      {/* Realtime Call Overlay */}
      <CallOverlay />

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Modals */}
      <NewGroupModal
        isOpen={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
      />
      <NewCommunityModal
        isOpen={newCommunityOpen}
        onClose={() => setNewCommunityOpen(false)}
      />
      <AddContactModal
        isOpen={addContactOpen}
        onClose={() => setAddContactOpen(false)}
      />
      <LanguageModal
        isOpen={languageModalOpen}
        onClose={() => setLanguageModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <ThemeProvider>
          <MediaUploadProvider>
            <MainAppContent />
          </MediaUploadProvider>
        </ThemeProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
