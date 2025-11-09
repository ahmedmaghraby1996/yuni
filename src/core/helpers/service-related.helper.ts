import { PaginatedRequest } from '../base/requests/paginated.request';

// to add user scope to the query filters
export const applyQueryFilters = (
  query: PaginatedRequest,
  applyFilter?: string,
  orFilters: string[] = [],
) => {
  if (query.filters) {
    if (typeof query.filters === 'string') {
      query.filters = [`${query.filters},${applyFilter}`];
    } else {
      query.filters.forEach((filter, index) => {
        query.filters[index] = `${filter},${applyFilter}`;
      });
    }
  } else {
    query.filters = [`${applyFilter}`];
  }

  if (orFilters.length) {
    orFilters.forEach((filter) => {
      query.filters.push(filter);
    });
  }
};

export const applyQueryISDeleted = (query: PaginatedRequest) => {
  query.isDeleted = true;
};
export const applyQuerySort = (query: PaginatedRequest, applySort: string) => {
  if (query.sortBy) {
    if (typeof query.sortBy === 'string') {
      query.sortBy = [query.sortBy];
    }
    query.sortBy.push(applySort);
  } else {
    query.sortBy = [applySort];
  }
};

export const applyQueryIncludes = (
  query: PaginatedRequest,
  applyInclude: string,
) => {
  if (query.includes) {
    if (typeof query.includes === 'string') {
      query.includes = [query.includes];
    }
    query.includes.push(applyInclude);
  } else {
    query.includes = [applyInclude];
  }
};

export const getCurrentDate = () => {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const day = currentDate.getDate().toString().padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};
export const getCurrentHourAndMinutes = () => {
  const currentDate = new Date();

  const hours = currentDate.getHours().toString().padStart(2, '0');
  const minutes = currentDate.getMinutes().toString().padStart(2, '0');

  const formattedTime = `${hours}.${minutes}`;
  return formattedTime;
};
