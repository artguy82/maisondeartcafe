import { Injectable, signal } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { getFirestore, Firestore, collection, getDocs, doc, getDoc, runTransaction, increment, QueryDocumentSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp | undefined;
  private firestore: Firestore | undefined;
  private auth: Auth | undefined;
  
  private readonly LIKES_COLLECTION = 'likes';
  private readonly USER_LIKES_COLLECTION = 'user_likes';
  
  isAvailable = signal(false);
  private currentUser = signal<User | null>(null);
  private authInitialized = new Promise<void>(resolve => {
    this.resolveAuthInitialized = resolve;
  });
  private resolveAuthInitialized!: () => void;


  constructor() {
    if (firebaseConfig.apiKey.startsWith('YOUR_')) {
      console.error('🚨 Firebase is not configured! Please update `src/firebase-config.ts`.');
      return;
    }

    try {
      this.app = initializeApp(firebaseConfig);
      this.firestore = getFirestore(this.app);
      this.auth = getAuth(this.app);
      this.isAvailable.set(true);
      this.initializeAuthentication();
    } catch (error) {
      this.isAvailable.set(false);
      this.handleInitializationError(error);
    }
  }

  private initializeAuthentication(): void {
    if (!this.auth) return;

    onAuthStateChanged(this.auth, user => {
      if (user) {
        this.currentUser.set(user);
        this.resolveAuthInitialized();
      } else {
        signInAnonymously(this.auth!).catch(error => {
          console.error('Anonymous sign-in failed', error);
          this.handleFirestoreError(error, 'auth');
        });
      }
    });
  }

  isUserAuthenticated(): boolean {
    return !!this.currentUser();
  }

  async getLikes(): Promise<Record<string, number>> {
    if (!this.isAvailable() || !this.firestore) return {};
    const likes: Record<string, number> = {};
    try {
      const querySnapshot = await getDocs(collection(this.firestore, this.LIKES_COLLECTION));
      querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
        likes[doc.id] = doc.data()['count'] || 0;
      });
    } catch (error) {
      this.handleFirestoreError(error, 'read');
    }
    return likes;
  }

  async getLikedProgramsForCurrentUser(): Promise<Set<string>> {
    await this.authInitialized;
    const user = this.currentUser();
    if (!this.isAvailable() || !this.firestore || !user) {
      return new Set();
    }

    try {
      const userLikesDocRef = doc(this.firestore, this.USER_LIKES_COLLECTION, user.uid);
      const docSnap = await getDoc(userLikesDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return new Set(Object.keys(data?.['programs'] || {}));
      }
    } catch (error) {
       this.handleFirestoreError(error, 'read');
    }
    return new Set();
  }

  async toggleLike(programId: string): Promise<'liked' | 'unliked' | 'error'> {
    await this.authInitialized;
    const user = this.currentUser();
    if (!this.isAvailable() || !this.firestore || !user) {
      console.error('Firebase not available or user not authenticated.');
      return 'error';
    }

    if (!programId || typeof programId !== 'string') {
      console.error('toggleLike called with invalid programId:', programId);
      return 'error';
    }

    const programLikesRef = doc(this.firestore, this.LIKES_COLLECTION, programId);
    const userLikesDocRef = doc(this.firestore, this.USER_LIKES_COLLECTION, user.uid);

    try {
      return await runTransaction(this.firestore, async (transaction) => {
        const userLikesDoc = await transaction.get(userLikesDocRef);
        const likedPrograms = userLikesDoc.data()?.['programs'] || {};
        const isCurrentlyLiked = !!likedPrograms[programId];

        if (isCurrentlyLiked) {
          transaction.set(programLikesRef, { count: increment(-1) }, { merge: true });
          delete likedPrograms[programId];
          transaction.set(userLikesDocRef, { programs: likedPrograms });
          return 'unliked';
        } else {
          transaction.set(programLikesRef, { count: increment(1) }, { merge: true });
          likedPrograms[programId] = true;
          transaction.set(userLikesDocRef, { programs: likedPrograms });
          return 'liked';
        }
      });
    } catch (error) {
      this.handleFirestoreError(error, 'write');
      return 'error';
    }
  }

  private handleInitializationError(error: unknown): void {
     const styles = ['color: white', 'background: #D32F2F', 'font-size: 16px', 'padding: 8px 12px', 'border-radius: 4px', 'font-weight: bold'].join(';');
     console.error('%c🔥 FIREBASE INITIALIZATION FAILED 🔥', styles);
     console.error('The "Like" feature has been disabled because the app could not connect to Firebase.');
     console.error('This could be due to an incorrect configuration in `src/firebase-config.ts` or network issues.');
     console.error('➡️ REQUIRED ACTION: Verify your `firebaseConfig` object and check the browser console for more details.');
     console.error('Full Error Details:', error);
  }

  private handleFirestoreError(error: unknown, operation: 'read' | 'write' | 'auth') {
    if (!this.isAvailable()) {
      return;
    }
    this.isAvailable.set(false);
    console.error(`Error during Firebase '${operation}' operation. The "Like" feature has been disabled.`);
    
    const styles = ['color: white', 'background: #D32F2F', 'font-size: 16px', 'padding: 8px 12px', 'border-radius: 4px', 'font-weight: bold'].join(';');
    console.error('%c🔥 FIREBASE ERROR 🔥', styles, error);

    if (error instanceof Error && 'code' in (error as any)) {
      const code = (error as any).code || 'unknown';
      if (code === 'permission-denied') {
        console.error('ERROR TYPE: Permission Denied. Your Firestore Security Rules are blocking the request.');
        console.error('➡️ REQUIRED ACTION: Update your Firestore Security Rules to allow access.');
        console.error('Go to Firebase Console > Firestore Database > Rules and use the following rules:');
        console.log(
`rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /likes/{programId} {
      allow read;
      allow write: if request.auth != null;
    }
    match /user_likes/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`
        );
      } else {
         console.error(`An unhandled Firebase error with code '${code}' occurred.`, error);
      }
    }
  }
}
