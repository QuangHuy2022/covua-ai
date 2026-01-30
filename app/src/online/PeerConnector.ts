import Peer, { type DataConnection } from 'peerjs';

type DataCallback = (data: unknown) => void;
type ConnectionCallback = () => void;

class PeerConnector {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessage: DataCallback | null = null;
  private onOpenCallbacks = new Set<ConnectionCallback>();
  private _id: string | null = null;
  private createPromise: Promise<string> | null = null;

  get id() {
    return this._id;
  }

  private resetTransport() {
    if (this.conn) {
      try {
        this.conn.close();
      } catch {
      }
      this.conn = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
      }
      this.peer = null;
    }

    this._id = null;
    this.createPromise = null;
  }

  private generateShortId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private createPeerWithId(id: string): Promise<string> {
    this.resetTransport();
    this.peer = new Peer(id);

    return new Promise<string>((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer is not initialized'));
        return;
      }

      this.peer.on('open', (peerId) => {
        this._id = peerId;
        resolve(peerId);
      });

      this.peer.on('connection', (connection) => {
        this.attachConnection(connection);
      });

      this.peer.on('error', (err) => {
        reject(err);
      });
    });
  }

  async create(): Promise<string> {
    if (this.createPromise) return this.createPromise;

    this.createPromise = (async () => {
      const maxAttempts = 10;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const id = this.generateShortId();
        try {
          return await this.createPeerWithId(id);
        } catch (err: unknown) {
          lastError = err;
          const errType = (err as { type?: string } | null)?.type;
          if (errType === 'unavailable-id') continue;
          throw err;
        }
      }

      throw lastError ?? new Error('Unable to create peer');
    })();

    return this.createPromise;
  }

  connect(remoteId: string): Promise<void> {
    const targetId = remoteId.trim();
    if (!targetId) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const run = async () => {
        try {
          if (!this.peer) {
            this.peer = new Peer();

            await new Promise<void>((openResolve, openReject) => {
              if (!this.peer) {
                openReject(new Error('Peer is not initialized'));
                return;
              }

              this.peer.on('open', (id) => {
                this._id = id;
                openResolve();
              });

              this.peer.on('connection', (connection) => {
                this.attachConnection(connection);
              });

              this.peer.on('error', (err) => {
                openReject(err);
              });
            });
          }

          if (!this.peer) {
            reject(new Error('Peer is not initialized'));
            return;
          }

          const connection = this.peer.connect(targetId);
          this.attachConnection(connection);

          if (connection.open) {
            resolve();
            return;
          }

          connection.on('open', () => resolve());
          connection.on('error', (err) => reject(err));
        } catch (err: unknown) {
          reject(err);
        }
      };

      void run();
    });
  }

  private attachConnection(connection: DataConnection) {
    if (this.conn && this.conn !== connection) {
      try {
        this.conn.close();
      } catch {
      }
    }

    this.conn = connection;

    connection.on('open', () => {
      this.onOpenCallbacks.forEach((cb) => cb());
    });

    connection.on('data', (data) => {
      if (this.onMessage) this.onMessage(data);
    });

    connection.on('close', () => {
      if (this.conn === connection) this.conn = null;
    });

    connection.on('error', () => {
      if (this.conn === connection) this.conn = null;
    });

    if (connection.open) {
      this.onOpenCallbacks.forEach((cb) => cb());
    }
  }

  send(data: unknown) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  onData(cb: DataCallback) {
    this.onMessage = cb;
  }

  onConnectionOpen(cb: ConnectionCallback) {
    this.onOpenCallbacks.add(cb);
    if (this.conn?.open) cb();
  }

  destroy() {
    this.onOpenCallbacks.clear();
    this.onMessage = null;
    this.resetTransport();
  }
}

export default PeerConnector;
