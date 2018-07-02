import { Injectable } from "@angular/core";
import { Headers, Http, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "../../rxjs-operators";

import { UserCredential } from "../model/user-credential.type";
import { SystemConfigService } from "./config.service";
import { MessageService } from "./message.service";
import { BaseHttpApiService } from "./base-http-api.service";
import { SocialAccountProviderInfo, socialAccountProviderInfos } from "../model/user-profile-api.model";
import { throwExpr } from "../util/throw-expr";

/**
 * The key used to store the authentication token in session and local storage.
 *
 * NOTE: This name is also referenced in the landing redirect code in index.html.
 *
 * @type {string}
 */
const TOKEN_STORAGE_KEY = "LoginService.token";

export interface AuthorizationToken {
	token: string;
}

@Injectable()
export class SessionService {
	baseUrl: string;

	loggedin$: Observable<boolean>;
	loggedinObserver: any;

	enabledExternalAuthProviders: SocialAccountProviderInfo[];

	constructor(
		private http: Http,
		private configService: SystemConfigService,
		private messageService: MessageService
	) {
		this.baseUrl = this.configService.apiConfig.baseUrl;
		this.enabledExternalAuthProviders = socialAccountProviderInfos.filter(providerInfo =>
			! this.configService.featuresConfig.socialAccountProviders || this.configService.featuresConfig.socialAccountProviders.includes(providerInfo.slug)
		);

		this.loggedin$ = new Observable<boolean>(observer => this.loggedinObserver = observer).share()
	}

	login(credential: UserCredential, sessionOnlyStorage: boolean = false): Promise<AuthorizationToken> {
		const endpoint = this.baseUrl + '/api-auth/token';
		const payload = 'username=' + encodeURIComponent(credential.username) + '&password=' + encodeURIComponent(
				credential.password);

		const headers = new Headers();
		headers.append('Content-Type', 'application/x-www-form-urlencoded');

		// Update global loading state
		this.messageService.incrementPendingRequestCount();

		const result = this.http.post(endpoint, payload, { headers: headers });

		result.toPromise().then(
			() => this.messageService.decrementPendingRequestCount(),
			() => this.messageService.decrementPendingRequestCount(),
		);

		return result.flatMap(
			r => {
				if (r.status < 200 || r.status >= 300) {
					return Observable.throw(new Error("Login Failed: " + r.status));
				}
				return Observable.of(r.json());
			}
		).map(
			(result: AuthorizationToken) => {
				this.storeToken(result, sessionOnlyStorage);
				return result
			}
		).toPromise().then(BaseHttpApiService.addTestingDelay(this.configService));
	}

	initiateUnauthenticatedExternalAuth(provider: SocialAccountProviderInfo) {
		var auth_provider = provider.slug + ""
		if(provider.slug === "microsoft"){
				auth_provider = "azure"
		}
		window.location.href = `${this.baseUrl}/account/sociallogin?provider=${encodeURIComponent(auth_provider)}`;
	}

	initiateAuthenticatedExternalAuth(provider: SocialAccountProviderInfo) {
		var auth_provider = provider.slug + ""
		if(provider.slug === "microsoft"){
				auth_provider = "azure"
		}
		window.location.href = `${this.baseUrl}/account/sociallogin?provider=${encodeURIComponent(auth_provider)}&authToken=${this.currentAuthToken.token}`;
	}

	logout(): void {
		localStorage.removeItem(TOKEN_STORAGE_KEY);
		sessionStorage.removeItem(TOKEN_STORAGE_KEY);

		if (this.loggedinObserver) {
			this.loggedinObserver.next(false);
		}
	}

	storeToken(token: AuthorizationToken, sessionOnlyStorage = false): void {
		if (sessionOnlyStorage) {
			sessionStorage.setItem(TOKEN_STORAGE_KEY, token.token);
		} else {
			localStorage.setItem(TOKEN_STORAGE_KEY, token.token);
		}
		if (this.loggedinObserver) {
			this.loggedinObserver.next(true);
		}
	}

	get currentAuthToken(): AuthorizationToken | null {
		const tokenString = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY) || null;

		return tokenString
			? { token: tokenString }
			: null;
	}

	get requiredAuthToken(): AuthorizationToken {
		return this.currentAuthToken || throwExpr("An authentication token is required, but the user is not logged in.")
	}

	get isLoggedIn() {
		return !!(sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY));
	}

	submitResetPasswordRequest(email: string): Promise<Response> {
		const endpoint = this.baseUrl + '/v1/user/forgot-password';
		const payload = 'email=' + encodeURIComponent(email);

		const headers = new Headers();
		headers.append('Content-Type', 'application/x-www-form-urlencoded');

		return this.http.post(endpoint, payload, { headers: headers }).toPromise();
	}

	submitForgotPasswordChange(newPassword: string, token: string): Promise<Response> {
		const endpoint = this.baseUrl + '/v1/user/forgot-password';

		const payload = JSON.stringify({ password: newPassword, token: token });

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');

		return this.http.put(endpoint, payload, { headers: headers }).toPromise();
	}
}
