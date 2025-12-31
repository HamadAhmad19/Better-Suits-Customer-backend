import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoadScreen from './components/LoadScreen';
import HomeScreen from './components/HomeScreen';
import GetStartedScreen from './components/GetStartedScreen';
import SkipScreen from './components/SkipScreen';
import OtpCodeScreen from './components/OtpCodeScreen';
import PasswordScreen from './components/PasswordScreen';
import DataScreen from './components/DataScreen';
import SuccessScreen from './components/SuccessScreen';
import MapScreen from './components/MapScreen';
import UserPasswordScreen from './components/UserPasswordScreen';
import ProfileScreen from './components/ProfileScreen';
import AnnouncementScreen from './components/AnnoucementScreen';
import WalletScreen from './components/WalletScreen';
import FavoriteLocationScreen from './components/FavoriteLocationScreen';
import ScheduleRideScreen from './components/SceduleRideScreen';
import HistoryScreen from './components/HistoryScreen';
import SettingScreen from './components/SettingScreen';
import ProfileInfoScreen from './components/ProfileInfoScreen';
import { PaymentMethodsScreen } from './components/PaymentScreen';
import TaxiScreen from './components/TaxiScreen';
import PickupScreen from './components/PickupScreen';
import DropoffScreen from './components/DropoffScreen';
import RouteScreen from './components/RouteScreen';
import OtpCode2Screen from './components/OtpCode2Screen';
import SelectLocationScreen from './components/SelectLocationScreen';
import DeliveryScreen from './components/DeliveryScreen';
import SenderScreen from './components/SenderScreen';
import RecipentScreen from './components/RecipentScreen';
import RecipentAddScreen from './components/RecipentAddScreen';
import DeliveryRouteScreen from './components/DeliveryRouteScreen';
import ActiveDeliveryScreen from './components/ActiveDeliveryScreen';
import ConfirmRideScreen from './components/ConfirmRideScreen';
import TaxiLaterScreen from './components/TaxiLaterScreen';
import TimeScreen from './components/TimeScreen';
import PickupLaterScreen from './components/PickupLater';
import DropoffLaterScreen from './components/DropoffLater';
import RouteLaterScreen from './components/RouteLaterScreen';
import ConfirmLaterScreen from './components/ConfirmLaterScreen';
import SaveHomeScreen from './components/SaveHomeScreen';
import HomeLocationScreen from './components/HomLocationScreen';
import SaveWorkScreen from './components/SaveWorkScreen';
import WorkLocationScreen from './components/WorkLocationScreen';
import * as SplashScreen from 'expo-splash-screen';
import SelectFavoriteScreen from './components/SelectFavoriteScreen';
import FavoriteMapScreen from './components/FavoriteMapScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
const Stack = createStackNavigator();
SplashScreen.preventAutoHideAsync();

const AuthNavigator = () => (
  <Stack.Navigator>

    <Stack.Screen
      name="Load"
      component={LoadScreen}
      options={{ headerShown: false }} // This hides the header
    />

    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />


    <Stack.Screen
      name="Started"
      component={GetStartedScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Skip"
      component={SkipScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />

    <Stack.Screen
      name="Otp"
      component={OtpCodeScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Password"
      component={PasswordScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />

    <Stack.Screen
      name="UserPassword"
      component={UserPasswordScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />

    <Stack.Screen
      name="Otp2"
      component={OtpCode2Screen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="AddData"
      component={DataScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />

    <Stack.Screen
      name="SuccessLogin"
      component={SuccessScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
  </Stack.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator >


    <Stack.Screen
      name="MapPage"
      component={MapScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="ActiveDelivery"
      component={ActiveDeliveryScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Announcements"
      component={AnnouncementScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Wallet"
      component={WalletScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Favorites"
      component={FavoriteLocationScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="SelectLocation"
      component={SelectLocationScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="SelectFavorite"
      component={SelectFavoriteScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="FavoriteMap"
      component={FavoriteMapScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Scheduled"
      component={ScheduleRideScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="History"
      component={HistoryScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Settings"
      component={SettingScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="ProfileInfo"
      component={ProfileInfoScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="PaymentMethods"
      component={PaymentMethodsScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Taxi"
      component={TaxiScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="TaxiLater"
      component={TaxiLaterScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />

    <Stack.Screen
      name="Pickup"
      component={PickupScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Dropoff"
      component={DropoffScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="ShowRoute"
      component={RouteScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="ConfirmRide"
      component={ConfirmRideScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="PickupLater"
      component={PickupLaterScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="DropoffLater"
      component={DropoffLaterScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Time"
      component={TimeScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="RouteLater"
      component={RouteLaterScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="ConfirmRideLater"
      component={ConfirmLaterScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Delivery"
      component={DeliveryScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Sender"
      component={SenderScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="Recipent"
      component={RecipentScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="RecipentAddress"
      component={RecipentAddScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="DeliveryRoute"
      component={DeliveryRouteScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="SaveHome"
      component={SaveHomeScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="HomeLocation"
      component={HomeLocationScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="SaveWork"
      component={SaveWorkScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
    <Stack.Screen
      name="WorkLocation"
      component={WorkLocationScreen}
      options={{ headerShown: false }} // Hide header for Home too
    />
  </Stack.Navigator>
);
const AppContent = () => {
  const { user } = useAuth();

  return user ? <MainNavigator /> : <AuthNavigator />;
};

const App = () => {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100); // Hide very quickly
  }, []);
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;



