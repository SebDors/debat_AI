import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { Message } from '../models';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;

  public connect(debateId: number): Observable<Message> {
    const url = `ws://localhost:8000/ws/debates/${debateId}`;
    this.socket$ = webSocket(url);
    
    return this.socket$.asObservable();
  }

  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}