import React from 'react'

import { ReactComponent as FullNextIcon } from 'icons/full-next.svg'
import { ButtonLink } from 'ui-kit'
import { ButtonVariant } from 'ui-kit/Button/types'

import styles from './SkipLinks.module.scss'

interface SkipLinksProps {
  displayMenu?: boolean
}

const SkipLinks = ({ displayMenu = false }: SkipLinksProps): JSX.Element => {
  return (
    <>
      <input
        tabIndex={-1}
        id="top-page"
        className={styles['input-focus-top-page']}
      />
      <nav className={styles['skip-links']}>
        <ul className={styles['skip-list']}>
          <li>
            <ButtonLink
              link={{
                to: '#content',
                isExternal: true,
              }}
              Icon={FullNextIcon}
              className={styles['skip-list-button']}
              variant={ButtonVariant.QUATERNARY}
            >
              Aller au contenu
            </ButtonLink>
          </li>
          {displayMenu && (
            <li>
              <a href="#header-navigation">Menu</a>
            </li>
          )}
        </ul>
      </nav>
    </>
  )
}

export default SkipLinks
