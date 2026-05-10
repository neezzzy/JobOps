import { useLocalSearchParams } from 'expo-router';
import { ApplicationFormScreen } from '@/src/screens/ApplicationFormScreen';

export default function EditApplicationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApplicationFormScreen id={id} />;
}
