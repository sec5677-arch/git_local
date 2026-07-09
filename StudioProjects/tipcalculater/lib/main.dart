import 'package:flutter/material.dart';

import 'screens/tip_calculator_screen.dart';

void main() {
  runApp(const TipCalculatorApp());
}

/// 앱의 최상위 위젯
class TipCalculatorApp extends StatelessWidget {
  const TipCalculatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '팁 계산기',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: const TipCalculatorScreen(),
    );
  }
}
