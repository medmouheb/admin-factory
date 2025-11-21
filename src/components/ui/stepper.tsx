import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Circle, Dot } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const StepperContext = React.createContext<{
    activeStep: number
    steps: number
    orientation: "horizontal" | "vertical"
}>({
    activeStep: 0,
    steps: 0,
    orientation: "horizontal",
})

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
    activeStep: number
    children: React.ReactNode
    orientation?: "horizontal" | "vertical"
}

function Stepper({
    activeStep,
    children,
    orientation = "horizontal",
    className,
    ...props
}: StepperProps) {
    const steps = React.Children.count(children)

    return (
        <StepperContext.Provider value={{ activeStep, steps, orientation }}>
            <div
                className={cn(
                    "flex w-full gap-4",
                    orientation === "vertical" ? "flex-col" : "flex-row items-center",
                    className
                )}
                {...props}
            >
                {React.Children.map(children, (child, index) => {
                    const isLast = index === steps - 1
                    return (
                        <React.Fragment>
                            {React.cloneElement(child as React.ReactElement, {
                                step: index,
                                isLast,
                            })}
                        </React.Fragment>
                    )
                })}
            </div>
        </StepperContext.Provider>
    )
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
    step?: number // Injected by Stepper
    isLast?: boolean // Injected by Stepper
    icon?: React.ReactNode
    label?: React.ReactNode
    description?: React.ReactNode
    onClick?: () => void
}

function Step({
    step = 0,
    isLast,
    icon,
    label,
    description,
    className,
    onClick,
    ...props
}: StepProps) {
    const { activeStep, orientation } = React.useContext(StepperContext)
    const isActive = step === activeStep
    const isCompleted = step < activeStep
    const isDisabled = step > activeStep

    return (
        <div
            className={cn(
                "flex items-center gap-4",
                orientation === "vertical" ? "w-full" : "flex-shrink-0",
                isLast ? "flex-grow-0" : "flex-grow",
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-4">
                <Button
                    variant={isActive || isCompleted ? "default" : "secondary"}
                    className={cn(
                        "flex size-10 items-center justify-center rounded-full transition-colors",
                        isActive && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={onClick}
                    disabled={isDisabled && !isCompleted} // Allow clicking completed steps if needed, or modify logic
                >
                    {icon ? (
                        icon
                    ) : isCompleted ? (
                        <Check className="size-5" />
                    ) : (
                        <span>{step + 1}</span>
                    )}
                </Button>
                <div className="flex flex-col">
                    {label && (
                        <span
                            className={cn(
                                "text-sm font-medium",
                                isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="text-xs text-muted-foreground">{description}</span>
                    )}
                </div>
            </div>
            {!isLast && (
                <Separator
                    orientation={orientation === "vertical" ? "vertical" : "horizontal"}
                    className={cn(
                        "flex-1",
                        orientation === "vertical" ? "min-h-8 ml-5" : "h-[2px]",
                        isCompleted ? "bg-primary" : "bg-muted"
                    )}
                />
            )}
        </div>
    )
}

export { Stepper, Step }
