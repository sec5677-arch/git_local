import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tipcalculater/main.dart';
import 'package:tipcalculater/utils/tip_calculator.dart';

void main() {
  testWidgets('청구 금액 입력 시 기본 팁 15% 결과가 표시된다', (WidgetTester tester) async {
    await tester.pumpWidget(const TipCalculatorApp());

    // 청구 금액 10,000 입력 (기본 통화 USD, 기본 팁 15%)
    await tester.enterText(find.byKey(const Key('bill_input')), '10000');
    await tester.pump();

    // 팁 $1,500.00, 총합 $11,500.00
    expect(
      find.text(formatWithCurrency(1500, AppCurrency.usd)),
      findsOneWidget,
    );
    expect(
      find.text(formatWithCurrency(11500, AppCurrency.usd)),
      findsOneWidget,
    );
  });

  testWidgets('프리셋 chip 선택 시 팁 비율이 변경된다', (WidgetTester tester) async {
    await tester.pumpWidget(const TipCalculatorApp());

    await tester.enterText(find.byKey(const Key('bill_input')), '10000');
    await tester.pump();

    // 20% 프리셋 선택
    await tester.tap(find.byKey(const Key('tip_preset_20')));
    await tester.pump();

    expect(find.text('20%'), findsWidgets);
    expect(
      find.text(formatWithCurrency(2000, AppCurrency.usd)),
      findsOneWidget,
    );
  });

  testWidgets('통화 변경 시 금액 표시 기호가 바뀐다', (WidgetTester tester) async {
    await tester.pumpWidget(const TipCalculatorApp());

    await tester.enterText(find.byKey(const Key('bill_input')), '10000');
    await tester.pump();

    // EUR로 변경
    await tester.tap(find.byKey(const Key('currency_dropdown')));
    await tester.pumpAndSettle();
    await tester.tap(find.text(AppCurrency.eur.dropdownLabel).last);
    await tester.pump();

    expect(
      find.text(formatWithCurrency(1500, AppCurrency.eur)),
      findsOneWidget,
    );
  });
}
