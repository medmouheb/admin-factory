import { defineStepper } from '@stepperize/react'
import i18n from '@/i18n/config'

export const { useStepper, steps, utils } = defineStepper(
    {
        id: 'ContainerManagement',
        get title() { return i18n.t('repairStepper.containerManagement') },
        get description() { return i18n.t('repairStepper.containerManagementDesc') },
    },

    {
        id: 'TransferPrep',
        get title() { return i18n.t('repairStepper.transferPrep') },
        get description() { return i18n.t('repairStepper.transferPrepDesc') },
    }
)
