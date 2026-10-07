import { Component, signal, OnInit } from '@angular/core';
import { Motion } from '@capacitor/motion';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  dice = signal(1);
  canRoll = signal(true);

  acceleration = signal({ x: 0, y: 0, z: 0 });

  alpha = signal(0);
  beta = signal(0);
  gamma = signal(0);

  constructor() {}

  ngOnInit() {
    this.shake();
    this.startMotion();
    this.startOrientation();
  }

  async shake() {
    await Motion.addListener('accel', (event) => {
      // Safe check for acceleration property, although TS might complain without it
      if (event.acceleration && event.acceleration.x !== undefined) {
        const acceleration = event.acceleration.x;
        
        if (Math.abs(acceleration) > 5 && this.canRoll()) {
          this.roll();
          this.canRoll.set(false);
          
          setTimeout(() => {
            this.canRoll.set(true);
          }, 1000);
        }
      }
    });
  }

  roll() {
    const result = Math.floor(Math.random() * 6) + 1;
    this.dice.set(result);
    // Haptic impact for physical feedback on roll
    this.impact();
  }

  async startMotion() {
    await Motion.addListener('accel', (event) => {
      if (event.accelerationIncludingGravity) {
        this.acceleration.set({
          x: event.accelerationIncludingGravity.x || 0,
          y: event.accelerationIncludingGravity.y || 0,
          z: event.accelerationIncludingGravity.z || 0
        });
      }
    });
  }

  async startOrientation() {
    await Motion.addListener('orientation', (event) => {
      this.alpha.set(event.alpha || 0);
      this.beta.set(event.beta || 0);
      this.gamma.set(event.gamma || 0);
    });
  }

  async impact() {
    await Haptics.impact({
      style: ImpactStyle.Heavy
    });
  }

  async success() {
    await Haptics.notification({
      type: NotificationType.Success
    });
  }

  async warning() {
    await Haptics.notification({
      type: NotificationType.Warning
    });
  }

  async error() {
    await Haptics.notification({
      type: NotificationType.Error
    });
  }

  async vibrate(x: number) {
    const news = x * 1000;
    await Haptics.vibrate({
      duration: news
    });
  }
}
