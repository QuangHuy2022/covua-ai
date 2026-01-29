import Peer, { type DataConnection } from 'peerjs';

type DataCallback = (data: unknown) => void;
type ConnectionCallback = () => void;

class PeerConnector {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessage: DataCallback | null = null;
  private onOpenCallback: ConnectionCallback | null = null;
  private _id: string | null = null;

  get id() {
    return this._id;
  }

  create(): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // Destroy existing peer if any
            if (this.peer) {
                this.peer.destroy();
            }

            this.peer = new Peer();
            
            this.peer.on('open', (id) => {
                this._id = id;
                resolve(id);
            });
            
            this.peer.on('connection', (connection) => {
                this.handleConnection(connection);
            });
            
            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                // Only reject if we haven't resolved yet (not perfect but helpful)
                if (!this._id) reject(err);
            });
        } catch (err: unknown) {
            reject(err);
        }
    });
  }

  connect(remoteId: string): Promise<void> {
      return new Promise((resolve, reject) => {
          if (!this.peer) {
             this.peer = new Peer();
             this.peer.on('open', () => {
                 this._connect(remoteId, resolve, reject);
             });
             this.peer.on('error', (err) => {
                 console.error('Peer error during connect:', err);
                 reject(err);
             });
          } else {
              this._connect(remoteId, resolve, reject);
          }
      });
  }

  private _connect(remoteId: string, resolve: () => void, reject: (err: any) => void) {
      if (!this.peer) return;
      try {
        const conn = this.peer.connect(remoteId);
        this.handleConnection(conn);
        
        // Wait for connection to open
        conn.on('open', () => {
            resolve();
        });
        
        conn.on('error', (err) => reject(err));
      } catch (err: unknown) {
          reject(err);
      }
  }

  private handleConnection(connection: DataConnection) {
    this.conn = connection;
    
    this.conn.on('open', () => {
        if (this.onOpenCallback) this.onOpenCallback();
    });
    
    this.conn.on('data', (data) => {
      if (this.onMessage) this.onMessage(data);
    });
    
    this.conn.on('close', () => {
        console.log('Connection closed');
    });
    
    this.conn.on('error', (err) => {
        console.error('Connection error:', err);
    });
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
      this.onOpenCallback = cb;
      // If already connected, trigger immediately
      if (this.conn && this.conn.open) {
          cb();
      }
  }

  destroy() {
      if (this.conn) {
          this.conn.close();
          this.conn = null;
      }
      if (this.peer) {
          this.peer.destroy();
          this.peer = null;
      }
      this._id = null;
      this.onMessage = null;
      this.onOpenCallback = null;
  }
}

export default PeerConnector;
