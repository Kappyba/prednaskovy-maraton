import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {take} from 'rxjs/operators';
import {AppUser} from '../model/appUser';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/compat/firestore';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import User = firebase.User;
import auth = firebase.auth;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public authState: any = null;
  public userData: BehaviorSubject<AppUser | null> = new BehaviorSubject<AppUser | null>(null);
  public userDataRef: AngularFirestoreDocument<any> | null = null;
  public lastUsedName: string | null = null;

  constructor(private router: Router,
              public afAuth: AngularFireAuth,
              private afs: AngularFirestore
  ) {

    this.afAuth.authState.subscribe((data: User | null) => {
      this.authState = data;
      if (!this.authState) {
        return;
      }
      this.userDataRef = this.afs.collection<any>('users').doc(this.authState.uid);
      this.userDataRef.valueChanges().pipe(take(1)).subscribe((userRefData: any) => {
        if (userRefData) {
          userRefData.id = this.authState.uid;
          this.userData.next(new AppUser(userRefData, this.userDataRef as any));
        } else {
          const newUserData: any = {
            email: this.authState.email,
            name: this.authState.displayName
          };
          this.userDataRef?.set(newUserData)
            .then((setEvent) => {
              console.log('new user created', userRefData, setEvent);
            });
          newUserData.id = this.authState.uid;
          this.userData.next(new AppUser(newUserData, this.userDataRef as any));
        }
      });
    });
  }

  // login() {
  //   this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  // }
  //
  // logout() {
  //   this.afAuth.auth.signOut();
  // }


  // Returns true if user is logged in
  get authenticated(): boolean {
    return this.authState !== null;
  }

  // Returns current user data
  get currentUser(): any {
    return this.authenticated ? this.authState : null;
  }

  // Returns
  get currentUserObservable(): any {
    return this.afAuth.authState;
  }

  // Returns current user UID
  get currentUserId(): string {
    return this.authenticated ? this.authState.uid : '';
  }

  // Anonymous AppUser
  get currentUserAnonymous(): boolean {
    return this.authenticated ? this.authState.isAnonymous : false;
  }

  // Returns current user display name or Guest
  get currentUserDisplayName(): string {
    if (!this.authState) {
      return 'Guest';
    } else if (this.currentUserAnonymous) {
      return 'Anonymous';
    } else {
      return this.authState['displayName'] || this.authState['email'];
    }
  }

  googleLogin() {
    const provider = new auth.GoogleAuthProvider();
    return this.socialSignIn(provider);
  }

  public emailSignUp(email: string, password: string, name: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((user: auth.UserCredential) => {
        this.authState = user;
        // user.updateProfile({
        //   displayName: name,
        // }).catch(
        //   (error) => {
        //     console.log(error);
        //   });
        this.updateUserData();
      })
      .catch(error => console.log(error));
  }

  //// Email/Password Auth ////

  emailLogin(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then((user) => {
        this.authState = user;
        this.updateUserData();
      })
      .catch(error => console.log(error));
  }

  // // Sends email allowing user to reset password
  resetPassword(email: string) {
    return auth().sendPasswordResetEmail(email)
      .then(() => console.log('email sent'))
      .catch((error) => console.log(error));
  }

  signOut(): void {
    this.afAuth.signOut().then((data) => {
      console.log('sign out', data);
      this.router.navigate(['/']);
      this.userData.next(null);
    });
  }


  //// Sign Out ////

  private socialSignIn(provider: any) {
    return this.afAuth.signInWithPopup(provider)
      .then((credential) => {
        this.authState = credential.user;
        this.updateUserData();
      })
      .catch(error => console.log(error));
  }

  //// Helpers ////

  private updateUserData(): void {
    // Writes user name and email to realtime db
    // useful if your app displays information about users or for admin features
    //
    const path = `users/${this.currentUserId}`; // Endpoint on firebase
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(path);

    const data = {
      email: this.authState.email,
      name: this.authState.displayName
    };

    userRef.update(data)
      .catch(error => console.log(error));

  }
}
