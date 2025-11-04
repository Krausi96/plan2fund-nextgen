/**
 * Requirements Checker Component
 * Shows program compliance and readiness status
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Card } from '@/shared/components/ui/card';
import { ReadinessCheck, createReadinessValidator, ReadinessValidator, transformCategorizedToProgramRequirements } from '@/shared/lib/readiness';
import { useI18n } from '@/shared/contexts/I18nContext';

interface RequirementsCheckerProps {
  programType?: string; // Now optional - can be programId
  programId?: string; // NEW: Specific program ID to fetch from scraper-lite
  planContent: Record<string, any>;
  onRequirementClick?: (section: string, requirement: string) => void;
}

export default function RequirementsChecker({ 
  programType, 
  programId,
  planContent, 
  onRequirementClick 
}: RequirementsCheckerProps) {
  const { t } = useI18n();
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [programRequirements, setProgramRequirements] = useState<any>(null);

  // PRIORITY: Fetch requirements from scraper-lite if programId is provided
  // Always prioritize database over fallback
  useEffect(() => {
    if (programId) {
      // ALWAYS use database if programId is available
      fetchProgramRequirements(programId);
    } else if (programType) {
      // Fallback to old method only if no programId
      console.warn('RequirementsChecker: No programId provided, using fallback method');
      performReadinessCheck();
    }
  }, [programId, programType, planContent]);

  // Fetch actual program requirements from scraper-lite database
  const fetchProgramRequirements = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/programmes/${id}/requirements`);
      if (!response.ok) {
        throw new Error(`Failed to fetch requirements: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract categorized_requirements from API response
      const categorizedRequirements = data.categorized_requirements || {};
      
      // Transform categorized_requirements to ProgramRequirements format for validator
      const transformedRequirements = transformCategorizedToProgramRequirements(
        categorizedRequirements,
        data
      );
      
      if (transformedRequirements) {
        setProgramRequirements(transformedRequirements);
        // Perform validation with actual scraper-lite data
        const validator = new ReadinessValidator(transformedRequirements, planContent);
        const results = await validator.performReadinessCheck();
        setChecks(results);
      } else {
        // Fallback if transformation fails (should not happen with proper data)
        console.error('Could not transform requirements from database. Data may be missing or malformed.');
        // Only use fallback if absolutely necessary
        if (programType) {
          console.warn('Falling back to generic validator');
          const validator = await createReadinessValidator(programType || 'grant', planContent);
          if (validator) {
            const results = await validator.performReadinessCheck();
            setChecks(results);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching program requirements:', error);
      // Fallback to old method
      if (programType) {
        performReadinessCheck();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback method (old implementation)
  const performReadinessCheck = async () => {
    setIsLoading(true);
    try {
      const validator = await createReadinessValidator(programType || 'grant', planContent);
      if (validator) {
        const results = await validator.performReadinessCheck();
        setChecks(results);
      }
    } catch (error) {
      console.error('Error performing readiness check:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update checks when planContent changes and we have requirements
  useEffect(() => {
    if (programRequirements && planContent) {
      const validator = new ReadinessValidator(programRequirements, planContent);
      validator.performReadinessCheck().then(results => {
        setChecks(results);
      }).catch(err => {
        console.error('Error updating checks:', err);
      });
    }
  }, [planContent, programRequirements]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'incomplete':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'missing':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRequirementIcon = (status: string) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'not_met':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'important':
        return 'bg-yellow-100 text-yellow-800';
      case 'optional':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getOverallScore = () => {
    if (checks.length === 0) return 0;
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round(totalScore / checks.length);
  };

  const getOverallStatus = () => {
    const criticalSections = checks.filter(check => 
      check.requirements.some(req => req.importance === 'critical' && req.status === 'not_met')
    );
    
    if (criticalSections.length > 0) return 'missing';
    
    const avgScore = getOverallScore();
    if (avgScore >= 80) return 'complete';
    if (avgScore >= 60) return 'incomplete';
    return 'missing';
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            <span>{t('requirementsChecker.checking')}</span>
          </div>
        </div>
      </Card>
    );
  }

  if (checks.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>{t('requirementsChecker.noProgramRequirements')}</p>
            <p className="text-sm">{t('requirementsChecker.selectProgram')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card>
        <div>
          <div className="flex items-center gap-2">
            {getStatusIcon(getOverallStatus())}
            {t('requirementsChecker.title')}
            <Badge className={getStatusColor(getOverallStatus())}>
              {getOverallStatus().toUpperCase()}
            </Badge>
          </div>
        </div>
        <div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('requirementsChecker.overallScore')}</span>
              <span className="text-2xl font-bold">{getOverallScore()}%</span>
            </div>
            <Progress value={getOverallScore()} />
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{t('requirementsChecker.complete')}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>{t('requirementsChecker.needsWork')}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>{t('requirementsChecker.missing')}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Section Details */}
      <div className="space-y-3">
        {checks.map((check) => (
          <Card key={check.section}>
            <div>
              <div>
                <div 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(check.section)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div className="text-lg capitalize">
                        {check.section.replace(/_/g, ' ')}
                      </div>
                      <Badge className={getStatusColor(check.status)}>
                        {check.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{check.score}%</div>
                        <div className="text-xs text-gray-500">{t('requirementsChecker.score')}</div>
                      </div>
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <Progress value={check.score} />
                </div>
              </div>
              
              <div>
                <div className="pt-0">
                  <div className="space-y-4">
                    {/* Requirements */}
                    <div>
                      <h4 className="font-medium mb-3">{t('requirementsChecker.requirements')}</h4>
                      <div className="space-y-2">
                        {check.requirements.map((req) => (
                          <div 
                            key={req.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => onRequirementClick?.(check.section, req.id)}
                          >
                            <div className="flex items-center gap-3">
                              {getRequirementIcon(req.status)}
                              <span className="text-sm">{req.description}</span>
                              <Badge
                                className={getImportanceColor(req.importance)}
                              >
                                {req.importance}
                              </Badge>
                            </div>
                            {req.evidence && (
                              <span className="text-xs text-gray-500 truncate max-w-xs">
                                {req.evidence}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    {check.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">{t('requirementsChecker.suggestions')}</h4>
                        <ul className="space-y-1">
                          {check.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          onClick={performReadinessCheck}
          variant="outline"
          size="sm"
        >
          <Clock className="h-4 w-4 mr-2" />
          {t('requirementsChecker.refreshCheck')}
        </Button>
        <Button 
          onClick={() => setExpandedSections(new Set(checks.map(c => c.section)))}
          variant="outline"
          size="sm"
        >
          {t('requirementsChecker.expandAll')}
        </Button>
        <Button 
          onClick={() => setExpandedSections(new Set())}
          variant="outline"
          size="sm"
        >
          {t('requirementsChecker.collapseAll')}
        </Button>
      </div>
    </div>
  );
}
