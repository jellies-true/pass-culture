import classnames from 'classnames'
import React from 'react'

import { DomainNameBanner } from 'components/DomainNameBanner/DomainNameBanner'
import Footer from 'components/Footer/Footer'
import OldHeader from 'components/Header/OldHeader'
import SkipLinks from 'components/SkipLinks'

import styles from './OldLayout.module.scss'

interface OldLayoutProps {
  children?: React.ReactNode
  layout?: 'basic' | 'funnel' | 'without-nav' | 'sticky-actions'
}

export const OldLayout = ({ children, layout = 'basic' }: OldLayoutProps) => {
  return (
    <>
      <SkipLinks />
      {(layout === 'basic' || layout === 'sticky-actions') && <OldHeader />}

      <main
        id="content"
        className={classnames({
          page: true,
          [styles.container]: layout === 'basic' || layout === 'sticky-actions',
          [styles['container-sticky-actions']]: layout === 'sticky-actions',
          [styles['container-without-nav']]: layout === 'without-nav',
        })}
      >
        {layout === 'funnel' || layout === 'without-nav' ? (
          children
        ) : (
          <div className={styles['page-content']}>
            <div className={styles['after-notification-content']}>
              <DomainNameBanner />
              {children}
            </div>
          </div>
        )}
      </main>
      {layout !== 'funnel' && <Footer layout={layout} />}
    </>
  )
}