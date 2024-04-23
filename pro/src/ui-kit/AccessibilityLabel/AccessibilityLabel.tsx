import cn from 'classnames'
import React from 'react'

import { AccessibilityEnum } from 'core/shared'
import strokeAccessibilityBrain from 'icons/stroke-accessibility-brain.svg'
import audioDisabilitySvg from 'icons/stroke-accessibility-ear.svg'
import strokeAccessibilityEye from 'icons/stroke-accessibility-eye.svg'
import strokeAccessibilityLeg from 'icons/stroke-accessibility-leg.svg'

import styles from './AccessibilityLabel.module.scss'

interface AccessibilityLabelProps {
  className?: string
  name: AccessibilityEnum
}

export const AccessibilityLabel = ({
  className,
  name,
}: AccessibilityLabelProps): JSX.Element => {
  const labelData = {
    [AccessibilityEnum.AUDIO]: {
      label: 'Auditif',
      svg: audioDisabilitySvg,
    },
    [AccessibilityEnum.MENTAL]: {
      label: 'Psychique ou cognitif',
      svg: strokeAccessibilityBrain,
    },
    [AccessibilityEnum.MOTOR]: {
      label: 'Moteur',
      svg: strokeAccessibilityLeg,
    },
    [AccessibilityEnum.VISUAL]: {
      label: 'Visuel',
      svg: strokeAccessibilityEye,
    },
    [AccessibilityEnum.NONE]: {
      label: 'Non accessible',
    },
  }[name]

  return (
    <div className={cn(styles['accessibility-label'], className)}>
      {labelData.svg && <img src={labelData.svg} className={styles['icon']} />}
      <span className={styles['text']}>{labelData.label}</span>
    </div>
  )
}
