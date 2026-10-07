import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { Motion } from '@capacitor/motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  dice = signal(1);
  canRoll = signal(true);
  diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  acceleration = signal({ x: 0, y: 0 });
  accelGravity = signal({ x: 0, y: 0 });

  pullValueX = 0;
  pullValueY = 0;
  diceOffsetX = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.shake();
    this.startMotion();
  }

  async shake() {
    await Motion.addListener('accel', (event) => {
      // Safe check for acceleration property, although TS might complain without it
      if (event.acceleration && event.acceleration.x !== undefined && event.acceleration.y !== undefined) {
        const x = event.acceleration.x;
        const y = event.acceleration.y;
        const average = (Math.abs(x) + Math.abs(y)) / 2;
        
        if (average > 5 && this.canRoll()) {
          this.canRoll.set(false);
          this.doRandomRoll();
          
          setTimeout(() => {
            this.canRoll.set(true);
          }, 1000);
        }
      }
    });
  }

  doRandomRoll() {
    this.dice.set(Math.floor(Math.random() * 6) + 1);
    this.impact();
  }

  onDiceClick() {
    if (!this.canRoll()) return;
    this.canRoll.set(false);
    
    let rolls = 0;
    const interval = setInterval(() => {
      // Randomize the face
      this.dice.set(Math.floor(Math.random() * 6) + 1);
      
      // Randomize the physical position only in X axis without moving the sliders
      this.diceOffsetX = Math.floor(Math.random() * 21) - 10; // -10 to 10
      this.cdr.detectChanges();

      rolls++;
      if (rolls >= 12) {
        clearInterval(interval);
        
        // Reset back to center
        this.diceOffsetX = 0;
        
        this.impact();
        this.canRoll.set(true);
        this.cdr.detectChanges();
      }
    }, 60);
  }

  onPullX(event: any) {
    this.pullValueX = event.detail.value;
    this.updateDiceFromPull();
  }
  
  onReleaseX() {
    setTimeout(() => { 
      this.pullValueX = 0; 
      this.doRandomRoll();
      this.cdr.detectChanges(); 
    }, 10);
  }

  onPullY(event: any) {
    this.pullValueY = event.detail.value;
    this.updateDiceFromPull();
  }

  onReleaseY() {
    setTimeout(() => { 
      this.pullValueY = 0; 
      this.doRandomRoll();
      this.cdr.detectChanges(); 
    }, 10);
  }

  updateDiceFromPull() {
    // Map the pull values to a dice face (1-6) while pulling
    const sum = Math.abs(this.pullValueX) + Math.abs(this.pullValueY);
    // Maps 0-20 sum to 1-6
    const face = Math.min(6, Math.max(1, Math.floor((sum / 20) * 5) + 1));
    this.dice.set(face);
  }

  async startMotion() {
    await Motion.addListener('accel', (event) => {
      if (event.acceleration) {
        this.acceleration.set({
          x: event.acceleration.x || 0,
          y: event.acceleration.y || 0
        });
      }
      if (event.accelerationIncludingGravity) {
        this.accelGravity.set({
          x: event.accelerationIncludingGravity.x || 0,
          y: event.accelerationIncludingGravity.y || 0
        });
      }
    });
  }

  async impact() {
    await Haptics.impact({
      style: ImpactStyle.Heavy
    });
  }
}
