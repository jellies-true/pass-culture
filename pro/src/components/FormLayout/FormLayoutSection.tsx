import cn from 'classnames'
import React from 'react'

import style from './FormLayout.module.scss'
import { FormLayoutDescription } from './FormLayoutDescription'

interface FormLayoutSectionProps {
  title: React.ReactNode
  description?: string
  children: React.ReactNode | React.ReactNode[]
  className?: string
  id?: string
}

const Section = ({
  title,
  description,
  children,
  className,
  id,
}: FormLayoutSectionProps): JSX.Element => (
  <fieldset className={cn(style['form-layout-section'], className)} id={id}>
    <legend>
      <h2 className={style['form-layout-section-title']}>{title}</h2>
    </legend>
    <div className={style['form-layout-section-header']}>
      <FormLayoutDescription description={description} />
    </div>
    {children}
  </fieldset>
)

export default Section
