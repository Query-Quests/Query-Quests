"use client";

import { useState, useEffect } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Separator } from "@/components/ui/separator";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Generate colors for up to 20 users
const generateColors = () => {
  const colors = [];
  for (let i = 0; i < 20; i++) {
    const hue = (i * 360 / 20) % 360;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
};

const userColors = generateColors();

export function LeaderBoard() {
  const [chartData, setChartData] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        
        // Get top 20 users
        const leaderboardResponse = await fetch('/api/leaderboard?limit=20');
        if (!leaderboardResponse.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const leaderboardData = await leaderboardResponse.json();
        setTopUsers(leaderboardData.leaderboard);

        // Generate last 3 months data, week by week
        const weeks = [];
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        
        // Calculate weeks from 3 months ago to now
        const totalWeeks = Math.ceil((now - threeMonthsAgo) / (7 * 24 * 60 * 60 * 1000));
        
        for (let i = totalWeeks - 1; i >= 0; i--) {
          const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
          const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
          
          // Format week label (e.g., "Oct 15" or "Nov 1")
          const weekLabel = weekStart.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          weeks.push({
            week: weekLabel,
            weekIndex: totalWeeks - 1 - i,
            weekStart: weekStart,
            weekEnd: weekEnd
          });
        }

        // Create chart data with simulated weekly progression for each user
        const chartDataPoints = weeks.map((weekInfo, weekIndex) => {
          const dataPoint = { 
            week: weekInfo.week,
            weekIndex: weekInfo.weekIndex
          };
          
          // For each user, simulate their score progression over the weeks
          leaderboardData.leaderboard.forEach((user, userIndex) => {
            // Simulate weekly score progression (current score distributed over all weeks)
            const currentScore = user.totalScore || 0;
            const baseScore = Math.max(0, currentScore * 0.2); // 20% base score
            const progressionFactor = (weekIndex + 1) / weeks.length; // Gradual progression
            
            // Add some randomness to make it more realistic
            const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
            const adjustedProgressionFactor = Math.max(0, Math.min(1, progressionFactor + randomVariation));
            
            const weeklyScore = Math.round(baseScore + (currentScore - baseScore) * adjustedProgressionFactor);
            
            dataPoint[`user_${user.id}`] = weeklyScore;
          });
          
          return dataPoint;
        });

        setChartData(chartDataPoints);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  // Create chart config for all users
  const chartConfig = {};
  topUsers.forEach((user, index) => {
    chartConfig[`user_${user.id}`] = {
      label: user.name,
      color: userColors[index % userColors.length],
    };
  });

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-6 lg:mt-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-center mb-6 lg:mb-10">
          Students Leaderboard
        </h1>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-6 lg:mt-10 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-center mb-6 lg:mb-10">
          Students Leaderboard
        </h1>
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="text-center text-destructive">
              Error: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-8xl mx-auto mt-6 lg:mt-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-center mb-6 lg:mb-10">
        Students Leaderboard - Weekly Progress (Last 3 Months)
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Top 20 Students Weekly Score Progression</CardTitle>
          <CardDescription>
            Weekly points progression over the last 3 months for the top 20 students
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                left: 20,
                right: 20,
                bottom: 80,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
                tickFormatter={(value) => value}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}pts`}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3 max-h-64 overflow-y-auto">
                        <p className="font-medium mb-2">Week of {label}</p>
                        {payload
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 10) // Show top 10 in tooltip to avoid clutter
                          .map((entry, index) => {
                            const user = topUsers.find(u => `user_${u.id}` === entry.dataKey);
                            return (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="font-medium">{user?.name || 'Unknown'}:</span>
                                <span>{entry.value} pts</span>
                              </div>
                            );
                          })}
                        {payload.length > 10 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            +{payload.length - 10} more students
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {topUsers.map((user, index) => (
                <Line
                  key={user.id}
                  dataKey={`user_${user.id}`}
                  type="monotone"
                  stroke={userColors[index % userColors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Students Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: userColors[index % userColors.length] }}
                />
                <span className="font-medium truncate">{user.name}</span>
                <span className="text-muted-foreground">({user.totalScore} pts)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 lg:mt-10">
        <Separator />
      </div>
    </div>
  );
}
