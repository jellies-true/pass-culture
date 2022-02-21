import React, { useContext } from 'react'

import { FiltersContext } from 'app/providers/FiltersContextProvider'
import { Option } from 'app/types'
import { Tag } from 'app/ui-kit'
import { ReactComponent as ResetIcon } from 'assets/reset.svg'
import { VenueFilterType } from 'utils/types'

import './OfferFiltersTags.scss'

export const OfferFiltersTags = ({
  venueFilter,
  removeVenueFilter,
  handleResetFilters,
}: {
  venueFilter: VenueFilterType | null
  removeVenueFilter: () => void
  handleResetFilters: () => void
}): JSX.Element => {
  const {
    currentFilters: { categories, students, departments },
    dispatchCurrentFilters,
  } = useContext(FiltersContext)

  const hasActiveFilters = Boolean(
    venueFilter?.id ||
      departments.length > 0 ||
      students.length > 0 ||
      categories.length > 0
  )

  const handleRemoveDepartmentFilter = (
    departmentToBeRemoved: Option
  ): void => {
    dispatchCurrentFilters({
      type: 'REMOVE_ONE_DEPARTMENT_FILTER',
      departmentFilter: departmentToBeRemoved,
    })
  }

  const handleRemoveCategoriesFilter = (
    categoryToBeRemoved: Option<string[]>
  ): void => {
    dispatchCurrentFilters({
      type: 'REMOVE_ONE_CATEGORY_FILTER',
      categoryFilter: categoryToBeRemoved,
    })
  }

  const handleRemoveStudentsFilter = (studentToBeRemoved: Option): void => {
    dispatchCurrentFilters({
      type: 'REMOVE_ONE_STUDENT_FILTER',
      studentFilter: studentToBeRemoved,
    })
  }

  return (
    <div className="offer-filters-tags-container">
      <div className="offer-filters-tags">
        {venueFilter?.id ? (
          <Tag
            key={venueFilter.id}
            label={`Lieu : ${venueFilter.publicName || venueFilter.name}`}
            onClick={removeVenueFilter}
          />
        ) : null}
        {departments.map(department => (
          <Tag
            key={department.value}
            label={department.label}
            onClick={() => handleRemoveDepartmentFilter(department)}
          />
        ))}
        {categories.map(category => (
          <Tag
            key={category.value.join(',')}
            label={category.label}
            onClick={() => handleRemoveCategoriesFilter(category)}
          />
        ))}
        {students.map(student => (
          <Tag
            key={student.value}
            label={student.label}
            onClick={() => handleRemoveStudentsFilter(student)}
          />
        ))}
      </div>
      {hasActiveFilters && (
        <button
          className="offer-filters-reset"
          onClick={handleResetFilters}
          type="button"
        >
          <ResetIcon className="offer-filters-reset-icon" />
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}

export default OfferFiltersTags
