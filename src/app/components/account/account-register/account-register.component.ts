import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { ErrorService } from 'src/app/services/error.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ConfirmedValidator } from 'src/app/validators/confirmed.validator';

@Component({
  selector: 'app-register',
  templateUrl: './account-register.component.html',
  styleUrls: ['./account-register.component.css', '../account-layout/account-layout.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  showErrorMessages: boolean = true;
  rememberMe: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastrService: ToastrService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private errorService:ErrorService
  ) { }

  ngOnInit(): void {
    this.createRegisterForm();
  }

  createRegisterForm() {
    this.registerForm = this.formBuilder.group({
      firstName: ["", [Validators.required]],
      lastName: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
      confirmPassword: ["", [Validators.required]]
    }, {
      validator: ConfirmedValidator('password', 'confirmPassword')
    })
  }

  register() {
    if (this.registerForm.valid) {
      let newUser = Object.assign({}, this.registerForm.value);
      delete newUser["confirmPassword"]
      this.authService.register(newUser).subscribe(successResponse => {
        this.localStorageService.add("token", successResponse.data.token);
        if (this.rememberMe) {
          this.saveEmail(newUser.email);
        }
        this.authService.isLoggedIn = true;
        this.router.navigate([""]);
        this.toastrService.success("Opération réussie", "Connecté");
      }, errorResponse => {
        this.errorService.showBackendError(errorResponse, "Échec de l'enregistrement");
      })
    } else {
      this.toastrService.error("Certaines de vos informations n'ont pas pu être vérifiées", "Votre formulaire est incorrect");
    }
  }

  saveEmail(email: string) {
    this.localStorageService.add("remember", email);
  }
}
