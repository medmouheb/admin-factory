import { defineStepper } from '@stepperize/react'

export const { useStepper, steps, utils } = defineStepper(
    {
        id: 'ContainerManagement',
        title: 'Container Management',
        description: 'Identify & Isolate HU',
    },

    {
        id: 'TransferPrep',
        title: 'Transfer Preparation',
        description: 'Generate Transfer Label',
    }
)
