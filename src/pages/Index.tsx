import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { RecentGames } from "@/components/dashboard/RecentGames";
import { StreakBanner } from "@/components/dashboard/StreakBanner";
import { motion } from "framer-motion";
import
{
	Gamepad2,
	Mic,
	Trophy,
	Calendar,
	ChevronRight,
	MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getUserSessions, updateSessionStatus } from "@/services/bookingService";
import { TherapistChat } from "@/components/therapists/TherapistChat";
import { useState } from "react";

const Index = () =>
{
	const { user } = useAuth();
	const { data: dashboardStats, isLoading } = useDashboardData();

	const { data: recentConversation } = useQuery({
		queryKey: ["recent-conversation", user?.id],
		enabled: !!user,
		queryFn: async () =>
		{
			if (!user) return null;

			// Get the last message to find the most recent therapist interaction
			const { data, error } = await supabase
				.from("chat_messages")
				.select("therapist_id, created_at")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(1)
				.maybeSingle();

			if (error || !data) return null;

			// Hardcoded therapist mapping (since valid relational data setup might be overkill for this demo)
			// In a real app, we would join tables.
			// Therapists IDs match `Therapists.tsx`: 1=Sarah, 2=Michael, 3=Emily, 4=James, 5=Lisa, 6=David
			const therapistNames: Record<number, string> = {
				1: "Dr. Sarah",
				2: "Dr. Michael",
				3: "Dr. Emily",
				4: "Dr. James",
				5: "Dr. Lisa",
				6: "Dr. David"
			};

			const lastDate = new Date(data.created_at as string);
			const timeLabel = lastDate.toLocaleTimeString(undefined, {
				hour: "numeric",
				minute: "2-digit",
			});
			const dayLabel = lastDate.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric"
			});

			return {
				name: therapistNames[data.therapist_id] || "Therapist",
				timeLabel: `${dayLabel}, ${timeLabel}`,
			};
		},
	});

	// Fetch upcoming booked sessions
	const { data: upcomingSessions, refetch: refetchSessions } = useQuery({
		queryKey: ["upcoming-sessions", user?.id],
		enabled: !!user,
		queryFn: () => getUserSessions(user!.id),
	});

	const [activeSession, setActiveSession] = useState<any>(null);

	const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="flex items-center justify-between"
				>
					<div>
						<h1 className="font-display text-3xl font-bold text-foreground">
							Welcome back, {firstName}! 👋
						</h1>
						<p className="mt-1 text-muted-foreground">
							Ready for your speech practice today?
						</p>
					</div>
					<Link to="/games">
						<Button className="gap-2">
							<Mic className="h-4 w-4" />
							Start Practice
							<ChevronRight className="h-4 w-4" />
						</Button>
					</Link>
				</motion.div>

				{/* Low Score Alert */}
				{dashboardStats?.showLowScoreAlert && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive"
					>
						<div className="flex items-start gap-3">
							<div className="mt-0.5 rounded-full bg-destructive/20 p-1">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="h-4 w-4"
								>
									<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
									<path d="M12 9v4" />
									<path d="M12 17h.01" />
								</svg>
							</div>
							<div className="flex-1">
								<h3 className="font-semibold">Speech Score Alert</h3>
								<p className="mt-1 text-sm text-destructive/90">
									Your average accuracy is below 60%. We recommend scheduling a session with an AI Therapist for personalized guidance.
								</p>
								<Link to="/therapists">
									<Button variant="link" className="mt-2 h-auto p-0 text-destructive underline decoration-destructive/30 underline-offset-4 hover:decoration-destructive">
										Find a Therapist →
									</Button>
								</Link>
							</div>
						</div>
					</motion.div>
				)}

				{/* Upcoming Sessions Notifications */}
				{upcomingSessions && upcomingSessions.length > 0 && (
					<div className="space-y-4">
						{upcomingSessions.map((session) => {
							const scheduledTime = new Date(session.scheduled_at);
							const now = new Date();
							// Show "Enter Session" if the session is within 15 minutes of now, or already started (but let's say up to 1 hour after)
							const isTimeNear = (scheduledTime.getTime() - now.getTime()) <= 15 * 60 * 1000;
							
							return (
								<motion.div
									key={session.id}
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									className="rounded-xl border border-primary/20 bg-primary/5 p-4"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="mt-0.5 rounded-full bg-primary/20 p-2">
												<Calendar className="h-5 w-5 text-primary" />
											</div>
											<div>
												<h3 className="font-semibold text-foreground">
													Upcoming Session with {session.therapists?.name}
												</h3>
												<p className="text-sm text-muted-foreground">
													Scheduled for: {scheduledTime.toLocaleString(undefined, { 
														weekday: 'short', month: 'short', day: 'numeric', 
														hour: 'numeric', minute: '2-digit' 
													})}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Button 
												variant={isTimeNear ? "default" : "secondary"} 
												disabled={!isTimeNear}
												onClick={() => setActiveSession(session)}
												className={isTimeNear ? "animate-pulse" : ""}
											>
												{isTimeNear ? "Enter Session" : "Starts Soon"}
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-destructive hover:bg-destructive/10 hover:text-destructive"
												onClick={async () => {
													await updateSessionStatus(session.id, 'cancelled');
													refetchSessions();
												}}
											>
												Cancel
											</Button>
										</div>
									</div>
								</motion.div>
							);
						})}
					</div>
				)}

				{/* Active Session Chat Modal */}
				{activeSession && activeSession.therapists && (
					<TherapistChat
						isOpen={!!activeSession}
						onClose={async () => {
							// Mark as completed upon closing if it was entered
							await updateSessionStatus(activeSession.id, 'completed');
							setActiveSession(null);
							refetchSessions();
						}}
						therapistId={activeSession.therapist_id}
						therapistName={activeSession.therapists.name}
						specialty={activeSession.therapists.specialty}
						systemPrompt="You are a helpful AI therapist conducting a scheduled session with the user."
					/>
				)}

				{/* Streak Banner */}
				<StreakBanner streak={dashboardStats?.streak} achievements={dashboardStats?.achievements} />

				{/* Stats Grid */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatsCard
						title="Total Sessions"
						value={dashboardStats?.totalSessions ?? 0}
						subtitle="Practice attempts"
						icon={Gamepad2}
						trend="up"
						trendValue=""
						delay={0}
					/>
					<StatsCard
						title="Avg. Accuracy"
						value={`${dashboardStats?.avgAccuracy ?? 0}%`}
						subtitle="Speech score"
						icon={Mic}
						trend="up"
						trendValue=""
						variant="primary"
						delay={0.1}
					/>
					<StatsCard
						title="Achievements"
						value={dashboardStats?.achievements ?? 0}
						subtitle="Badges earned"
						icon={Trophy}
						trend={dashboardStats?.achievementsTrend ? "up" : "neutral"}
						trendValue={dashboardStats?.achievementsTrend}
						delay={0.2}
					/>
					<StatsCard
						title="Last Conversation"
						value={recentConversation?.name ?? "No chats yet"}
						subtitle={recentConversation?.timeLabel ?? "Start a session"}
						icon={MessageCircle}
						variant="accent"
						delay={0.3}
					/>
				</div>

				{/* Charts Section */}
				<div className="grid gap-6 lg:grid-cols-2">
					<ProgressChart />
					<RecentGames games={dashboardStats?.recentGames} />
				</div>

				{/* Quick Actions */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.4 }}
					className="grid gap-4 sm:grid-cols-3"
				>
					<Link to="/games" className="block">
						<div className="group rounded-2xl bg-card p-6 shadow-card transition-all hover:shadow-lg hover:-translate-y-1">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
								<Gamepad2 className="h-6 w-6 text-primary-foreground" />
							</div>
							<h3 className="font-display text-lg font-bold text-foreground">
								Play Games
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Practice speech with fun interactive games
							</p>
						</div>
					</Link>
					<Link to="/therapists" className="block">
						<div className="group rounded-2xl bg-card p-6 shadow-card transition-all hover:shadow-lg hover:-translate-y-1">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
								<Calendar className="h-6 w-6 text-accent-foreground" />
							</div>
							<h3 className="font-display text-lg font-bold text-foreground">
								Let’s Talk
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Connect with your AI Speech Therapist
							</p>
						</div>
					</Link>
					<Link to="/progress" className="block">
						<div className="group rounded-2xl bg-card p-6 shadow-card transition-all hover:shadow-lg hover:-translate-y-1">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success">
								<Trophy className="h-6 w-6 text-success-foreground" />
							</div>
							<h3 className="font-display text-lg font-bold text-foreground">
								View Progress
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Track your improvement over time
							</p>
						</div>
					</Link>
				</motion.div>
			</div>
		</DashboardLayout>
	);
};

export default Index;
