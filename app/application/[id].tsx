import { useLocalSearchParams } from 'expo-router';
import { ApplicationDetailScreen } from '@/src/screens/ApplicationDetailScreen';

export default function ApplicationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApplicationDetailScreen id={id} />;
}
