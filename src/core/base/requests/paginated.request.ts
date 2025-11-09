import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { toRightNumber } from 'src/core/helpers/cast.helper';
import {
  ILike,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
} from 'typeorm';

export interface WhereFilter {
  [key: string]: string;
}

export type SortHandle = 'ASC' | 'DESC';

export interface SortFilter {
  [key: string]: SortHandle;
}

export interface IncludesFilter {
  [key: string]: boolean | IncludesFilter;
}

export class PaginatedRequest {
  @Transform(({ value }) => toRightNumber(value, { min: 1 }))
  @ApiProperty({ required: false, minimum: 1 })
  @IsOptional()
  @IsNumber()
  page: number;

  @Transform(({ value }) => toRightNumber(value, { min: 1 }))
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  filters: string[]; // [ 'name=John', 'age=20,name=Mahmoud' ]

  @ApiProperty({ required: false })
  @IsOptional()
  sortBy: string[]; // [ 'name,ASC', 'age,DESC' ]

  @ApiProperty({ required: false })
  @IsOptional()
  includes: string[]; // [ 'addresses', 'profile' ]

  @ApiProperty({ required: false })
  @IsOptional()
  select: object;

  @ApiProperty({ required: false ,default: false})
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isDeleted: boolean;

  get skip(): number {
    if (this.page && !this.limit) {
      return (this.page - 1) * 10;
    }
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    if (this.page && !this.limit) return 10;
    return this.limit;
  }

  get where(): WhereFilter | WhereFilter[] {
    const whereFilters: WhereFilter[] | WhereFilter = [];

    // convert filters to array if it's a string
    if (this.filters && typeof this.filters === 'string') {
      this.filters = [this.filters];
    }

    // return empty object if filters is empty
    if (!this.filters) return {};

    // convert filters to where filters
    this.filters.forEach((filter) => {
      let whereFilter = {};
      const filterParts = filter.split(',');
      filterParts.forEach((filterPart) => {
        const subFilters = filterPart.split('.');
        if (
          subFilters.length > 1
        ) {
          const subFilter = subFilters.shift();
          whereFilter = {
            ...whereFilter,
            [subFilter]: this.handleSubFilters(subFilters.join('.')),
          };
        } else {
          const operator = this.getOperator(filterPart);

          const [key, value] = filterPart.split(operator);
          console.log(key, value);
          switch (operator) {
            
            //case Include  line In() make it a character not a letter
            case'/':
              whereFilter = { ...whereFilter, [key]: In(value.split('_')) };
            
            case '#':
              whereFilter = { ...whereFilter, [key]: ILike(`%${value}%`) };
            case '<':
              whereFilter = { ...whereFilter, [key]: LessThan(value) };
              break;
            case '>':
              whereFilter = { ...whereFilter, [key]: MoreThan(value) };
              break;
            case '<=':
              whereFilter = { ...whereFilter, [key]: LessThanOrEqual(value) };
              break;
            case '>=':
              whereFilter = { ...whereFilter, [key]: MoreThanOrEqual(value) };
              break;
            case '!=':
              whereFilter = { ...whereFilter, [key]: Not(value) };
              break;
            default:
            case ':=:':
              whereFilter = { ...whereFilter, [key]: Like(`%${value}%`) };
              break;
            case '=:':
              whereFilter = { ...whereFilter, [key]: Like(`${value}%`) };
              break;
            case ':=':
              whereFilter = { ...whereFilter, [key]: Like(`%${value}`) };
              break;

              case '=!':
                whereFilter = { ...whereFilter, [key]: IsNull() };
                break;

                case '==':
                  whereFilter = { ...whereFilter, [key]: Not(IsNull()) };
                  break;
                
              
              whereFilter = { ...whereFilter, [key]: value };
              break;
          }
        }
      });
      whereFilters.push(whereFilter);
    });
    return whereFilters;
  }
  

  get order(): SortFilter {
    let orderFilters: SortFilter;

    // convert sortBy to array if it's a string
    if (this.sortBy && typeof this.sortBy === 'string') {
      this.sortBy = [this.sortBy];
    }

    // return empty object if sortBy is empty
    if (!this.sortBy) return orderFilters;

    // convert sortBy to order filters
    this.sortBy.forEach((sort) => {
      const [key, value] = sort.split('=').slice(0, 2);
      orderFilters = {
        ...orderFilters,
        [key]: value ? (value as SortHandle) : 'ASC',
      };
    });

    return orderFilters;
  }

  get relations(): IncludesFilter {
    let relations: IncludesFilter;
    // convert includes to array if it's a string
    if (this.includes && typeof this.includes === 'string') {
      this.includes = [this.includes];
    }

    // return empty object if includes is empty
    if (!this.includes) return relations;

    // convert includes to relations
    this.includes.forEach((include) => {
      relations = { ...relations, ...this.handleSubRelations(include) };
    });

    return relations;
  }

  // handle sub relations with level limit of x
  private handleSubRelations(include: string): IncludesFilter {
    if (include.includes('#')) {
      const key = include.split('#')[0];

      const relations = include.split('#')[1].split('.');

      const resultObject = {};
      relations.forEach((key) => {
        resultObject[key] = true;
      });
     
      return { [key]: resultObject };
    }
    const subRelations = include.split('.');
    if (subRelations.length > 1) {
      const subRelation = subRelations.shift();
      return { [subRelation]: this.handleSubRelations(subRelations.join('.')) };
    } else {
      return { [include]: true };
    }
  }
  private handleSubFilters(filter: string) {
    const subFilters = filter.split('.');
    if (
      subFilters.length > 1 &&
      subFilters[1] !== 'com'
    ) {
      const subFilter = subFilters.shift();
      return { [subFilter]: this.handleSubFilters(subFilters.join('.')) };
    } else {
      const operator = this.getOperator(filter);

      const [key, value] = filter.split(operator);
      switch (operator) {
        //case Include  line In() make it a character not a letter
        case'/':
          return { [key]: In(value.split('_')) };
        case '<':
          return { [key]: LessThan(value) };
        case '>':
          return { [key]: MoreThan(value) };
        case '<=':
          return { [key]: LessThanOrEqual(value) };
        case '>=':
          return { [key]: MoreThanOrEqual(value) };
        case '!=':
          return { [key]: Not(value) };
        case '=!':
          return { [key]: IsNull() };
        case '==':
          return { [key]: Not(IsNull()) };
        default:
          return { [key]: Like(`%${value}%`) };
      }
    }
  }

  private getOperator(statement: string): string {
    if (statement.includes('/')) return '/';
    if (statement.includes('#')) return '#';
    if (statement.includes('<=')) return '<=';
    if (statement.includes('>=')) return '>=';
    if (statement.includes('<')) return '<';
    if (statement.includes('>')) return '>';
    if (statement.includes('!=')) return '!=';
    if( statement.includes('=!')) return '=!';
    if( statement.includes('==')) return '==';
    return '=';
  }
}
