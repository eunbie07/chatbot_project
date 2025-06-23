// contexts/UserContext.js
import { createContext, useContext, useState, useEffect } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // localStorage에서 사용자 정보 복원
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    if (savedUsername) {
      setUser({ username: savedUsername });
      console.log("저장된 사용자 복원됨:", savedUsername);
    }
  }, []);

  // 로그아웃 함수 (이 부분이 중요!)
  const logout = () => {
    setUser(null);
    localStorage.removeItem('username');
    console.log("로그아웃 완료");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}