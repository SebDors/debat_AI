import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Debate, Message } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  getDebates(): Observable<Debate[]> {
    return this.http.get<Debate[]>(`${this.baseUrl}/debates`);
  }

  getMessages(debateId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/debates/${debateId}/messages`);
  }

  postMessage(debateId: number, content: string, username: string): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/debates/${debateId}/messages`, { content, username });
  }
}