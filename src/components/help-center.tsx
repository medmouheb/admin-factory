import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Phone, 
  Search,
  FileText,
  Video,
  Users,
  Zap,
  Shield,
  Settings,
  ChevronRight
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

const categories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn the basics of using the platform',
    color: 'bg-blue-500',
    articles: 12
  },
  {
    icon: Users,
    title: 'User Management',
    description: 'Manage users, roles, and permissions',
    color: 'bg-purple-500',
    articles: 8
  },
  {
    icon: FileText,
    title: 'Ticket System',
    description: 'Create and manage tickets efficiently',
    color: 'bg-orange-500',
    articles: 15
  },
  {
    icon: Settings,
    title: 'Configuration',
    description: 'Configure system settings and preferences',
    color: 'bg-green-500',
    articles: 10
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Security best practices and guidelines',
    color: 'bg-indigo-500',
    articles: 6
  },
  {
    icon: Zap,
    title: 'Advanced Features',
    description: 'Unlock powerful advanced capabilities',
    color: 'bg-yellow-500',
    articles: 9
  }
]

const faqs = [
  {
    question: 'How do I create a new ticket?',
    answer: 'To create a new ticket, navigate to the Ticket Codes page and click the "New Ticket" button. Fill in the required information including the barcode, ticket code, and any additional details. Click "Create" to generate your ticket.'
  },
  {
    question: 'How can I search for specific tickets?',
    answer: 'Use the search bar on the Ticket Codes page to search by ticket code, HU number, or date. You can also use advanced filters to narrow down your search results by date range, sort order, and ticket quantity.'
  },
  {
    question: 'What are the different user roles?',
    answer: 'The system supports multiple user roles including Admin, Supervisor, and Operator. Each role has different permissions: Admins have full access, Supervisors can manage tickets and view reports, and Operators can create and view tickets.'
  },
  {
    question: 'How do I export ticket data?',
    answer: 'You can export ticket data by clicking the "Export" button on the Ticket Codes page. Choose your preferred format (PDF or Excel) and select the date range for the data you want to export.'
  },
  {
    question: 'Can I edit tickets after creation?',
    answer: 'Yes, tickets can be edited after creation. Click on the ticket you want to modify, then select "Edit" from the actions menu. Note that some fields may be restricted based on your user role.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'Click on your profile icon in the top right corner, select "Settings", then navigate to "Security". Click "Change Password" and follow the prompts to set a new password.'
  }
]

const contactOptions = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Get help via email',
    contact: 'support@tesca.com',
    color: 'bg-blue-500'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Call us for immediate help',
    contact: '+1 (555) 123-4567',
    color: 'bg-green-500'
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Chat with our support team',
    contact: 'Available 24/7',
    color: 'bg-purple-500'
  }
]

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header Section - Similar to User Management */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 p-8 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
            >
              <HelpCircle className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Help Center
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-lg"
              >
                Find answers and get support for your questions
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quick Search</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help articles, guides, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Categories Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -4 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 h-full border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <motion.div
                        animate={hoveredCard === index ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 0.5 }}
                        className={`p-3 rounded-xl ${category.color} text-white shadow-md`}
                      >
                        <Icon className="h-6 w-6" />
                      </motion.div>
                      <Badge variant="secondary">
                        {category.articles} articles
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-primary font-medium">
                      View articles
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:text-primary transition-colors">
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium">{faq.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Support Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contactOptions.map((option, index) => {
            const Icon = option.icon
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card className="text-center cursor-pointer hover:shadow-lg transition-all duration-300 h-full border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className={`mx-auto p-4 rounded-2xl ${option.color} text-white shadow-md mb-3 w-fit`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                    <div className="text-sm font-semibold text-primary mt-2">
                      {option.contact}
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Video Tutorials Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg mb-4 w-fit">
              <Video className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Video Tutorials</CardTitle>
            <CardDescription>
              Watch step-by-step guides to master the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-300">
              <Video className="mr-2 h-5 w-5" />
              Browse Video Library
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
