import { HomeScreen } from "@/components/home/HomeScreen";
import { BottomNav } from "@/components/shared/BottomNav";
import { InstallBanner } from "@/components/shared/InstallBanner";

export default function HomePage() {
  return (
    <>
      <HomeScreen />
      <BottomNav />
      <InstallBanner />
    </>
  );
}
