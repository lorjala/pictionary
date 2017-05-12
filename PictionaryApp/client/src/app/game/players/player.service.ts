import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

import { Player } from './../../shared/player';

@Injectable()
export class PlayerService {
  private url: string = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
  private socket: any;

  constructor(private http: Http) {
    this.socket = io(this.url);
  }
  getPlayers() {
    return new Observable((observer) => {
      this.socket.on('player', (data: any) => {
        observer.next(data);
      });

      this.socket.emit('get-players', {

      });
    });
  }
}