import { getHomeData } from '@/lib/home-data';
import HomeClient from './HomeClient';

export const revalidate = 300; // 5 minutes — home data doesn't need 60s freshness

export default async function Page() {
  const homeData = await getHomeData();
  return <HomeClient {...homeData} />;
}
