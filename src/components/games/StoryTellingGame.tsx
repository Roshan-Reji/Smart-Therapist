import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stories = [
  "The quick brown fox jumps over the lazy dog near the river bank.",
  "She sells seashells by the seashore, the shells she sells are surely seashells.",
  "Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked.",
];

interface StoryTellingGameProps {
  onBack: () => void;
}

export function StoryTellingGame({ onBack }: StoryTellingGameProps) {
  const [currentStory, setCurrentStory] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [score, setScore] = useState(0);
  const [showScanlines, setShowScanlines] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // CRT effect
  useEffect(() => {
    if (!showScanlines) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    const drawScanlines = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create scanlines
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
      ctx.lineWidth = 1;
      
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Add subtle screen curvature
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, 
        canvas.height / 2, 
        0,
        canvas.width / 2, 
        canvas.height / 2, 
        Math.max(canvas.width, canvas.height) * 0.8
      );
      
      gradient.addColorStop(0, 'rgba(0, 30, 0, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      animationRef.current = requestAnimationFrame(drawScanlines);
    };
    
    drawScanlines();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [showScanlines]);

  const startNewStory = () => {
    const randomIndex = Math.floor(Math.random() * stories.length);
    setCurrentStory(stories[randomIndex]);
    setShowAnalysis(false);
    setScore(0);
  };

  const toggleListening = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      // Simulate analysis
      setTimeout(() => {
        setShowAnalysis(true);
        setScore(Math.floor(Math.random() * 40) + 60); // Random score between 60-100
      }, 1500);
    } else {
      // Start listening
      setIsListening(true);
    }
  };

  useEffect(() => {
    startNewStory();
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      {/* CRT Effect Canvas */}
      {showScanlines && (
        <canvas 
          ref={canvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-10"
        />
      )}
      
      {/* Main Content */}
      <div className="relative z-20 container mx-auto p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl bg-black border-2 border-green-500 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-green-400">STORY TELLER</h1>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm">
                {isListening ? 'LISTENING...' : 'READY'}
              </span>
              <button 
                onClick={() => setShowScanlines(!showScanlines)}
                className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm hover:bg-green-800/50 transition-colors"
              >
                {showScanlines ? 'DISABLE CRT' : 'ENABLE CRT'}
              </button>
            </div>
          </div>
          
          <div className="bg-black border border-green-500 p-6 rounded-lg mb-6 min-h-48 flex items-center justify-center">
            {showAnalysis ? (
              <div className="text-center">
                <div className="text-5xl font-bold mb-4">{score}%</div>
                <div className="text-green-300 mb-4">
                  {score >= 90 
                    ? "Excellent pronunciation!" 
                    : score >= 75 
                      ? "Good job! Keep practicing!" 
                      : "Keep practicing! You'll get better!"}
                </div>
                <div className="h-2 bg-green-900 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full ${score > 75 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex gap-4 mt-6">
                  <Button 
                    onClick={onBack} 
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Games
                  </Button>
                  <Button 
                    onClick={startNewStory}
                    className="flex-1"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-lg leading-relaxed text-center">{currentStory}</p>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <Button
              onClick={toggleListening}
              className={cn(
                "h-16 w-16 rounded-full text-white transition-all duration-300",
                isListening 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {isListening ? (
                <Volume2 className="h-8 w-8 animate-pulse" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
            <p className="mt-4 text-green-300">
              {isListening 
                ? "Reading the story..." 
                : showAnalysis 
                  ? "" 
                  : "Click the microphone to start reading"}
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-green-500/50 text-sm">
          <p>For best experience, read the story clearly and at a natural pace.</p>
          <p className="mt-1">CRT effect can be toggled on/off using the button above.</p>
        </div>
      </div>
      
      {/* Subtle flicker effect */}
      <AnimatePresence>
        {Math.random() > 0.9 && (
          <motion.div 
            className="fixed inset-0 bg-white/5 z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
