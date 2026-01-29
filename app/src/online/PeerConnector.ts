import Peer, { type DataConnection } from 'peerjs';

type Callback = (data: unknown) => void;

class PeerConnector {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private onMessage: Callback | null = null;
  private _id: string | null = null;

  get id() {
    return this._id;
  }

  create() {
    this.peer = new Peer();
    this.peer.on('open', (id) => {
      this._id = id;
    });
    this.peer.on('connection', (connection) => {
      this.conn = connection;
      this.setupConn();
    });
  }

  connect(remoteId: string) {
    if (!this.peer) this.create();
    if (!this.peer) return;
    this.conn = this.peer.connect(remoteId);
    this.setupConn();
  }

  private setupConn() {
    if (!this.conn) return;
    this.conn.on('data', (data) => {
      if (this.onMessage) this.onMessage(data);
    });
  }

  send(data: unknown) {
    if (this.conn && this.conn.open) {
      this.conn.send(data);
    }
  }

  onData(cb: Callback) {
    this.onMessage = cb;
  }
}

export default PeerConnector;
