// import { motion } from "framer-motion"; // Removed to fix linter error if not used, but is used.
import { motion } from "framer-motion";
import { Flame, Trophy, Target } from "lucide-react";

interface StreakBannerProps
{
	streak?: number;
	achievements?: number;
}

export function StreakBanner({ streak = 0, achievements = 0 }: StreakBannerProps)
{
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4 }}
			className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground shadow-glow"
		>
			<div className="relative z-10 flex items-center justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Flame className="h-6 w-6 animate-pulse-soft" />
						<span className="text-lg font-bold">{streak} Day Streak!</span>
					</div>
					<p className="text-sm opacity-90">
						{streak > 0 ? "You're doing amazing! Keep practicing to maintain your streak." : "Start practicing today to build your streak!"}
					</p>
				</div>

				<div className="flex gap-4">
					<div className="text-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
							<Trophy className="h-7 w-7" />
						</div>
						<p className="mt-1 text-xs opacity-80">{achievements} Badges</p>
					</div>
					<div className="text-center">
						<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
							<Target className="h-7 w-7" />
						</div>
						<p className="mt-1 text-xs opacity-80">85% Goal</p>
					</div>
				</div>
			</div>

			{/* Decorative circles */}
			<div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
			<div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
		</motion.div>
	);
}
