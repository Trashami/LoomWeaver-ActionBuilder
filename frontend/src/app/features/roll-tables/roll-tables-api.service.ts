import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface LwRollDieVm {
  readonly count: number;
  readonly sides: number;
  readonly expression: string;
}

export interface LwRollTableSummaryVm {
  readonly id: number;
  readonly name: string;
  readonly sourceBook: string | null;
  readonly page: number | null;
  readonly caption: string | null;
  readonly category: string | null;
  readonly rowCount: number;
  readonly die: LwRollDieVm | null;
}

export interface LwRollTableRowVm {
  readonly rangeLabel: string;
  readonly min: number | null;
  readonly max: number | null;
  readonly cells: readonly string[];
}

export interface LwRollTableDetailVm extends Omit<LwRollTableSummaryVm, 'rowCount'> {
  readonly colLabels: readonly string[];
  readonly rows: readonly LwRollTableRowVm[];
}

export interface LwRollTableListVm {
  readonly tables: readonly LwRollTableSummaryVm[];
  readonly count: number;
  readonly hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class RollTablesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v2/roll-tables';

  listTables(options: {
    search?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Observable<LwRollTableListVm> {
    let params = new HttpParams();
    if (options.search?.trim()) params = params.set('search', options.search.trim());
    if (options.source?.trim()) params = params.set('source', options.source.trim());
    if (options.limit != null) params = params.set('limit', options.limit);
    if (options.offset != null) params = params.set('offset', options.offset);
    return this.http.get<LwRollTableListVm>(this.base, { params });
  }

  getTable(id: number): Observable<LwRollTableDetailVm> {
    return this.http.get<LwRollTableDetailVm>(`${this.base}/${id}`);
  }
}
