import 'package:flutter_test/flutter_test.dart';
import 'package:tipcalculater/utils/tip_calculator.dart';

void main() {
  group('TipCalculator', () {
    test('팁 금액과 총합을 올바르게 계산한다', () {
      final result = TipCalculator.calculate(
        billAmount: 10000,
        tipRate: 15,
      );

      expect(result.tipAmount, 1500);
      expect(result.totalAmount, 11500);
    });

    test('청구 금액이 0이면 팁과 총합도 0이다', () {
      final result = TipCalculator.calculate(
        billAmount: 0,
        tipRate: 15,
      );

      expect(result.tipAmount, 0);
      expect(result.totalAmount, 0);
    });

    test('문자열 입력값을 숫자로 변환한다', () {
      expect(TipCalculator.parseAmount('50000'), 50000);
      expect(TipCalculator.parseAmount('12,345.67'), 12345.67);
      expect(TipCalculator.parseAmount(''), 0);
      expect(TipCalculator.parseAmount('abc'), 0);
    });
  });

  group('formatCurrency', () {
    test('금액을 포맷한다', () {
      expect(formatCurrency(50000), '50,000');
      expect(formatCurrency(12345.67), '12,345.67');
      expect(formatCurrency(0), '0');
    });
  });

  group('formatCurrencyFixed', () {
    test('금액을 소수 둘째 자리까지 포맷한다', () {
      expect(formatCurrencyFixed(1500), '1,500.00');
      expect(formatCurrencyFixed(11500), '11,500.00');
    });
  });

  group('formatWithCurrency', () {
    test('통화 기호를 붙여 금액을 표시한다', () {
      expect(
        formatWithCurrency(1500, AppCurrency.usd),
        '\$1,500.00',
      );
      expect(
        formatWithCurrency(11500, AppCurrency.usd),
        '\$11,500.00',
      );
    });
  });

  group('formatTipRate', () {
    test('팁 비율을 정수·소수 형태로 표시한다', () {
      expect(formatTipRateInteger(15), '15%');
      expect(formatTipRateDecimal(15), '15.00%');
    });
  });
}
