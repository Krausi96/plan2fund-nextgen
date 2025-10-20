// Unified Recommendation Wizard - Consolidates all wizard functionality
import { Button } from "@/components/ui/button";
// import { useRouter } from "next/router"; // Unused
import Link from "next/link";
import { useRecommendation } from "@/contexts/RecommendationContext";
import { DynamicWizard } from "../decision-tree/DynamicWizard";
import HealthFooter from "@/components/common/HealthFooter";
// import { useI18n } from "@/contexts/I18nContext"; // Unused

interface UnifiedRecommendationWizardProps {
  mode?: 'wizard' | 'advanced-search' | 'enhanced';
  showAdvancedSearch?: boolean;
  showDynamicWizard?: boolean;
}

export default function UnifiedRecommendationWizard({ 
  mode = 'wizard',
  showAdvancedSearch = true,
  // showDynamicWizard = true // Unused
}: UnifiedRecommendationWizardProps) {
  // const { t } = useI18n(); // Unused
  // const router = useRouter(); // Unused
  const {
    state,
    handleAnswer,
    handlePrevious,
    handleNext,
    // submitSurvey, // Unused
    // handleAdvancedSearch, // Unused
    // handleProgramSelect, // Unused
    handleDynamicWizardComplete,
    handleDynamicWizardCancel
  } = useRecommendation();

  const { 
    questions, 
    currentQuestionIndex, 
    answers, 
    isLoading, 
    isMounted, 
    showDynamicWizard: showDynamic,
    selectedProgram,
    error
  } = state;

  // Show dynamic wizard if active
  if (showDynamic && selectedProgram) {
    return (
      <DynamicWizard
        programId={selectedProgram.id}
        onComplete={handleDynamicWizardComplete}
        onCancel={handleDynamicWizardCancel}
      />
    );
  }

  // Show advanced search if in advanced mode
  if (mode === 'advanced-search') {
    return <AdvancedSearchInterface />;
  }

  // Show enhanced mode with recommendations if available
  if (mode === 'enhanced' && state.recommendations.length > 0) {
    return <EnhancedRecommendationsInterface />;
  }

  // Default wizard mode
  if (!isMounted) {
    return <LoadingState />;
  }
  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">No questions available. Please try again.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <ProgressBar 
          current={currentQuestionIndex + 1} 
          total={questions.length} 
        />

        {/* Advanced Search Option */}
        {showAdvancedSearch && (
          <AdvancedSearchOption />
        )}

        {/* Current Question */}
        <QuestionCard
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswer={(value) => handleAnswer(currentQuestion.id, value)}
        />

        {/* Error Display */}
        {error && (
          <ErrorDisplay error={error} />
        )}

        {/* Navigation */}
        <NavigationButtons
          onPrevious={handlePrevious}
          onNext={handleNext}
          isLoading={isLoading}
          canGoPrevious={currentQuestionIndex > 0}
          isLastQuestion={isLastQuestion}
        />

        {/* Health Footer (hidden unless explicitly enabled) */}
        {process.env.NEXT_PUBLIC_SHOW_HEALTH === '1' && <HealthFooter />}
      </div>
    </div>
  );
}

// Sub-components for better organization
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span>Question {current} of {total}</span>
        <span>{percentage}% Complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function AdvancedSearchOption() {
  // const { t } = useI18n(); // Unused
  
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              Advanced Search
            </h3>
            <p className="text-blue-700 text-sm">
              Search for funding programs using natural language
            </p>
          </div>
          <Link href="/advanced-search">
            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Try Advanced Search
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ 
  question, 
  answer, 
  onAnswer 
}: { 
  question: any; 
  answer: any; 
  onAnswer: (value: any) => void; 
}) {
  // const { t } = useI18n(); // Unused
  // Normalize question types from data source to UI-supported values
  const normalizedType =
    question?.type === 'single-select' ? 'single' :
    question?.type === 'multi-select' ? 'multiple' :
    question?.type;

  return (
    <div
      key={question.id}
      className="animate-fade-in-up bg-white rounded-lg shadow-md p-6 mb-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {question.question}
      </h2>
      
      {normalizedType === 'single' && question.options && (
        <div className="space-y-3">
          {question.options.map((option: any) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={answer === option.value}
                onChange={(e) => onAnswer(e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )}
      
      {normalizedType === 'multiple' && question.options && (
        <div className="space-y-3">
          {question.options.map((option: any) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                name={question.id}
                value={option.value}
                checked={Array.isArray(answer) && answer.includes(option.value)}
                onChange={(e) => {
                  const currentValues = Array.isArray(answer) ? answer : [];
                  if (e.target.checked) {
                    onAnswer([...currentValues, option.value]);
                  } else {
                    onAnswer(currentValues.filter((v: any) => v !== option.value));
                  }
                }}
                className="mr-3"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )}
      
      {normalizedType === 'text' && (
        <textarea
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={question.placeholder || 'Enter your answer...'}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
      )}
      
      {normalizedType === 'number' && (
        <input
          type="number"
          value={answer || ''}
          onChange={(e) => onAnswer(parseInt(e.target.value) || 0)}
          placeholder={question.placeholder || 'Enter a number...'}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="text-red-600 mr-3">⚠️</div>
        <div>
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    </div>
  );
}

function NavigationButtons({
  onPrevious,
  onNext,
  isLoading,
  canGoPrevious,
  isLastQuestion
}: {
  onPrevious: () => void;
  onNext: () => void;
  isLoading: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
}) {
  // const { t } = useI18n(); // Unused
  
  return (
    <div className="flex justify-between">
      <Button
        onClick={onPrevious}
        disabled={!canGoPrevious || isLoading}
        variant="outline"
      >
        Previous
      </Button>
      
      <Button
        onClick={onNext}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Processing...
          </div>
        ) : isLastQuestion ? (
          "Get Recommendations"
        ) : (
          "Next"
        )}
      </Button>
    </div>
  );
}

function LoadingState() {
  // const { t } = useI18n(); // Unused
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function AdvancedSearchInterface() {
  // This would integrate with the existing advanced search component
  return <div>Advanced Search Interface</div>;
}

function EnhancedRecommendationsInterface() {
  // This would show recommendations with dynamic wizard options
  return <div>Enhanced Recommendations Interface</div>;
}

