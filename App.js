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

async function saveResultLocal(result) {
  try {
    const existing = await AsyncStorage.getItem(RESULTS_KEY);
    const arr = existing ? JSON.parse(existing) : [];
    arr.push(result);
    await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('saveResultLocal error', e);
  }
}

async function loadResultsLocal() {
  try {
    const existing = await AsyncStorage.getItem(RESULTS_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.warn('loadResultsLocal error', e);
    return [];
  }
}

async function sendResultRemoteAndSave(result) {
  try {
    await fetch('https://tgryl.pl/quiz/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
  } catch (e) {
    console.warn('Send result remote failed', e);
  } finally {
    await saveResultLocal(result);
  }
}

async function loadResultsRemote(last = 20) {
  try {
    const res = await fetch(`https://tgryl.pl/quiz/results?last=${last}`);
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();

    if (!Array.isArray(json)) return [];

    return json.map(r => ({
      nick: r.nick,
      score: r.score,
      total: r.total,
      type: r.type,
      date: r.createdOn,
      id: r.id
    }));
  } catch (e) {
    console.warn('loadResultsRemote error', e);
    return [];
  }
}

async function fetchTestsList() {
  try {
    const res = await fetch('https://tgryl.pl/quiz/tests');
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.warn('fetchTestsList error', e);
    return [];
  }
}

async function fetchTestDetailsAndTranslate(id) {
  try {
    const res = await fetch(`https://tgryl.pl/quiz/test/${id}`);
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    const translated = {
      id: json.id || id,
      name: json.name || `Test ${id}`,
      questions: Array.isArray(json.tasks)
        ? json.tasks.map((t) => ({
            question: t.question || '',
            duration: t.duration || 30,
            answers: Array.isArray(t.answers)
              ? t.answers.map((a) => ({
                  content: a.content || a,
                  isCorrect: !!a.isCorrect,
                }))
              : [],
          }))
        : [],
    };
    return translated;
  } catch (e) {
    console.warn('fetchTestDetailsAndTranslate error', e);
    return null;
  }
}

function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <SafeAreaView style={styles.center}>
      <Image source={require('./assets/logo.png')} style={{ width: 150, height: 150 }} />
      <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Quiz App</Text>
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
      <Text style={[styles.sectionTitle, styles.headingFont]}>Regulamin aplikacji</Text>
      <Text style={{ marginBottom: 20, fontFamily: 'Roboto-Regular' }}>
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
      <Text style={[styles.topTitle, styles.headingFont]}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

function HomeScreen({ navigation }) {
  const [tests, setTests] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const list = await fetchTestsList();
      if (mounted) {
        const mapped = list.map((t) => {
          if (typeof t === 'string') return { id: t, name: `Test ${t}` };
          return { id: t.id || t._id || t._id, name: t.name || t.title || `Test ${t.id || ''}` };
        });
        setTests(mapped.length ? mapped : SAMPLE_TESTS.map((s) => ({ id: s.id, name: s.name })));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32 },
      ]}
    >
      <TopBar title="HOME PAGE" leftButton={() => navigation.openDrawer()} />
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, styles.headingFont]}>Lista testów</Text>
        {loading && <ActivityIndicator size="small" />}
        {!loading && tests && tests.length === 0 && <Text>Brak testów</Text>}
        {!loading &&
          tests &&
          tests.map((t) => (
            <View key={t.id} style={styles.testRow}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => navigation.navigate('Test', { testId: String(t.id), testName: t.name })}
              >
                <Text style={[styles.testButtonText, { fontFamily: 'Roboto-Regular' }]}>{t.name}</Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>
    </SafeAreaView>
  );
}

function TestScreen({ route, navigation }) {
  const { testId, testName } = route.params;
  const localTest = SAMPLE_TESTS.find((t) => t.id === testId);
  const [test, setTest] = useState(localTest || null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const [completed, setCompleted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!localTest) {
        const fetched = await fetchTestDetailsAndTranslate(testId);
        if (mounted && fetched) {
          setTest(fetched);
        }
      }
    })();
    return () => (mounted = false);
  }, [testId]);

  useEffect(() => {
    if (!test) return;
    setIndex(0);
    setScore(0);
    setCompleted(false);
    setPlayerName('');
    clearInterval(timerRef.current);
    const firstDuration = test.questions?.[0]?.duration || 30;
    setTimeLeft(firstDuration);
    startTimer(firstDuration);
    return () => clearInterval(timerRef.current);
  }, [testId, test]);

  useEffect(() => {
    if (!test || completed) return;
    clearInterval(timerRef.current);
    const dur = test.questions?.[index]?.duration || 30;
    setTimeLeft(dur);
    startTimer(dur);
    return () => clearInterval(timerRef.current);
  }, [index, test, completed]);

  const startTimer = (duration = 30) => {
    clearInterval(timerRef.current);
    setTimeLeft(duration);
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
        <TopBar title={`Test ${testName || ''}`} leftButton={() => navigation.goBack()} />
        <View style={styles.content}>
          <Text>Ładowanie testu...</Text>
          <ActivityIndicator />
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

  const answer = (idx) => {
    if (completed) return;
    clearInterval(timerRef.current);
    if (q && q.answers[idx]) {
      goToNextQuestion(!!q.answers[idx].isCorrect);
    }
  };

  async function submitName() {
    if (!playerName.trim()) {
      Alert.alert('Proszę wpisać imię');
      return;
    }
    const resultPayload = {
      nick: playerName.trim(),
      score: score,
      total: test.questions.length,
      type: test.name || testName || 'unknown'
    };
    try {
      await sendResultRemoteAndSave(resultPayload);
      Alert.alert('Zapisano');
      navigation.navigate('Results');
    } catch (e) {
      Alert.alert('Błąd zapisu');
    }
  }

  const maxDuration = q?.duration || 30;
  const progressWidth = `${(timeLeft / maxDuration) * 100}%`;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32 },
      ]}
    >
      <TopBar title={`Test ${test.name}`} leftButton={() => navigation.openDrawer()} />
      <View style={styles.content}>
        {!completed && q && (
          <>
            <View style={styles.topRow}>
              <Text style={[styles.small, { fontFamily: 'Roboto-Regular' }]}>
                Pytanie {index + 1} z {test.questions.length}
              </Text>
              <Text style={[styles.small, { fontFamily: 'Roboto-Regular' }]}>Pozostało: {timeLeft}s</Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>

            <Text style={[styles.questionText, { fontFamily: 'Merriweather-Regular' }]}>{q.question}</Text>

            <View style={styles.answersBox}>
              {q.answers.map((a, idx) => (
                <TouchableOpacity key={idx} style={styles.answerButton} onPress={() => answer(idx)}>
                  <Text style={[styles.answerText, { fontFamily: 'Roboto-Regular' }]}>{a.content}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {completed && (
          <View style={styles.submitBox}>
            <Text style={{ marginBottom: 8, fontFamily: 'Roboto-Regular' }}>
              Score: {score} / {test.questions.length}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Wpisz swoje imię"
              value={playerName}
              onChangeText={setPlayerName}
            />
            <TouchableOpacity style={styles.saveButton} onPress={submitName}>
              <Text style={styles.saveButtonText}>Wyślij wynik</Text>
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
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const remote = await loadResultsRemote(20);
    if (remote && remote.length) {
      setResults(remote);
      setLoading(false);
      return;
    }
    const local = await loadResultsLocal();
    setResults(local);
    setLoading(false);
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
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => (item.nick || 'n') + idx}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadData();
                setRefreshing(false);
              }}
            />
          }
          ListHeaderComponent={
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.headCell, { fontFamily: 'Merriweather-Regular' }]}>Nick</Text>
              <Text style={[styles.cell, styles.headCell, { fontFamily: 'Merriweather-Regular' }]}>Score</Text>
              <Text style={[styles.cell, styles.headCell, { fontFamily: 'Merriweather-Regular' }]}>Test</Text>
              <Text style={[styles.cell, styles.headCell, { fontFamily: 'Merriweather-Regular' }]}>Date</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { fontFamily: 'Roboto-Regular' }]}>{item.nick}</Text>
              <Text style={[styles.cell, { fontFamily: 'Roboto-Regular' }]}>{item.score}/{item.total}</Text>
              <Text style={[styles.cell, { fontFamily: 'Roboto-Regular' }]}>{item.type}</Text>
              <Text style={[styles.cell, { fontFamily: 'Roboto-Regular' }]}>{item.date || "no date"}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function DrawerContent({ navigation }) {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await fetchTestsList();
      const mapped = list.map((t) => {
        if (typeof t === 'string') return { id: t, name: `Test ${t}` };
        return { id: t.id || t._id || t._id, name: t.name || t.title || `Test ${t.id || ''}` };
      });
      if (mounted) setTests(mapped);
    })();
    return () => (mounted = false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 10, fontFamily: 'Merriweather-Regular' }}>Quiz App</Text>
      <Image source={require('./assets/egg.png')} style={{ width: 120, height: 120, marginBottom: 20 }} />

      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={[styles.drawerButton, { marginBottom: 20 }]}>
        <Text style={{ fontSize: 18, fontFamily: 'Roboto-Regular' }}>Home Page</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Results')} style={[styles.drawerButton, { marginBottom: 20 }]}>
        <Text style={{ fontSize: 18, fontFamily: 'Roboto-Regular' }}>Results</Text>
      </TouchableOpacity>

      <View style={{ borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 12 }} />

      {tests.map((t) => (
        <TouchableOpacity key={t.id} onPress={() => navigation.navigate('Test', { testId: String(t.id), testName: t.name })} style={[styles.drawerButton, { marginBottom: 15 }]}>
          <Text style={{ fontSize: 18, fontFamily: 'Roboto-Regular' }}>Test {t.name}</Text>
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
      try {
        const firstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (!firstLaunch) {
          setShowWelcome(true);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
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

  headingFont: { fontFamily: 'Merriweather-Bold' },
});
