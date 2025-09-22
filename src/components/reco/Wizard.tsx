import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { scoreProgramsEnhanced } from "@/lib/enhancedRecoEngine";
import { dynamicQuestionEngine, DynamicQuestion } from "@/lib/dynamicQuestionEngine";
import HealthFooter from "@/components/common/HealthFooter";

export default function Wizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState<DynamicQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const questions = dynamicQuestionEngine.getQuestionOrder();

  useEffect(() => {
    setMounted(true);
    // Get the first question dynamically
    const firstQuestion = dynamicQuestionEngine.getNextQuestion(answers);
    setCurrentQuestion(firstQuestion);
  }, []);

  // Update current question when answers change
  useEffect(() => {
    const nextQuestion = dynamicQuestionEngine.getNextQuestion(answers);
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setCurrentQuestionIndex(questions.findIndex(q => q.id === nextQuestion.id));
    } else {
      setCurrentQuestion(null);
    }
  }, [answers]);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = async () => {
    // Check if we have more questions
    const nextQuestion = dynamicQuestionEngine.getNextQuestion(answers);
    if (!nextQuestion) {
      // No more questions, get recommendations
      await submitSurvey();
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
        
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
                    {currentQuestion.programsAffected > 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Affects {currentQuestion.programsAffected} programs ({currentQuestion.informationValue}% info value)
                      </span>
                    )}
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

      <HealthFooter />
    </div>
  );
}