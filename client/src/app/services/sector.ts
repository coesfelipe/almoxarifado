import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sector {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface CreateSectorPayload {
  name: string;
  description?: string;
}

export interface UpdateSectorPayload {
  name?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class SectorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sectors`;

  getSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(this.apiUrl);
  }

  getSector(id: number): Observable<Sector> {
    return this.http.get<Sector>(`${this.apiUrl}/${id}`);
  }

  createSector(payload: CreateSectorPayload): Observable<Sector> {
    return this.http.post<Sector>(this.apiUrl, payload);
  }

  updateSector(id: number, payload: UpdateSectorPayload): Observable<Sector> {
    return this.http.patch<Sector>(`${this.apiUrl}/${id}`, payload);
  }

  deleteSector(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
