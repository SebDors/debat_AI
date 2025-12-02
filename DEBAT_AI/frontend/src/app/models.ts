export interface Debate {
    id: number;
    topic: string;
}

export interface Message {
    id: number;
    content: string;
    user_id: number;
    debate_id: number;
    username: string;
}
