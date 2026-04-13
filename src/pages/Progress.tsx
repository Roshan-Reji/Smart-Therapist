import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SpeechAnalysis } from "@/components/progress/SpeechAnalysis";
import { motion } from "framer-motion";
import
	{
		LineChart,
		Line,
		XAxis,
		YAxis,
		CartesianGrid,
		Tooltip,
		ResponsiveContainer,
	} from "recharts";
import { useProgressData } from "@/hooks/useProgressData";

const Progress = () =>
{
	const { data: progressStats, isLoading } = useProgressData();

	if (isLoading)
	{
		return (
			<DashboardLayout>
				<div className="flex h-screen items-center justify-center">
					<p className="text-muted-foreground">Loading progress...</p>
				</div>
			</DashboardLayout>
		);
	}

	const monthlyData = progressStats?.monthlyData || [];
	const milestones = progressStats?.milestones || [];

	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<h1 className="font-display text-3xl font-bold text-foreground">
						Your Progress
					</h1>
					<p className="mt-1 text-muted-foreground">
						Track your speech therapy journey and improvements
					</p>
				</motion.div>

				{/* Stats Overview */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="grid gap-4 sm:grid-cols-4"
				>
					{[
						{ label: "Total Sessions", value: String(progressStats?.totalSessions ?? 0), change: progressStats?.totalSessionsChange ?? "+0" },
						{ label: "Avg. Accuracy", value: `${progressStats?.avgAccuracy ?? 0}%`, change: progressStats?.avgAccuracyChange ?? "+0%" },
						{ label: "Practice Hours", value: `${progressStats?.practiceHours ?? 0}h`, change: progressStats?.practiceHoursChange ?? "+0h" },
						{ label: "Current Streak", value: `${progressStats?.currentStreak ?? 0} days`, change: progressStats?.currentStreakChange ?? "Start today!" },
					].map((stat) => (
						<div
							key={stat.label}
							className="rounded-2xl bg-card p-5 shadow-card"
						>
							<p className="text-sm text-muted-foreground">{stat.label}</p>
							<p className="mt-1 font-display text-2xl font-bold text-foreground">
								{stat.value}
							</p>
							<p className="mt-1 text-xs text-primary">{stat.change}</p>
						</div>
					))}
				</motion.div>

				{/* Speech Analysis Charts */}
				<SpeechAnalysis
					radarData={progressStats?.radarData}
					strengthsWeaknesses={progressStats?.strengthsWeaknesses}
				/>

				{/* Long-term Progress */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.2 }}
					className="rounded-2xl bg-card p-6 shadow-card"
				>
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h3 className="font-display text-lg font-bold text-foreground">
								6-Month Progress
							</h3>
							<p className="text-sm text-muted-foreground">
								Your improvement over time
							</p>
						</div>
						<div className="flex items-center gap-4 text-sm">
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-primary" />
								<span className="text-muted-foreground">Accuracy</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-accent" />
								<span className="text-muted-foreground">Fluency</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-success" />
								<span className="text-muted-foreground">Pronunciation</span>
							</div>
						</div>
					</div>

					<div className="h-72">
						<ResponsiveContainer width="100%" height="100%">
							{monthlyData.length > 0 ? (
								<LineChart data={monthlyData}>
									<CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 20%, 88%)" />
									<XAxis
										dataKey="month"
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
										}}
									/>
									<Line
										type="monotone"
										dataKey="accuracy"
										stroke="hsl(174, 62%, 47%)"
										strokeWidth={3}
										dot={{ r: 4, fill: "hsl(174, 62%, 47%)" }}
									/>
									<Line
										type="monotone"
										dataKey="fluency"
										stroke="hsl(15, 85%, 60%)"
										strokeWidth={3}
										dot={{ r: 4, fill: "hsl(15, 85%, 60%)" }}
									/>
									<Line
										type="monotone"
										dataKey="pronunciation"
										stroke="hsl(142, 71%, 45%)"
										strokeWidth={3}
										dot={{ r: 4, fill: "hsl(142, 71%, 45%)" }}
									/>
								</LineChart>
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									No data available for this period.
								</div>
							)}
						</ResponsiveContainer>
					</div>
				</motion.div>

				{/* Milestones */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.3 }}
					className="rounded-2xl bg-card p-6 shadow-card"
				>
					<h3 className="mb-6 font-display text-lg font-bold text-foreground">
						Milestones
					</h3>
					<div className="space-y-4">
						{milestones.length > 0 ? (
							milestones.map((milestone) => (
								<div
									key={milestone.title}
									className={`flex items-center gap-4 rounded-xl p-4 ${milestone.completed ? "bg-success/10" : "bg-secondary"
										}`}
								>
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-xl ${milestone.completed ? "bg-success" : "bg-muted"
											}`}
									>
										<milestone.icon
											className={`h-5 w-5 ${milestone.completed ? "text-success-foreground" : "text-muted-foreground"
												}`}
										/>
									</div>
									<div className="flex-1">
										<p className="font-semibold text-foreground">{milestone.title}</p>
										<p className="text-sm text-muted-foreground">{milestone.date}</p>
									</div>
									{milestone.completed && (
										<span className="rounded-full bg-success px-3 py-1 text-xs font-medium text-success-foreground">
											Complete
										</span>
									)}
								</div>
							))
						) : (
							<p className="text-muted-foreground text-sm">No milestones tracked yet.</p>
						)}
					</div>
				</motion.div>
			</div>
		</DashboardLayout>
	);
};

export default Progress;
