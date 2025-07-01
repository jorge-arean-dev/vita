import { Button } from "./ui/button";

export function Hero() {
  return (
    <div className="flex flex-col gap-8 items-center py-16 px-4 text-center">
      <div className="space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          .vita <span className="text-primary"></span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Streamline recruitment duties with your Virtual Interface for Talent Acquisition
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <Button size="lg">
          Get Started
        </Button>
        <Button size="lg" variant="outline">
          Learn More
        </Button>
      </div>
      
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
