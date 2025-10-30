import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BarChart3, MessageSquare, Settings2, Sparkles, Zap } from 'lucide-react'
import { ReactNode } from 'react'
import AnimatedContainer from '../animate-container'

export function Features() {
    return (
        <section id='features' className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-5xl px-6">
                <AnimatedContainer>
                <div className="text-center">
                    <h2 className="text-4xl font-bold mb-3">Why ConvoFlow?</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The first truly AI-native form platform designed for the modern web
            </p>
                </div>
                </AnimatedContainer>

                <AnimatedContainer delay={0.3}>

                <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
                    <Card className="group shadow-black-950/5 hover:shadow hover:-translate-y-2 transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Sparkles className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">AI-Powered Creation</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm"> Just describe what you need. Our AI generates complete forms with smart logic, validation, and beautiful
                design in seconds.</p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-black-950/5 hover:shadow hover:-translate-y-2 transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <MessageSquare className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Conversational Experience</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">One question at a time, just like chatting. Voice input, natural language, and AI that understands
                context.</p>
                        </CardContent>
                    </Card>

                    <Card className="group shadow-black-950/5 hover:shadow hover:-translate-y-2 transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <BarChart3 className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Smart Analytics</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">AI-powered insights, sentiment analysis, and actionable recommendations to improve your forms.</p>
                        </CardContent>
                    </Card>
                </div>
                </AnimatedContainer>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-36 mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
        <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[24px_24px] opacity-10"/>
        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">{children}</div>
    </div>
)