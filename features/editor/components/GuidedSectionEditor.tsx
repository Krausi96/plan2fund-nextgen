/**
 * GuidedSectionEditor - Step-by-step question-based editor
 * Guides users through section creation with structured questions
 * Based on Phase 1.1 implementation plan
 */

'use client';

import React, { useState, useMemo } from 'react';
import { SectionTemplate, SectionQuestion } from '@/shared/lib/templates/types';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle,
  FileText
} from 'lucide-react';

interface GuidedSectionEditorProps {
  section: SectionTemplate;
  currentContent: string;
  onContentChange: (content: string) => void;
  onComplete?: () => void;
}

interface QuestionAnswer {
  question: SectionQuestion;
  answer: string;
  completed: boolean;
}

export default function GuidedSectionEditor({
  section,
  currentContent: _currentContent,
  onContentChange,
  onComplete
}: GuidedSectionEditorProps) {
  // Parse existing content to extract answers (if available)
  const [answers, setAnswers] = useState<QuestionAnswer[]>(() => {
    if (!section.questions || section.questions.length === 0) {
      return [];
    }
    
    // Initialize answers from questions
    return section.questions.map(q => ({
      question: q,
      answer: '',
      completed: false
    }));
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Calculate progress
  const progress = useMemo(() => {
    if (answers.length === 0) return 0;
    const completed = answers.filter(a => a.completed).length;
    return Math.round((completed / answers.length) * 100);
  }, [answers]);

  // Check if all required questions are answered
  const allRequiredAnswered = useMemo(() => {
    return answers.every(a => !a.question.required || a.completed);
  }, [answers]);

  // Current question
  const currentQuestion = answers[currentQuestionIndex]?.question;
  const currentAnswer = answers[currentQuestionIndex]?.answer || '';

  // Handle answer change
  const handleAnswerChange = (value: string) => {
    const updated = [...answers];
    updated[currentQuestionIndex] = {
      ...updated[currentQuestionIndex],
      answer: value,
      completed: value.trim().length > 0
    };
    setAnswers(updated);
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < answers.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, show summary
      setShowSummary(true);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Generate content from answers
  const generateContent = () => {
    if (answers.length === 0) return '';

    // Combine answers into flowing text
    const sections = answers
      .filter(a => a.answer.trim().length > 0)
      .map(a => {
        const questionText = a.question.text;
        const answerText = a.answer.trim();
        
        // Format as paragraph with question context
        return `**${questionText}**\n\n${answerText}`;
      });

    return sections.join('\n\n');
  };

  // Handle completion
  const handleComplete = () => {
    const content = generateContent();
    onContentChange(content);
    if (onComplete) {
      onComplete();
    }
  };

  // If no questions, show message
  if (!section.questions || section.questions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>This section doesn't have guided questions yet.</p>
          <p className="text-sm mt-2">Use free-form editing mode instead.</p>
        </div>
      </Card>
    );
  }

  // Show summary view
  if (showSummary) {
    const content = generateContent();
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter((w: string) => w.length > 0).length;

    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Review Your Answers</h3>
            <Badge variant={allRequiredAnswered ? "secondary" : "destructive"}>
              {progress}% Complete
            </Badge>
          </div>

          <div className="space-y-4 mb-6">
            {answers.map((qa, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-start gap-2 mb-2">
                  {qa.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">
                      {qa.question.text}
                      {qa.question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </p>
                    {qa.answer.trim() ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{qa.answer}</p>
                    ) : (
                      <p className="text-gray-400 italic">Not answered</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Word count: {wordCount} / {section.wordCountMin}-{section.wordCountMax}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSummary(false)}
              >
                Edit Answers
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!allRequiredAnswered || wordCount < section.wordCountMin}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show question view
  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestionIndex + 1} of {answers.length}
          </span>
          <span className="text-sm text-gray-600">{progress}% Complete</span>
        </div>
        <Progress value={progress} />
      </Card>

      {/* Current Question */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentQuestion?.text}
            </h3>
            {currentQuestion?.required && (
              <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
          </div>
          
          {currentQuestion?.hint && (
            <p className="text-sm text-gray-600 mb-4">{currentQuestion.hint}</p>
          )}

          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={currentQuestion?.placeholder || 'Type your answer here...'}
            className="min-h-[200px]"
            rows={8}
          />

          <p className="text-xs text-gray-500 mt-2">
            {currentAnswer.length} characters
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {answers.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  w-2 h-2 rounded-full transition-colors
                  ${index === currentQuestionIndex 
                    ? 'bg-blue-600' 
                    : answers[index].completed 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                  }
                `}
                title={`Question ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!currentAnswer.trim() && currentQuestion?.required}
          >
            {currentQuestionIndex === answers.length - 1 ? 'Review' : 'Next'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Section Description */}
      {section.description && (
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-gray-700">{section.description}</p>
        </Card>
      )}
    </div>
  );
}

