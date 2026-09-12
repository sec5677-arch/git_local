import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/client/components/ui/Modal';

describe('Modal', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('isOpen=false면 아무것도 렌더링하지 않는다', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>내용</p>
      </Modal>
    );
    expect(screen.queryByText('내용')).not.toBeInTheDocument();
  });

  it('isOpen=true면 오버레이와 컨텐츠를 렌더링한다', () => {
    render(
      <Modal isOpen onClose={jest.fn()}>
        <p>내용</p>
      </Modal>
    );
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('ESC 키 입력 시 onClose가 호출된다', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>내용</p>
      </Modal>
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('오버레이(바깥 영역) 클릭 시 onClose가 호출된다', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>내용</p>
      </Modal>
    );
    await userEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('모달 내부 클릭은 onClose를 호출하지 않는다', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>내용</p>
      </Modal>
    );
    await userEvent.click(screen.getByText('내용'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('컨텐츠에 role="dialog"가 설정된다', () => {
    render(
      <Modal isOpen onClose={jest.fn()}>
        <p>내용</p>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('열려있는 동안 body 스크롤이 잠기고, 닫히면 해제된다', () => {
    const { rerender } = render(
      <Modal isOpen onClose={jest.fn()}>
        <p>내용</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={jest.fn()}>
        <p>내용</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('');
  });
});
