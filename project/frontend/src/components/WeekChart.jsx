// src/components/WeekChart.jsx

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function WeekChart() {
  const data = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        label: '감정 점수 (1~5)',
        data: [2, 3, 2, 4, 3, 5, 4],  // 필요시 API에서 불러올 수 있음
        fill: true,
        tension: 0.4,
        borderColor: '#7C8BFF',
        backgroundColor: 'rgba(124, 139, 255, 0.15)',
        pointBackgroundColor: '#7C8BFF',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1
        },
        grid: {
          borderDash: [4, 2],
          color: '#E0E0E0',
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ marginTop: '25px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#333' }}>이번 주 감정 변화</h3>
      <Line data={data} options={options} />
    </div>
  );
}
