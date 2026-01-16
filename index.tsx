
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { FirebaseService } from './src/app/firebase.service';

bootstrapApplication(AppComponent, {
  providers: [
    FirebaseService
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.