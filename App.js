import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts } from 'expo-font';

import { ColorPicker } from 'react-native-color-picker';
import Slider from '@react-native-community/slider';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as SplashScreen from 'expo-splash-screen';
import { Image, Animated } from 'react-native';

const Tab = createBottomTabNavigator();
SplashScreen.preventAutoHideAsync();

const InvisibleSlider = ({ value, onValueChange }) => {
  React.useEffect(() => {
    if (onValueChange) {
      onValueChange(1);
    }
  }, [onValueChange]);

  return <View style={{ height: 0, width: 0 }} />;
};

ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);

function DevicesScreen() {
  const [addingDevice, setAddingDevice] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState('');
  const [devicePlace, setDevicePlace] = React.useState('');
  const [deviceCommand, setDeviceCommand] = React.useState('');
  const [color, setColor] = React.useState('#ffffff');
  const [pickerVisible, setPickerVisible] = React.useState(false);

  const [devices, setDevices] = React.useState([]);

  React.useEffect(() => {
    const loadDevices = async () => {
      try {
        const stored = await AsyncStorage.getItem('DEVICES');
        if (stored) {
          setDevices(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load devices', e);
      }
    };

    loadDevices();
  }, []);

  React.useEffect(() => {
    const saveDevices = async () => {
      try {
        await AsyncStorage.setItem('DEVICES', JSON.stringify(devices));
      } catch (e) {
        console.error('Failed to save devices', e);
      }
    };

    saveDevices();
  }, [devices]);

  if (addingDevice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>New device</Text>
        </View>

        <View style={styles.main}>
          <TextInput
            placeholder="Name"
            value={deviceName}
            onChangeText={setDeviceName}
            style={styles.inputBar}
            placeholderTextColor="gray"
          />
          <TextInput
            placeholder="Place"
            value={devicePlace}
            onChangeText={setDevicePlace}
            style={styles.inputBar}
            placeholderTextColor="gray"
          />
          <TextInput
            placeholder="Command"
            value={deviceCommand}
            onChangeText={setDeviceCommand}
            style={styles.inputBar}
            placeholderTextColor="gray"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Color</Text>
          <TouchableOpacity
            style={[styles.colorSquare, { backgroundColor: color }]}
            onPress={() => setPickerVisible(true)}
          />

          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setAddingDevice(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                setDevices((prev) => [
                  ...prev,
                  {
                    name: deviceName,
                    place: devicePlace,
                    color,
                  },
                ]);

                setDeviceName('');
                setDevicePlace('');
                setDeviceCommand('');
                setColor('#ffffff');

                setAddingDevice(false);
              }}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={pickerVisible}
            transparent={false}
            animationType="slide">
            <SafeAreaView style={{ flex: 1 }}>
              <ColorPicker
                defaultColor="#ff0000"
                style={{ flex: 1 }}
                sliderComponent={Slider}
                onColorSelected={(selectedColor) => {
                  setColor(selectedColor);
                  setPickerVisible(false);
                }}
                hideSliders={true}
              />
              <Pressable
                style={{
                  backgroundColor: 'black',
                  padding: 12,
                  alignItems: 'center',
                }}
                onPress={() => setPickerVisible(false)}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  Close
                </Text>
              </Pressable>
            </SafeAreaView>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Devices</Text>
      </View>
      <View style={[styles.main, styles.grid]}>
        {devices.map((device, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.deviceButton, { backgroundColor: device.color }]}
            onPress={() => {
              console.log('Pressed device:', device.name);
            }}>
            <Text style={styles.deviceText}>{device.name}</Text>
            <Text style={styles.deviceSubText}>{device.place}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddingDevice(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ConnectionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Connection</Text>
      </View>
      <View style={styles.main} />
    </SafeAreaView>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require('./assets/fonts/Comic_Sans_MS.ttf'),
  });

  const [showSplash, setShowSplash] = React.useState(true);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => setShowSplash(false));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      {!showSplash && (
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: styles.footer,
              tabBarIconStyle: { display: 'none' },
              tabBarLabelStyle: styles.footerLabel,
              tabBarActiveTintColor: 'black',
              tabBarInactiveTintColor: 'black',
              tabBarItemStyle: styles.footerItem,
            }}
          >
            <Tab.Screen name="Devices" component={DevicesScreen} />
            <Tab.Screen name="Connection" component={ConnectionScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      )}

      {showSplash && (
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            opacity: fadeAnim,
          }}
        >
            <Text style={{color: '#555', marginBottom: 8 }}>
              KRAIZY IOT APP
            </Text>
          <Image
            source={require('./assets/splash.png')}
            style={{ width: 200, height: 200, resizeMode: 'contain' }}
          />
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: '#ffffff',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'black',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: 'black',
  },
  main: {
    flex: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'black',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  addButton: {
    width: 120,
    height: 120,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    marginRight: 8,
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: 'black',
  },
  deviceButton: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  deviceText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  deviceSubText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'black',
  },
  footer: {
    height: '10%',
    backgroundColor: '#ecf0f1',
    borderTopWidth: 1,
    borderColor: 'black',
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: 'black',
  },
  footerItem: {
    borderWidth: 1,
    borderColor: 'black',
  },
  inputBar: {
    height: 50,
    borderWidth: 1,
    borderColor: 'black',
    paddingHorizontal: 12,
    marginBottom: 8,
    fontFamily: 'Inter',
    fontSize: 16,
    color: 'black',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  colorSquare: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: 'black',
    marginTop: 8,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'black',
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'black',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
});
