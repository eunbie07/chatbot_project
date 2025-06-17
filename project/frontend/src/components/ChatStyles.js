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

export const MessageBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ align }) => (align === 'right' ? 'flex-end' : 'flex-start')};
  margin-bottom: 10px;
`;

export const NameTag = styled.div`
  font-size: 11px;
  color: #888;
  margin-bottom: 2px;
`;

export const MessageText = styled.div`
  background-color: ${({ bg }) => bg || '#e0e0e0'};
  border-radius: 16px;
  padding: 10px 14px;
  max-width: 70%;
`;

export const MessageMeta = styled.div`
  font-size: 10px;
  color: #888;
  margin-top: 4px;
`;

export const InputArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  input {
    flex-grow: 1;
    padding: 8px 12px;
    border-radius: 12px;
    border: 1px solid #ccc;
  }
`;

export const Button = styled.button`
  background-color: #7c8bff;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const blink = keyframes`
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
`;

export const DotLoader = styled.div`
  display: flex;
  gap: 4px;
  span {
    width: 6px;
    height: 6px;
    background: #7c8bff;
    border-radius: 50%;
    animation: ${blink} 1.4s infinite ease-in-out;
  }
  span:nth-child(2) { animation-delay: 0.2s; }
  span:nth-child(3) { animation-delay: 0.4s; }
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
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