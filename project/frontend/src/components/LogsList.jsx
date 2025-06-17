import { useEffect, useState } from 'react';
import axios from 'axios';

const LogsList = ({ userId = 'user_female' }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await axios.get(`https://eunbie.site/api/logs?user_id=${userId}`);
      setLogs(res.data.logs || []);
    };

    fetchLogs();
  }, [userId]);

  return (
    <div>
      <h3>감정 소비 기록</h3>
      {logs.length === 0 ? (
        <p>기록이 없습니다.</p>
      ) : (
        <ul>
          {logs.map((log) => (
            <li key={log._id}>
              <strong>{log.date}</strong> - [{log.emotion.label}] {log.description} ({log.amount}원)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LogsList;
