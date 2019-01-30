import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../service/auth.service';
import {MessengerService} from '../../service/messenger.service';
import {Router} from '@angular/router';
import {CookieService} from '../../service/cookie.service';

@Component({
	selector: 'app-auth',
	templateUrl: './auth.component.html',
	styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

	private credentials = {
		login: null,
		password: null
	};

	constructor(private authService: AuthService,
	            private messengerService: MessengerService,
	            private cookieService: CookieService,
	            private router: Router) {
	}

	ngOnInit() {
	}

	login() {
		this.authService.authenticate(this.credentials.login, this.credentials.password).subscribe(
			token => {
				this.credentials.password = null;

				this.messengerService.setToken(token);
				this.cookieService.setToken(token);

				this.authService.validate(token).subscribe(user => {
					this.messengerService.setMe(user);
					this.router.navigate(['/im'], {replaceUrl: true});
				});

			},
			error => {
				this.credentials.password = null;
				return console.error(error);
			}
		);
	}

}
