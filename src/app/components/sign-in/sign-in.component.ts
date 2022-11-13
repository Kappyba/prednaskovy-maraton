import {Component, OnDestroy, OnInit} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit, OnDestroy {
  public signInForm!: FormGroup;
  public subscription!: any;
  public isUnknownError = false;
  public isInvalidCredentials = false;
  public formErrors = {
    'email': '',
    'password': ''
  };
  public validationMessages = {
    'email': {
      'required': 'E-mail je povinný údaj',
      'email': 'E-mailová adresa má neplatný formát'
    },
    'password': {
      'required': 'Heslo je povinný údaj',
      'pattern': 'Heslo musí mít alespoň jedno písmeno a alespoň jednu číslici',
      // 'minlength': 'Password must be at least 4 characters long.',
      // by trial it is 6, not 4
      'minlength': 'Heslo musí být minimálně 6 znaků dlouhé.',
      // 'maxlength': 'Password cannot be more than 40 characters long.',
      // by trial it is 25, not 40
      'maxlength': 'Heslo nesmí být delší než 25 znaků',
    }
  };
  constructor(private fb: FormBuilder,
              private router: Router,
              private authService: AuthService,
              ) {
  }

  public ngOnInit() {
    this.buildForm();
  }

  public login(): void {
    this.isInvalidCredentials = false;
    this.authService.emailLogin(this.signInForm.value['email'], this.signInForm.value['password']).then(success => {
      if (this.authService.authState) {
        this.router.navigate(['/profile']);
      } else {
        this.isInvalidCredentials = true;
      }
    });
  }


  public buildForm(): void {
    this.signInForm = this.fb.group({
      'email': ['', [
        Validators.required,
        Validators.email
      ]
      ],
      'password': ['', [
        Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
        Validators.minLength(6),
        Validators.maxLength(25)
      ]
      ],
    });

    this.subscription = this.signInForm.valueChanges.subscribe(data => this.onValueChanged(data));
    this.onValueChanged(); // reset validation messages
  }

  public onValueChanged(data?: any) {
    if (!this.signInForm) {
      return;
    }
    const form = this.signInForm;
    for (const field in this.formErrors) {
      if (Object.prototype.hasOwnProperty.call(this.formErrors, field)) {
        // clear previous error message (if any)
        // @ts-ignore
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          // @ts-ignore
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (Object.prototype.hasOwnProperty.call(control.errors, key)) {
              // @ts-ignore
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public signInWithGoogle(): void {
    this.authService.googleLogin()
      .then(() => this.afterSignIn());
  }

  private afterSignIn(): void {
    // Do after login stuff here, such router redirects, toast messages, etc.
    if (this.authService.authState) {
      this.router.navigate(['/']);
    } else {
      this.isUnknownError = true;
    }
  }
}
