import { motion } from "framer-motion";
import
{
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Radar,
} from "recharts";

interface SpeechAnalysisProps
{
	strengthsWeaknesses?: {
		name: string;
		value: number;
		color: string;
	}[];
	radarData?: {
		category: string;
		score: number;
		fullMark: number;
	}[];
}

const defaultStrengthsWeaknesses = [
	{ name: "Strengths", value: 72, color: "hsl(142, 71%, 45%)" },
	{ name: "Areas to Improve", value: 28, color: "hsl(15, 85%, 60%)" },
];

const defaultRadarData = [
	{ category: "Vowels", score: 85, fullMark: 100 },
	{ category: "Consonants", score: 72, fullMark: 100 },
	{ category: "Blends", score: 65, fullMark: 100 },
	{ category: "Diphthongs", score: 78, fullMark: 100 },
	{ category: "R-sounds", score: 58, fullMark: 100 },
	{ category: "S-sounds", score: 82, fullMark: 100 },
];

export function SpeechAnalysis({
	strengthsWeaknesses = defaultStrengthsWeaknesses,
	radarData = defaultRadarData,
}: SpeechAnalysisProps)
{
	// Ensure we have data even if passed empty arrays (though default props handle undefined)
	const pieData = strengthsWeaknesses.length > 0 ? strengthsWeaknesses : defaultStrengthsWeaknesses;
	const rData = radarData.length > 0 ? radarData : defaultRadarData;

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			{/* Strengths vs Weaknesses */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="rounded-2xl bg-card p-6 shadow-card"
			>
				<h3 className="mb-2 font-display text-lg font-bold text-foreground">
					Overall Analysis
				</h3>
				<p className="mb-6 text-sm text-muted-foreground">
					Based on your recent sessions
				</p>

				<div className="flex items-center gap-6">
					<div className="h-48 w-48">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData}
									cx="50%"
									cy="50%"
									innerRadius={50}
									outerRadius={70}
									paddingAngle={5}
									dataKey="value"
								>
									{pieData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="space-y-3">
						{pieData.map((item) => (
							<div key={item.name} className="flex items-center gap-2">
								<div
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: item.color }}
								/>
								<span className="text-sm text-muted-foreground">
									{item.name}
								</span>
								<span className="ml-auto font-semibold text-foreground">
									{Math.round(item.value)}%
								</span>
							</div>
						))}
					</div>
				</div>
			</motion.div>

			{/* Phoneme Radar */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
				className="rounded-2xl bg-card p-6 shadow-card"
			>
				<h3 className="mb-2 font-display text-lg font-bold text-foreground">
					Phoneme Categories
				</h3>
				<p className="mb-4 text-sm text-muted-foreground">
					Performance by sound type
				</p>

				<div className="h-56">
					<ResponsiveContainer width="100%" height="100%">
						<RadarChart cx="50%" cy="50%" outerRadius="70%" data={rData}>
							<PolarGrid stroke="hsl(180, 20%, 88%)" />
							<PolarAngleAxis
								dataKey="category"
								tick={{ fill: "hsl(200, 15%, 45%)", fontSize: 11 }}
							/>
							<PolarRadiusAxis
								angle={30}
								domain={[0, 100]}
								tick={{ fill: "hsl(200, 15%, 45%)", fontSize: 10 }}
							/>
							<Radar
								name="Score"
								dataKey="score"
								stroke="hsl(174, 62%, 47%)"
								fill="hsl(174, 62%, 47%)"
								fillOpacity={0.3}
								strokeWidth={2}
							/>
						</RadarChart>
					</ResponsiveContainer>
				</div>
			</motion.div>
		</div>
	);
}
