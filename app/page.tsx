import { getHomeData } from '@/lib/home-data';
import HomeClient from './HomeClient';

export const revalidate = 60;

export default async function Page() {
  const homeData = await getHomeData();
  return <HomeClient {...homeData} />;
}
