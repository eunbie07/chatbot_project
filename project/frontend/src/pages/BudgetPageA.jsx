import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, LineChart, Line } from 'recharts';
import { useUser } from '../contexts/UserContext';

// 카테고리 정규화 함수 - 실제 소비 카테고리를 예산 카테고리에 매핑
const normalizeCategory = (category) => {
  const categoryMap = {
    // 식비 관련
    "점심식사": "식비",
    "카페": "식비",
    "식당": "식비",
    "배달": "식비",
    
    // 쇼핑 관련  
    "스트레스 쇼핑": "쇼핑",
    "패션": "쇼핑",
    "의류": "쇼핑",
    "온라인쇼핑": "쇼핑",
    
    // 기타
    "업무비품": "기타",
    "생활용품": "기타",
    "교통": "기타",
    "의료": "기타"
  };
  
  return categoryMap[category] || category;
};

// API 호출 함수들
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
    console.log('🎯 Coach API 실패:', error.message);
    throw error;
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
    console.log('🎯 Actuals API 실패:', error.message);
    throw error;
  }
};

const fetchSummaryData = async (userId) => {
  try {
    const response = await fetch(`https://eunbie.site/api/summary/${userId}`);
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return {
      totalIncome: data.total_income || 0,
      totalExpense: data.total_expense || 0
    };
  } catch (error) {
    console.log('🎯 Summary API 실패:', error.message);
    throw error;
  }
};

const BudgetPageA = () => {
  const { user } = useUser();
  const userId = user?.username || "";
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 데이터 상태
  const [budgets, setBudgets] = useState({});
  const [actuals, setActuals] = useState({});
  const [savingGoal, setSavingGoal] = useState(0);
  const [tips, setTips] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // 데이터 로드 함수
  const loadData = async () => {
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log(`🔍 ${userId} 사용자 데이터 분석 시작...`);
      
      // 모든 API를 병렬로 호출
      const [coachData, actualData, summaryData] = await Promise.all([
        fetchCoachingData(userId),
        fetchActualsData(userId),
        fetchSummaryData(userId)
      ]);

      setBudgets(coachData.budgets || {});
      setActuals(actualData);
      setSavingGoal(coachData.saving_goal || 0);
      setTips(coachData.tips || []);
      setTotalIncome(summaryData.totalIncome);
      setTotalExpense(summaryData.totalExpense);

      console.log('✅ 실제 데이터 로드 완료!', {
        categories: Object.keys(actualData).length,
        income: summaryData.totalIncome.toLocaleString() + '원',
        expense: summaryData.totalExpense.toLocaleString() + '원'
      });

    } catch (err) {
      console.error('❌ 데이터 로드 실패:', err);
      setError(`데이터를 불러올 수 없습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (userId && Object.keys(actuals).length === 0) {
      loadData();
    }
  }, [userId]);

  // 🔥 카테고리 정규화된 실제 소비 데이터 계산
  const normalizedActuals = useMemo(() => {
    const normalized = {};
    Object.entries(actuals).forEach(([category, amount]) => {
      const normalizedCat = normalizeCategory(category);
      normalized[normalizedCat] = (normalized[normalizedCat] || 0) + amount;
    });
    return normalized;
  }, [actuals]);

  // 🔥 예산 데이터도 정규화 (일관성을 위해)
  const normalizedBudgets = useMemo(() => {
    const normalized = {};
    Object.entries(budgets).forEach(([category, amount]) => {
      const normalizedCat = normalizeCategory(category);
      normalized[normalizedCat] = (normalized[normalizedCat] || 0) + amount;
    });
    return normalized;
  }, [budgets]);

  // 예산 vs 실제 소비 차트 데이터 (정규화된 데이터 사용)
  const budgetComparisonData = useMemo(() => {
    const allCategories = new Set([...Object.keys(normalizedBudgets), ...Object.keys(normalizedActuals)]);
    return Array.from(allCategories).map(category => ({
      name: category,
      예산: normalizedBudgets[category] || 0,
      실제소비: normalizedActuals[category] || 0
    }));
  }, [normalizedBudgets, normalizedActuals]);

  // 카테고리별 소비 파이차트 데이터 (정규화된 데이터 사용)
  const categoryPieData = useMemo(() => {
    return Object.entries(normalizedActuals).map(([name, value]) => ({
      name,
      value
    }));
  }, [normalizedActuals]);

  // 예산 대비 초과 분석 (정규화된 데이터 사용)
  const budgetAnalysis = useMemo(() => {
    const analysis = [];
    const allCategories = new Set([...Object.keys(normalizedBudgets), ...Object.keys(normalizedActuals)]);
    
    allCategories.forEach(category => {
      const budget = normalizedBudgets[category] || 0;
      const actual = normalizedActuals[category] || 0;
      const difference = actual - budget;
      const percentage = budget > 0 ? ((actual / budget) * 100) : (actual > 0 ? 999 : 0); // 예산이 0이면 999%로 표시
      
      // 예산이나 실제 소비가 있는 경우만 포함
      if (budget > 0 || actual > 0) {
        analysis.push({
          category,
          budget,
          actual,
          difference,
          percentage,
          status: difference > 0 ? 'over' : 'under'
        });
      }
    });
    return analysis.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [normalizedBudgets, normalizedActuals]);

  // 소비 트렌드 데이터 (정규화된 실제 지출 사용)
  const trendData = useMemo(() => {
    const months = ['1월', '2월', '3월', '4월', '5월'];
    const currentExpense = Object.values(normalizedActuals).reduce((sum, val) => sum + val, 0);
    
    return months.map((month, index) => ({
      month,
      지출: Math.floor(currentExpense * (0.7 + (index * 0.08))),
      예산: Math.floor(currentExpense * 0.9),
      저축: Math.floor(currentExpense * 0.1)
    }));
  }, [normalizedActuals]);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];

  const formatCurrency = (value) => {
    return `${value.toLocaleString()}원`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
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
      const total = categoryPieData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg border-gray-200">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
          <p className="text-sm text-blue-600">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4"></div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Budget & Spending Tracker 
          </h1>
          <p className="text-gray-600 text-lg">상세한 소비 패턴과 트렌드를 분석해보세요</p>
          
          <div className="mt-6 flex justify-center">
            <button 
              onClick={loadData}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>분석 중...</span>
                </div>
              ) : (
                "🔄 데이터 새로고침"
              )}
            </button>
          </div>
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="font-semibold text-red-800 mb-2">오류 발생</p>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button 
                onClick={loadData}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 데이터가 있을 때만 표시 */}
        {!loading && !error && (Object.keys(normalizedActuals).length > 0 || totalExpense > 0) && (
          <>
            {/* 요약 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-red-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">총 지출</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                    <p className="text-xs text-gray-500 mt-1">이번 달 지출액</p>
                  </div>
                  <div className="text-4xl">💸</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">총 수입</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalIncome)}</p>
                    <p className="text-xs text-gray-500 mt-1">이번 달 수입액</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-green-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">잔액</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">저축률: {savingsRate}%</p>
                  </div>
                  <div className="text-4xl">{balance >= 0 ? '📈' : '📉'}</div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-yellow-500 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">저축 목표</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(savingGoal)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      달성률: {savingGoal > 0 ? Math.min(100, ((balance / savingGoal) * 100)).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div className="text-4xl">🎯</div>
                </div>
              </div>
            </div>

            {/* 탭 네비게이션 */}
            <div className="mb-8">
              <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-lg border">
                {[
                  { id: 'overview', label: '개요', icon: '📊' },
                  { id: 'budget', label: '예산 비교', icon: '💹' },
                  { id: 'trend', label: '트렌드', icon: '📈' },
                  { id: 'analysis', label: '상세 분석', icon: '🔍' },
                  { id: 'tips', label: 'AI 조언', icon: '🧠' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
                    }`}
                  >
                    <span className="mr-2 text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">카테고리별 소비 분포</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => percent > 5 ? `${name}\n${(percent * 100).toFixed(0)}%` : ''}
                          outerRadius={120}
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
                  
                  <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold mb-6 text-gray-800">카테고리별 소비 현황</h3>
                    <div className="space-y-4">
                      {Object.entries(normalizedActuals).map(([category, amount], index) => {
                        const totalNormalizedExpense = Object.values(normalizedActuals).reduce((sum, val) => sum + val, 0);
                        const percentage = totalNormalizedExpense > 0 ? ((amount / totalNormalizedExpense) * 100).toFixed(1) : 0;
                        const budget = normalizedBudgets[category] || 0;
                        const isOverBudget = amount > budget && budget > 0;
                        
                        return (
                          <div key={category} className={`p-4 rounded-xl transition-all duration-200 hover:scale-102 ${
                            isOverBudget ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'
                          }`}>
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <div 
                                  className="w-6 h-6 rounded-full mr-4 shadow-sm" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <div>
                                  <span className="font-semibold text-gray-700">{category}</span>
                                  {budget > 0 && (
                                    <div className="text-xs text-gray-500">
                                      예산: {formatCurrency(budget)} 
                                      {isOverBudget && <span className="text-red-500 ml-1">초과!</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`font-bold text-lg ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}>
                                {formatCurrency(amount)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  isOverBudget ? 'bg-red-500' : ''
                                }`}
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: isOverBudget ? undefined : COLORS[index % COLORS.length]
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {percentage}% of total
                              {budget > 0 && (
                                <span className="ml-2">
                                  (예산 대비 {((amount / budget) * 100).toFixed(0)}%)
                                </span>
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'budget' && (
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <h3 className="text-2xl font-bold mb-8 text-center text-gray-800">카테고리별 예산 vs 실제 소비</h3>
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={budgetComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="예산" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                        name="예산"
                      />
                      <Bar 
                        dataKey="실제소비" 
                        fill="#F472B6" 
                        radius={[4, 4, 0, 0]}
                        name="실제 소비"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'trend' && (
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <h3 className="text-2xl font-bold mb-8 text-center text-gray-800">월별 소비 트렌드</h3>
                  <ResponsiveContainer width="100%" height={450}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#666" />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="예산" 
                        stackId="1" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                        name="예산"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="지출" 
                        stackId="2" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.6}
                        name="지출"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="저축" 
                        stackId="3" 
                        stroke="#ffc658" 
                        fill="#ffc658" 
                        fillOpacity={0.4}
                        name="저축"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-700 text-center">
                      💡 5월 데이터를 기반으로 한 추정 트렌드입니다. 실제 과거 데이터는 향후 업데이트 예정입니다.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <h3 className="text-2xl font-bold mb-8 text-gray-800">📊 예산 대비 소비 상세 분석</h3>
                  <div className="grid gap-6">
                    {budgetAnalysis.map((item, index) => (
                      <div key={item.category} className={`p-6 rounded-xl border-l-4 transition-all duration-200 hover:scale-102 ${
                        item.status === 'over' 
                          ? 'bg-red-50 border-red-400 hover:bg-red-100' 
                          : 'bg-green-50 border-green-400 hover:bg-green-100'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className={`text-xl font-bold mb-2 ${
                              item.status === 'over' ? 'text-red-800' : 'text-green-800'
                            }`}>
                              {item.category}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">예산: </span>
                                <span className="font-semibold">{formatCurrency(item.budget)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">실제: </span>
                                <span className="font-semibold">{formatCurrency(item.actual)}</span>
                              </div>
                            </div>
                            
                            {/* 진행률 바 */}
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    item.status === 'over' ? 'bg-red-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right ml-6">
                            <div className={`text-2xl font-bold ${
                              item.status === 'over' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {item.status === 'over' ? '+' : ''}{formatCurrency(Math.abs(item.difference))}
                            </div>
                            <div className={`text-lg font-semibold ${
                              item.status === 'over' ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {item.percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {item.status === 'over' ? '예산 초과' : '예산 절약'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'tips' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold mb-6 text-gray-800">🧠 AI 맞춤 조언</h3>
                    <div className="space-y-4">
                      {tips.map((tip, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
                          <p className="text-blue-800 font-medium">💡 {tip}</p>
                        </div>
                      ))}
                      
                      {tips.length === 0 && (
                        <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500">
                          <div className="text-4xl mb-2">🤖</div>
                          <p>AI 조언을 불러오는 중입니다...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold mb-6 text-gray-800">📈 종합 평가</h3>
                    <div className="space-y-6">
                      {/* 소비 패턴 점수 */}
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <h4 className="font-bold text-purple-800 mb-4">소비 패턴 점수</h4>
                        <div className="flex items-center mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                            <div 
                              className="bg-gradient-to-r from-purple-400 to-pink-500 h-4 rounded-full transition-all duration-1000" 
                              style={{ width: `${Math.min(100, Math.max(0, (balance / totalIncome) * 100 + 50))}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-2xl text-purple-700">
                            {Math.min(100, Math.max(0, Math.round((balance / totalIncome) * 100 + 50)))}점
                          </span>
                        </div>
                        <p className="text-sm text-purple-600">
                          {balance >= 0 ? '우수한 소비 관리!' : '개선이 필요합니다'}
                        </p>
                      </div>

                      {/* 저축률 분석 */}
                      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <h4 className="font-bold text-green-800 mb-4">저축률 분석</h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-700">현재 저축률</span>
                          <span className="font-bold text-2xl text-green-800">{savingsRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.max(0, Math.min(100, parseFloat(savingsRate)))}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-green-600 mt-2">
                          {parseFloat(savingsRate) >= 20 ? '훌륭한 저축률입니다!' : 
                           parseFloat(savingsRate) >= 10 ? '평균적인 저축률입니다' : 
                           '저축률을 높여보세요'}
                        </p>
                      </div>

                      {/* 월별 목표 달성률 */}
                      <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                        <h4 className="font-bold text-yellow-800 mb-4">목표 달성률</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-700">저축 목표</span>
                            <span className="font-semibold">{formatCurrency(savingGoal)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-700">현재 저축</span>
                            <span className="font-semibold">{formatCurrency(Math.max(0, balance))}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
                              style={{ 
                                width: `${savingGoal > 0 ? Math.min(100, (Math.max(0, balance) / savingGoal) * 100) : 0}%` 
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-yellow-600">
                            달성률: {savingGoal > 0 ? Math.min(100, ((Math.max(0, balance) / savingGoal) * 100)).toFixed(0) : 0}%
                          </p>
                        </div>
                      </div>

                      {/* 이번 달 종합 평가 */}
                      <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                        <h4 className="font-bold text-indigo-800 mb-3">이번 달 종합 평가</h4>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">
                              {balance >= savingGoal ? '🎉' : balance >= 0 ? '👍' : '⚠️'}
                            </span>
                            <p className="text-indigo-700 font-medium">
                              {balance >= savingGoal 
                                ? "목표를 초과 달성했습니다! 훌륭해요!" 
                                : balance >= 0 
                                ? "수입 범위 내에서 잘 관리하고 계시네요" 
                                : "지출 관리에 더 신경 써보세요"}
                            </p>
                          </div>
                          
                          {/* 개선 포인트 */}
                          <div className="mt-4 p-3 bg-white rounded-lg">
                            <h5 className="font-semibold text-gray-800 mb-2">💡 개선 포인트</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {budgetAnalysis.filter(item => item.status === 'over').length > 0 && (
                                <li>• 예산 초과 카테고리: {budgetAnalysis.filter(item => item.status === 'over').map(item => item.category).join(', ')}</li>
                              )}
                              {parseFloat(savingsRate) < 10 && (
                                <li>• 저축률을 10% 이상으로 높여보세요</li>
                              )}
                              <li>• 고정비와 변동비를 구분하여 관리해보세요</li>
                              <li>• 정기적인 가계부 작성으로 소비 패턴을 파악하세요</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 데이터 없을 때 안내 */}
        {!loading && !error && Object.keys(normalizedActuals).length === 0 && totalExpense === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-8">📊</div>
            <h3 className="text-3xl font-bold text-gray-600 mb-4">분석할 데이터가 없습니다</h3>
            <p className="text-gray-500 text-lg mb-8">소비 기록을 추가한 후 다시 시도해주세요.</p>
            <div className="space-x-4">
              <button 
                onClick={loadData}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔄 데이터 새로고침
              </button>
              <button 
                onClick={() => window.location.href = '/diary'}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📝 소비 기록하기
              </button>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="mt-16 text-center py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            💡 이 분석은 AI를 활용하여 생성되었습니다. 참고용으로만 활용해주세요.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetPageA;