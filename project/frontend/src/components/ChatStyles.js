import styled, { keyframes } from 'styled-components';

export const ChatContainer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-family: 'Apple SD Gothic Neo', sans-serif;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const ChatHeader = styled.h3`
  text-align: center;
  margin-bottom: 16px;
  color: #333;
`;

export const ChatArea = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  background: #f4f6ff;
  border-radius: 12px;
  margin-bottom: 12px;
  max-height: 400px;
`;

// 🔥 MessageBox 수정 - 카카오톡 스타일 정렬
export const MessageBox = styled.div`
  display: flex;
  align-items: flex-end;  // flex-start → flex-end (프로필과 메시지 하단 정렬)
  margin-bottom: 12px;
  gap: 8px;
  width: 100%;
  // 🔥 사용자 메시지는 오른쪽 정렬
  justify-content: ${({ $align }) => ($align === 'right' ? 'flex-end' : 'flex-start')};
`;

// 🔥 ProfileImage 수정 - 배경색과 위치 개선
export const ProfileImage = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  // 기존 코드와 동일한 색상 유지
  background: ${({ $isBot }) => $isBot ? '#667eea' : '#ffa726'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  // margin-top 제거 - align-items: flex-end로 자동 정렬
`;

export const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 70%;
  align-items: ${({ $align }) => ($align === 'right' ? 'flex-end' : 'flex-start')};
`;

export const NameTag = styled.div`
  font-size: 12px;  // 11px → 12px (가독성 개선)
  color: #888;      // #666 → #888 (기존 코드와 일치)
  margin-bottom: 4px;
  // 정렬에 따른 마진 조정
  align-self: ${({ $align }) => ($align === 'right' ? 'flex-end' : 'flex-start')};
`;

// 🔥 MessageText 대폭 수정 - 기존 코드 스타일과 일치
export const MessageText = styled.div`
  // 기존 코드와 동일한 색상 적용
  background-color: ${({ $align }) => 
    $align === 'right' ? '#667eea' : '#f1f3f4'
  };
  color: ${({ $align }) => 
    $align === 'right' ? 'white' : '#333'
  };
  border-radius: ${({ $align }) => 
    $align === 'right' 
      ? '18px 18px 4px 18px'   // 기존 코드와 일치
      : '18px 18px 18px 4px'   // 기존 코드와 일치
  };
  padding: 12px 16px;  // 기존 코드와 일치
  word-break: break-word;
  line-height: 1.4;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  max-width: 280px;  // 최대 너비 추가
  
  // 말풍선 꼬리 제거 (더 깔끔한 디자인)
`;

// 🔥 MessageMeta 수정 - 시간 표시 개선
export const MessageMeta = styled.div`
  font-size: 11px;
  color: #999;  // #666 → #999 (기존 코드와 일치)
  align-self: flex-end;
  white-space: nowrap;
  margin-bottom: 2px;
`;

export const InputArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  
  input {
    flex-grow: 1;
    padding: 12px 16px;
    border-radius: 20px;
    border: 1px solid #ddd;
    outline: none;
    font-size: 14px;
    
    &:focus {
      border-color: #7c8bff;
    }
  }
`;

export const Button = styled.button`
  background-color: #7c8bff;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #6b7bf7;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const blink = keyframes`
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
`;

// 🔥 DotLoader 수정 - 기존 코드 스타일과 일치
export const DotLoader = styled.div`
  display: flex;
  gap: 2px;  // 4px → 2px (기존 코드와 일치)
  
  span {
    width: 6px;
    height: 6px;
    background: #999;  // #7c8bff → #999 (기존 코드와 일치)
    border-radius: 50%;
    animation: bounce 1.4s infinite both;  // blink → bounce
  }
  span:nth-child(1) { animation-delay: 0s; }     // 기존 코드와 일치
  span:nth-child(2) { animation-delay: 0.2s; }   // 기존 코드와 일치
  span:nth-child(3) { animation-delay: 0.4s; }   // 기존 코드와 일치
`;

// 🔥 bounce 애니메이션 추가 (기존 코드에서 사용)
const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

export const SpeakingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 6px;
  
  span {
    background-color: #6c91ff;
    width: 10px;
    height: 10px;
    margin: 0 4px;
    border-radius: 50%;
    display: inline-block;
    animation: ${bounce} 1.4s infinite ease-in-out both;
  }
  
  span:nth-child(1) { animation-delay: -0.32s; }
  span:nth-child(2) { animation-delay: -0.16s; }
  span:nth-child(3) { animation-delay: 0; }
`;

export const SpeakingText = styled.div`
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-top: 4px;
`;