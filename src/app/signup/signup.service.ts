import { Injectable } from "@angular/core";
import { Http, Headers } from "@angular/http";
import { SystemConfigService } from "../common/services/config.service";
import { SignupModel } from "./signup-model.type";
import { Observable } from "rxjs/Observable";
import { ApiUserProfile } from "../common/model/user-profile-api.model";


@Injectable()
export class SignupService {
	baseUrl: string;

	constructor(private http: Http, private configService: SystemConfigService) {
		this.baseUrl = this.configService.apiConfig.baseUrl;
	}

	submitSignup(signupModel: SignupModel) {

		const endpoint = this.baseUrl + '/v1/user/profile';
		const payload = {
			email: signupModel.username,
			first_name: signupModel.firstName,
			last_name: signupModel.lastName,
			password: signupModel.password,
			agreed_terms_service: signupModel.agreedTermsService,
			marketing_opt_in: signupModel.marketingOptIn,
		};

		const headers = new Headers();
		headers.append('Content-Type', 'application/json');
		headers.set('Accept', '*/*');

		return new Observable<ApiUserProfile>((observer) => {

			this.http.post(endpoint, JSON.stringify(payload), { headers: headers }).subscribe((r) => {
				observer.next(r.json())
			}, error => {
				observer.error(error.json())
			});

		});

	}
}
