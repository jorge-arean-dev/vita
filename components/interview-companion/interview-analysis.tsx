"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BarChart, 
  MessageSquare,
  Target,
  Plus,
  Minus
} from "lucide-react"
import { InterviewWithDetails } from "@/types/interview.types"

// Mock data structure for Q&A analysis
interface QAPair {
  id: string
  question: string
  answer: string
  category: 'technical' | 'behavioral' | 'cultural'
  score: 0 | 1 | 2 | 3 | 4
  scoreRationale: string
  skills: string[]
  timestamp: string
}

interface QAAnalysis {
  overall_score: number
  qa_pairs: QAPair[]
}

// Mock data for testing
const mockQAAnalysis: QAAnalysis = {
  overall_score: 3.2,
  qa_pairs: [
    {
      id: 'qa-1',
      question: 'Can you tell me about your experience with React and how you\'ve used it in previous projects?',
      answer: 'I have been working with React for over 3 years. In my last project, I built a dashboard application using React 18 with hooks and context API. I implemented code splitting and lazy loading to optimize performance. I also used React Query for data fetching and state management.',
      category: 'technical',
      score: 4,
      scoreRationale: 'Demonstrates comprehensive React knowledge with specific examples of modern patterns (hooks, context API). Shows understanding of performance optimization techniques and state management solutions. Response is thorough and well-structured.',
      skills: ['React', 'Performance Optimization', 'State Management'],
      timestamp: '00:02:15'
    },
    {
      id: 'qa-2',
      question: 'Describe a time when you had to work with a difficult team member. How did you handle the situation?',
      answer: 'In my previous role, I worked with a colleague who was resistant to code reviews. I approached them privately to understand their concerns and found they felt their work was being criticized. I explained that code reviews help everyone learn and improve code quality. We established guidelines together, and the situation improved significantly.',
      category: 'behavioral',
      score: 3,
      scoreRationale: 'Shows good conflict resolution skills and emotional intelligence. Demonstrates proactive communication and empathy. Could have provided more detail on long-term outcomes and specific guidelines established.',
      skills: ['Team Leadership', 'Communication', 'Conflict Resolution'],
      timestamp: '00:08:30'
    },
    {
      id: 'qa-3',
      question: 'How do you handle database optimization when dealing with large datasets?',
      answer: 'I usually start by analyzing query performance using explain plans. Then I look at indexing strategies, considering both single and composite indexes. I also implement pagination for large result sets.',
      category: 'technical',
      score: 2,
      scoreRationale: 'Addresses the question at a basic level with correct fundamentals (explain plans, indexing, pagination). Lacks depth on advanced techniques like partitioning, caching strategies, or query optimization patterns.',
      skills: ['Database Management', 'Performance Optimization'],
      timestamp: '00:15:45'
    },
    {
      id: 'qa-4',
      question: 'What motivates you in your work, and how do you align with our company values?',
      answer: 'I\'m motivated by solving complex problems and seeing the impact of my work on users. I believe in continuous learning and collaboration, which aligns with your values of innovation and teamwork.',
      category: 'cultural',
      score: 3,
      scoreRationale: 'Correctly identifies key motivators and makes connection to company values. Response is genuine but could benefit from specific examples or stories that demonstrate these values in action.',
      skills: ['Problem Solving', 'Continuous Learning'],
      timestamp: '00:22:10'
    },
    {
      id: 'qa-5',
      question: 'Can you explain the difference between REST and GraphQL APIs?',
      answer: 'Well, REST uses HTTP methods and GraphQL is newer. GraphQL is better I think.',
      category: 'technical',
      score: 1,
      scoreRationale: 'Shows minimal understanding with one partially correct element (REST uses HTTP methods). Lacks technical depth, specific differences, use cases, or trade-offs. Response is incomplete and contains subjective opinion without justification.',
      skills: ['API Design'],
      timestamp: '00:28:20'
    }
  ]
}

interface InterviewAnalysisProps {
  interview: InterviewWithDetails
}

export default function InterviewAnalysis({ interview }: InterviewAnalysisProps) {
  const score = interview.interview_scores?.[0]
  
  // Use mock data for now - in production this would come from the analysis
  const analysis = mockQAAnalysis
  
  // State for collapsible score sections
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set())
  
  // Toggle score expansion
  const toggleScoreExpansion = (qaId: string) => {
    const newExpanded = new Set(expandedScores)
    if (newExpanded.has(qaId)) {
      newExpanded.delete(qaId)
    } else {
      newExpanded.add(qaId)
    }
    setExpandedScores(newExpanded)
  }
  
  if (!score && interview.status !== 'completed') {
    return (
      <div className="py-8 text-center">
        <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {interview.status === 'analyzing' 
            ? "Analysis in progress..."
            : "No analysis available yet. Analyze the transcript to see insights."}
        </p>
      </div>
    )
  }

  const scorePercentage = ((analysis.overall_score / 4) * 100)
  
  const getScoreColor = (score: number) => {
    if (score >= 3.6) return "text-green-600"
    if (score >= 2.6) return "text-blue-600"
    if (score >= 1.6) return "text-yellow-600"
    if (score >= 0.6) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 3.6) return "Excellent"
    if (score >= 2.6) return "Good"
    if (score >= 1.6) return "Basic"
    if (score >= 0.6) return "Below Average"
    return "Poor"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 3.6) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (score >= 2.6) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (score >= 1.6) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    if (score >= 0.6) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  const getCategoryColor = (category: string) => {
    // No colors for category badges to avoid confusion with score colors
    return "bg-transparent border-muted-foreground/30"
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score}
                </div>
                <div className="text-xs text-muted-foreground">/4.0</div>
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Overall Score
              </CardTitle>
              <CardDescription>
                Average score across all questions
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${getScoreBgColor(analysis.overall_score)} border-0`}>
              {getScoreLabel(analysis.overall_score)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={scorePercentage} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Based on {analysis.qa_pairs.length} interview questions
          </p>
        </CardContent>
      </Card>

      {/* Q&A Pairs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Question & Answer Analysis
          </CardTitle>
          <CardDescription>
            Individual scoring for each interview question
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 p-6">
              {analysis.qa_pairs.map((qa, index) => (
                <div key={qa.id} className="border rounded-lg p-4 space-y-3">
                  {/* Top badges - horizontal layout */}
                  <div className="flex justify-end gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${getCategoryColor(qa.category)} text-xs`}
                    >
                      {qa.category.charAt(0).toUpperCase() + qa.category.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs bg-transparent">
                      {qa.timestamp}
                    </Badge>
                  </div>

                  {/* Question - prominent title styling */}
                  <div className="space-y-2">
                    <p className="text-base font-semibold leading-relaxed">
                      <span className="text-muted-foreground">Q:</span>{' '}
                      {qa.question}
                    </p>
                  </div>

                  {/* Answer - regular styling */}
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-muted-foreground">A:</span>{' '}
                      {qa.answer}
                    </p>
                  </div>
                  
                  {/* Collapsible Score Section */}
                  <div className="bg-muted/30 rounded-lg border border-muted">
                    {/* Clickable header */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleScoreExpansion(qa.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">📊 Score:</span>
                        <Badge 
                          variant="outline" 
                          className={`${getScoreBgColor(qa.score)} border-0 font-semibold`}
                        >
                          {qa.score}/4 - {getScoreLabel(qa.score)}
                        </Badge>
                      </div>
                      {expandedScores.has(qa.id) ? (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Expandable rationale */}
                    {expandedScores.has(qa.id) && (
                      <div className="px-3 pb-3 space-y-1 border-t border-muted pt-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Rationale:
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {qa.scoreRationale}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Skills - compact layout */}
                  {qa.skills.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium text-muted-foreground">
                        Skills Evaluated:
                      </p>
                      {qa.skills.map((skill, skillIndex) => (
                        <Badge 
                          key={skillIndex} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Analysis Metadata */}
      <div className="text-xs text-muted-foreground text-center">
        Analysis generated on {new Date().toLocaleString()}
      </div>
    </div>
  )
}