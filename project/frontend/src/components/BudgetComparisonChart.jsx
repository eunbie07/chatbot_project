import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 목 데이터 (테스트용)
const mockCoachingData = {
  budgets: {
    "카페": 50000,
    "점심식사": 200000,
    "업무비품": 300000,
    "스트레스 쇼핑": 150000,
    "패션": 200000
  },
  saving_goal: 400000,
  tips: [
    "스트레스 쇼핑을 줄이기 위해 대체 활동을 찾아보세요",
    "카페 대신 집에서 커피를 만들어 드셔보세요",
    "온라인 쇼핑 전 24시간 기다리기 규칙을 적용해보세요"
  ]
};

const mockActualsData = {
  "카페": 45600,
  "점심식사": 168200,
  "업무비품": 875200,
  "스트레스 쇼핑": 2343600,
  "패션": 832600
};

// API 호출 함수들 (실패 시 목 데이터 사용)
const fetchCoachingData = async (userId) => {
  try {
    const response = await fetch(`https://eunbie.site/api/coach/${userId}`);
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.warn('API 호출 실패, 목 데이터 사용:', error.message);
    // API 실패 시 목 데이터 반환
    return mockCoachingData;
  }
};

const fetchActualsData = async (userId) => {
  try {
    const response = await fetch(`https://eunbie.site/api/actuals/${userId}`);
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.actuals || {};
  } catch (error) {
    console.warn('API 호출 실패, 목 데이터 사용:', error.message);
    // API 실패 시 목 데이터 반환
    return mockActualsData;
  }
};

const SpendingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userId, setUserId] = useState('testuser'); // 기본값, 실제로는 로그인 정보에서 가져와야 함
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 데이터 상태
  const [budgets, setBudgets] = useState({});
  const [actuals, setActuals] = useState({});
  const [savingGoal, setSavingGoal] = useState(0);
  const [tips, setTips] = useState([]);

  // 계산된 값들
  const { totalIncome, totalExpense, categoryTotals } = useMemo(() => {
    const categoryTotals = { ...actuals };
    const totalExpense = Object.values(actuals).reduce((sum, amount) => sum + amount, 0);
    
    // 수입은 예상값으로 계산 (실제로는 API에서 받아와야 함)
    const estimatedIncome = 4000000; // 400만원 가정
    
    return {
      categoryTotals,
      totalExpense,
      totalIncome: estimatedIncome
    };
  }, [actuals]);

  // 데이터 로드 함수
  const loadData = async () => {
    if (!userId || loading) {
      setError("사용자 ID가 필요합니다.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log(`Fetching data for user: ${userId}`);
      
      // 병렬로 데이터 가져오기
      const [coachData, actualData] = await Promise.all([
        fetchCoachingData(userId),
        fetchActualsData(userId)
      ]);

      setBudgets(coachData.budgets || {});
      setActuals(actualData);
      setSavingGoal(coachData.saving_goal || 0);
      setTips(coachData.tips || []);

      console.log('Data loaded successfully:', {
        budgets: coachData.budgets,
        actuals: actualData,
        savingGoal: coachData.saving_goal
      });

    } catch (err) {
      console.error('Error loading data:', err);
      
      // API 오류 시에도 목 데이터로 계속 진행
      setBudgets(mockCoachingData.budgets);
      setActuals(mockActualsData);
      setSavingGoal(mockCoachingData.saving_goal);
      setTips(mockCoachingData.tips);
      
      setError(`API 연결 실패로 샘플 데이터를 표시합니다`);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드 (중복 호출 방지)
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (userId && isMounted && Object.keys(actuals).length === 0) {
        await loadData();
      }
    };
    
    initializeData();
    
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // 예산 vs 실제 소비 차트 데이터
  const budgetComparisonData = useMemo(() => {
    const allCategories = new Set([...Object.keys(budgets), ...Object.keys(actuals)]);
    return Array.from(allCategories).map(category => ({
      name: category,
      예산: budgets[category] || 0,
      실제소비: actuals[category] || 0
    }));
  }, [budgets, actuals]);

  // 카테고리별 소비 파이차트 데이터
  const categoryPieData = useMemo(() => {
    return Object.entries(actuals).map(([name, value]) => ({
      name,
      value
    }));
  }, [actuals]);

  // 예산 대비 초과 분석
  const budgetAnalysis = useMemo(() => {
    const analysis = [];
    Object.keys(budgets).forEach(category => {
      const budget = budgets[category] || 0;
      const actual = actuals[category] || 0;
      const difference = actual - budget;
      const percentage = budget > 0 ? ((actual / budget) * 100) : 0;
      
      analysis.push({
        category,
        budget,
        actual,
        difference,
        percentage,
        status: difference > 0 ? 'over' : 'under'
      });
    });
    return analysis.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [budgets, actuals]);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];

  const formatCurrency = (value) => {
    return `${value.toLocaleString()}원`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p style={{ color: data.payload.fill }}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">💰</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AI 소비 코치</h1>
        <div className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-lg inline-block font-semibold mb-4">
          실시간 소비 습관 분석
        </div>
        
        {/* 사용자 ID 입력 및 로드 버튼 */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="사용자 ID 입력 (예: soyeon123)"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <button
            onClick={loadData}
            disabled={loading || !userId}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              loading || !userId 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>분석 중...</span>
              </div>
            ) : (
              "📊 데이터 분석"
            )}
          </button>
          <button
            onClick={() => {
              setBudgets(mockCoachingData.budgets);
              setActuals(mockActualsData);
              setSavingGoal(mockCoachingData.saving_goal);
              setTips(mockCoachingData.tips);
              setError('');
              setUserId('demo');
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
          >
            🎯 데모 보기
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className={`text-sm text-center mb-6 p-3 border rounded ${
          error.includes('샘플 데이터') 
            ? 'text-orange-600 bg-orange-50 border-orange-200' 
            : 'text-red-500 bg-red-50 border-red-200'
        }`}>
          {error}
        </div>
      )}

      {/* 데이터가 있을 때만 표시 */}
      {(Object.keys(actuals).length > 0 || Object.keys(budgets).length > 0) && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💸</span>
                <span className="text-gray-600 font-medium">총 지출</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpense)}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💰</span>
                <span className="text-gray-600 font-medium">총 수입</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalIncome)}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📊</span>
                <span className="text-gray-600 font-medium">잔액</span>
              </div>
              <div className={`text-2xl font-bold ${totalIncome - totalExpense > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalIncome - totalExpense)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🎯</span>
                <span className="text-gray-600 font-medium">저축 목표</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(savingGoal)}
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border">
              {[
                { id: 'overview', label: '개요', icon: '📊' },
                { id: 'budget', label: '예산 비교', icon: '💹' },
                { id: 'analysis', label: '상세 분석', icon: '🔍' },
                { id: 'tips', label: 'AI 조언', icon: '🧠' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4 text-center">카테고리별 소비 분포</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">카테고리별 소비 현황</h3>
                  <div className="space-y-3">
                    {Object.entries(actuals).map(([category, amount], index) => (
                      <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-3" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-gray-600">{category}</span>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-4 text-center">카테고리별 예산 vs 실제 소비</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={budgetComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="예산" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="실제소비" fill="#F472B6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">📊 예산 대비 소비 분석</h3>
                <div className="space-y-4">
                  {budgetAnalysis.map((item, index) => (
                    <div key={item.category} className={`p-4 rounded-lg border-l-4 ${
                      item.status === 'over' ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-semibold ${
                            item.status === 'over' ? 'text-red-800' : 'text-green-800'
                          }`}>
                            {item.category}
                          </h4>
                          <p className={`text-sm ${
                            item.status === 'over' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            예산: {formatCurrency(item.budget)} / 실제: {formatCurrency(item.actual)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            item.status === 'over' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.status === 'over' ? '+' : ''}{formatCurrency(Math.abs(item.difference))}
                          </div>
                          <div className={`text-sm ${
                            item.status === 'over' ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {item.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">🧠 AI 맞춤 조언</h3>
                <div className="space-y-4">
                  {tips.map((tip, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-blue-800 font-medium">💡 {tip}</p>
                    </div>
                  ))}
                  
                  {tips.length === 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                      AI 조언을 불러오는 중입니다...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 데이터 없을 때 안내 */}
      {Object.keys(actuals).length === 0 && Object.keys(budgets).length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">AI 소비 분석을 시작해보세요</h3>
          <p className="text-gray-500 mb-4">실제 사용자 ID를 입력하거나 데모를 통해 기능을 체험해보세요.</p>
          <div className="flex justify-center space-x-4">
            <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
              💡 실제 ID: soyeon123, testuser 등
            </div>
            <div className="text-sm text-gray-600 bg-green-50 px-4 py-2 rounded-lg">
              🎯 데모 버튼으로 즉시 체험 가능
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingDashboard;