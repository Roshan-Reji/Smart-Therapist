import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SpeechRecorder } from "@/components/speech/SpeechRecorder";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

const practiceWords = [
  "Hello, how are you today?",
  "The quick brown fox jumps.",
  "She sells seashells.",
  "Peter Piper picked peppers.",
  "I love learning new things.",
  "Practice makes perfect.",
  "Good morning sunshine!",
  "Thank you very much.",
];

const Practice = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const { user } = useAuth();

  const handleResult = async (result: {
    transcribedText: string;
    accuracy: number;
    feedback: string;
  }) => {
    setScores((prev) => [...prev, result.accuracy]);

    if (!user) return;

    // Persist practice attempt to Supabase
    await supabase.from("practice_sessions").insert({
      user_id: user.id,
      phrase: practiceWords[currentIndex],
      accuracy: result.accuracy,
      feedback: result.feedback,
    });
  };

  const nextPhrase = () => {
    setCurrentIndex((prev) => (prev + 1) % practiceWords.length);
  };

  const prevPhrase = () => {
    setCurrentIndex((prev) => (prev - 1 + practiceWords.length) % practiceWords.length);
  };

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            Speech Practice
          </h1>
          <p className="mt-1 text-muted-foreground">
            Practice your pronunciation with AI-powered feedback
          </p>
        </motion.div>

        {/* Stats */}
        {scores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="rounded-2xl bg-card p-4 shadow-card">
              <p className="text-sm text-muted-foreground">Attempts</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {scores.length}
              </p>
            </div>
            <div className="rounded-2xl bg-card p-4 shadow-card">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className={`font-display text-2xl font-bold ${
                averageScore >= 70 ? "text-success" : averageScore >= 50 ? "text-warning" : "text-destructive"
              }`}>
                {averageScore}%
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <Button variant="outline" size="icon" onClick={prevPhrase}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Phrase {currentIndex + 1} of {practiceWords.length}
          </span>
          <Button variant="outline" size="icon" onClick={nextPhrase}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Speech Recorder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <SpeechRecorder
            key={currentIndex}
            targetText={practiceWords[currentIndex]}
            onResult={handleResult}
          />
        </motion.div>

        {/* Try Another */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex justify-center"
        >
          <Button variant="outline" onClick={nextPhrase} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Next Phrase
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Practice;
