import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

import { Player } from './../shared/player';

@Injectable()
export class GameService {
  private url: string = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
  private socket: any;

  loggedIn: boolean = false;
  duplicate: boolean = false;
  player: Player;

  constructor(private http: Http) {
    this.socket = io(this.url);

    this.socket.on('alive', (data: any) => {
      if (this.player && data === this.player.username) {
        this.socket.emit('alive', data);
      }
    })
  }

  disconnect() {
    console.log('close');
    this.socket.disconnect();
  }

  logIn(username: string) {
    console.log('asd');
    this.duplicate = false;

    this.socket.on('player-join', (data: any) => {
      if (data === username) {
        this.player = new Player(data);
        this.loggedIn = true;
      }
    });

    this.socket.on('player-exists', () => {
      console.log('duplicate player!');
      this.duplicate = true;
    });

    this.socket.emit('player-join', username);
  }

  logOut() {
    this.loggedIn = false;
  }

  getDrawingPlayer() {
    return new Observable((observer) => {
      this.socket.on('drawing-player', (data: any) => {
        console.log('drawing player!');

        observer.next(data);
      });
    });
  }

  getPlayers() {
    return new Observable((observer) => {
      this.socket.on('player-join', (data: any) => {
        console.log('player join!');

        const joinObj = {
          join: true,
          data
        };

        observer.next(joinObj);
      });

      this.socket.on('player-leave', (data: any) => {
        const leaveObj = {
          leave: true,
          data
        };

        observer.next(leaveObj);
      });

      this.socket.emit('get-players', {});
    });
  }

  leave(player: Player) {
    console.log('leave');
    this.socket.emit('player-leave', player.username);
  }

  getDrawable(): Promise<string> {
    return this.http.get('/drawable')
    .toPromise()
    .then(data => data.json().drawable as string);
  }

  guess(player: Player, value: string) {
    console.log('Guessed: ' + value);

    this.socket.emit('guess', {
      player: player.username,
      value
    });
  }

  getMessages() {
    return new Observable((observer) => {
      this.socket.on('guess-message', (data: any) => {
        observer.next(data as string);
      })
    });
  }

  sendStrokes(strokes: object) {
    this.socket.emit('strokes', strokes);
  }

  getStrokes() {
    return new Observable((observer) => {
      this.socket.on('strokes', (data: any) => {
        observer.next(data);
      });
    });
  }
}