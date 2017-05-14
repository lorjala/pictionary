import { Component, HostListener } from '@angular/core';

import { GameService } from './../game/game.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private gameService: GameService) {}

  login() {
    this.gameService.logIn(this.username);
  }

  @HostListener('window:beforeunload')
  removePlayer() {
    this.gameService.leave(this.gameService.player);
  }
}
