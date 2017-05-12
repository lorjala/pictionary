import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { AuthService } from './../auth/auth.service';
import { PlayerService } from './players/player.service';

import { Player } from './../shared/player';

const COLORS = [
  'black',
  'red',
  'green',
  'blue',
  'yellow',
  'cyan',
  'magenta',
  'white',
  'saddlebrown'
];

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, AfterViewInit {

  @Input() player: Player;

  players: Player[] = [];
  colors: string[] = [];

  drawingPlayer: Player;
  activeColor: string;

  @ViewChild('gameCanvas')
  gameCanvas: ElementRef;

  context: CanvasRenderingContext2D;

  // Drawing state:
  drawing: boolean = false;
  clickX: any[] = [];
  clickY: any[] = [];
  clickColor: any[] = [];
  clickDrag: any[] = [];

  constructor(private authService: AuthService, private playerService: PlayerService) {}

  ngOnInit() {
    this.colors = COLORS;
    this.activeColor = this.colors[0];

    this.playerService.getPlayers().subscribe((data: any) => {
      const player: Player = this.players.find(p => p.username === data.username);

      if (player) {
        // update
      } else {
        this.players.push(new Player(data.username));
      }
    });
  }

  ngAfterViewInit() {
    this.gameCanvas.nativeElement.width = this.gameCanvas.nativeElement.offsetWidth;
    this.gameCanvas.nativeElement.height = this.gameCanvas.nativeElement.offsetHeight;
    this.context = this.gameCanvas.nativeElement.getContext('2d');

    this.updateCanvas();
  }

  private updateCanvas() {
    requestAnimationFrame(() => {
      this.updateCanvas();
    });


    const ctx = this.context;
    ctx.clearRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);
    
    this.drawStrokes();
  }

  private drawStrokes() {
    const ctx = this.context;

    ctx.beginPath();

    for (let i = 0; i < this.clickX.length; i++) {

      ctx.beginPath();

      if (this.clickDrag[i] && i) {
        ctx.moveTo(this.clickX[i - 1], this.clickY[i - 1]);
      } else {
        ctx.moveTo(this.clickX[i] - 1, this.clickY[i]);
      }
    
      ctx.lineTo(this.clickX[i], this.clickY[i]);

      ctx.strokeStyle = this.clickColor[i];

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 10;
      ctx.stroke();
    }

    ctx.closePath();
  }

  private addClick(x: number, y: number, dragging: boolean) {
    this.clickX.push(x);
    this.clickY.push(y);
    this.clickColor.push(this.activeColor);
    this.clickDrag.push(dragging);
  }

  mouseEnterDrawingArea(event: any) {
  }

  mouseLeaveDrawingArea(event: any) {
    this.drawing = false;
  }

  mouseMove(event: any) {
    if (this.drawing) {
      const mouseX = event.layerX;
      const mouseY = event.layerY;

      this.addClick(mouseX, mouseY, true);
    }
  }

  mouseDown(event: any) {
    event.preventDefault();

    this.drawing = true;

    const mouseX = event.layerX;
    const mouseY = event.layerY;

    this.addClick(mouseX, mouseY, false);
  }

  mouseUp(event: any) {
    this.drawing = false;
  }

  changeColor(color: string) {
    console.log(color);
    this.activeColor = color;
  }

  clearCanvas() {
    this.clickX = [];
    this.clickY = [];
    this.clickColor = [];
    this.clickDrag = [];
  }
}