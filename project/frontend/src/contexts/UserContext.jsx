// contexts/UserContext.js
import { createContext, useContext, useState, useEffect } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage와 URL 파라미터에서 사용자 정보 복원
  useEffect(() => {
    // URL 파라미터에서 사용자 정보 확인
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
      // URL 파라미터에서 받은 사용자 정보로 설정
      const userData = { username: decodeURIComponent(userParam) };
      setUser(userData);
      localStorage.setItem('username', userData.username);
      console.log("URL에서 사용자 정보 설정됨:", userData.username);
      
      // URL에서 user 파라미터 제거 (깔끔하게 하기 위해)
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('user');
      window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
    } else {
      // URL 파라미터가 없으면 localStorage에서 복원
      const savedUsername = localStorage.getItem('username');
      if (savedUsername) {
        setUser({ username: savedUsername });
        console.log("저장된 사용자 복원됨:", savedUsername);
      }
    }
    
    setIsLoading(false);
  }, []);

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
    localStorage.removeItem('username');
    console.log("로그아웃 완료");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
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