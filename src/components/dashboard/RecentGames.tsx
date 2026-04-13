// import { motion } from "framer-motion"; // Removed to fix linter error if not used, but it is used below.
import { motion } from "framer-motion";
import { Gamepad2, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Game
{
	id: number;
	name: string;
	score: number;
	duration: string;
	difficulty: string;
	color: string;
}

interface RecentGamesProps
{
	games?: Game[];
}

export function RecentGames({ games = [] }: RecentGamesProps)
{
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.3 }}
			className="rounded-2xl bg-card p-6 shadow-card"
		>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h3 className="font-display text-lg font-bold text-foreground">
						Recent Games
					</h3>
					<p className="text-sm text-muted-foreground">
						Your latest practice sessions
					</p>
				</div>
				<button className="text-sm font-medium text-primary hover:underline">
					View All
				</button>
			</div>

			<div className="space-y-4">
				{games.length === 0 ? (
					<p className="text-muted-foreground text-sm">No recent sessions found.</p>
				) : (
					games.map((game, index) => (
						<motion.div
							key={game.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3, delay: 0.1 * index }}
							className="flex items-center gap-4 rounded-xl bg-secondary/50 p-4 transition-colors hover:bg-secondary"
						>
							<div className={cn(
								"flex h-12 w-12 items-center justify-center rounded-xl",
								game.color
							)}>
								<Gamepad2 className="h-6 w-6 text-white" />
							</div>
							<div className="flex-1">
								<h4 className="font-semibold text-foreground">{game.name}</h4>
								<div className="flex items-center gap-3 text-sm text-muted-foreground">
									<span className="flex items-center gap-1">
										<Clock className="h-3.5 w-3.5" />
										{game.duration}
									</span>
									<span className="rounded-full bg-muted px-2 py-0.5 text-xs">
										{game.difficulty}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-1 text-lg font-bold text-foreground">
								<Star className="h-5 w-5 text-warning fill-warning" />
								{game.score}%
							</div>
						</motion.div>
					))
				)}
			</div>
		</motion.div>
	);
}
