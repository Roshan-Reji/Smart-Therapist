import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI, ChatMessage } from "@/services/chatService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface TherapistChatProps {
	isOpen: boolean;
	onClose: () => void;
	therapistId: number;
	therapistName: string;
	specialty: string;
	systemPrompt: string;
	initialMessage?: string;
}

export function TherapistChat({
	isOpen,
	onClose,
	therapistId,
	therapistName,
	specialty,
	systemPrompt,
	initialMessage,
}: TherapistChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const recognitionRef = useRef<any>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();
	const { user } = useAuth();

	// Initialize chat with memory, validation, and system prompt
	useEffect(() => {
		if (isOpen && user) {
			// Reset messages to empty when opening fresh
			setMessages([]);
			setIsLoading(true); // Show loading while fetching context

			const fetchContext = async () => {
				// 1. Fetch existing summary (Long-term memory)
				const { data: memoryData } = await supabase
					.from("therapist_memories")
					.select("summary")
					.eq("user_id", user.id)
					.eq("therapist_id", therapistId)
					.maybeSingle();

				const summary = memoryData?.summary || "";

				// 2. Fetch Recent Practice Sessions (Last 5)
				const { data: practiceData } = await supabase
					.from("practice_sessions")
					.select("phrase, accuracy, created_at")
					.eq("user_id", user.id)
					.order("created_at", { ascending: false })
					.limit(5);

				// 3. Fetch Recent Game Sessions (Last 5)
				const { data: gameData } = await supabase
					.from("game_sessions")
					.select("score, created_at, games(title)")
					.eq("user_id", user.id)
					.order("created_at", { ascending: false })
					.limit(5);

				// Format Performance Stats
				let performanceContext = "";
				let statsList = "";

				if (practiceData && practiceData.length > 0) {
					const practices = practiceData.map(p => `• Practice: "${p.phrase.substring(0, 15)}..." - ${p.accuracy}%`).join("\n");
					statsList += `${practices}\n`;
					performanceContext += `Recent Practices (Last 5):\n${practices}\n`;
				}

				if (gameData && gameData.length > 0) {
					// @ts-ignore
					const games = gameData.map(g => `• Game: ${g.games?.title || 'Session'} - ${g.score}%`).join("\n");
					statsList += `${games}\n`;
					performanceContext += `Recent Games (Last 5):\n${games}\n`;
				}

				// 4. Construct System Prompt with Context
				const contextPrompt = `
${systemPrompt}

USER PERFORMANCE DATA:
${performanceContext || "No recent activity."}

LONG-TERM MEMORY:
${summary || "No prior chat history."}

INSTRUCTIONS:
- You are aware of the user's recent performance listed above.
- If scores are low (<60%), be supportive but ask about specific difficulties.
- If scores are high (>80%), congratulate them.
- Reference specific exercises if relevant.
- Formatting rule: Keep ALL your responses concise, short, and easy to read.
- Formatting rule: Primarily use bullet points. Limit yourself to a maximum of 3-4 short bullet points per response.
- Formatting rule: Use simple, everyday language. Avoid complex jargon. Be warm and comfortable.
`;

				// 5. Generate Initial Greeting
				// If we have new activity, we want the AI to analyze it and greet the user naturally.
				let greeting = initialMessage || `Hello! I'm ${therapistName}.`;

				// Priority: If we have stats (regardless of history), interpret them.
				if (statsList) {
					try {
						const apiKey = import.meta.env.VITE_GROK_API_KEY;
						if (apiKey) {
							// We generate a custom greeting by asking the AI
							const greetingPrompt: ChatMessage[] = [
								{ role: "system", content: contextPrompt },
								{
									role: "user",
									content: `Based on my recent performance stats, start the conversation with a DETAILED clinical analysis. 
                                    1. START with a warm, personalized greeting (e.g., "Hello [Name]" if known, or "Hello there").
                                    2. Explicitly mention my key scores (e.g., "I see your accuracy is 68%...").
                                    3. Explain what these specific numbers mean for my speech development.
                                    4. Explain how these results affect our therapy plan for today.
                                    5. End by asking how I feel about my progress.
									6. Make sure that the response in easily redable not too long.
                                	Keep the tone professional mix with casual like a comfort zone, encouraging, and analytical.
                                	IMPORTANT: Keep the response casual and encouraging(under 250 words).`
								}
							];

							// We need to call this without adding to 'messages' state yet
							const { chatWithAI } = await import("@/services/chatService");
							const aiGreeting = await chatWithAI(greetingPrompt, apiKey);
							if (aiGreeting) greeting = aiGreeting;
						}
					} catch (e) {
						console.error("Failed to generate AI greeting:", e);
					}
				}
				// Fallback: If no stats but we have history
				else if (summary) {
					greeting = `Welcome back! It's good to see you again. ${initialMessage ? "" : "How have you been since our last session?"}`;
				}

				setMessages([
					{ role: "system", content: contextPrompt },
					{
						role: "assistant",
						content: greeting
					}
				]);
				setIsLoading(false);
			};

			fetchContext();
		}
	}, [isOpen, user, therapistId, therapistName, specialty, systemPrompt, initialMessage]);

	// Auto-scroll to bottom
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const saveMessage = async (role: 'user' | 'assistant', content: string) => {
		if (!user) return;
		// Still save raw messages for audit/debugging, but we won't load them into the UI context anymore
		const { error } = await supabase.from("chat_messages").insert({
			user_id: user.id,
			therapist_id: therapistId,
			role,
			content
		});
		if (error) console.error("Error saving message:", error);
	};

	const handleCloseAndSummarize = async () => {
		if (!user) {
			onClose();
			return;
		}

		// Only summarize if there was an actual conversation (more than system + greeting)
		const newInteractions = messages.filter(m => m.role !== 'system' && m.role !== 'assistant'); // Check if user said anything
		if (newInteractions.length === 0) {
			onClose();
			return;
		}

		toast({ title: "Saving session...", description: "Updating therapist memory." });

		try {
			const apiKey = import.meta.env.VITE_GROK_API_KEY;
			if (!apiKey) throw new Error("No API Key");

			// Get current summary first
			const { data: currentMem } = await supabase
				.from("therapist_memories")
				.select("summary")
				.eq("user_id", user.id)
				.eq("therapist_id", therapistId)
				.maybeSingle();

			const oldSummary = currentMem?.summary || "";

			// Summarize specific new messages (excluding system prompt)
			// We pass ALL messages from this session to the summarizer to give full context of what just happened
			const sessionMessages = messages.filter(m => m.role !== 'system');

			const { summarizeChat } = await import("@/services/chatService"); // Dynamic import to avoid circular dep if any
			const newSummary = await summarizeChat(oldSummary, sessionMessages, apiKey);

			// Upsert Memory
			const { error } = await supabase.from("therapist_memories").upsert({
				user_id: user.id,
				therapist_id: therapistId,
				summary: newSummary,
				last_updated: new Date().toISOString()
			}, { onConflict: 'user_id,therapist_id' });

			if (error) throw error;

			toast({ title: "Saved", description: "Therapist memory updated." });

		} catch (err) {
			console.error("Summarization error:", err);
		} finally {
			onClose();
		}
	};

	const toggleRecording = () => {
		// @ts-ignore
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		
		if (!SpeechRecognition) {
			toast({
				title: "Not Supported",
				description: "Voice recording is not supported in this browser.",
				variant: "destructive"
			});
			return;
		}

		if (isRecording) {
			recognitionRef.current?.stop();
			setIsRecording(false);
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;

		// Store input that was present before starting to speak
		const previousInput = input;

		recognition.onresult = (event: any) => {
			let currentTranscript = "";
			for (let i = 0; i < event.results.length; i++) {
				currentTranscript += event.results[i][0].transcript;
			}
			setInput(previousInput + (previousInput && currentTranscript ? " " : "") + currentTranscript);
		};

		recognition.onerror = () => setIsRecording(false);
		recognition.onend = () => setIsRecording(false);

		recognitionRef.current = recognition;
		setIsRecording(true);
		recognition.start();
	};

	const handleSend = async () => {
		if (!input.trim()) return;

		const userMessage: ChatMessage = { role: "user", content: input };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);
		saveMessage('user', userMessage.content);

		try {
			const apiKey = import.meta.env.VITE_GROK_API_KEY; // Using the key from env
			if (!apiKey) {
				throw new Error("API Key not found");
			}

			// Send entire history including system prompt
			const newHistory = [...messages, userMessage];
			const aiResponseContent = await chatWithAI(newHistory, apiKey);

			const aiMessage: ChatMessage = { role: "assistant", content: aiResponseContent };
			setMessages((prev) => [...prev, aiMessage]);
			saveMessage('assistant', aiMessage.content);

		} catch (error) {
			console.error("Chat error:", error);
			toast({
				title: "Error",
				description: "Failed to connect to the therapist. Please check your connection or API key.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
				>
					<motion.div
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						className="flex h-[600px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-lg sm:h-[700px]"
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b p-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
									<Bot className="h-6 w-6 text-primary" />
								</div>
								<div>
									<h3 className="font-semibold text-foreground">{therapistName}</h3>
									<p className="text-sm text-muted-foreground">{specialty}</p>
								</div>
							</div>
							<Button variant="ghost" size="icon" onClick={handleCloseAndSummarize}>
								<X className="h-5 w-5" />
							</Button>
						</div>

						{/* Chat Area */}
						<ScrollArea className="flex-1 p-4">
							<div className="space-y-4">
								{messages.filter(m => m.role !== 'system').map((msg, idx) => (
									<div
										key={idx}
										className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"
											}`}
									>
										{msg.role === "assistant" && (
											<div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
												<Bot className="h-5 w-5 text-primary" />
											</div>
										)}
										<div
											className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user"
												? "bg-primary text-primary-foreground"
												: "bg-muted text-foreground"
												}`}
										>
											<p className="text-sm/relaxed whitespace-pre-wrap">{msg.content}</p>
										</div>
										{msg.role === "user" && (
											<div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
												<User className="h-5 w-5 text-primary-foreground" />
											</div>
										)}
									</div>
								))}
								{isLoading && (
									<div className="flex gap-3">
										<div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
											<Bot className="h-5 w-5 text-primary" />
										</div>
										<div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2">
											<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-0"></span>
											<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-150"></span>
											<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-300"></span>
										</div>
									</div>
								)}
								<div ref={scrollRef} />
							</div>
						</ScrollArea>

						{/* Input Area */}
						<div className="border-t p-4">
							<div className="flex gap-2">
								<Button
									variant={isRecording ? "destructive" : "secondary"}
									size="icon"
									onClick={toggleRecording}
									className={`shrink-0 ${isRecording ? "animate-pulse" : ""}`}
									title={isRecording ? "Stop recording" : "Start recording"}
								>
									{isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
								</Button>
								<Input
									placeholder="Type your message..."
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={handleKeyDown}
									disabled={isLoading}
									className="flex-1"
								/>
								<Button className="shrink-0" onClick={handleSend} disabled={isLoading || !input.trim()}>
									<Send className="h-4 w-4" />
								</Button>
							</div>
							<p className="mt-2 text-center text-xs text-muted-foreground">
								AI can make mistakes. Consider checking important information.
							</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
