import React, { ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import type { Location } from 'react-router-dom'

import { ConfirmDialog } from 'components/Dialog/ConfirmDialog/ConfirmDialog'

export type BlockerFunction = (args: {
  currentLocation: Location
  nextLocation: Location
}) => boolean

export interface RouteLeavingGuardProps {
  children?: ReactNode | ReactNode[]
  extraClassNames?: string
  shouldBlockNavigation: BlockerFunction
  dialogTitle: string
  rightButton?: string
  leftButton?: string
  // This is a weird behavior that should be unified at a UX level
  // the modal should follow the same behavior
  closeModalOnRightButton?: boolean
}

export const RouteLeavingGuard = ({
  children,
  extraClassNames = '',
  shouldBlockNavigation,
  dialogTitle,
  rightButton = 'Quitter',
  leftButton = 'Annuler',
  closeModalOnRightButton = false,
}: RouteLeavingGuardProps) => {
  const blocker = useBlocker(shouldBlockNavigation)

  const closeModal = () => {
    if (blocker.state !== 'blocked') {
      return
    }
    blocker.reset()
  }

  const confirmNavigation = () => {
    if (blocker.state !== 'blocked') {
      return
    }

    blocker.proceed()
  }

  return (
    <ConfirmDialog
      extraClassNames={extraClassNames}
      onCancel={closeModal}
      leftButtonAction={
        closeModalOnRightButton ? confirmNavigation : closeModal
      }
      onConfirm={closeModalOnRightButton ? closeModal : confirmNavigation}
      title={dialogTitle}
      confirmText={rightButton}
      cancelText={leftButton}
      open={blocker.state === 'blocked'}
    >
      {children}
    </ConfirmDialog>
  )
}
