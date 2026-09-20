import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '@/client/components/FilterBar';

describe('FilterBar', () => {
  it('두 버튼과 각 counts 숫자를 표시한다', () => {
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={jest.fn()}
        counts={{ thisWeek: 2, overdue: 5 }}
      />
    );
    expect(screen.getByRole('button', { name: /이번주 업무/ })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: /일정 초과/ })).toHaveTextContent('5');
  });

  it('"이번주 업무" 클릭 시 onFilterChange가 "thisWeek"으로 호출된다', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={{ thisWeek: 2, overdue: 5 }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /이번주 업무/ }));
    expect(onFilterChange).toHaveBeenCalledWith('thisWeek');
  });

  it('"일정 초과" 클릭 시 onFilterChange가 "overdue"로 호출된다', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        activeFilter="all"
        onFilterChange={onFilterChange}
        counts={{ thisWeek: 2, overdue: 5 }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /일정 초과/ }));
    expect(onFilterChange).toHaveBeenCalledWith('overdue');
  });

  it('activeFilter와 같은 버튼에 filter-button--active가 적용된다', () => {
    render(
      <FilterBar
        activeFilter="overdue"
        onFilterChange={jest.fn()}
        counts={{ thisWeek: 2, overdue: 5 }}
      />
    );
    expect(screen.getByRole('button', { name: /일정 초과/ })).toHaveClass(
      'filter-button--active'
    );
    expect(screen.getByRole('button', { name: /이번주 업무/ })).not.toHaveClass(
      'filter-button--active'
    );
  });

  it('활성화된 "이번주 업무"를 다시 클릭하면 onFilterChange("all")이 호출된다', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        activeFilter="thisWeek"
        onFilterChange={onFilterChange}
        counts={{ thisWeek: 2, overdue: 5 }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /이번주 업무/ }));
    expect(onFilterChange).toHaveBeenCalledWith('all');
  });

  it('활성화된 "일정 초과"를 다시 클릭하면 onFilterChange("all")이 호출된다', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        activeFilter="overdue"
        onFilterChange={onFilterChange}
        counts={{ thisWeek: 2, overdue: 5 }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /일정 초과/ }));
    expect(onFilterChange).toHaveBeenCalledWith('all');
  });
});
