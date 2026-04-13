import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

type WeeklyPoint = {
  day: string;
  score: number;
};

export function ProgressChart() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["weekly-practice", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WeeklyPoint[]> => {
      if (!user) return [];

      // Last 7 days of practice, grouped by date
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("accuracy, created_at")
        .eq("user_id", user.id)
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: true });

      if (error || !data) {
        console.error("Error loading practice_sessions", error);
        return [];
      }

      const byDay = new Map<
        string,
        { total: number; count: number }
      >();

      data.forEach((row) => {
        const d = new Date(row.created_at as string);
        const key = d.toLocaleDateString(undefined, {
          weekday: "short",
        });
        const current = byDay.get(key) ?? { total: 0, count: 0 };
        const accuracy =
          typeof row.accuracy === "number"
            ? row.accuracy
            : parseFloat(String(row.accuracy));
        byDay.set(key, {
          total: current.total + accuracy,
          count: current.count + 1,
        });
      });

      return Array.from(byDay.entries()).map(([day, stats]) => ({
        day,
        score: Math.round(stats.total / Math.max(stats.count, 1)),
      }));
    },
  });

  const chartData =
    data && data.length > 0
      ? data
      : [
          { day: "Mon", score: 0 },
          { day: "Tue", score: 0 },
          { day: "Wed", score: 0 },
          { day: "Thu", score: 0 },
          { day: "Fri", score: 0 },
          { day: "Sat", score: 0 },
          { day: "Sun", score: 0 },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Weekly Progress
          </h3>
          <p className="text-sm text-muted-foreground">
            Speech accuracy over time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
          {isLoading && (
            <span className="text-xs text-muted-foreground">
              Loading...
            </span>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(174, 62%, 47%)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(174, 62%, 47%)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(180, 20%, 88%)"
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(200, 15%, 45%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(200, 15%, 45%)", fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(180, 20%, 88%)",
                borderRadius: "12px",
                boxShadow: "0 4px 16px hsl(200 25% 15% / 0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(174, 62%, 47%)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
