import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { FirebaseService } from './src/app/firebase.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    FirebaseService
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.