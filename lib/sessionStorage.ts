// lib/sessionStorage.ts

export interface Session {
  id: string;
  // add more properties if you use them
  [key: string]: any;
}

export interface SessionStorage {
  store(session: Session): Promise<void>;
  load(id: string): Promise<Session | undefined>;
  delete(id: string): Promise<void>;
}

export class InMemorySessionStorage implements SessionStorage {
  private sessions: Record<string, Session> = {};

  async store(session: Session): Promise<void> {
    this.sessions[session.id] = session;
  }

  async load(id: string): Promise<Session | undefined> {
    return this.sessions[id];
  }

  async delete(id: string): Promise<void> {
    delete this.sessions[id];
  }
}
