import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, RotateCcw, Clock, Award, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type Difficulty = 'easy' | 'medium' | 'hard';

interface TongueTwister {
  text: string;
  difficulty: Difficulty;
  points: number;
  hint: string;
}

const TONGUE_TWISTERS: TongueTwister[] = [
  {
    text: "She sells seashells by the seashore.",
    difficulty: 'easy',
    points: 10,
    hint: "Focus on the 'sh' and 's' sounds"
  },
  {
    text: "How can a clam cram in a clean cream can?",
    difficulty: 'medium',
    points: 20,
    hint: "Watch out for the 'c' and 'cl' sounds"
  },
  {
    text: "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn't very fuzzy, was he?",
    difficulty: 'hard',
    points: 30,
    hint: "The 'z' and 'w' sounds are tricky!"
  },
  {
    text: "Peter Piper picked a peck of pickled peppers.",
    difficulty: 'medium',
    points: 25,
    hint: "P's are the key here!"
  },
  {
    text: "Red lorry, yellow lorry, red lorry, yellow lorry.",
    difficulty: 'hard',
    points: 30,
    hint: "The 'l' and 'r' sounds are challenging!"
  },
  {
    text: "I scream, you scream, we all scream for ice cream.",
    difficulty: 'easy',
    points: 15,
    hint: "Focus on the 'scream' sounds"
  },
  {
    text: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    difficulty: 'medium',
    points: 25,
    hint: "The 'w' and 'ch' sounds are important"
  },
  {
    text: "Betty Botter bought some butter but the butter was bitter.",
    difficulty: 'hard',
    points: 30,
    hint: "Watch the 'b' and 't' sounds"
  }
];

const DIFFICULTY_COLORS = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500'
};

const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard'
};

interface TongueTwisterSprintProps {
  onBack: () => void;
}

export function TongueTwisterSprint({ onBack }: TongueTwisterSprintProps) {
  const [currentTwisterIndex, setCurrentTwisterIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [spokenText, setSpokenText] = useState('');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const currentTwister = TONGUE_TWISTERS[currentTwisterIndex];
  const isLastTwister = currentTwisterIndex === TONGUE_TWISTERS.length - 1;

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setSpokenText(finalTranscript || interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
      } else {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Try using Chrome or Edge.",
          variant: "destructive",
        });
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [toast]);

  // Timer effect
  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setGameStatus('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && gameStatus === 'playing') {
      setGameStatus('finished');
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStatus, timeLeft]);

  const startGame = useCallback(() => {
    setGameStatus('playing');
    setTimeLeft(30);
    setScore(0);
    setStreak(0);
    setCombo(0);
    setCurrentTwisterIndex(0);
    setSpokenText('');
    setShowHint(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpokenText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const checkCompletion = useCallback(() => {
    if (!spokenText) return false;

    const target = currentTwister.text.toLowerCase().replace(/[^a-z ]/g, '');
    const spoken = spokenText.toLowerCase().replace(/[^a-z ]/g, '');
    
    // Simple check if the spoken text includes the target or vice versa
    const isMatch = spoken.includes(target) || target.includes(spoken) || 
                  spoken.split(' ').some(word => target.includes(word)) ||
                  target.split(' ').some(word => spoken.includes(word));

    if (isMatch) {
      const newStreak = streak + 1;
      const newCombo = combo + 1;
      const pointsEarned = currentTwister.points * (1 + (newCombo * 0.1)); // Combo multiplier
      
      setScore(prev => Math.round(prev + pointsEarned));
      setStreak(newStreak);
      setCombo(newCombo);
      setBestStreak(prev => Math.max(prev, newStreak));
      
      if (newCombo >= 3) {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 2000);
      }
      
      toast({
        title: `+${Math.round(pointsEarned)} points!`,
        description: newCombo > 1 ? `${newCombo}x Combo!` : "Great job!",
      });
      
      return true;
    } else {
      setCombo(0);
      return false;
    }
  }, [currentTwister, spokenText, streak, combo, toast]);

  const nextTwister = useCallback(() => {
    if (isLastTwister) {
      setGameStatus('finished');
    } else {
      setCurrentTwisterIndex(prev => (prev + 1) % TONGUE_TWISTERS.length);
      setSpokenText('');
      setShowHint(false);
      if (isListening) {
        toggleListening();
      }
    }
  }, [isLastTwister, isListening, toggleListening]);

  const skipTwister = useCallback(() => {
    setCombo(0);
    nextTwister();
  }, [nextTwister]);

  const toggleHint = useCallback(() => {
    setShowHint(prev => !prev);
  }, []);

  // Auto-check completion when user stops speaking
  useEffect(() => {
    if (spokenText && !isListening) {
      const timer = setTimeout(() => {
        if (checkCompletion()) {
          const timer = setTimeout(() => {
            nextTwister();
          }, 1500);
          return () => clearTimeout(timer);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [spokenText, isListening, checkCompletion, nextTwister]);

  // Calculate progress percentage for the progress bar
  const progress = (timeLeft / 30) * 100;

  // Calculate the number of stars based on score (1-3)
  const stars = Math.min(3, Math.floor(score / 50) + 1);

  if (gameStatus === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
          <div className="text-5xl font-bold text-primary mb-6">{score} points</div>
          
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(3)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-8 w-8",
                  i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Best Streak</div>
              <div className="text-2xl font-bold">{bestStreak}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Tongue Twisters</div>
              <div className="text-2xl font-bold">{currentTwisterIndex + 1}/{TONGUE_TWISTERS.length}</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button 
              onClick={onBack} 
              variant="outline"
              className="flex-1"
            >
              Back to Games
            </Button>
            <Button 
              onClick={startGame} 
              size="lg" 
              className="flex-1"
            >
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tongue Twister Sprint</h1>
          <p className="text-muted-foreground">Say it fast, say it right!</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
            <Award className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">{score}</span>
          </div>
          
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
            <Clock className="h-5 w-5 text-red-500" />
            <span className="font-medium">{timeLeft}s</span>
          </div>
          
          {combo > 1 && (
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              {combo}x Combo!
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Game Area */}
      <div className="bg-card border rounded-2xl p-6 mb-6 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
        {showFireworks && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute text-6xl animate-bounce">🎉</div>
            <div className="absolute text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
            <div className="absolute text-5xl animate-bounce" style={{ animationDelay: '0.4s' }}>🔥</div>
          </div>
        )}
        
        <div className="relative z-10 w-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${DIFFICULTY_COLORS[currentTwister.difficulty]}`} />
              <span className="text-sm font-medium">
                {DIFFICULTY_LABELS[currentTwister.difficulty]}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleHint}
              className="text-muted-foreground hover:text-foreground"
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              {currentTwister.text}
            </h2>
            
            {showHint && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg inline-block">
                <p className="text-sm text-muted-foreground">💡 {currentTwister.hint}</p>
              </div>
            )}
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg mb-6 min-h-[60px]">
            {spokenText ? (
              <p className="text-center">{spokenText}</p>
            ) : (
              <p className="text-center text-muted-foreground">
                {isListening ? 'Listening...' : 'Press the mic and start speaking...'}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              onClick={toggleListening}
              className={cn(
                "gap-2 transition-all",
                isListening 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {isListening ? (
                <>
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Start Speaking
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={skipTwister}
              className="gap-2"
            >
              Skip <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentTwisterIndex(prev => (prev - 1 + TONGUE_TWISTERS.length) % TONGUE_TWISTERS.length)}
          disabled={gameStatus !== 'playing' && gameStatus !== 'idle'}
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Previous
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {currentTwisterIndex + 1} of {TONGUE_TWISTERS.length}
        </div>
        
        <Button 
          variant="ghost" 
          onClick={nextTwister}
          disabled={gameStatus !== 'playing' && gameStatus !== 'idle'}
        >
          Next <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
