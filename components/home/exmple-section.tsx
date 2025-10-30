import { cn } from "@/lib/utils";
import { BarChart3, FileText, MessageSquare, Users, Zap } from "lucide-react";
import Link from "next/link";
import AnimatedContainer from "../animate-container";


export function ExamplesSection() {
  const features = [
    {
      title: "Lead Generation",
      description:
        "Qualify leads naturally with AI-powered questions that adapt based on responses. 73% completion rate.",
      icon: <Users />,
    },
    {
      title: "Customer Feedback",
      description:
        "Gather rich feedback through natural conversation. Get 3x more detailed responses than traditional surveys.",
      icon: <MessageSquare />,
    },
    {
      title: "Event Registration",
      description:
        " Make event signups feel personal. Collect dietary preferences, accessibility needs, and more effortlessly.",
      icon: <FileText />,
    },
    {
      title: "Job Applications",
      description: "Screen candidates intelligently with adaptive questions. Reduce time-to-hire by 40%.",
      icon: <Zap />,
    },
    {
      title: "Market Research",
      description: "Conduct in-depth research with AI that asks follow-up questions. Get insights traditional surveys miss.",
      icon: <BarChart3 />,
    },
    {
      title: "Customer Onboarding",
      description:
        "Welcome new customers with a personalized conversation. Increase activation rates by 55%.",
      icon: <Users />,
    },
  
  ];
    return (
      <section id="examples" className="@container mx-auto max-w-5xl px-6">
        <AnimatedContainer>
              <div className="text-center">
                    <h2 className="text-4xl font-bold mb-3">See It In Action</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-world examples of conversational forms that get results
            </p>
                </div>
        </AnimatedContainer>

        <AnimatedContainer delay={0.3}>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  relative z-10 py-10">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
        </AnimatedContainer>
      </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r  py-10 relative group/feature dark:border-neutral-800 bg-card",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 6 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-linear-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 6 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-linear-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
          )}
          <div className="flex items-start justify-between pr-10">
              
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
          </div>
          
              <Link className="text-sm" href="/demo/onboarding">
                
                  Try Demo →
                
              </Link>
          
          </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
          </p>
          
          
    </div>
  );
};
