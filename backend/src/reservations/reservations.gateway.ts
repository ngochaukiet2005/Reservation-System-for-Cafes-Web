import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  namespace: '/reservations',
  cors: { origin: '*', credentials: false },
})
export class ReservationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth as any)?.token || this.extractBearer(client.handshake.headers?.authorization);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const secret = this.configService.get<string>('JWT_SECRET') || 'supersecretkey';
      await this.jwtService.verifyAsync(token, { secret });
    } catch (err) {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
    // No-op
  }

  emitReservation(event: 'reservation.created' | 'reservation.updated' | 'reservation.cancelled', payload: any) {
    this.server.emit(event, payload);
  }

  emitTable(event: 'table.updated', payload: any) {
    this.server.emit(event, payload);
  }

  private extractBearer(raw?: string) {
    if (!raw) return null;
    if (raw.startsWith('Bearer ')) return raw.replace('Bearer ', '').trim();
    return raw;
  }
}
