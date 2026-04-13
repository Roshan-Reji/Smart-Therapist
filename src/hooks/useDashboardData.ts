import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type DashboardStats = {
	totalSessions: number;
	avgAccuracy: number;
	streak: number;
	recentGames: {
		id: number;
		name: string;
		score: number;
		duration: string;
		difficulty: string;
		color: string;
		date: Date;
	}[];
	achievements: number;
	achievementsTrend: string;
	showLowScoreAlert?: boolean;
};

export function useDashboardData()
{
	const { user } = useAuth();

	return useQuery({
		queryKey: ["dashboard-stats", user?.id],
		enabled: !!user,
		queryFn: async (): Promise<DashboardStats> =>
		{
			if (!user)
			{
				return {
					totalSessions: 0,
					avgAccuracy: 0,
					streak: 0,
					recentGames: [],
					achievements: 0,
					achievementsTrend: "",
				};
			}

			// Fetch all sessions ordered by date
			const { data: sessions, error } = await supabase
				.from("practice_sessions")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false });

			if (error || !sessions)
			{
				console.error("Error fetching sessions:", error);
				return {
					totalSessions: 0,
					avgAccuracy: 0,
					streak: 0,
					recentGames: [],
					achievements: 0,
					achievementsTrend: "",
				};
			}

			// Calculate Total Sessions
			const totalSessions = sessions.length;

			// Calculate Avg Accuracy
			const sumAccuracy = sessions.reduce((acc, session) =>
			{
				const val = typeof session.accuracy === 'number' ? session.accuracy : parseFloat(session.accuracy);
				return acc + (isNaN(val) ? 0 : val);
			}, 0);
			const avgAccuracy = totalSessions > 0 ? Math.round(sumAccuracy / totalSessions) : 0;

			// Calculate Streak
			// Sort sessions by date descending (already done by query)
			let streak = 0;
			if (sessions.length > 0)
			{
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				// Check if there's a session today
				const lastSessionDate = new Date(sessions[0].created_at);
				lastSessionDate.setHours(0, 0, 0, 0);

				if (lastSessionDate.getTime() === today.getTime())
				{
					streak = 1;
				}

				// Iterate backwards to find consecutive days
				// This is a simplified streak calculation.
				// A robust one would check previous days.
				// For now, let's just count consecutive days where a session exists.
				// Group sessions by day first
				const sessionsByDay = new Set<string>();
				sessions.forEach(s =>
				{
					const d = new Date(s.created_at);
					d.setHours(0, 0, 0, 0);
					sessionsByDay.add(d.toISOString());
				});

				// Check consecutive days backwards from today or yesterday
				let currentTestDate = new Date();
				currentTestDate.setHours(0, 0, 0, 0);

				// If no session today, check if streak ended yesterday
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

			// Format Recent Games
			// We map "phrase practice" to "Game" concepts for display
			const recentGames = sessions.slice(0, 3).map((session, index) =>
			{
				// Mocking some game-like attributes based on the session data
				const accuracy = typeof session.accuracy === 'number' ? session.accuracy : parseFloat(session.accuracy);

				let difficulty = "Medium";
				if (session.phrase.length < 20) difficulty = "Easy";
				if (session.phrase.length > 50) difficulty = "Hard";

				let color = "bg-warning";
				if (accuracy > 80) color = "bg-success";
				if (accuracy < 50) color = "bg-secondary"; // Using secondary for low scores instead of destructive/accent for variety

				return {
					id: session.id || index, // fallback to index if id missing
					name: "Speech Practice", // Generic name as we don't have game types yet
					score: Math.round(accuracy),
					duration: "2 min", // Mock duration
					difficulty,
					color,
					date: new Date(session.created_at)
				};
			});

			// Calculate Achievements (Mock logic based on milestones)
			let achievements = 0;
			let newAchievements = 0;
			if (totalSessions >= 1) achievements++; // First Step
			if (totalSessions >= 10) achievements++; // Dedicated
			if (totalSessions >= 50) { achievements++; newAchievements++ }; // Master
			if (avgAccuracy >= 80) achievements++; // Sharpshooter
			if (streak >= 3) achievements++; // Consistent
			if (streak >= 7) { achievements++; newAchievements++ }; // Unstoppable

			const achievementsTrend = newAchievements > 0 ? `${newAchievements} new` : "";

			// Low Score Alert Logic
			// Show alert if user has practiced (totalSessions > 0) and avg accuracy is below 60%
			const showLowScoreAlert = totalSessions > 0 && avgAccuracy < 60;

			return {
				totalSessions,
				avgAccuracy,
				streak,
				recentGames,
				achievements,
				achievementsTrend,
				showLowScoreAlert,
			};
		},
	});
}
