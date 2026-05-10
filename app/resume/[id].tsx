import { useLocalSearchParams } from 'expo-router';
import { ResumeFormScreen } from '@/src/screens/ResumeFormScreen';

export default function EditResumeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ResumeFormScreen id={id} />;
}
