import Peer, { type DataConnection } from 'peerjs';

type Callback = (data: unknown) => void;

class PeerConnector {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessage: Callback | null = null;
  private onConnectionOpenCallback: (() => void) | null = null;
  private _id: string | null = null;

  get id() {
    return this._id;
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
  }

  create(): Promise<string> {
    return new Promise((resolve, reject) => {
      const generateId = () => {
        // Generate random 6-digit number
        const id = Math.floor(100000 + Math.random() * 900000).toString();
        return id;
      };

      const tryCreate = (attempts: number) => {
        if (attempts > 5) {
          reject(new Error('Could not generate a unique ID after 5 attempts'));
          return;
        }

        const id = generateId();
        const peer = new Peer(id);

        peer.on('open', (peerId) => {
          this.peer = peer;
          this._id = peerId;
          this.setupPeerListeners();
          resolve(peerId);
        });

        peer.on('error', (err: any) => {
          if (err.type === 'unavailable-id') {
            peer.destroy();
            tryCreate(attempts + 1);
          } else {
            // Other errors
            console.error('PeerJS error:', err);
          }
        });
      };

      tryCreate(0);
    });
  }

  private setupPeerListeners() {
    if (!this.peer) return;
    
    this.peer.on('connection', (connection) => {
      // If we already have a connection, close the new one (1v1 only)
      if (this.conn && this.conn.open) {
          connection.close();
          return;
      }
      this.conn = connection;
      this.setupConn();
    });
  }

  connect(remoteId: string) {
    if (!this.peer) {
        // For joining, we don't care about our ID, just let PeerJS assign one
        this.peer = new Peer();
        this.peer.on('open', () => {
             this.doConnect(remoteId);
        });
        this.peer.on('error', (err) => console.error('Peer join error:', err));
    } else {
        this.doConnect(remoteId);
    }
  }

  private doConnect(remoteId: string) {
      if (!this.peer) return;
      if (this.conn) {
          this.conn.close();
      }
      this.conn = this.peer.connect(remoteId);
      this.setupConn();
  }

  private setupConn() {
    if (!this.conn) return;
    
    this.conn.on('open', () => {
        console.log('Connection opened');
        if (this.onConnectionOpenCallback) this.onConnectionOpenCallback();
    });

    this.conn.on('data', (data) => {
      if (this.onMessage) this.onMessage(data);
    });
    
    this.conn.on('close', () => {
        console.log('Connection closed');
        this.conn = null;
    });

    this.conn.on('error', (err) => {
        console.error('Connection error:', err);
    });
  }

  send(data: unknown) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    } else {
        console.warn('Cannot send data, connection not open');
    }
  }

  onData(cb: Callback) {
    this.onMessage = cb;
  }

  onConnectionOpen(cb: () => void) {
      this.onConnectionOpenCallback = cb;
  }
}

export default PeerConnector;
