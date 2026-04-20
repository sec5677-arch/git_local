# Random Numbers

1부터 45까지의 숫자 중에서 중복 없이 5개의 숫자를 랜덤으로 뽑는 Java 프로그램입니다.

## 프로젝트 구조

```
random-numbers/
├── src/
│   └── main/
│       └── java/
│           └── RandomNumbers.java
└── README.md
```

## 컴파일 및 실행

### 컴파일
```bash
cd random-numbers
javac src/main/java/RandomNumbers.java
```

### 실행
```bash
java -cp src/main/java RandomNumbers
```

또는

```bash
cd src/main/java
javac RandomNumbers.java
java RandomNumbers
```

## 기능

- 1부터 45까지의 범위에서 랜덤 숫자 생성
- 중복 없는 5개의 숫자 선택
- 오름차순 정렬 후 출력
