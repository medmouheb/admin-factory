import React, { useState } from 'react'
import { Stepper, Step } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function StepperExample() {
    const [activeStep, setActiveStep] = useState(0)

    const steps = [
        { title: 'Personal Info', description: 'Enter your details' },
        { title: 'Account', description: 'Setup your account' },
        { title: 'Review', description: 'Check everything' },
    ]

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1)
        }
    }

    return (
        <div className="flex justify-center p-10">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Registration Wizard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <Stepper activeStep={activeStep}>
                        {steps.map((step, index) => (
                            <Step
                                key={index}
                                label={step.title}
                                description={step.description}
                                onClick={() => setActiveStep(index)} // Optional: allow clicking steps
                            />
                        ))}
                    </Stepper>

                    <div className="min-h-[200px] rounded-lg border border-dashed p-4 flex items-center justify-center bg-muted/50">
                        <div className="text-center">
                            <h3 className="text-lg font-medium">Step {activeStep + 1}: {steps[activeStep].title}</h3>
                            <p className="text-muted-foreground">Content for {steps[activeStep].title} goes here.</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={activeStep === 0}>
                        Back
                    </Button>
                    <Button onClick={handleNext} disabled={activeStep === steps.length - 1}>
                        {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
