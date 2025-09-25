import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Link from "next/link";
import { scoreProgramsEnhanced } from "@/lib/enhancedRecoEngine";
import { DynamicQuestionEngine } from "@/lib/dynamicQuestionEngine";
import HealthFooter from "@/components/common/HealthFooter";
import { useI18n } from "@/contexts/I18nContext";

export default function Wizard() {
  const { t } = useI18n();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Create a new instance with translation function
  const [questionEngine] = useState(() => new DynamicQuestionEngine(t));
  const questions = questionEngine.getQuestionOrder();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Last question, get recommendations
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Advanced Search Option */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Prefer to describe your project?</h3>
                <p className="text-xs text-blue-700">Skip the questions and describe your project in plain language</p>
              </div>
              <Link 
                href="/advanced-search"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Try Advanced Search
              </Link>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-xl shadow-lg p-8"
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
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      answers[currentQuestion.id] === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-900 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        answers[currentQuestion.id] === option.value
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}>
                        {answers[currentQuestion.id] === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2"
                >
                  ← {t('wizard.previous')}
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id] || loading}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? t('wizard.loading') : currentQuestionIndex === questions.length - 1 ? t('wizard.submit') : t('wizard.next') + " →"}
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
                {t('wizard.submit')}
              </Button>
            </div>
          )}
        </motion.div>

        <HealthFooter />
      </div>
    </div>
  );
}