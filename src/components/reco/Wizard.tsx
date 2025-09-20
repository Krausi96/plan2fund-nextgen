import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { scoreProgramsEnhanced } from "@/lib/enhancedRecoEngine";
import questionsData from "@/data/questions";
import HealthFooter from "@/components/common/HealthFooter";

interface Question {
  id: string;
  label: string;
  type: 'single-select' | 'multi-select';
  options: Array<{ value: string; label: string }>;
  required: boolean;
}

export default function Wizard() {
  const router = useRouter();
  const [mode, setMode] = useState<"survey" | "freeText">("survey");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const questions = questionsData.universal as Question[];

  useEffect(() => {
    setMounted(true);
    // Get the first question
    setCurrentQuestion(questions[0] || null);
  }, []);

  // Update current question when answers change
  useEffect(() => {
    const nextIndex = getNextQuestionIndex();
    if (nextIndex < questions.length) {
      setCurrentQuestion(questions[nextIndex]);
      setCurrentQuestionIndex(nextIndex);
    } else {
      setCurrentQuestion(null);
    }
  }, [answers]);

  const getNextQuestionIndex = () => {
    // Simple logic: move to next question if current is answered
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!answers[question.id] && question.required) {
        return i;
      }
    }
    return questions.length; // All questions answered
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = async () => {
    if (mode === "survey") {
      // Check if we have more questions
      const nextIndex = getNextQuestionIndex();
      if (nextIndex >= questions.length) {
        // No more questions, get recommendations
        await submitSurvey();
      }
    } else {
      await submitFreeText();
    }
  };

  const submitSurvey = async () => {
    try {
      setLoading(true);
      // Store answers for results page
      localStorage.setItem("userAnswers", JSON.stringify(answers));
      // Get recommendations using enhanced reco engine
      const recommendations = scoreProgramsEnhanced(answers, "strict");
      localStorage.setItem("recoResults", JSON.stringify(recommendations));
      router.push("/results");
    } catch (err) {
      console.error("Error submitting survey:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitFreeText = async () => {
    try {
      setLoading(true);
      // For now, just redirect to results with empty recommendations
      // TODO: Implement free text analysis
      localStorage.setItem("recoResults", JSON.stringify([]));
      router.push("/results");
    } catch (err) {
      console.error("Error submitting free-text:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Find Your Perfect Funding Program
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Answer a few questions and we'll recommend the best funding programs for you
        </p>
        
        {/* Mode Toggle */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={mode === "survey" ? "default" : "outline"}
            onClick={() => setMode("survey")}
          >
            Guided Questions
          </Button>
          <Button
            variant={mode === "freeText" ? "default" : "outline"}
            onClick={() => setMode("freeText")}
          >
            Free Text Search
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "survey" ? (
          <motion.div
            key="survey"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            {currentQuestion ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {currentQuestion.label}
                  </h2>
                  {currentQuestion.required && (
                    <p className="text-sm text-gray-500">* Required</p>
                  )}
                </div>

                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        answers[currentQuestion.id] === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-6">
                  <div className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id] || loading}
                    className="px-8"
                  >
                    {loading ? "Processing..." : "Next"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  No more questions needed!
                </h3>
                <p className="text-gray-600 mb-6">
                  We have enough information to find the best programs for you.
                </p>
                <Button onClick={handleNext} className="px-8">
                  Get Recommendations
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="freeText"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Describe Your Project
                </h2>
                <p className="text-gray-600">
                  Tell us about your project and we'll find relevant funding programs
                </p>
              </div>

              <textarea
                value={answers.freeText || ""}
                onChange={(e) => handleAnswer("freeText", e.target.value)}
                placeholder="e.g., I'm developing a mobile app for sustainable transportation in Austria. We're a team of 3 people, just incorporated, looking for €50,000 in funding..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!answers.freeText || loading}
                  className="px-8"
                >
                  {loading ? "Processing..." : "Find Programs"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <HealthFooter />
    </div>
  );
}