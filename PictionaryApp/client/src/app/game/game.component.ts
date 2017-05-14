import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { TimerObservable } from 'rxjs/Observable/TimerObservable';

import { GameService } from './game.service';

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

  connection: any;
  drawerConnection: any;
  messagesConnection: any;
  strokesConnection: any;
  timerConnection: any;

  players: Player[] = [];
  colors: string[] = [];

  drawingPlayer: string;
  drawable: string = '';
  activeColor: string;

  @ViewChild('gameCanvas')
  gameCanvas: ElementRef;

  @ViewChild('messages')
  messages: ElementRef;

  guessValue: string = '';

  context: CanvasRenderingContext2D;

  timer: any;

  // Drawing state:
  drawing: boolean = false;
  clickX: any[] = [];
  clickY: any[] = [];
  clickColor: any[] = [];
  clickDrag: any[] = [];

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.colors = COLORS;
    this.activeColor = this.colors[0];

    this.timer = TimerObservable.create(0, 2000);

    this.connection = this.gameService.getPlayers().subscribe((data: any) => {
      console.log(data);

      const player: Player = this.players.find(p => p.username === data.data);

      if (player && data.leave) {
        const index = this.players.indexOf(player);
        console.log(index);
        console.log(this.players);
        if (index > -1) {
          this.players.splice(index, 1);
        }
        console.log(this.players);
      } else if (player === undefined && data.join) {
        this.players.push(new Player(data.data));
      }
    });

    this.drawerConnection = this.gameService.getDrawingPlayer().subscribe((data: any) => {
      this.drawable = '';
      this.drawingPlayer = data;

      console.log('drawing player: ' + this.drawingPlayer);
      if (this.messages && this.drawingPlayer) this.messages.nativeElement.value += this.drawingPlayer + ' is drawing.\n';

      if (this.drawingPlayer === this.player.username) {
        this.clearCanvas();
        this.timerConnection = this.timer.subscribe((t: any) => {
          const strokes = {
            clickX: this.clickX,
            clickY: this.clickY,
            clickColor: this.clickColor,
            clickDrag: this.clickDrag
          };

          this.gameService.sendStrokes(strokes);
        });
        this.gameService.getDrawable()
        .then((drawable: string) => {
          this.drawable = drawable;
          console.log(this.drawable);
        });
      } else {
        if (this.timerConnection) this.timerConnection.unsubscribe();
      }
    });

    this.messagesConnection = this.gameService.getMessages().subscribe((data: any) => {
      console.log('message!');
      if (this.messages) {
        this.messages.nativeElement.value += data + '\n';
      }
    });

    this.strokesConnection = this.gameService.getStrokes().subscribe((data: any) => {
      if (this.drawingPlayer !== this.player.username) {
        this.clickX = data.clickX;
        this.clickY = data.clickY;
        this.clickColor = data.clickColor;
        this.clickDrag = data.clickDrag;
      }
    });
  }

  ngOnDestroy() {
    this.connection.unsubscribe();
    this.drawerConnection.unsubscribe();
    this.messagesConnection.unsubscribe();
    if (this.timerConnection) this.timerConnection.unsubscribe();

    this.gameService.disconnect();
  }

  ngAfterViewInit() {
    if (this.gameCanvas === undefined) return;
    this.gameCanvas.nativeElement.width = this.gameCanvas.nativeElement.offsetWidth;
    this.gameCanvas.nativeElement.height = this.gameCanvas.nativeElement.offsetHeight;
    this.context = this.gameCanvas.nativeElement.getContext('2d');

    this.updateCanvas();
  }

  @HostListener('window:beforeunload')
  removePlayer() {
    this.connection.unsubscribe();
    this.gameService.leave(this.player);
  }

  drawableIsVowel() {
    if (this.drawable) {
      const firstChar = this.drawable.charAt(0);
      return ['a', 'e', 'i', 'o', 'u'].indexOf(firstChar.toLowerCase()) !== -1;
    }

    return false;
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

    if (this.drawingPlayer === this.player.username) {
      this.drawing = true;

      const mouseX = event.layerX;
      const mouseY = event.layerY;

      this.addClick(mouseX, mouseY, false);
    }
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

  guess() {
    this.gameService.guess(this.player, this.guessValue);
  }
}