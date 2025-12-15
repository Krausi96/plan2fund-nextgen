/**
 * QuestionRenderer - Handles rendering of all question types
 */

import React from 'react';
import { QuestionDefinition } from '../types';
import { useI18n } from '@/shared/contexts/I18nContext';

interface QuestionRendererProps {
  question: QuestionDefinition;
  questionIndex: number;
  value: any;
  answers: Record<string, any>;
  onAnswer: (questionId: string, value: any) => void;
}

export default function QuestionRenderer({
  question,
  questionIndex,
  value,
  answers,
  onAnswer,
}: QuestionRendererProps) {
  const { t } = useI18n();
  const isAnswered = value !== undefined && value !== null && value !== '';

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 shadow-md p-6">
      {/* Question Header */}
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {questionIndex + 1}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900 break-words leading-relaxed">
                {question.label}
              </h3>
              {!question.required && (
                <span className="text-sm text-gray-500 font-normal">(Optional)</span>
              )}
            </div>
          </div>
          {isAnswered && (
            <span className="text-green-600 flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Question Options */}
      {question.type === 'single-select' && (
        <div className="space-y-2">
          {question.options.map((option: any) => {
            const isSelected = value === option.value;
            const showRegionInput = question.hasOptionalRegion && isSelected && question.hasOptionalRegion(option.value);
            const regionValue = showRegionInput ? (answers[`${question.id}_region`] || '') : '';
            const isOtherOption = option.value === 'other';
            const otherTextValue = isOtherOption && answers[question.id] === 'other' ? (answers[`${question.id}_other`] || '') : '';
            
            return (
              <div key={`${question.id}-${option.value}`} className="space-y-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isSelected) {
                      onAnswer(question.id, undefined);
                      if (isOtherOption) onAnswer(`${question.id}_other`, undefined);
                      if (showRegionInput) onAnswer(`${question.id}_region`, undefined);
                    } else {
                      onAnswer(question.id, option.value);
                      if (showRegionInput && value !== option.value) onAnswer(`${question.id}_region`, undefined);
                      if (isOtherOption && value !== option.value) onAnswer(`${question.id}_other`, undefined);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                      : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected && <span className="text-lg font-bold">✓</span>}
                    <span className="text-sm">{option.label}</span>
                  </div>
                </button>
                
                {/* Optional region input */}
                {showRegionInput && (
                  <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      {t('reco.ui.regionOptional') || 'Region (optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        option.value === 'austria' ? (t('reco.ui.regionPlaceholderAustria') || 'e.g., Vienna, Tyrol, Salzburg') : 
                        option.value === 'germany' ? (t('reco.ui.regionPlaceholderGermany') || 'e.g., Bavaria, Berlin, Hamburg') : 
                        option.value === 'eu' ? (t('reco.ui.regionPlaceholderEU') || 'e.g., France, Italy, Spain, or specific region') :
                        (t('reco.ui.regionPlaceholderInternational') || 'e.g., USA, UK, Switzerland, or specific country/region')
                      }
                      value={regionValue}
                      onChange={(e) => onAnswer(`${question.id}_region`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      {t('reco.ui.regionLeaveEmpty') || 'Leave empty if not applicable'}
                    </p>
                  </div>
                )}
                
                {/* "Other" text input */}
                {isOtherOption && answers[question.id] === 'other' && question.hasOtherTextInput && (
                  <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1 mt-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      {t('reco.ui.pleaseSpecify') || 'Please specify:'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        question.id === 'organisation_stage' || question.id === 'company_type'
                          ? ((t('reco.ui.otherPlaceholderOrg' as any) as string) || 'e.g., Association, Cooperative, Foundation')
                          : ((t('reco.ui.otherPlaceholder' as any) as string) || 'Please specify...')
                      }
                      value={otherTextValue}
                      onChange={(e) => onAnswer(`${question.id}_other`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    {(question.id === 'organisation_stage' || question.id === 'company_type') && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(t('reco.ui.otherExamples' as any) as string) || 'Examples: Association, Cooperative, Foundation, LLC, Inc., etc.'}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Co-financing percentage input */}
                {question.hasCoFinancingPercentage && isSelected && option.value === 'co_yes' && (
                  <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      {t('reco.ui.coFinancingPercentage') || 'What percentage can you provide? (e.g., 20%, 30%, 50%)'}
                    </label>
                    <input
                      type="text"
                      placeholder={t('reco.ui.coFinancingPercentagePlaceholder') || 'e.g., 30%'}
                      value={(answers[`${question.id}_percentage`] as string) || ''}
                      onChange={(e) => onAnswer(`${question.id}_percentage`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      {t('reco.ui.coFinancingPercentageHint') || 'Many programs require 20-50% co-financing'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Skip Button */}
          {!question.required && (
            <button
              onClick={() => onAnswer(question.id, undefined)}
              className="w-full mt-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all"
            >
              {t('reco.skipQuestion') || 'Skip this question'}
            </button>
          )}
        </div>
      )}

      {question.type === 'multi-select' && (
        <div className="space-y-2">
          {question.options.map((option: any) => {
            const isSelected = Array.isArray(value) && value.includes(option.value);
            const subCategories = question.subCategories && isSelected && option.value in question.subCategories 
              ? question.subCategories[option.value as keyof typeof question.subCategories] 
              : [];
            const hasSubCategories = subCategories && subCategories.length > 0;
            const subCategoryKey = `${question.id}_${option.value}`;
            const subCategoryValue = answers[subCategoryKey];
            const isOtherOption = option.value === 'other';
            const otherTextValue = isOtherOption && isSelected && Array.isArray(value) && value.includes('other') ? (answers[`${question.id}_other`] || '') : '';
            
            return (
              <div key={`${question.id}-${option.value}`} className="space-y-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const current = Array.isArray(value) ? value : [];
                    let newValue: any[];
                    
                    if (option.value === 'no_partnerships') {
                      newValue = isSelected ? current.filter(v => v !== option.value) : ['no_partnerships'];
                    } else {
                      if (!isSelected && current.includes('no_partnerships')) {
                        newValue = [...current.filter(v => v !== 'no_partnerships'), option.value];
                      } else {
                        newValue = isSelected ? current.filter(v => v !== option.value) : [...current, option.value];
                      }
                    }
                    
                    onAnswer(question.id, newValue.length > 0 ? newValue : undefined);
                    if (isSelected && hasSubCategories) onAnswer(subCategoryKey, undefined);
                    if (isSelected && isOtherOption) onAnswer(`${question.id}_other`, undefined);
                  }}
                  className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                      : 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-white border-white' : 'border-gray-400'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm">{option.label}</span>
                  </div>
                </button>
                
                {/* Sub-categories */}
                {hasSubCategories && isSelected && (
                  <div className="ml-4 space-y-1 border-l-2 border-blue-200 pl-3 pt-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Specific areas:</p>
                    <div className="space-y-1">
                      {subCategories.map((subCat: any) => {
                        const isSubSelected = Array.isArray(subCategoryValue) && subCategoryValue.includes(subCat.value);
                        return (
                          <button
                            key={subCat.value}
                            onClick={() => {
                              const current = Array.isArray(subCategoryValue) ? subCategoryValue : [];
                              const newSubValue = isSubSelected
                                ? current.filter(v => v !== subCat.value)
                                : [...current, subCat.value];
                              onAnswer(subCategoryKey, newSubValue);
                            }}
                            className={`w-full text-left px-3 py-1.5 border rounded-lg transition-all duration-150 ${
                              isSubSelected
                                ? 'bg-blue-500 border-blue-500 text-white font-medium'
                                : 'bg-gray-50 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isSubSelected ? 'bg-white border-white' : 'border-gray-400'
                              }`}>
                                {isSubSelected && (
                                  <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                              <span className="text-xs">{subCat.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* "Other" text input */}
                {isOtherOption && Array.isArray(value) && value.includes('other') && question.hasOtherTextInput && (
                  <div className="ml-4 space-y-1.5 border-l-2 border-blue-200 pl-3 pt-1 mt-2">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      {t('reco.ui.pleaseSpecify') || 'Please specify:'}
                    </label>
                    <input
                      type="text"
                      placeholder={(t('reco.ui.otherPlaceholder' as any) as string) || 'Please specify...'}
                      value={otherTextValue}
                      onChange={(e) => onAnswer(`${question.id}_other`, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Skip Button */}
          {!question.required && (
            <button
              onClick={() => onAnswer(question.id, undefined)}
              className="w-full mt-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all"
            >
              {t('reco.skipQuestion') || 'Skip this question'}
            </button>
          )}
        </div>
      )}

      {question.type === 'range' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {question.unit === 'EUR' ? '€' : ''}
                {question.min.toLocaleString('de-DE')}
                {question.unit !== 'EUR' && question.unit !== 'months' && question.unit !== 'people' && ` ${question.unit}`}
                {question.unit === 'months' && ` ${t('reco.ui.sliderMonths') || 'months'}`}
                {question.unit === 'people' && ` ${t('reco.ui.sliderPeople') || 'people'}`}
              </span>
              <span className="text-sm text-gray-600">
                {question.unit === 'EUR' ? '€' : ''}
                {question.max.toLocaleString('de-DE')}
                {question.unit !== 'EUR' && question.unit !== 'months' && question.unit !== 'people' && ` ${question.unit}`}
                {question.unit === 'months' && ` ${t('reco.ui.sliderMonths') || 'months'}`}
                {question.unit === 'people' && ` ${t('reco.ui.sliderPeople') || 'people'}`}
              </span>
            </div>
            <input
              type="range"
              min={question.min}
              max={question.max}
              step={question.step}
              value={typeof value === 'number' ? value : question.min}
              onChange={(e) => {
                const numValue = question.unit === 'years' ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
                onAnswer(question.id, numValue);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                  ((Math.max(question.min, Math.min(question.max, typeof value === 'number' ? value : question.min)) - question.min) /
                    (question.max - question.min)) * 100
                }%, #e5e7eb ${
                  ((Math.max(question.min, Math.min(question.max, typeof value === 'number' ? value : question.min)) - question.min) /
                    (question.max - question.min)) * 100
                }%, #e5e7eb 100%)`,
              }}
            />
            <div className="text-center mt-3">
              {question.editableValue && question.unit === 'EUR' ? (
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg font-semibold text-gray-700">€</span>
                    <input
                      type="text"
                      value={(typeof value === 'number' ? value : question.min).toLocaleString('de-DE')}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/[^\d]/g, '');
                        if (inputValue === '') return;
                        const numValue = Math.floor(parseFloat(inputValue));
                        if (!isNaN(numValue)) {
                          const clamped = Math.max(question.min, Math.min(question.max, numValue));
                          onAnswer(question.id, clamped);
                        }
                      }}
                      onBlur={(e) => {
                        const cleaned = e.target.value.replace(/[^\d]/g, '');
                        const numValue = Math.floor(parseFloat(cleaned || '0'));
                        if (isNaN(numValue) || numValue < question.min) {
                          onAnswer(question.id, question.min);
                        } else if (numValue > question.max) {
                          onAnswer(question.id, question.max);
                        } else {
                          onAnswer(question.id, numValue);
                        }
                      }}
                      placeholder={`${question.min.toLocaleString('de-DE')} - ${question.max.toLocaleString('de-DE')}`}
                      className="w-48 px-4 py-3 border-2 border-blue-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center bg-white shadow-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-base font-semibold text-gray-800">
                  {(() => {
                    const val = typeof value === 'number' ? value : question.min;
                    if (question.unit === 'EUR') return `€${val.toLocaleString('de-DE')}`;
                    if (question.unit === 'months') return `${val} ${t('reco.ui.sliderMonths') || 'months'}`;
                    if (question.unit === 'people') return `${val} ${t('reco.ui.sliderPeople') || 'people'}`;
                    if (question.unit === 'years') return `${val.toFixed(1)} ${question.unit}`;
                    return `${val} ${question.unit}`;
                  })()}
                </div>
              )}
            </div>
          </div>

          {!question.required && (
            <button
              onClick={() => onAnswer(question.id, undefined)}
              className="w-full mt-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all"
            >
              {t('reco.skipQuestion') || 'Skip this question'}
            </button>
          )}
        </div>
      )}

      {question.type !== 'range' && question.type !== 'single-select' && question.type !== 'multi-select' && (
        <div className="text-sm text-gray-500">Unsupported question type</div>
      )}
    </div>
  );
}


