import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../utils/tip_calculator.dart';

/// 팁 계산기 메인 화면
class TipCalculatorScreen extends StatefulWidget {
  const TipCalculatorScreen({super.key});

  @override
  State<TipCalculatorScreen> createState() => _TipCalculatorScreenState();
}

class _TipCalculatorScreenState extends State<TipCalculatorScreen> {
  /// 선택된 통화 (기본값: USD)
  AppCurrency _selectedCurrency = AppCurrency.usd;

  /// 청구 금액 입력 컨트롤러
  final _billController = TextEditingController();

  /// 슬라이더·프리셋으로 조절하는 팁 비율 (%)
  double _tipRate = TipCalculator.defaultTipRate;

  @override
  void initState() {
    super.initState();
    // 입력이 바뀔 때마다 화면을 다시 그려 결과를 갱신합니다.
    _billController.addListener(_onInputChanged);
  }

  @override
  void dispose() {
    _billController.dispose();
    super.dispose();
  }

  void _onInputChanged() {
    setState(() {});
  }

  /// 현재 입력값으로 팁 계산 결과를 반환합니다.
  TipResult get _result {
    final billAmount = TipCalculator.parseAmount(_billController.text);
    return TipCalculator.calculate(
      billAmount: billAmount,
      tipRate: _tipRate,
    );
  }

  /// 프리셋 chip을 눌렀을 때 슬라이더 값(팁 비율)을 변경합니다.
  void _selectTipPreset(int rate) {
    setState(() {
      _tipRate = rate.toDouble();
    });
  }

  @override
  Widget build(BuildContext context) {
    final result = _result;
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('팁 계산기'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. 통화 선택
              Text(
                '통화',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              InputDecorator(
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  filled: true,
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<AppCurrency>(
                    key: const Key('currency_dropdown'),
                    isExpanded: true,
                    value: _selectedCurrency,
                    items: AppCurrency.values
                        .map(
                          (currency) => DropdownMenuItem(
                            value: currency,
                            child: Text(currency.dropdownLabel),
                          ),
                        )
                        .toList(),
                    onChanged: (currency) {
                      if (currency == null) return;
                      setState(() => _selectedCurrency = currency);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // 2. 청구 금액 입력
              _InputSection(
                inputKey: const Key('bill_input'),
                label: '청구 금액',
                controller: _billController,
                hint: '청구 금액을 입력',
                suffix: _selectedCurrency.symbol,
              ),
              const SizedBox(height: 24),

              // 3. 팁 비율 슬라이더 (10% ~ 30%)
              Text(
                '팁 비율',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Slider(
                key: const Key('tip_rate_slider'),
                value: _tipRate,
                min: TipCalculator.minTipRate,
                max: TipCalculator.maxTipRate,
                divisions: (TipCalculator.maxTipRate - TipCalculator.minTipRate)
                    .toInt(),
                label: '${_tipRate.round()}%',
                onChanged: (value) {
                  setState(() => _tipRate = value);
                },
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${TipCalculator.minTipRate.toInt()}%',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(
                    '${TipCalculator.maxTipRate.toInt()}%',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 빠른 선택 프리셋 (10%, 15%, 18%, 20%)
              Text(
                '빠른 선택',
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: TipCalculator.tipPresets.map((rate) {
                  final isSelected = _tipRate.round() == rate;
                  return ChoiceChip(
                    key: Key('tip_preset_$rate'),
                    label: Text('$rate%'),
                    selected: isSelected,
                    onSelected: (_) => _selectTipPreset(rate),
                  );
                }).toList(),
              ),
              const SizedBox(height: 32),

              // 4~7. 계산 결과 카드
              Card(
                elevation: 0,
                color: colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      // 4. 팁 비율 (정수 %)
                      _ResultRow(
                        key: const Key('tip_rate_integer_row'),
                        label: '팁 비율',
                        value: formatTipRateInteger(result.tipRate),
                      ),
                      const SizedBox(height: 12),

                      // 5. 설정된 팁 비율 (소수 둘째 자리)
                      _ResultRow(
                        key: const Key('tip_rate_decimal_row'),
                        label: '설정된 팁 비율',
                        value: formatTipRateDecimal(result.tipRate),
                      ),
                      const SizedBox(height: 12),

                      // 6. 팁 금액
                      _ResultRow(
                        key: const Key('tip_amount_row'),
                        label: '팁 금액',
                        value: formatWithCurrency(
                          result.tipAmount,
                          _selectedCurrency,
                        ),
                        highlight: true,
                      ),
                      const Divider(height: 32),

                      // 7. 총 금액
                      _ResultRow(
                        key: const Key('total_amount_row'),
                        label: '총 금액',
                        value: formatWithCurrency(
                          result.totalAmount,
                          _selectedCurrency,
                        ),
                        isTotal: true,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 숫자 입력 섹션 위젯
class _InputSection extends StatelessWidget {
  const _InputSection({
    required this.inputKey,
    required this.label,
    required this.controller,
    required this.hint,
    required this.suffix,
  });

  final Key inputKey;
  final String label;
  final TextEditingController controller;
  final String hint;
  final String suffix;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        TextField(
          key: inputKey,
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          // 숫자, 소수점, 쉼표만 입력 가능
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[\d.,]')),
          ],
          decoration: InputDecoration(
            hintText: hint,
            suffixText: suffix,
            border: const OutlineInputBorder(),
            filled: true,
          ),
        ),
      ],
    );
  }
}

/// 결과 한 줄 표시 위젯
class _ResultRow extends StatelessWidget {
  const _ResultRow({
    super.key,
    required this.label,
    required this.value,
    this.highlight = false,
    this.isTotal = false,
  });

  final String label;
  final String value;
  final bool highlight;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context).textTheme;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal
              ? theme.titleMedium
              : theme.bodyLarge?.copyWith(
                  color: highlight
                      ? Theme.of(context).colorScheme.primary
                      : null,
                ),
        ),
        Text(
          value,
          style: isTotal
              ? theme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)
              : theme.titleMedium?.copyWith(
                  fontWeight: highlight ? FontWeight.bold : FontWeight.normal,
                ),
        ),
      ],
    );
  }
}
