import java.util.*;

public class RandomNumbers {
    public static void main(String[]  args) {
        Random random = new Random();
        Set<Integer> numbers = new HashSet<>();

        // 1~45 범위에서 중복 없이 5개 뽑기
        while (numbers.size() < 5) {
            int num = random.nextInt(45) + 1;  // 1~45
            numbers.add(num);
        }

        // 오름차순 정렬 후 출력
        List<Integer> sorted = new ArrayList<>(numbers);
        Collections.sort(sorted);

        System.out.println("뽑은 숫자 (오름차순): " + sorted);
    }
}
