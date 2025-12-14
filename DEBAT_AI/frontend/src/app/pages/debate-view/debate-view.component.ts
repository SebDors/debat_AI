import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { ApiService } from '../../services/api.service';
import { WebsocketService } from '../../services/websocket.service';
import { Message } from '../../models';

@Component({
  selector: 'app-debate-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './debate-view.component.html',
  styleUrls: ['./debate-view.component.css']
})
export class DebateViewComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChildren('messageElements') messageElements!: QueryList<ElementRef>;

  // Données de base
  messages: Message[] = [];
  newMessageContent: string = '';
  debateId: number = 0;
  
  // NOUVEAU : Infos de la session (Le Match)
  debateTopic: string = 'Loading...';
  sessionId: string = '';

  // Gestion des Joueurs
  username: string = ''; // L'utilisateur actuel (celui qui parle)
  playerA: string = 'Alice';
  playerB: string = 'Bob';

  // Gestion du Score
  scoreA: number = 0;
  scoreB: number = 0;

  // Gestion de l'IA et WebSocket
  private wsSubscription!: Subscription;
  winningIds: string[] = []; // Liste des IDs des arguments "Verts"
  
  // Gestion des Suggestions (Coach)
  loadingSuggestionId: number | null = null;
  suggestionsMap: { [key: number]: string[] } = {};

  showWinnerModal: boolean = false;
  winnerName: string = '';
  winnerMessage: string = '';

  highlightedMessageId: number | null = null; // New property for highlighting

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private websocketService: WebsocketService
  ) { }

  ngOnInit(): void {
    // 1. Récupération des noms depuis le Setup (Page d'accueil)
    this.playerA = localStorage.getItem('debaterA') || 'Alice';
    this.playerB = localStorage.getItem('debaterB') || 'Bob';
    
    // Par défaut, on prend le nom stocké, sinon le joueur A
    this.username = localStorage.getItem('username') || this.playerA;

    // 2. NOUVEAU : Récupération du Titre et de l'ID de Session Unique
    this.debateTopic = localStorage.getItem('debateTopic') || 'Debate';
    this.sessionId = localStorage.getItem('currentSessionId') || 'default_session';
    
    // 3. Initialisation du débat
    this.route.paramMap.subscribe(params => {
      this.debateId = Number(params.get('id'));
      if (this.debateId) {
        this.loadInitialMessages();
        this.connectToWebSocket();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.websocketService.disconnect();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // --- CHARGEMENT & WEBSOCKET ---

  loadInitialMessages(): void {
    this.apiService.getMessages(this.debateId, this.sessionId).subscribe(data => {
      this.messages = data;
      if (this.messages.length > 0 && this.messages[0].current_winners) {
        this.winningIds = this.messages[0].current_winners.map(id => String(id));
      }
      this.calculateScore(); 
    });
  }

  connectToWebSocket(): void {
    this.wsSubscription = this.websocketService.connect(this.debateId).subscribe({
      next: (message: Message) => {
        
        // MODIFIÉ : Filtre de sécurité
        // Si le message reçu ne porte pas le bon session_id, on l'ignore.
        // (Cast 'any' au cas où le modèle TS n'est pas encore à jour strictement, mais le backend envoie bien le champ)
        if ((message as any).session_id && (message as any).session_id !== this.sessionId) {
            return;
        }

        // 1. Mise à jour de la logique (Qui gagne ?)
        if (message.current_winners) {
          this.winningIds = message.current_winners.map(id => String(id));
          this.calculateScore(); // Recalcul du score en temps réel
        }

        // 2. Ajout du message (si pas déjà présent)
        const exists = this.messages.find(m => m.id === message.id);
        if (!exists) {
            this.messages.push(message);
        } else {
            // Si le message existe déjà (ex: update), on met à jour ses infos
            Object.assign(exists, message);
        }
      },
      error: err => console.error('WebSocket error:', err),
      complete: () => console.log('WebSocket connection closed')
    });
  }

  onKeydown(event: KeyboardEvent): void {
    // Si on appuie sur Entrée SANS la touche Maj (Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (!this.newMessageContent.trim() || !this.username) {
      return;
    }

    // MODIFIÉ : On envoie le sessionId pour lier le message au bon match
    this.apiService.postMessage(this.debateId, this.newMessageContent, this.username, this.sessionId)
      .subscribe(() => {
        this.newMessageContent = '';
        // Le message s'affichera via le WebSocket
      });
  }

  // --- LOGIQUE METIER (IA & SCORE) ---

  // Change l'utilisateur actif (Header Switcher)
  switchUser(user: string): void {
    this.username = user;
    localStorage.setItem('username', user);
  }

  // Calcule le score basé sur le nombre d'arguments "Verts" pour chaque camp
  calculateScore(): void {
    let countA = 0;
    let countB = 0;

    this.messages.forEach(msg => {
      if (this.isWinner(msg.id)) {
        if (msg.username === this.playerA) countA++;
        if (msg.username === this.playerB) countB++;
      }
    });

    this.scoreA = countA;
    this.scoreB = countB;
  }

  // Vérifie si un message est gagnant (Tweety Logic)
  isWinner(msgId: number): boolean {
    return this.winningIds.includes(String(msgId));
  }

  // Demande des suggestions à l'IA
  askForHelp(msgId: number): void {
    this.loadingSuggestionId = msgId;
    this.apiService.getSuggestions(this.debateId, msgId).subscribe({
      next: (resp) => {
        this.suggestionsMap[msgId] = resp.suggestions;
        this.loadingSuggestionId = null;
      },
      error: (err) => {
        console.error(err);
        this.loadingSuggestionId = null;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  scrollToMessage(targetId: number): void {
    const targetMessageElement = this.messageElements.find(
      (el: ElementRef) => el.nativeElement.id === `message-${targetId}`
    );

    if (targetMessageElement) {
      targetMessageElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightedMessageId = targetId;
      setTimeout(() => {
        this.highlightedMessageId = null;
      }, 2000); // Highlight for 2 seconds
    }
  }

  finishDebate(): void {
    // 1. Calcul du gagnant
    if (this.scoreA > this.scoreB) {
      this.winnerName = this.playerA;
      this.winnerMessage = `${this.playerA} wins !`;
    } else if (this.scoreB > this.scoreA) {
      this.winnerName = this.playerB;
      this.winnerMessage = `${this.playerB} wins !`;
    } else {
      this.winnerName = 'Draw';
      this.winnerMessage = "It's a perfect tie!";
    }

    
    this.showWinnerModal = true;
  }

  
  confirmReset(): void {
    this.apiService.resetDebate(this.debateId, this.sessionId).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
  
  
  cancelFinish(): void {
    this.showWinnerModal = false;
  }
}
