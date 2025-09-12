# Interview Analysis Tab - Design Specification

## Overview

This document outlines the design for a redesigned Analysis tab in the Interview Companion that displays interview Q&A pairs with individual scoring. The design transforms the current high-level analysis view into a detailed Q&A breakdown while maintaining consistency with the existing interface.

## Design Requirements Met

- **Overall Score Display**: Prominent average score (0-4 scale) with label
- **Q&A Pairs Layout**: Question-answer pairs with individual scoring
- **Category Badges**: Technical/Behavioral/Cultural question categorization
- **Job-specific Skills**: Skill badges under relevant answers
- **Design System Consistency**: Uses existing Shadcn UI and Tailwind patterns
- **Accessibility**: WCAG 2.1 AA compliant with proper focus management
- **Mobile Responsive**: Adapts gracefully across all screen sizes

## Desktop Layout Schema (1440px+)

```
+---------------------------------------------------------------------------------+
|                          ANALYSIS TAB CONTENT                                   |
|================================================================================= |
|                                                                                 |
| +-----------------------------------------------------------------------------+ |
| |                           OVERALL SCORE CARD                               | |
| |                                                                             | |
| |   +---------------+  Overall Assessment                        [ 3.2/4.0 ] | |
| |   | SCORE CIRCLE  |  AI-powered analysis based on job          [ GOOD    ] | |
| |   |    3.2/4.0    |  requirements and performance               [Progress ] | |
| |   |    GOOD       |                                             [   Bar   ] | |
| |   +---------------+  Recommendation: Strong technical skills,                | |
| |                       work on communication clarity                          | |
| +-----------------------------------------------------------------------------+ |
|                                                                                 |
| +-----------------------------------------------------------------------------+ |
| |                            Q&A PAIRS SECTION                               | |
| |=============================================================================| |
| |                                                                             | |
| | ┌─ QUESTION 1 ──────────────────────────────────────────────────────────┐   | |
| | │ [TECHNICAL] Tell me about your experience with React development?      │   | |
| | │                                                                        │   | |
| | │ CANDIDATE ANSWER:                                           Score: 3/4 │   | |
| | │ I've been working with React for about 3 years...           [GOOD]    │   | |
| | │ [Long answer text with proper line wrapping and spacing]              │   | |
| | │                                                                        │   | |
| | │ Skills Demonstrated:                                                   │   | |
| | │ [React] [JavaScript] [Frontend Development] [Component Architecture]   │   | |
| | └────────────────────────────────────────────────────────────────────────┘   | |
| |                                                                             | |
| | ┌─ QUESTION 2 ──────────────────────────────────────────────────────────┐   | |
| | │ [BEHAVIORAL] Describe a challenging project and how you handled it     │   | |
| | │                                                                        │   | |
| | │ CANDIDATE ANSWER:                                           Score: 2/4 │   | |
| | │ There was this one project where...                      [BELOW AVG]  │   | |
| | │ [Answer text continues here]                                           │   | |
| | │                                                                        │   | |
| | │ Skills Demonstrated:                                                   │   | |
| | │ [Problem Solving] [Project Management] [Communication]                 │   | |
| | └────────────────────────────────────────────────────────────────────────┘   | |
| |                                                                             | |
| | ┌─ QUESTION 3 ──────────────────────────────────────────────────────────┐   | |
| | │ [CULTURAL] How do you handle feedback and criticism?                   │   | |
| | │                                                                        │   | |
| | │ CANDIDATE ANSWER:                                           Score: 4/4 │   | |
| | │ I really value feedback because...                       [EXCELLENT]  │   | |
| | │ [Answer continues with good spacing]                                   │   | |
| | │                                                                        │   | |
| | │ Skills Demonstrated:                                                   │   | |
| | │ [Growth Mindset] [Communication] [Self-Awareness]                      │   | |
| | └────────────────────────────────────────────────────────────────────────┘   | |
| |                                                                             | |
| | [Additional Q&A pairs follow same pattern...]                               | |
| +-----------------------------------------------------------------------------+ |
|                                                                                 |
| +-----------------------------------------------------------------------------+ |
| |                        ANALYSIS SUMMARY FOOTER                             | |
| |=============================================================================| |
| | Analysis generated on Sep 12, 2025, 2:45 PM                               | |
| | 8 questions analyzed • Average response time: 45 seconds                   | |
| +-----------------------------------------------------------------------------+ |
+---------------------------------------------------------------------------------+
```

## Mobile Layout Schema (375px)

```
+------------------------------------------+
|           ANALYSIS TAB CONTENT           |
|==========================================|
|                                          |
| +--------------------------------------+ |
| |         OVERALL SCORE CARD           | |
| |                                      | |
| |        +------------+                | |
| |        |   3.2/4.0   |  Overall      | |
| |        |    GOOD     |  Assessment   | |
| |        +------------+                | |
| |                                      | |
| |        [Progress Bar ████████░░]     | |
| |                                      | |
| |  Recommendation: Strong technical    | |
| |  skills, work on communication       | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| |             Q&A PAIRS               | |
| |=====================================| |
| |                                     | |
| | ┌─ QUESTION 1 ──────────────────────┐ | |
| | │ [TECHNICAL]                       │ | |
| | │ Tell me about your React          │ | |
| | │ experience?                       │ | |
| | │                                   │ | |
| | │ ANSWER:                   3/4     │ | |
| | │ I've been working with    [GOOD]  │ | |
| | │ React for 3 years...              │ | |
| | │ [Text wraps properly on mobile]   │ | |
| | │                                   │ | |
| | │ Skills:                           │ | |
| | │ [React] [JavaScript]              │ | |
| | │ [Frontend] [Architecture]         │ | |
| | └───────────────────────────────────┘ | |
| |                                     | |
| | ┌─ QUESTION 2 ──────────────────────┐ | |
| | │ [BEHAVIORAL]                      │ | |
| | │ Describe a challenging project... │ | |
| | │                                   │ | |
| | │ ANSWER:                   2/4     │ | |
| | │ There was this project... [BELOW] │ | |
| | │ [Answer continues...]             │ | |
| | │                                   │ | |
| | │ Skills:                           │ | |
| | │ [Problem Solving] [Communication] │ | |
| | └───────────────────────────────────┘ | |
| |                                     | |
| | [More Q&A pairs stack vertically]   | |
| +-------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| |          ANALYSIS FOOTER             | |
| |======================================| |
| | Generated Sep 12, 2:45 PM            | |
| | 8 questions • 45s avg response       | |
| +--------------------------------------+ |
+------------------------------------------+
```

## Color Scheme Specifications

### Score Colors (0-4 Scale)
- **Score 0-1 (Poor)**: `hsl(0 84% 60%)` - Red
- **Score 1.5-2.5 (Below Average)**: `hsl(25 95% 53%)` - Orange  
- **Score 2.5-3 (Basic)**: `hsl(45 93% 47%)` - Yellow
- **Score 3-3.5 (Good)**: `hsl(142 76% 36%)` - Green
- **Score 3.5-4 (Excellent)**: `hsl(142 76% 30%)` - Dark Green

### Category Badge Colors
- **Technical**: `hsl(210 40% 50%)` - Blue theme
- **Behavioral**: `hsl(25 95% 53%)` - Orange theme  
- **Cultural**: `hsl(142 76% 36%)` - Green theme
- **Problem Solving**: `hsl(270 50% 40%)` - Purple theme
- **Communication**: `hsl(200 80% 40%)` - Light blue theme
- **Leadership**: `hsl(340 75% 40%)` - Pink theme

### Accessibility Notes
- All color combinations meet WCAG 2.1 AA contrast requirements (4.5:1 minimum)
- Score indicators include both color and text labels
- Focus states use high-contrast outline: `hsl(217 91% 60%)`

## Component Specifications

### Overall Score Card
- **Container**: `Card` component with `CardHeader` and `CardContent`
- **Score Display**: Large text (3xl) with color-coded background circle
- **Progress Bar**: Shadcn `Progress` component with custom score colors
- **Typography**: 
  - Score: `text-3xl font-bold`
  - Label: `text-sm text-muted-foreground`
  - Recommendation: `text-sm`

### Q&A Pair Cards
- **Container**: `Card` component with subtle border and hover states
- **Question Section**:
  - Category badge: Shadcn `Badge` with custom colors
  - Question text: `text-base font-medium`
- **Answer Section**:
  - "CANDIDATE ANSWER:" label: `text-sm font-medium text-muted-foreground`
  - Answer text: `text-sm leading-relaxed`
  - Score display: Right-aligned with color coding
- **Skills Section**:
  - Label: `text-sm font-medium mb-2`
  - Skills: Flex-wrapped Shadcn `Badge` components with `variant="outline"`

### Spacing & Layout
- **Container padding**: `space-y-6` between major sections
- **Card padding**: `p-6` for desktop, `p-4` for mobile
- **Inner spacing**: `space-y-4` within cards
- **Skill badges**: `gap-2` with `flex-wrap`

### Interactive States
- **Card hover**: Subtle shadow increase and border color change
- **Badge hover**: Slight opacity increase
- **Focus states**: High-contrast outline for keyboard navigation

## Responsive Breakpoints

### Desktop (1440px+)
- Two-column layout for score and metadata
- Full Q&A cards with side-by-side question/answer layout
- Skill badges display in multiple rows with optimal spacing

### Tablet (768px-1439px)  
- Single-column layout
- Condensed score display
- Q&A cards stack vertically
- Skill badges wrap more tightly

### Mobile (375px-767px)
- Minimal score circle design
- Condensed Q&A cards
- Skills display in 2-3 columns
- Reduced padding and margins throughout

## Data Structure Extensions

To support this design, the existing `InterviewScore.analysis` JSONB should be extended to include:

```typescript
interface EnhancedAnalysis {
  overall_score: number
  qa_pairs: Array<{
    question: string
    answer: string
    category: 'technical' | 'behavioral' | 'cultural' | 'problem_solving' | 'communication' | 'leadership'
    individual_score: number // 0-4 scale
    skills_demonstrated: string[] // Job-specific skills
    timestamp?: string // Optional timing data
  }>
  strengths: string[]
  areas_for_improvement: string[]
  recommendation: string
  metadata: {
    total_questions: number
    average_response_time?: number
    analysis_completion_time: string
  }
}
```

## Implementation Notes

### Performance Considerations
- Use React.memo for Q&A pair components to prevent unnecessary re-renders
- Implement virtual scrolling if analysis contains >20 Q&A pairs
- Lazy load skill badge components

### Accessibility Implementation
- Semantic HTML with proper heading hierarchy (h2 → h3 → h4)
- ARIA labels for score indicators and interactive elements
- Keyboard navigation support with proper tab order
- Screen reader announcements for score changes

### Error States
- Handle missing analysis data gracefully
- Show skeleton loaders during analysis processing
- Display helpful messages for incomplete data

This design provides a comprehensive, scannable view of interview performance while maintaining consistency with the existing Interview Companion interface and meeting all specified requirements for accessibility and responsiveness.