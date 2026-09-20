'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/client/components/ui/Button';
import { createTicketSchema } from '@/shared/validations/ticket';
import type { CreateTicketInput, Ticket } from '@/shared/types/ticket';
import type { TicketPriority } from '@/shared/constants';

type TicketFormValues = {
  title: string;
  description: string;
  priority: TicketPriority;
  plannedStartDate: string;
  dueDate: string;
};

function toFormValues(initialData?: Partial<Ticket>): TicketFormValues {
  return {
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    priority: (initialData?.priority as TicketPriority | undefined) ?? 'MEDIUM',
    plannedStartDate: initialData?.plannedStartDate ?? '',
    dueDate: initialData?.dueDate ?? '',
  };
}

export function TicketForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  mode: 'create' | 'edit';
  initialData?: Partial<Ticket>;
  onSubmit: (data: CreateTicketInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [values, setValues] = useState<TicketFormValues>(() => toFormValues(initialData));
  const [errors, setErrors] = useState<Partial<Record<keyof TicketFormValues, string>>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = createTicketSchema.safeParse({
      title: values.title,
      description: values.description.trim() === '' ? undefined : values.description,
      priority: values.priority,
      plannedStartDate: values.plannedStartDate === '' ? undefined : values.plannedStartDate,
      dueDate: values.dueDate === '' ? undefined : values.dueDate,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TicketFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof TicketFormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label className="form-label" htmlFor="ticket-title">
          제목
        </label>
        <input
          id="ticket-title"
          className="form-input"
          type="text"
          value={values.title}
          onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
        />
        {errors.title && <p className="form-error">{errors.title}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="ticket-description">
          설명
        </label>
        <textarea
          id="ticket-description"
          className="form-textarea"
          value={values.description}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, description: event.target.value }))
          }
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="ticket-priority">
          우선순위
        </label>
        <select
          id="ticket-priority"
          className="form-select"
          value={values.priority}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, priority: event.target.value as TicketPriority }))
          }
        >
          <option value="LOW">낮음</option>
          <option value="MEDIUM">보통</option>
          <option value="HIGH">높음</option>
        </select>
        {errors.priority && <p className="form-error">{errors.priority}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="ticket-planned-start-date">
          시작예정일
        </label>
        <input
          id="ticket-planned-start-date"
          className="form-input"
          type="date"
          value={values.plannedStartDate}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, plannedStartDate: event.target.value }))
          }
        />
        {errors.plannedStartDate && <p className="form-error">{errors.plannedStartDate}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="ticket-due-date">
          종료예정일
        </label>
        <input
          id="ticket-due-date"
          className="form-input"
          type="date"
          value={values.dueDate}
          onChange={(event) => setValues((prev) => ({ ...prev, dueDate: event.target.value }))}
        />
        {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {mode === 'create' ? '생성' : '저장'}
        </Button>
      </div>
    </form>
  );
}
