"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BarChart, 
  MessageSquare,
  Target
} from "lucide-react"
import { InterviewWithDetails } from "@/types/interview.types"

// Mock data structure for Q&A analysis
interface QAPair {
  id: string
  question: string
  answer: string
  category: 'technical' | 'behavioral' | 'cultural'
  score: 0 | 1 | 2 | 3 | 4
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
      skills: ['React', 'Performance Optimization', 'State Management'],
      timestamp: '00:02:15'
    },
    {
      id: 'qa-2',
      question: 'Describe a time when you had to work with a difficult team member. How did you handle the situation?',
      answer: 'In my previous role, I worked with a colleague who was resistant to code reviews. I approached them privately to understand their concerns and found they felt their work was being criticized. I explained that code reviews help everyone learn and improve code quality. We established guidelines together, and the situation improved significantly.',
      category: 'behavioral',
      score: 3,
      skills: ['Team Leadership', 'Communication', 'Conflict Resolution'],
      timestamp: '00:08:30'
    },
    {
      id: 'qa-3',
      question: 'How do you handle database optimization when dealing with large datasets?',
      answer: 'I usually start by analyzing query performance using explain plans. Then I look at indexing strategies, considering both single and composite indexes. I also implement pagination for large result sets.',
      category: 'technical',
      score: 2,
      skills: ['Database Management', 'Performance Optimization'],
      timestamp: '00:15:45'
    },
    {
      id: 'qa-4',
      question: 'What motivates you in your work, and how do you align with our company values?',
      answer: 'I\'m motivated by solving complex problems and seeing the impact of my work on users. I believe in continuous learning and collaboration, which aligns with your values of innovation and teamwork.',
      category: 'cultural',
      score: 3,
      skills: ['Problem Solving', 'Continuous Learning'],
      timestamp: '00:22:10'
    },
    {
      id: 'qa-5',
      question: 'Can you explain the difference between REST and GraphQL APIs?',
      answer: 'Well, REST uses HTTP methods and GraphQL is newer. GraphQL is better I think.',
      category: 'technical',
      score: 1,
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
    switch (category) {
      case 'technical':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case 'behavioral':
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      case 'cultural':
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
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
                  {/* Question */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getCategoryColor(qa.category)} border-0 text-xs font-medium`}
                      >
                        {qa.category.charAt(0).toUpperCase() + qa.category.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {qa.timestamp}
                      </Badge>
                    </div>
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Question {index + 1}:
                      </p>
                      <p className="text-sm">{qa.question}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Candidate Response:</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${getScoreBgColor(qa.score)} border-0 font-semibold`}
                        >
                          {qa.score}/4 - {getScoreLabel(qa.score)}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-background border rounded-md p-3">
                      <p className="text-sm leading-relaxed">{qa.answer}</p>
                    </div>
                    
                    {/* Skills */}
                    {qa.skills.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Skills Evaluated:
                        </p>
                        <div className="flex flex-wrap gap-1">
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
                      </div>
                    )}
                  </div>
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