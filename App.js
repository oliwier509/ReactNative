import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { enableScreens } from 'react-native-screens';
import { Platform, StatusBar, RefreshControl } from 'react-native';
enableScreens();
import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator();

const RESULTS_KEY = '@quiz_results_v1';
const FIRST_LAUNCH_KEY = '@first_launch';

const SAMPLE_TESTS = [
  {
    id: '1',
    name: 'Historia Rzymu',
    questions: [
      {
        question: 'Który wódz po śmierci Gajusza Mariusza prowadził wojnę domową z Sullą?',
        answers: [
          { content: 'LUCJUSZ CYNNA', isCorrect: true },
          { content: 'JULIUSZ CEZAR', isCorrect: false },
          { content: 'LUCJUSZ MURENA', isCorrect: false },
          { content: 'MAREK KRASSUS', isCorrect: false },
        ],
        duration: 30,
      },
      {
        question: 'Kiedy upadł Rzym zachodni?',
        answers: [
          { content: '476', isCorrect: true },
          { content: '410', isCorrect: false },
          { content: '395', isCorrect: false },
          { content: '500', isCorrect: false },
        ],
        duration: 30,
      },
    ],
  },
  {
    id: '2',
    name: 'Matematyka podstawowa',
    questions: [
      {
        question: 'Ile to 2 + 2?',
        answers: [
          { content: '3', isCorrect: false },
          { content: '4', isCorrect: true },
          { content: '5', isCorrect: false },
          { content: '6', isCorrect: false },
        ],
        duration: 30,
      },
    ],
  },
];

async function saveResult(result) {
  const existing = await AsyncStorage.getItem(RESULTS_KEY);
  const arr = existing ? JSON.parse(existing) : [];
  arr.push(result);
  await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(arr));
}

async function loadResults() {
  const existing = await AsyncStorage.getItem(RESULTS_KEY);
  return existing ? JSON.parse(existing) : [];
}

function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <SafeAreaView style={styles.center}>
      <Image source={require('./assets/logo.png')} style={{ width: 150, height: 150 }} />
      <Text style={{ fontSize: 22, marginTop: 12 }}>Quiz App</Text>
    </SafeAreaView>
  );
}

function WelcomeScreen({ onAgree }) {
  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32 },
      ]}
    >
      <Text style={styles.sectionTitle}>Regulamin aplikacji</Text>
      <Text style={{ marginBottom: 20 }}>
        Tutaj umieść treść regulaminu aplikacji.
      </Text>
      <TouchableOpacity style={styles.saveButton} onPress={onAgree}>
        <Text style={styles.saveButtonText}>Akceptuję</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function TopBar({ title, leftButton }) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={leftButton} style={styles.hamburger}>
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </TouchableOpacity>
      <Text style={styles.topTitle}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32 },
      ]}
    >
      <TopBar title="HOME PAGE" leftButton={() => navigation.openDrawer()} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Lista testów</Text>
        {SAMPLE_TESTS.map((t) => (
          <View key={t.id} style={styles.testRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => navigation.navigate('Test', { testId: t.id, testName: t.name })}
            >
              <Text style={styles.testButtonText}>[{t.name}]</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

function TestScreen({ route, navigation }) {
  const { testId, testName } = route.params;
  const test = SAMPLE_TESTS.find((t) => t.id === testId);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const [completed, setCompleted] = useState(false);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    setIndex(0);
    setScore(0);
    setTimeLeft(30);
    setCompleted(false);
    setPlayerName('');
    clearInterval(timerRef.current);
    startTimer();
  }, [testId]);

  useEffect(() => {
    if (!completed) startTimer();
    return () => clearInterval(timerRef.current);
  }, [index, completed]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(30);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          goToNextQuestion(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!test) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title={`Test ${testName}`} leftButton={() => navigation.goBack()} />
        <View style={styles.content}>
          <Text>Test nie znaleziony</Text>
        </View>
      </SafeAreaView>
    );
  }

  const q = !completed ? test.questions[index] : null;

  const goToNextQuestion = (correct) => {
    if (correct) setScore((s) => s + 1);
    if (index + 1 >= test.questions.length) {
      setCompleted(true);
      clearInterval(timerRef.current);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const answer = (letter) => {
    if (completed) return;
    clearInterval(timerRef.current);
    if (q) {
      goToNextQuestion(q.answers[letter].isCorrect);
    }
  };

  async function submitName() {
    if (!playerName.trim()) {
      Alert.alert('Proszę wpisać imię');
      return;
    }
    const result = {
      nick: playerName.trim(),
      score: score,
      total: test.questions.length,
      type: test.name,
      date: new Date().toISOString(),
    };
    try {
      await saveResult(result);
      Alert.alert('Zapisano');
      navigation.navigate('Results');
    } catch (e) {
      Alert.alert('Błąd zapisu');
    }
  }

  const progressWidth = `${(timeLeft / 30) * 100}%`;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32 },
      ]}
    >
      <TopBar title={`Test ${testName}`} leftButton={() => navigation.openDrawer()} />
      <View style={styles.content}>
        {!completed && q && (
          <>
            <View style={styles.topRow}>
              <Text style={styles.small}>
                Question {index + 1} of {test.questions.length}
              </Text>
              <Text style={styles.small}>Time left: {timeLeft}s</Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>

            <Text style={styles.questionText}>{q.question}</Text>

            <View style={styles.answersBox}>
              {q.answers.map((a, idx) => (
                <TouchableOpacity key={idx} style={styles.answerButton} onPress={() => answer(idx)}>
                  <Text style={styles.answerText}>{a.content}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {completed && (
          <View style={styles.submitBox}>
            <Text style={{ marginBottom: 8 }}>
              Score: {score} / {test.questions.length}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Wpisz swoje imię"
              value={playerName}
              onChangeText={setPlayerName}
            />
            <TouchableOpacity style={styles.saveButton} onPress={submitName}>
              <Text style={styles.saveButtonText}>Save score</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function ResultsScreen({ navigation }) {
  const [results, setResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await loadResults();
    setResults(data);
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    loadData();
    return unsub;
  }, [navigation]);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32 },
      ]}
    >
      <TopBar title="RESULTS" leftButton={() => navigation.openDrawer()} />
      <FlatList
        data={results}
        keyExtractor={(item, idx) => item.nick + idx}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}
        ListHeaderComponent={
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headCell]}>Nick</Text>
            <Text style={[styles.cell, styles.headCell]}>Score</Text>
            <Text style={[styles.cell, styles.headCell]}>Test</Text>
            <Text style={[styles.cell, styles.headCell]}>Date</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={styles.cell}>{item.nick}</Text>
            <Text style={styles.cell}>{item.score}/{item.total}</Text>
            <Text style={styles.cell}>{item.type}</Text>
            <Text style={styles.cell}>{new Date(item.date).toLocaleString()}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function DrawerContent({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 10 }}>Quiz App</Text>
      <Image source={require('./assets/egg.png')} style={{ width: 120, height: 120, marginBottom: 20 }} />

      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.drawerButton, { marginBottom: 20 }]}>
        <Text style={{ fontSize: 18 }}>Home Page</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Results')} style={[styles.drawerButton, { marginBottom: 20 }]}>
        <Text style={{ fontSize: 18 }}>Results</Text>
      </TouchableOpacity>

      <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 12 }} />

      {SAMPLE_TESTS.map((t) => (
        <TouchableOpacity key={t.id} onPress={() => navigation.navigate('Test', { testId: t.id, testName: t.name })} style={[styles.drawerButton, { marginBottom: 15 }]}>
          <Text style={{ fontSize: 18 }}>Test {t.name}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }} drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Test" component={TestScreen} />
      <Drawer.Screen name="Results" component={ResultsScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    (async () => {
      const firstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
      if (!firstLaunch) {
        setShowWelcome(true);
      }
      setLoading(false);
    })();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  if (showWelcome) {
    return <WelcomeScreen onAgree={async () => { await AsyncStorage.setItem(FIRST_LAUNCH_KEY, '1'); setShowWelcome(false); }} />;
  }

  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  drawerButton: { padding: 12, borderWidth: 1, borderColor: '#888', borderRadius: 8 },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee', justifyContent: 'space-between' },
  hamburger: { width: 44, justifyContent: 'center' },
  bar: { height: 3, backgroundColor: '#222', marginVertical: 2, width: 22 },
  topTitle: { fontSize: 18, fontWeight: '700' },

  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  testRow: { marginVertical: 6 },
  testButton: { padding: 12, borderWidth: 1, borderRadius: 8 },
  testButtonText: { fontSize: 16 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  small: { fontSize: 12, color: '#333' },
  questionText: { fontSize: 18, marginBottom: 16 },
  answersBox: { flexDirection: 'column', gap: 8 },
  answerButton: { padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  answerText: { fontSize: 16 },
  submitBox: { marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 },
  saveButton: { padding: 12, backgroundColor: '#28A745', borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  progressBarBackground: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: 'yellow' },
  cell: { flex: 1, fontSize: 12 },
  headCell: { fontWeight: '700' },
});

