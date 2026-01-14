import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZoneChangeDetection } from '@angular/core';
import { FirebaseService } from './src/app/firebase.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    FirebaseService
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
