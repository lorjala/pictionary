import { Injectable } from '@angular/core';

import { Player } from './../shared/player';

@Injectable()
export class AuthService {
  loggedIn: boolean = false;
  player: Player;


  logIn(username: string, password: string) {
    this.player = new Player(username);
    this.loggedIn = true;
  }

  logOut() {
    this.loggedIn = false;
  }
}