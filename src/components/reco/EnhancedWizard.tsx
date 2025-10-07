// Enhanced Recommendation Wizard with Dynamic Decision Trees - Phase 3 Step 1
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { scoreProgramsEnhanced } from "@/lib/enhancedRecoEngine";
import { DynamicQuestionEngine, DynamicQuestion } from "@/lib/dynamicQuestionEngine";
import { DynamicWizard } from "../decision-tree/DynamicWizard";
import HealthFooter from "@/components/common/HealthFooter";
import { useI18n } from "@/contexts/I18nContext";

interface Program {
  id: string;
  name: string;
  description: string;
  program_type: string;
  funding_amount_min?: number;
  funding_amount_max?: number;
  target_personas?: string[];
  tags?: string[];
  decision_tree_questions?: any[];
}

export default function EnhancedWizard() {
  const { t } = useI18n();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showDynamicWizard, setShowDynamicWizard] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Create a new instance with translation function
  const [questionEngine] = useState(() => new DynamicQuestionEngine(t));
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      const loadedQuestions = await questionEngine.getQuestionOrder();
      setQuestions(loadedQuestions);
      setQuestionsLoaded(true);
      setMounted(true);
    };
    loadQuestions();
  }, [questionEngine]);

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
    setLoading(true);
    try {
      const scoredPrograms = await scoreProgramsEnhanced(answers);
      setRecommendations(scoredPrograms);
      
      // Check if any programs have dynamic decision trees
      const programsWithDecisionTrees = scoredPrograms.filter(
        (rec: any) => rec.program.decision_tree_questions && rec.program.decision_tree_questions.length > 0
      );

      if (programsWithDecisionTrees.length > 0) {
        // Show option to use dynamic decision tree
        // Dynamic decision tree option available
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    setShowDynamicWizard(true);
  };

  const handleDynamicWizardComplete = (dynamicAnswers: Record<string, any>) => {
    // Combine general answers with program-specific answers
    const combinedAnswers = { ...answers, ...dynamicAnswers };
    
    // Re-score programs with enhanced answers
    scoreProgramsEnhanced(combinedAnswers).then((scoredPrograms) => {
      setRecommendations(scoredPrograms);
      setShowDynamicWizard(false);
    });
  };

  const handleDynamicWizardCancel = () => {
    setShowDynamicWizard(false);
    setSelectedProgram(null);
  };

  if (!mounted || !questionsLoaded) {
    return <div>Loading...</div>;
  }

  // Show dynamic wizard if a program is selected
  if (showDynamicWizard && selectedProgram) {
    return (
      <DynamicWizard
        programId={selectedProgram.id}
        onComplete={handleDynamicWizardComplete}
        onCancel={handleDynamicWizardCancel}
      />
    );
  }

  // Show recommendations if available
  if (recommendations.length > 0 && !showDynamicWizard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Funding Recommendations
            </h1>
            <p className="text-lg text-gray-600">
              Based on your answers, here are the best funding programs for you
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 6).map((recommendation, index) => (
              <motion.div
                key={recommendation.program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {recommendation.program.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {recommendation.program.description}
                  </p>
                  
                  {recommendation.program.funding_amount_min && recommendation.program.funding_amount_max && (
                    <div className="text-lg font-medium text-green-600 mb-3">
                      €{recommendation.program.funding_amount_min.toLocaleString()} - €{recommendation.program.funding_amount_max.toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      Match Score: {Math.round(recommendation.score * 100)}%
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {recommendation.program.program_type}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {recommendation.reasons.slice(0, 3).map((reason: string, reasonIndex: number) => (
                    <div key={reasonIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {reason}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <Button
                    onClick={() => handleProgramSelect(recommendation.program)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {recommendation.program.decision_tree_questions && recommendation.program.decision_tree_questions.length > 0
                      ? 'Take Program Assessment'
                      : 'View Details'
                    }
                  </Button>
                  
                  <Button
                    onClick={() => router.push(`/program/${recommendation.program.id}`)}
                    variant="outline"
                    className="w-full"
                  >
                    Learn More
                  </Button>
                </div>

                {recommendation.program.decision_tree_questions && recommendation.program.decision_tree_questions.length > 0 && (
                  <div className="mt-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    💡 This program has a personalized assessment to help you prepare
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => {
                setRecommendations([]);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
              variant="outline"
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding the best funding programs for you...</p>
        </div>
      </div>
    );
  }

  // Show general wizard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Your Perfect Funding Program
          </h1>
          <p className="text-lg text-gray-600">
            Answer a few questions to get personalized recommendations
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
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

          {/* Question */}
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.label}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={answers[currentQuestion.id] === option.value}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
            >
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Get Recommendations' : 'Next'}
            </Button>
          </div>
        </div>

        <HealthFooter />
      </div>
    </div>
  );
}
