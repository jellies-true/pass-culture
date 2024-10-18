import { DEFAULT_SEARCH_FILTERS } from '../constants'
import { CollectiveSearchFiltersParams, SearchFiltersParams } from '../types'

export const hasSearchFilters = (
  searchFilters: Partial<SearchFiltersParams>,
  filterNames: (keyof SearchFiltersParams)[] = Object.keys(
    searchFilters
  ) as (keyof SearchFiltersParams)[]
): boolean => {
  return filterNames
    .map(
      (filterName) =>
        searchFilters[filterName] !== { ...DEFAULT_SEARCH_FILTERS }[filterName]
    )
    .includes(true)
}

export const hasCollectiveSearchFilters = (
  searchFilters: Partial<CollectiveSearchFiltersParams>,
  defaultFilters: CollectiveSearchFiltersParams,
  filterNames: (keyof CollectiveSearchFiltersParams)[] = Object.keys(
    searchFilters
  ) as (keyof CollectiveSearchFiltersParams)[]
): boolean => {
  return filterNames
    .map(
      (filterName) =>
        searchFilters[filterName] !== { ...defaultFilters }[filterName]
    )
    .includes(true)
}