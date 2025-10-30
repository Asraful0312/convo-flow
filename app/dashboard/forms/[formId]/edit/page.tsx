import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye, Trash2, Plus, GripVertical } from "lucide-react"
import { mockForms, mockQuestions } from "@/lib/mock-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EditFormPage({ params }: { params: { formId: string } }) {
  const form = mockForms.find((f) => f.id === params.formId)
  const questions = mockQuestions[params.formId] || []

  if (!form) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/forms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Form</h1>
            <p className="text-muted-foreground">Customize your form questions and settings</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/f/${form.id}`} target="_blank">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </Link>
          <Button className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="questions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Questions</CardTitle>
                  <CardDescription>Add, edit, or reorder your form questions</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <Label>Question {index + 1}</Label>
                            <Input defaultValue={question.text} placeholder="Enter your question" />
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Question Type</Label>
                            <Select defaultValue={question.type}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Short Text</SelectItem>
                                <SelectItem value="textarea">Long Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="choice">Multiple Choice</SelectItem>
                                <SelectItem value="checkbox">Checkboxes</SelectItem>
                                <SelectItem value="rating">Rating</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between pt-8">
                            <Label htmlFor={`required-${question.id}`}>Required</Label>
                            <Switch id={`required-${question.id}`} defaultChecked={question.required} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
              <CardDescription>Configure form behavior and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Form Title</Label>
                <Input id="title" defaultValue={form.title} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" defaultValue={form.description} rows={3} />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email on new response</Label>
                    <p className="text-sm text-muted-foreground">Get notified when someone submits</p>
                  </div>
                  <Switch defaultChecked={form.settings?.notifications?.email_on_response} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-email">Notification Email</Label>
                  <Input
                    id="notification-email"
                    type="email"
                    defaultValue={form.settings?.notifications?.notification_email}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">AI Configuration</h3>
                <div className="space-y-2">
                  <Label htmlFor="personality">AI Personality</Label>
                  <Select defaultValue={form.ai_config?.personality}>
                    <SelectTrigger id="personality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Input</Label>
                    <p className="text-sm text-muted-foreground">Allow users to speak their answers</p>
                  </div>
                  <Switch defaultChecked={form.ai_config?.voice_enabled} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Design</CardTitle>
              <CardDescription>Customize the look and feel of your form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    defaultValue={form.settings?.branding?.primary_color || "#6366f1"}
                    className="w-20 h-10"
                  />
                  <Input defaultValue={form.settings?.branding?.primary_color || "#6366f1"} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" placeholder="https://example.com/logo.png" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Welcome! Let's get started..."
                  rows={3}
                  defaultValue="Hi there! Thanks for taking the time to fill out this form. It should only take a few minutes."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thank-you-message">Thank You Message</Label>
                <Textarea
                  id="thank-you-message"
                  placeholder="Thank you for your submission!"
                  rows={3}
                  defaultValue="Thank you for your response! We appreciate your feedback."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
