import Header from "@/components/header";
import { LeaderBoard } from "@/components/ui/leaderboard";
import { LeaderboardTable } from "@/components/leaderboardTable";

export default async function Home() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">Welcome to Query-Quest</h1>
            <p className="text-lg text-muted-foreground">
              Master SQL through interactive challenges and track your progress
            </p>
          </div>
          
          <LeaderBoard />
          <LeaderboardTable />
        </div>
      </div>
    </>
  );
}
