import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Award, Target, TrendingUp, Calendar, LucideIcon } from "lucide-react";

export type Milestone = {
	title: string;
	date: string;
	icon: LucideIcon;
	completed: boolean;
};

export type ProgressStats = {
	totalSessions: number;
	totalSessionsChange: string; // e.g., "+8 this month"
	avgAccuracy: number;
	avgAccuracyChange: string;
	practiceHours: number;
	practiceHoursChange: string;
	currentStreak: number;
	currentStreakChange: string;
	monthlyData: {
		month: string;
		accuracy: number;
		fluency: number;
		pronunciation: number;
	}[];
	milestones: Milestone[];
	radarData: {
		category: string;
		score: number;
		fullMark: number;
	}[];
	strengthsWeaknesses: {
		name: string;
		value: number;
		color: string;
	}[];
};

export function useProgressData()
{
	const { user } = useAuth();

	return useQuery({
		queryKey: ["progress-stats", user?.id],
		enabled: !!user,
		queryFn: async (): Promise<ProgressStats> =>
		{
			if (!user)
			{
				return {
					totalSessions: 0,
					totalSessionsChange: "+0",
					avgAccuracy: 0,
					avgAccuracyChange: "+0%",
					practiceHours: 0,
					practiceHoursChange: "+0h",
					currentStreak: 0,
					currentStreakChange: "Start today!",
					monthlyData: [],
					milestones: [],
					radarData: [],
					strengthsWeaknesses: []
				};
			}

			const { data: sessions, error } = await supabase
				.from("practice_sessions")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", { ascending: true }); // Order by date ascending for monthly grouping

			if (error || !sessions)
			{
				console.error("Error fetching sessions:", error);
				return {
					totalSessions: 0,
					totalSessionsChange: "+0",
					avgAccuracy: 0,
					avgAccuracyChange: "+0%",
					practiceHours: 0,
					practiceHoursChange: "+0h",
					currentStreak: 0,
					currentStreakChange: "Start today!",
					monthlyData: [],
					milestones: [],
					radarData: [],
					strengthsWeaknesses: []
				};
			}

			// --- Stats Calculation ---

			const totalSessions = sessions.length;

			// Filter for this month
			const now = new Date();
			const thisMonth = now.getMonth();
			const thisYear = now.getFullYear();
			const sessionsThisMonth = sessions.filter(s =>
			{
				const d = new Date(s.created_at);
				return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
			});
			const totalSessionsChange = `+${sessionsThisMonth.length} this month`;

			// Avg Accuracy
			const sumAccuracy = sessions.reduce((acc, s) =>
			{
				const val = typeof s.accuracy === 'number' ? s.accuracy : parseFloat(s.accuracy);
				return acc + (isNaN(val) ? 0 : val);
			}, 0);
			const avgAccuracy = totalSessions > 0 ? Math.round(sumAccuracy / totalSessions) : 0;
			// Mock change for accuracy
			const avgAccuracyChange = totalSessions > 0 ? "+5% from start" : "0%";

			// Practice Hours (Assuming 5 mins per session for valid mock)
			const practiceHours = Math.round((totalSessions * 5 / 60) * 10) / 10;
			const practiceHoursMonth = Math.round((sessionsThisMonth.length * 5 / 60) * 10) / 10;
			const practiceHoursChange = `+${practiceHoursMonth}h this month`;

			// Streak (Use logic from useDashboardData or simple verify)
			// Re-implementing simplified streak logic here or abstracting it would be better. 
			// For now, I'll copy the logic for independence.
			const sessionsDesc = [...sessions].reverse();
			let streak = 0;
			if (sessionsDesc.length > 0)
			{
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const lastSessionDate = new Date(sessionsDesc[0].created_at);
				lastSessionDate.setHours(0, 0, 0, 0);

				if (lastSessionDate.getTime() === today.getTime())
				{
					streak = 1;
				}

				const sessionsByDay = new Set<string>();
				sessionsDesc.forEach(s =>
				{
					const d = new Date(s.created_at);
					d.setHours(0, 0, 0, 0);
					sessionsByDay.add(d.toISOString());
				});

				let currentTestDate = new Date();
				currentTestDate.setHours(0, 0, 0, 0);
				if (!sessionsByDay.has(currentTestDate.toISOString()))
				{
					currentTestDate.setDate(currentTestDate.getDate() - 1);
				}
				let currentStreak = 0;
				while (sessionsByDay.has(currentTestDate.toISOString()))
				{
					currentStreak++;
					currentTestDate.setDate(currentTestDate.getDate() - 1);
				}
				streak = currentStreak;
			}
			const currentStreakChange = streak > 3 ? "Personal best!" : "Keep going!";

			// --- Monthly Data ---
			const monthsMap = new Map<string, { totalAcc: number; count: number }>();
			sessions.forEach(s =>
			{
				const d = new Date(s.created_at);
				const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
				const val = typeof s.accuracy === 'number' ? s.accuracy : parseFloat(s.accuracy);
				if (!monthsMap.has(monthKey))
				{
					monthsMap.set(monthKey, { totalAcc: 0, count: 0 });
				}
				const curr = monthsMap.get(monthKey)!;
				curr.totalAcc += val;
				curr.count++;
			});

			// Fill in last 6 months to ensure chart/line continuity or just show what we have.
			// Let's just show what we have for now, or last 6 months including empty ones.
			// For simplicity, I'll just map the existing data.
			const monthlyData = Array.from(monthsMap.entries()).map(([month, data]) =>
			{
				const acc = Math.round(data.totalAcc / data.count);
				return {
					month,
					accuracy: acc,
					fluency: Math.max(0, acc - 5), // Mock derived
					pronunciation: Math.min(100, acc + 2) // Mock derived
				};
			});
			// If empty, provide at least one month so chart doesn't crash? Or handle in UI.
			if (monthlyData.length === 0)
			{
				const m = new Date().toLocaleDateString('en-US', { month: 'short' });
				monthlyData.push({ month: m, accuracy: 0, fluency: 0, pronunciation: 0 });
			}

			// --- Milestones ---
			const milestones: Milestone[] = [];

			// 1. First Session
			if (sessions.length > 0)
			{
				const firstDate = new Date(sessions[0].created_at).toLocaleDateString();
				milestones.push({
					title: "First Session Complete",
					date: firstDate,
					icon: Award,
					completed: true
				});
			} else
			{
				milestones.push({
					title: "First Session Complete",
					date: "Not yet",
					icon: Award,
					completed: false
				});
			}

			// 2. 7-Day Streak
			milestones.push({
				title: "7-Day Streak",
				date: streak >= 7 ? "Achieved" : "In Progress",
				icon: Target,
				completed: streak >= 7
			});

			// 3. 75% Accuracy
			const hasHighAccuracy = sessions.some(s => (typeof s.accuracy === 'number' ? s.accuracy : parseFloat(s.accuracy)) >= 75);
			milestones.push({
				title: "75% Accuracy",
				date: hasHighAccuracy ? "Achieved" : "In Progress",
				icon: TrendingUp,
				completed: hasHighAccuracy
			});

			// 4. 30-Day Streak (or 30 sessions for easier goal) -> Let's do 30 sessions
			milestones.push({
				title: "30 Sessions",
				date: totalSessions >= 30 ? "Achieved" : "In Progress",
				icon: Calendar,
				completed: totalSessions >= 30
			});

			// --- Radar Data (Mocked but dynamic based on average) ---
			const radarData = [
				{ category: "Vowels", score: Math.min(100, avgAccuracy + 5), fullMark: 100 },
				{ category: "Consonants", score: Math.max(0, avgAccuracy - 5), fullMark: 100 },
				{ category: "Blends", score: Math.max(0, avgAccuracy - 10), fullMark: 100 },
				{ category: "Diphthongs", score: avgAccuracy, fullMark: 100 },
				{ category: "R-sounds", score: Math.max(0, avgAccuracy - 15), fullMark: 100 },
				{ category: "S-sounds", score: Math.min(100, avgAccuracy + 2), fullMark: 100 },
			];

			// --- Strengths vs Weaknesses ---
			const strengthsWeaknesses = [
				{ name: "Strengths", value: avgAccuracy, color: "hsl(142, 71%, 45%)" },
				{ name: "Areas to Improve", value: 100 - avgAccuracy, color: "hsl(15, 85%, 60%)" },
			];

			return {
				totalSessions,
				totalSessionsChange,
				avgAccuracy,
				avgAccuracyChange,
				practiceHours,
				practiceHoursChange,
				currentStreak: streak,
				currentStreakChange,
				monthlyData,
				milestones,
				radarData,
				strengthsWeaknesses
			};
		},
	});
}
