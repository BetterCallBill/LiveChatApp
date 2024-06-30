import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
	AbstractControl,
	UntypedFormBuilder,
	UntypedFormGroup,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../_services/account.service';

@Component({
	selector: 'app-register',
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
	@Output() cancelRegister = new EventEmitter();
	registerForm: UntypedFormGroup;
	maxDate: Date;
	validationErrors: string[] = [];

	constructor(
		private fb: UntypedFormBuilder,
		private accountService: AccountService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.initializeForm();
		this.maxDate = new Date();
		this.maxDate.setFullYear(this.maxDate.getFullYear() - 18);
	}

	initializeForm() {
		this.registerForm = this.fb.group({
			gender: ['male'],
			username: ['', Validators.required],
			knownAs: ['', Validators.required],
			dateOfBirth: ['', Validators.required],
			suburb: ['', Validators.required],
			street: ['', Validators.required],
			password: [
				'',
				[
					Validators.required,
					Validators.minLength(4),
					Validators.maxLength(12),
				],
			],
			confirmPassword: [
				'',
				[Validators.required, this.matchValues('password')],
			],
		});

		this.registerForm.controls.password.valueChanges.subscribe(() => {
			this.registerForm.controls.confirmPassword.updateValueAndValidity();
		});
	}

	// Customize validator
	matchValues(matchTo: string): ValidatorFn {
		return (control: AbstractControl) => {
			return control?.value === control?.parent?.controls[matchTo].value
				? null
				: { isMatching: true };
		};
	}

	register() {
		this.accountService.register(this.registerForm.value).subscribe(
			(response) => {
				this.router.navigateByUrl('/members');
			},
			(error) => {
				this.validationErrors = error;
			}
		);
	}

	cancel() {
		this.cancelRegister.emit(false);
	}
}
