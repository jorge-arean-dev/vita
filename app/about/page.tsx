import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-6xl py-10 space-y-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">About Vita</h1>
        <p className="text-xl text-muted-foreground">Our modern tech stack powering this application</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TechCard 
          title="Frontend Framework" 
          description="Built with Next.js 14 using the App Router for optimized server and client rendering"
          technologies={["Next.js", "React", "TypeScript"]}
        />
        
        <TechCard 
          title="Backend & Database" 
          description="Powered by Supabase for authentication, database, storage, and edge functions"
          technologies={["Supabase", "PostgreSQL", "Edge Functions"]}
        />
        
        <TechCard 
          title="Styling & UI" 
          description="Beautiful, accessible components with modern styling solutions"
          technologies={["Shadcn UI", "Radix UI", "Tailwind CSS"]}
        />
        
        <TechCard 
          title="State Management" 
          description="Efficient state management using React Server Components and server actions"
          technologies={["React Server Components", "Server Actions", "useOptimistic"]}
        />
        
        <TechCard 
          title="Developer Experience" 
          description="Modern tooling for a productive development workflow"
          technologies={["TypeScript", "ESLint", "pnpm"]}
        />
        
        <TechCard 
          title="Security" 
          description="Enterprise-grade security with Row Level Security and authentication"
          technologies={["RLS", "Supabase Auth", "zod validation"]}
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Architecture Highlights</h2>
        <p className="text-muted-foreground">
          This application follows modern best practices with a focus on performance, security, and developer experience:
        </p>
        
        <ul className="list-disc pl-6 space-y-2">
          <li>App Router architecture with layouts, pages, and error boundaries</li>
          <li>Server Components for improved performance and reduced client-side JavaScript</li>
          <li>Row Level Security (RLS) for data protection at the database level</li>
          <li>Responsive design with mobile-first approach using Tailwind CSS</li>
          <li>Type-safe data fetching and form handling with TypeScript and zod</li>
          <li>Optimized for Core Web Vitals with fast loading times</li>
        </ul>
      </div>
    </div>
  );
}

function TechCard({ title, description, technologies }: { 
  title: string;
  description: string;
  technologies: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <Badge key={tech} variant="secondary">{tech}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}