import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    const handleOrientationChange = () => {
      const { width, height } = Dimensions.get('window');
      setIsPortrait(height >= width);
    };

    handleOrientationChange();
    Dimensions.addEventListener('change', handleOrientationChange);

    return () => {
      Dimensions.removeEventListener('change', handleOrientationChange);
    };
  }, []);

const [isRad, setIsRad] = useState(true); // Radian mode
const [operatorMemory, setOperatorMemory] = useState(null); // for x^y, y√x
const [firstOperand, setFirstOperand] = useState(null);
const [memory, setMemory] = useState(0);

const handlePress = (value) => {
  if (value === 'AC') {
    setDisplay('0');
    setOperatorMemory(null);
    setFirstOperand(null);
  } else if (value === 'mc') {
    setMemory(0);
  } else if (value === 'm+') {
    setMemory((prev) => prev + Number(display));
  } else if (value === 'm-') {
    setMemory((prev) => prev - Number(display));
  } else if (value === 'mr') {
    setDisplay(String(memory));
  } else if (value === '+/-') {
    setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : prev !== '0' ? '-' + prev : prev));
  } else if (value === '%') {
    try {
      setDisplay(String(Number(display) / 100));
    } catch {
      setDisplay('Error');
    }
  } else if (value === '=') {
    try {
      if (operatorMemory && firstOperand !== null) {
        let result;
        const secondOperand = Number(display);
        if (operatorMemory === 'x^y') result = Math.pow(firstOperand, secondOperand);
        else if (operatorMemory === 'y√x') result = Math.pow(secondOperand, 1 / firstOperand);
        setDisplay(String(result));
        setOperatorMemory(null);
        setFirstOperand(null);
      } else {
        const result = Function(`"use strict"; return (${display})`)();
        setDisplay(String(result));
      }
    } catch {
      setDisplay('Error');
    }
  } else if (value === ',') {
    setDisplay((prev) => (prev.includes('.') ? prev : prev + '.'));
  } else if (value === 'π') {
    setDisplay((prev) => (prev === '0' ? String(Math.PI) : prev + String(Math.PI)));
  } else if (value === 'e') {
    setDisplay((prev) => (prev === '0' ? String(Math.E) : prev + String(Math.E)));
  } else if (value === 'Rand') {
    setDisplay(String(Math.random()));
  } else if (value === 'x^2') {
    setDisplay(String(Math.pow(Number(display), 2)));
  } else if (value === 'x^3') {
    setDisplay(String(Math.pow(Number(display), 3)));
  } else if (value === '1/x') {
    setDisplay(String(1 / Number(display)));
  } else if (value === '2√x') {
    setDisplay(String(Math.sqrt(Number(display))));
  } else if (value === '3√x') {
    setDisplay(String(Math.cbrt(Number(display))));
  } else if (value === 'Ln') {
    setDisplay(String(Math.log(Number(display))));
  } else if (value === 'log10') {
    setDisplay(String(Math.log10(Number(display))));
  } else if (value === 'X!') {
    const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
    setDisplay(String(factorial(Number(display))));
  } else if (value === 'sin') {
    setDisplay(String(isRad ? Math.sin(Number(display)) : Math.sin(Number(display) * (Math.PI / 180))));
  } else if (value === 'cos') {
    setDisplay(String(isRad ? Math.cos(Number(display)) : Math.cos(Number(display) * (Math.PI / 180))));
  } else if (value === 'tan') {
    setDisplay(String(isRad ? Math.tan(Number(display)) : Math.tan(Number(display) * (Math.PI / 180))));
  } else if (value === 'sinh') {
    setDisplay(String(Math.sinh(Number(display))));
  } else if (value === 'cosh') {
    setDisplay(String(Math.cosh(Number(display))));
  } else if (value === 'tanh') {
    setDisplay(String(Math.tanh(Number(display))));
  } else if (value === 'Rad') {
    setIsRad((prev) => !prev);
  } else if (value === 'x^y' || value === 'y√x') {
    setFirstOperand(Number(display));
    setOperatorMemory(value);
    setDisplay('0');
  } else if (value === 'EE') {
    setDisplay((prev) => prev + 'e');
  } else if (value === '2nd') {
    alert('2nd function toggle pressed');
  } else {
    setDisplay((prev) => (prev === '0' ? value : prev + value));
  }
};



  const renderButton = (label, color, width = '25%') => (
    <TouchableOpacity
      key={label}
      style={[styles.button, { backgroundColor: color, width }]}
      onPress={() => handlePress(label)}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  const scientificButtons = [
    ['(', ')', 'mc', 'm+', 'm-', 'mr'],
    ['2nd', 'x^2', 'x^3', 'x^y', 'e^x', '10^x'],
    ['1/x', '2√x', '3√x', 'y√x', 'Ln', 'log10'],
    ['X!', 'sin', 'cos', 'tan', 'e', 'EE'],
    ['Rad', 'sinh', 'cosh', 'tanh', 'π', 'Rand'],
  ];

  const standardLayout = (
    <View style={styles.standardContainer}>
      <View style={styles.row}>
        {renderButton('AC', '#555A55')}
        {renderButton('+/-', '#555A55')}
        {renderButton('%', '#555A55')}
        {renderButton('/', '#FF9B0A')}
      </View>
      <View style={styles.row}>
        {renderButton('7', '#737373')}
        {renderButton('8', '#737373')}
        {renderButton('9', '#737373')}
        {renderButton('*', '#FF9B0A')}
      </View>
      <View style={styles.row}>
        {renderButton('4', '#737373')}
        {renderButton('5', '#737373')}
        {renderButton('6', '#737373')}
        {renderButton('-', '#FF9B0A')}
      </View>
      <View style={styles.row}>
        {renderButton('1', '#737373')}
        {renderButton('2', '#737373')}
        {renderButton('3', '#737373')}
        {renderButton('+', '#FF9B0A')}
      </View>
      <View style={styles.row}>
        {renderButton('0', '#737373', '50%')}
        {renderButton(',', '#737373', '25%')}
        {renderButton('=', '#FF9B0A', '25%')}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isPortrait ? (
        <>
          <View style={[styles.displayContainer, { height: '16.6%' }]}>
            <Text style={[styles.displayText, { fontSize: 60 }]} numberOfLines={1} adjustsFontSizeToFit>
              {display}
            </Text>
          </View>
          <View style={{ flex: 1 }}>{standardLayout}</View>
        </>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Display Area (Top Bar) */}
          <View style={[styles.displayContainer, { height: '16.6%' }]}>
            <Text style={[styles.displayText, { fontSize: 40 }]} numberOfLines={1} adjustsFontSizeToFit>
              {display}
            </Text>
          </View>

          {/* Buttons Area */}
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {/* LEFT: Scientific Buttons */}
            <View style={{ flex: 6, backgroundColor: 'black' }}>
              {scientificButtons.map((row, i) => (
                <View key={i} style={styles.landscapeRow}>
                  {row.map((label) =>
                    renderButton(label, '#555A55', `${100 / 6}%`)
                  )}
                </View>
              ))}
            </View>

            {/* RIGHT: Standard Calculator */}
            <View style={{ flex: 4 }}>{standardLayout}</View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  displayContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    backgroundColor: '#414646',
    padding: 20,
  },
  displayText: {
    color: 'white',
    fontSize: 60,
  },
  standardContainer: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    height: '20%',
    justifyContent: 'space-between',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderWidth: 0.5,
    borderColor: '#000',
  },
  buttonText: {
    color: 'white',
    fontSize: 22,
  },
  landscapeRow: {
    flexDirection: 'row',
    height: '20%',
    justifyContent: 'space-between',
  },
});
