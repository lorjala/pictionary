import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { GameComponent } from './game/game.component';

import { AuthService } from './auth/auth.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GameComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
