import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../service/auth.service';
import {Router} from '@angular/router';
import {CookieService} from '../../service/cookie.service';
import {TokenProvider} from '../../provider/token-provider';
import {MeProvider} from '../../provider/me-provider';

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
	            private tokenProvider: TokenProvider,
	            private meProvider: MeProvider,
	            private cookieService: CookieService,
	            private router: Router) {
	}

	ngOnInit() {
	}

	login() {
		this.authService.authenticate(this.credentials.login, this.credentials.password).subscribe(
			token => {
				this.credentials.password = null;

				this.tokenProvider.setToken(token);
				// TODO: refactor so tokenProvider deal with cookies
				this.cookieService.setToken(token);

				this.authService.validate(token).subscribe(user => {
					this.meProvider.setMe(user);
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
