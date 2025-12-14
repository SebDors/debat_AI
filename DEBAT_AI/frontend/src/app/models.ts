export interface Debate {
    id: number;
    topic: string;
    selectionCount?: number;
}

export interface Message {
    id: number;
    content: string;
    user_id: number;
    debate_id: number;
    username: string;

    // --- NOUVEAUX CHAMPS IA ---
  arg_type?: 'claim' | 'premise';
  relation_type?: 'attack' | 'support' | 'none';
  target_id?: number | null;
  feedback?: string | null; // Critique de l'IA
  
  // Liste des gagnants (envoyée par le backend lors d'une mise à jour)
  current_winners?: any[]; 
}

export interface SuggestionResponse {
  suggestions: string[];

}
