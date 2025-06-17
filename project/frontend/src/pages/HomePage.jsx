import Layout from '../components/Layout';
import ChatBot from '../components/ChatBot';
import EmotionChart from '../components/EmotionChart';
import DiaryCard from '../components/DiaryCard';

/**
 * HomePage component that renders the main layout of the application.
 * It includes an EmotionChart on the left, a ChatBot in the center, and a DiaryCard on the right.
 */

export default function HomePage() {
  return (
    <Layout
      left={<EmotionChart />}
      center={<ChatBot />}
      right={<DiaryCard />}
    />
  );
}
