import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GameCard } from "@/components/games/GameCard";
import { StoryTellingGame } from "@/components/games/StoryTellingGame";
import { TongueTwisterSprint } from "@/components/games/TongueTwisterSprint";
import { motion } from "framer-motion";
import
{
	MessageSquare,
	BookOpen,
	Music,
	Puzzle,
	Zap,
	Star,
	Search,
	Brain,
	RefreshCw,
	ChevronLeft,
	ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { SpeechRecorder } from "@/components/speech/SpeechRecorder";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

const games = [
	{
		id: 1,
		title: "Word Pronunciation",
		description: "Practice pronouncing common words with AI-powered feedback on your accuracy.",
		icon: MessageSquare,
		difficulty: "Easy" as const,
		duration: "5 min",
		variant: "teal" as const,
	},
	{
		id: 2,
		title: "Sentence Builder",
		description: "Construct and speak complete sentences while improving fluency.",
		icon: BookOpen,
		difficulty: "Medium" as const,
		duration: "8 min",
		variant: "purple" as const,
	},
	{
		id: 3,
		title: "Tongue Twister Sprint",
		description: "Test your pronunciation with fun and challenging tongue twisters!",
		icon: Zap,
		difficulty: "Hard" as const,
		duration: "5 min",
		variant: "coral" as const,
		isSpecial: true
	},
	{
		id: 4,
		title: "Story Telling",
		description: "Read short stories aloud and receive detailed pronunciation analysis.",
		icon: BookOpen,
		difficulty: "Medium" as const,
		duration: "12 min",
		variant: "blue" as const,
		isSpecial: true
	},
	{
		id: 5,
		title: "Phoneme Practice",
		description: "Focus on specific sounds that need improvement with targeted exercises.",
		icon: Music,
		difficulty: "Hard" as const,
		duration: "10 min",
		variant: "coral" as const,
	},
	{
		id: 6,
		title: "Speed Challenge",
		description: "Test your speaking speed while maintaining clarity and accuracy.",
		icon: Zap,
		difficulty: "Hard" as const,
		duration: "5 min",
		variant: "coral" as const,
		locked: true,
	},
	{
		id: 7,
		title: "Daily Challenge",
		description: "Complete today's special challenge to earn bonus points and badges.",
		icon: Star,
		difficulty: "Medium" as const,
		duration: "7 min",
		variant: "purple" as const,
	},
];

const gamePrompts: Record<number, string[]> = {
	1: [
		"Hello, how are you today?",
		"Practice makes perfect",
		"Therapy sessions are fun",
		"Clear speech builds confidence",
	],
	7: [
		"She sells seashells by the seashore",
		"Peter Piper picked a peck of pickled peppers",
		"Unique New York, unique New York",
		"Red lorry, yellow lorry",
	],
};

const sentenceBuilderExercises = [
	{
		id: 1,
		target: "I love practicing speech every day",
		wordBank: ["I", "love", "practicing", "speech", "every", "day", "quick", "calmly"],
		hint: "Focus on daily practice",
	},
	{
		id: 2,
		target: "The therapist gives helpful feedback",
		wordBank: ["therapist", "helpful", "gives", "The", "feedback", "always", "fun"],
		hint: "Subject + verb + adjective",
	},
	{
		id: 3,
		target: "We build confident speech together",
		wordBank: ["We", "build", "confident", "speech", "together", "slowly", "loudly"],
		hint: "Think teamwork",
	},
];

const Games = () =>
{
	const { user } = useAuth();
	const [filter, setFilter] = useState("all");
	const [activeGameId, setActiveGameId] = useState<number | null>(null);
	const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
	const [scores, setScores] = useState<number[]>([]);
	const [sentenceExerciseIndex, setSentenceExerciseIndex] = useState(0);
	const [selectedWords, setSelectedWords] = useState<string[]>([]);
	const [sentenceScore, setSentenceScore] = useState<number | null>(null);
	const [selectedGame, setSelectedGame] = useState<number | null>(null);
	const [showGameList, setShowGameList] = useState(true);

	const currentSentenceExercise = sentenceBuilderExercises[sentenceExerciseIndex % sentenceBuilderExercises.length];

	const activeGame = useMemo(
		() => games.find((game) => game.id === activeGameId) || null,
		[activeGameId]
	);

	const handleGameSelect = (gameId: number) =>
	{
		setSelectedGame(gameId);
		setShowGameList(false);
	};

	if (!showGameList)
	{
		if (selectedGame === 3)
		{
			return <TongueTwisterSprint onBack={() =>
			{
				setSelectedGame(null);
				setShowGameList(true);
			}} />;
		}

		if (selectedGame === 4)
		{
			return <StoryTellingGame onBack={() =>
			{
				setSelectedGame(null);
				setShowGameList(true);
			}} />;
		}
	}

	const prompts = activeGameId ? gamePrompts[activeGameId] : undefined;
	const currentPrompt = prompts ? prompts[currentPromptIndex] : "";

	const handlePlay = (gameTitle: string) =>
	{
		toast({
			title: "Starting Game",
			description: `Loading ${gameTitle}... Get ready to practice!`,
		});
	};

	const handleSelectGame = (gameId: number) =>
	{
		setActiveGameId(gameId);
		setCurrentPromptIndex(0);
		setScores([]);
		if (gameId === 2)
		{
			setSentenceExerciseIndex(0);
			setSelectedWords([]);
			setSentenceScore(null);
		}
	};

	const handleResult = async (result: { accuracy: number }) =>
	{
		setScores((prev) => [...prev, result.accuracy]);

		if (user && activeGameId)
		{
			// Mock duration for now
			const { error } = await supabase.from("game_sessions").insert({
				user_id: user.id,
				game_id: activeGameId,
				score: result.accuracy,
				duration_seconds: 60,
				metadata: { prompt: currentPrompt }
			});

			if (error) console.error("Error saving game session:", error);
		}
	};

	const nextPrompt = () =>
	{
		if (!prompts) return;
		setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
	};

	const prevPrompt = () =>
	{
		if (!prompts) return;
		setCurrentPromptIndex((prev) => (prev - 1 + prompts.length) % prompts.length);
	};

	const addWordToSentence = (word: string) =>
	{
		setSelectedWords((prev) => [...prev, word]);
	};

	const removeWordAt = (index: number) =>
	{
		setSelectedWords((prev) => prev.filter((_, i) => i !== index));
	};

	const clearSentence = () =>
	{
		setSelectedWords([]);
		setSentenceScore(null);
	};

	const calculateSentenceAccuracy = (target: string, attempt: string) =>
	{
		const targetTokens = target.split(" ");
		const attemptTokens = attempt.split(" ");
		const rows = targetTokens.length + 1;
		const cols = attemptTokens.length + 1;
		const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

		for (let i = 0; i < rows; i++) matrix[i][0] = i;
		for (let j = 0; j < cols; j++) matrix[0][j] = j;

		for (let i = 1; i < rows; i++)
		{
			for (let j = 1; j < cols; j++)
			{
				const cost = targetTokens[i - 1] === attemptTokens[j - 1] ? 0 : 1;
				matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
			}
		}

		const distance = matrix[rows - 1][cols - 1];
		const maxLen = Math.max(targetTokens.length, attemptTokens.length) || 1;
		return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));
	};

	const evaluateSentence = () =>
	{
		const attempt = selectedWords.join(" ");
		if (!attempt)
		{
			toast({
				title: "Add words first",
				description: "Tap words from the bank to form a sentence before checking.",
				variant: "destructive",
			});
			return;
		}
		const score = calculateSentenceAccuracy(currentSentenceExercise.target, attempt);
		setSentenceScore(score);
		toast({
			title: `Sentence score: ${score}%`,
			description: score >= 80 ? "Great structure!" : "Try rearranging or swapping a few words.",
		});
	};

	const nextSentenceExercise = () =>
	{
		setSentenceExerciseIndex((prev) => (prev + 1) % sentenceBuilderExercises.length);
		setSelectedWords([]);
		setSentenceScore(null);
	};

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
						Speech Games
					</h1>
					<p className="mt-1 text-muted-foreground">
						Fun and interactive exercises to improve your speech
					</p>
				</motion.div>

				{/* Filters */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
					className="flex flex-wrap items-center gap-4"
				>
					<div className="relative flex-1 max-w-sm">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search games..."
							className="pl-10"
						/>
					</div>
					<div className="flex gap-2">
						{["all", "Easy", "Medium", "Hard"].map((level) => (
							<Button
								key={level}
								variant={filter === level ? "default" : "outline"}
								size="sm"
								onClick={() =>
								{
									if (level === "all")
									{
										setFilter(level);
									} else
									{
										if (level === "Medium")
										{
											setSelectedGame(3);
										} else
										{
											toast({
												title: "Coming Soon",
												description: "This game is under development. Try the Story Telling game!",
											});
										}
									}
								}}
							>
								{level === "all" ? "All Levels" : level}
							</Button>
						))}
					</div>
				</motion.div>

				{/* Games Grid */}
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{games
						.filter((g) => filter === "all" || g.difficulty === filter)
						.map((game, index) => (
							<div
								key={game.id}
								onClick={() => handleGameSelect(game.id)}
								className="cursor-pointer"
							>
								<GameCard
									{...game}
									delay={0.05 * index}
									onPlay={() =>
									{
										handlePlay(game.title);
										handleSelectGame(game.id);
									}}
								/>
							</div>
						))}
				</div>

				{activeGame && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-2xl bg-card p-6 shadow-card"
					>
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Now playing</p>
								<h2 className="font-display text-2xl font-bold text-foreground">
									{activeGame.title}
								</h2>
								<p className="text-muted-foreground">{activeGame.description}</p>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<span className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">
									{activeGame.difficulty}
								</span>
								<span className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">
									{activeGame.duration}
								</span>
							</div>
						</div>

						{scores.length > 0 && (
							<div className="mt-4 grid gap-4 sm:grid-cols-3">
								<div className="rounded-xl bg-muted/60 p-4">
									<p className="text-sm text-muted-foreground">Attempts</p>
									<p className="font-display text-2xl font-bold text-foreground">{scores.length}</p>
								</div>
								<div className="rounded-xl bg-muted/60 p-4">
									<p className="text-sm text-muted-foreground">Best Score</p>
									<p className="font-display text-2xl font-bold text-foreground">
										{Math.max(...scores)}%
									</p>
								</div>
								<div className="rounded-xl bg-muted/60 p-4">
									<p className="text-sm text-muted-foreground">Average</p>
									<p className="font-display text-2xl font-bold text-foreground">
										{Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%
									</p>
								</div>
							</div>
						)}

						{activeGame.id === 2 ? (
							<div className="mt-6 space-y-4">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<p className="text-sm text-muted-foreground">Sentence Builder</p>
										<h3 className="font-display text-xl font-bold text-foreground">
											Create: "{currentSentenceExercise.target}"
										</h3>
										<p className="text-sm text-muted-foreground">Hint: {currentSentenceExercise.hint}</p>
									</div>
									<Button variant="outline" onClick={nextSentenceExercise}>
										Next Sentence
									</Button>
								</div>

								<div className="rounded-2xl bg-muted/50 p-4">
									<p className="mb-2 text-sm font-semibold text-muted-foreground">Word Bank</p>
									<div className="flex flex-wrap gap-2">
										{currentSentenceExercise.wordBank.map((word, index) => (
											<Button
												key={`${word}-${index}`}
												variant="secondary"
												size="sm"
												onClick={() => addWordToSentence(word)}
											>
												{word}
											</Button>
										))}
									</div>
								</div>

								<div className="rounded-2xl bg-secondary p-4">
									<div className="mb-2 flex items-center justify-between">
										<p className="text-sm font-semibold text-muted-foreground">Your Sentence</p>
										<div className="flex gap-2">
											<Button variant="outline" size="icon" onClick={() => removeWordAt(selectedWords.length - 1)} disabled={selectedWords.length === 0}>
												<ChevronLeft className="h-4 w-4" />
											</Button>
											<Button variant="outline" size="sm" onClick={clearSentence} disabled={selectedWords.length === 0}>
												Clear
											</Button>
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										{selectedWords.length === 0 ? (
											<span className="text-sm text-muted-foreground">Tap words to build your sentence</span>
										) : (
											selectedWords.map((word, index) => (
												<button
													key={`${word}-selected-${index}`}
													onClick={() => removeWordAt(index)}
													className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary transition hover:bg-primary/20"
												>
													{word}
												</button>
											))
										)}
									</div>
								</div>

								<div className="flex flex-wrap gap-3">
									<Button onClick={evaluateSentence} disabled={selectedWords.length === 0}>
										Check Sentence
									</Button>
									<Button variant="outline" onClick={nextSentenceExercise}>
										Shuffle Words
									</Button>
								</div>

								{sentenceScore !== null && (
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="rounded-2xl bg-success/10 p-4">
											<p className="text-sm text-success">Score</p>
											<p className="text-3xl font-bold text-success">{sentenceScore}%</p>
										</div>
										<div className="rounded-2xl bg-card p-4 shadow-card">
											<p className="text-sm text-muted-foreground">Speak it out</p>
											<SpeechRecorder
												targetText={selectedWords.length ? selectedWords.join(" ") : currentSentenceExercise.target}
												onResult={handleResult}
											/>
										</div>
									</div>
								)}
							</div>
						) : prompts ? (
							<div className="mt-6 space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">
										Prompt {currentPromptIndex + 1} of {prompts.length}
									</span>
									<div className="flex gap-2">
										<Button variant="outline" size="icon" onClick={prevPrompt}>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<Button variant="outline" size="icon" onClick={nextPrompt}>
											<ChevronRight className="h-4 w-4" />
										</Button>
										<Button variant="outline" size="icon" onClick={nextPrompt}>
											<RefreshCw className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<div className="rounded-2xl bg-secondary p-5">
									<p className="font-display text-xl font-bold text-foreground">{currentPrompt}</p>
								</div>
								<SpeechRecorder targetText={currentPrompt} onResult={handleResult} />
							</div>
						) : (
							<div className="mt-6 rounded-2xl bg-muted/60 p-5">
								<p className="text-muted-foreground">
									Detailed gameplay for this exercise is coming soon. For now, focus on the
									instructions above and track your streaks.
								</p>
							</div>
						)}
					</motion.div>
				)}
			</div>
		</DashboardLayout>
	);
};

export default Games;
