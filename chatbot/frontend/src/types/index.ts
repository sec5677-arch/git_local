export interface Message {
  id: string;
  /** 사용자와 AI 메시지를 구분. UI 스타일링에 사용 */
  role: 'user' | 'assistant';
  content: string;
  /** 한 응답에 여러 도구 호출이 포함될 수 있음 */
  toolCalls?: ToolCall[];
  timestamp: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
}

/** 대화 세션 - 사이드바에서 목록 표시에 사용 */
export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currenttoolCalls: ToolCall[];
}
