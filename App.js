import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { enableScreens } from 'react-native-screens';
import { Platform, StatusBar } from 'react-native';
enableScreens();
import React, {useState, useEffect, useRef} from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator();

const SAMPLE_TESTS = [
  {
    id: '1',
    name: 'Matematyka podstawowa',
    questions: [
      {id: 'q1', text: 'Ile to 2 + 2?', correct: 'A'},
      {id: 'q2', text: 'Ile to 5 - 3?', correct: 'B'},
      {id: 'q3', text: 'Ile to 3 * 3?', correct: 'C'},
    ],
  },
  {
    id: '2',
    name: 'Fizyka 101',
    questions: [
      {id: 'q1', text: 'Co to jest siła?', correct: 'D'},
      {id: 'q2', text: 'Jednostka prędkości?', correct: 'A'},
    ],
  },
];

const RESULTS_KEY = '@quiz_results_v1';

function saveResult(result) {
  return AsyncStorage.getItem(RESULTS_KEY).then(existing => {
    const arr = existing ? JSON.parse(existing) : [];
    arr.push(result);
    return AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(arr));
  });
}

function loadResults() {
  return AsyncStorage.getItem(RESULTS_KEY).then(existing => {
    return existing ? JSON.parse(existing) : [];
  });
}

function TopBar({title, leftButton}) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={leftButton} style={styles.hamburger}>
        <View style={styles.bar} />
        <View style={styles.bar} />
        <View style={styles.bar} />
      </TouchableOpacity>
      <Text style={styles.topTitle}>{title}</Text>
      <View style={{width: 44}} />
    </View>
  );
}

function HomeScreen({navigation}) {
  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32,
        },
      ]}
    >
      <TopBar title="HOME PAGE" leftButton={() => navigation.openDrawer()} />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Lista testów</Text>
        {SAMPLE_TESTS.map(t => (
          <View key={t.id} style={styles.testRow}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() =>
                navigation.navigate('Test', {testId: t.id, testName: t.name})
              }>
              <Text style={styles.testButtonText}>[{t.name}]</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}



function TestScreen({route, navigation}) {
  const {testId, testName} = route.params;
  const test = SAMPLE_TESTS.find(t => t.id === testId);

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
      setTimeLeft(prev => {
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
        <View style={styles.content}><Text>Test nie znaleziony</Text></View>
      </SafeAreaView>
    );
  }

  const q = !completed ? test.questions[index] : null;

  const goToNextQuestion = (correct) => {
    if (correct) setScore(s => s + 1);

    if (index + 1 >= test.questions.length) {
      setCompleted(true);
      clearInterval(timerRef.current);
    } else {
      setIndex(i => i + 1);
    }
  };

  function answer(letter) {
    if (completed) return;
    clearInterval(timerRef.current);
    if (q) goToNextQuestion(letter === q.correct);
  }

  async function submitName() {
    if (!playerName.trim()) {
      Alert.alert('Proszę wpisać imię');
      return;
    }
    const result = {
      name: playerName.trim(),
      points: score,
      testName: test.name,
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
        {
          paddingTop:
            Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32,
        },
      ]}
    >
      <TopBar title={`Test ${testName}`} leftButton={() => navigation.openDrawer()} />
      <View style={styles.content}>
        {!completed && q && (
          <>
            <View style={styles.topRow}>
              <Text style={styles.small}>Question {index + 1} of {test.questions.length}</Text>
              <Text style={styles.small}>Time left: {timeLeft}s</Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, {width: progressWidth}]} />
            </View>

            <Text style={styles.questionText}>{q.text}</Text>

            <View style={styles.answersBox}>
              {['A', 'B', 'C', 'D'].map(letter => (
                <TouchableOpacity key={letter} style={styles.answerButton} onPress={() => answer(letter)}>
                  <Text style={styles.answerText}>Answer {letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {completed && (
          <View style={styles.submitBox}>
            <Text style={{marginBottom: 8}}>Score: {score}</Text>
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




function ResultsScreen({navigation}) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadResults().then(setResults));
    loadResults().then(setResults);
    return unsub;
  }, [navigation]);

  return (
        <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 32,
        },
      ]}
    >
      <TopBar title="RESULTS" leftButton={() => navigation.openDrawer()} />
      <View style={styles.content}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.headCell]}>Name</Text>
          <Text style={[styles.cell, styles.headCell]}>Points</Text>
          <Text style={[styles.cell, styles.headCell]}>Test Name</Text>
          <Text style={[styles.cell, styles.headCell]}>Date</Text>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, idx) => item.name + idx}
          renderItem={({item}) => (
            <View style={styles.tableRow}>
              <Text style={styles.cell}>{item.name}</Text>
              <Text style={styles.cell}>{item.points}</Text>
              <Text style={styles.cell}>{item.testName}</Text>
              <Text style={styles.cell}>{new Date(item.date).toLocaleString()}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function DrawerContent({navigation}) {
  return (
    <SafeAreaView style={{flex: 1, padding: 16}}>
      <Text style={{fontSize: 22, fontWeight: '700', marginBottom: 10}}>Quiz App</Text>
      <Image source={require('./assets/egg.png')} style={{width: 120, height: 120, marginBottom: 20}} />

      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={[styles.drawerButton, {marginBottom: 20}]}
      >
        <Text style={{fontSize: 18}}>Home Page</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Results')}
        style={[styles.drawerButton, {marginBottom: 20}]}
      >
        <Text style={{fontSize: 18}}>Results</Text>
      </TouchableOpacity>

      <View style={{borderBottomWidth: 1, borderBottomColor: '#ccc', marginVertical: 12}} />

      {SAMPLE_TESTS.map(t => (
        <TouchableOpacity
          key={t.id}
          onPress={() => navigation.navigate('Test', {testId: t.id, testName: t.name})}
          style={[styles.drawerButton, {marginBottom: 15}]}
        >
          <Text style={{fontSize: 18}}>Test {t.name}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}



function DrawerNavigator() {
  return (
    <Drawer.Navigator screenOptions={{headerShown: false}} drawerContent={props => <DrawerContent {...props} />}>
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Test" component={TestScreen} />
      <Drawer.Screen name="Results" component={ResultsScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},

  drawerButton: {
  padding: 12,
  borderWidth: 1,
  borderColor: '#888',
  borderRadius: 8,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  hamburger: {width: 44, justifyContent: 'center'},
  bar: {height: 3, backgroundColor: '#222', marginVertical: 2, width: 22},
  topTitle: {fontSize: 18, fontWeight: '700'},

  content: {flex: 1, padding: 16},

  sectionTitle: {fontSize: 16, fontWeight: '600', marginBottom: 8},

  testRow: {marginVertical: 6},
  testButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  testButtonText: {fontSize: 16},

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  small: {fontSize: 12, color: '#333'},

  questionText: {fontSize: 18, marginBottom: 16},

  answersBox: {flexDirection: 'column', gap: 8},
  answerButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  answerText: {fontSize: 16},

  submitBox: {marginTop: 8},
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  saveButton: {
    padding: 12,
    backgroundColor: '#28A745',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {color: '#fff', fontWeight: '700'},

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
    progressBarFill: {
    height: '100%',
    backgroundColor: 'yellow',
  },
  cell: {flex: 1, fontSize: 12},
  headCell: {fontWeight: '700'},
});
