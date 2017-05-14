import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

import { Player } from './../shared/player';

@Injectable()
export class AuthService {
  private url: string = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
  private socket: any;

  loggedIn: boolean = false;
  player: Player;

  constructor() {
    this.socket = io(this.url);
  }

  logIn(username: string) {
    this.player = new Player(username);

    this.socket.on('player-join', (data: any) => {
      this.player = new Player(data);
      this.loggedIn = true;
    });

    this.socket.emit('player-join', username);
  }

  logOut() {
    this.loggedIn = false;
  }
}