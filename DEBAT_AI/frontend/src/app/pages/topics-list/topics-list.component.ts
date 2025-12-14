import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Debate } from '../../models';

@Component({
  selector: 'app-topics-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topics-list.component.html',
  styleUrls: ['./topics-list.component.css']
})
export class TopicsListComponent implements OnInit {
  debates: Debate[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  
  selectedDebate: Debate | null = null;
  debaterA: string = 'Alice';
  debaterB: string = 'Bob';

  constructor(private apiService: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.apiService.getDebates().subscribe(data => {
      const counts = this.getDebateCounts();
      this.debates = data.map(debate => ({
        ...debate,
        selectionCount: counts[debate.id] || 0
      }));
    });
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  openSetup(debate: Debate): void {
    this.selectedDebate = debate;
    this.incrementDebateCount(debate.id);
  }

  closeSetup(): void {
    this.selectedDebate = null;
  }

  startDebate(): void {
    if (!this.selectedDebate || !this.debaterA.trim() || !this.debaterB.trim()) {
      return;
    }

    localStorage.setItem('debaterA', this.debaterA);
    localStorage.setItem('debaterB', this.debaterB);
    localStorage.setItem('username', this.debaterA);
    localStorage.setItem('debateTopic', this.selectedDebate.topic);

    const participants = [this.debaterA, this.debaterB].sort().join('_');
    const sessionId = `${this.selectedDebate.id}_${participants}`;
    
    localStorage.setItem('currentSessionId', sessionId);

    this.router.navigate(['/debates', this.selectedDebate.id]);
  }

  private getDebateCounts(): { [key: number]: number } {
    const counts = localStorage.getItem('debateCounts');
    return counts ? JSON.parse(counts) : {};
  }

  private incrementDebateCount(debateId: number): void {
    const counts = this.getDebateCounts();
    counts[debateId] = (counts[debateId] || 0) + 1;
    localStorage.setItem('debateCounts', JSON.stringify(counts));
    // Update the count in the component's data as well
    const debate = this.debates.find(d => d.id === debateId);
    if (debate) {
      debate.selectionCount = counts[debateId];
    }
  }
}