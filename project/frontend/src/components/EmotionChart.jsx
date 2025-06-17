import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const EmotionChart = () => {
  // 더미 데이터 (MongoDB에서 불러오도록 확장 가능)
  const data = {
    labels: ['기쁨', '우울', '불안', '스트레스', '무감정'],
    datasets: [
      {
        label: '감정별 소비 건수',
        data: [4, 6, 2, 5, 1],
        backgroundColor: ['#a4c8ff', '#ffb3b3', '#ffe0a3', '#d5cfff', '#d9d9d9'],
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
      height: '100%'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>감정별 소비 분포</h3>
      <Bar data={data} options={options} />
    </div>
  );
};

export default EmotionChart;
