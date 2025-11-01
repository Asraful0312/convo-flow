import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Trash2, Clock, Monitor } from "lucide-react"
import { mockResponses, mockForms, mockQuestions } from "@/lib/mock-data"

export default function ResponseDetailPage({
  params,
}: {
  params: { formId: string; responseId: string }
}) {
  const form = mockForms.find((f) => f.id === params.formId)
  const response = mockResponses.find((r) => r.id === params.responseId && r.form_id === params.formId)
  const questions = mockQuestions[params.formId] || []

  if (!form || !response) {
    notFound()
  }

  // Mock answers for this response
  const answers = [
    { question: "What is your name?", answer: "John Doe" },
    { question: "What is your email address?", answer: "john.doe@example.com" },
    { question: "How would you rate our product?", answer: "5 stars" },
    { question: "What could we improve?", answer: "The onboarding process could be more intuitive." },
  ]

  const completionTime = response.completed_at
    ? Math.round((new Date(response.completed_at).getTime() - new Date(response.started_at).getTime()) / 1000 / 60)
    : null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/forms/${params.formId}/responses`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Responses
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Response Details</h1>
            <p className="text-muted-foreground">{form.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2 text-destructive hover:text-destructive bg-transparent">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Response Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Response Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#6366f1]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {response.completed_at ? new Date(response.completed_at).toLocaleString() : "In Progress"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-[#f97316]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Device</p>
                  <p className="font-medium">
                    {response.metadata?.device} - {response.metadata?.browser}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Time</p>
                  <p className="font-medium">{completionTime ? `${completionTime} minutes` : "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={response.status === "completed" ? "default" : "secondary"}
                  className={
                    response.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : ""
                  }
                >
                  {response.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Thread */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>Full conversation thread with the respondent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {answers.map((item, index) => (
              <div key={index} className="space-y-3">
                {/* AI Question */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-medium">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                      <p className="text-sm">{item.question}</p>
                    </div>
                  </div>
                </div>

                {/* User Answer */}
                <div className="flex gap-3 justify-end">
                  <div className="flex-1 flex justify-end">
                    <div className="bg-[#6366f1] text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                      <p className="text-sm">{item.answer}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Automated analysis of this response</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">Sentiment</p>
              <p className="text-sm text-green-700 dark:text-green-300">Positive</p>
            </div>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              85% Confidence
            </Badge>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Key Themes</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Product Quality</Badge>
              <Badge variant="secondary">User Experience</Badge>
              <Badge variant="secondary">Onboarding</Badge>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Summary</p>
            <p className="text-sm text-muted-foreground">
              The respondent is generally satisfied with the product but suggests improvements to the onboarding
              process. They rated the product highly and provided constructive feedback.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
