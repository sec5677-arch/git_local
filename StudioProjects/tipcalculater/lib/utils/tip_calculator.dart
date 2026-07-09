/// 앱에서 지원하는 통화 목록
enum AppCurrency {
  usd('USD', '\$'),
  eur('EUR', '€'),
  jpy('JPY', '¥'),
  aud('AUD', 'A\$'),
  cad('CAD', 'C\$');

  const AppCurrency(this.code, this.symbol);

  /// 통화 코드 (예: USD)
  final String code;

  /// 통화 기호 (예: $)
  final String symbol;

  /// 드롭다운에 표시할 라벨 (코드 + 기호)
  String get dropdownLabel => '$code ($symbol)';
}

/// 팁 계산 결과를 담는 데이터 클래스
class TipResult {
  const TipResult({
    required this.billAmount,
    required this.tipRate,
    required this.tipAmount,
    required this.totalAmount,
  });

  /// 청구 금액
  final double billAmount;

  /// 팁 비율 (%)
  final double tipRate;

  /// 팁 금액
  final double tipAmount;

  /// 총합 (청구 금액 + 팁)
  final double totalAmount;
}

/// 팁 계산 유틸리티
class TipCalculator {
  /// 슬라이더·프리셋에서 사용하는 팁 비율 최소값 (%)
  static const double minTipRate = 10;

  /// 슬라이더·프리셋에서 사용하는 팁 비율 최대값 (%)
  static const double maxTipRate = 30;

  /// 기본 팁 비율 (%)
  static const double defaultTipRate = 15;

  /// 자주 쓰는 팁 비율 프리셋 (%)
  static const List<int> tipPresets = [10, 15, 18, 20];

  /// 청구 금액과 팁 비율(%)로 팁 금액과 총합을 계산합니다.
  ///
  /// [billAmount]: 청구 금액 (0 이상)
  /// [tipRate]: 팁 비율 (0 이상, 예: 15 = 15%)
  static TipResult calculate({
    required double billAmount,
    required double tipRate,
  }) {
    // 팁 금액 = 청구 금액 × (팁 비율 ÷ 100)
    final tipAmount = billAmount * (tipRate / 100);
    final totalAmount = billAmount + tipAmount;

    return TipResult(
      billAmount: billAmount,
      tipRate: tipRate,
      tipAmount: tipAmount,
      totalAmount: totalAmount,
    );
  }

  /// 문자열 입력값을 숫자로 변환합니다. 빈 값이나 잘못된 값은 0으로 처리합니다.
  static double parseAmount(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return 0;

    // 쉼표(,)는 제거하고 소수점(.)만 허용
    final normalized = trimmed.replaceAll(',', '');
    return double.tryParse(normalized) ?? 0;
  }
}

/// 금액을 화면에 표시하기 좋은 형태로 포맷합니다.
///
/// - 정수: 천 단위 쉼표 (`50,000`)
/// - 소수: 둘째 자리까지 + 쉼표 (`12,345.67`)
/// - 소수점이 없으면 정수 형태로 표시
String formatCurrency(double amount) {
  final hasFraction = (amount * 100).round() % 100 != 0;
  final fixed =
      hasFraction ? amount.toStringAsFixed(2) : amount.toStringAsFixed(0);

  final parts = fixed.split('.');
  final formattedInteger = _addCommas(parts[0]);

  if (parts.length == 1) {
    return formattedInteger;
  }
  return '$formattedInteger.${parts[1]}';
}

/// 금액을 소수 둘째 자리까지 고정해 포맷합니다. (팁·총액 표시용)
String formatCurrencyFixed(double amount) {
  final fixed = amount.toStringAsFixed(2);
  final parts = fixed.split('.');
  return '${_addCommas(parts[0])}.${parts[1]}';
}

/// 선택한 통화 기호를 붙여 금액을 표시합니다.
String formatWithCurrency(double amount, AppCurrency currency) {
  return '${currency.symbol}${formatCurrencyFixed(amount)}';
}

/// 팁 비율을 정수(%) 형태로 표시합니다. (예: 15%)
String formatTipRateInteger(double tipRate) {
  return '${tipRate.round()}%';
}

/// 팁 비율을 소수 둘째 자리까지 표시합니다. (예: 15.00%)
String formatTipRateDecimal(double tipRate) {
  return '${tipRate.toStringAsFixed(2)}%';
}

/// 정수 부분에 천 단위 쉼표를 추가합니다.
String _addCommas(String digits) {
  if (digits.isEmpty) return '0';
  if (digits.length <= 3) return digits;

  final buffer = StringBuffer();
  final remainder = digits.length % 3;
  if (remainder > 0) {
    buffer.write(digits.substring(0, remainder));
    if (digits.length > remainder) buffer.write(',');
  }

  for (var i = remainder; i < digits.length; i += 3) {
    buffer.write(digits.substring(i, i + 3));
    if (i + 3 < digits.length) buffer.write(',');
  }

  return buffer.toString();
}
