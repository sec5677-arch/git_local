import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '@/client/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('C006-1: 확인 버튼 클릭 시 onConfirm이 호출된다', async () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmDialog
        isOpen
        message="정말 삭제하시겠습니까?"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('C006-2: 취소 버튼 클릭 시 onCancel이 호출된다', async () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen
        message="정말 삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('확인 버튼은 danger variant(빨간색)로 렌더링된다', () => {
    render(
      <ConfirmDialog
        isOpen
        message="정말 삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: '확인' })).toHaveClass('btn--danger');
  });

  it('메시지를 표시한다', () => {
    render(
      <ConfirmDialog
        isOpen
        message="정말 삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('isOpen=false면 렌더링하지 않는다', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        message="정말 삭제하시겠습니까?"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.queryByText('정말 삭제하시겠습니까?')).not.toBeInTheDocument();
  });
});
