import { getHomeData } from '@/lib/home-data';
import HomeClient from './HomeClient';

// Trending data needs to feel live — revalidate every 60 seconds
export const revalidate = 60;

export default async function Page() {
  const homeData = await getHomeData();
  return <HomeClient {...homeData} />;
}
