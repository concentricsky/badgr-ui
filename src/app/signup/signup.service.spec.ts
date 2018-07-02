import { BaseRequestOptions, Http, Response, ResponseOptions } from "@angular/http";
import { MockBackend } from "@angular/http/testing";
import { TestBed, inject } from "@angular/core/testing";
import { SystemConfigService } from "../common/services/config.service";
import { SignupModel } from "./signup-model.type";
import { SignupService } from "./signup.service";
import { MessageService } from "../common/services/message.service";
import { SessionService } from "../common/services/session.service";


describe('SignupService', () => {
	beforeEach(() => TestBed.configureTestingModule({
		declarations: [  ],
		providers: [
			SystemConfigService,
			MockBackend,
			BaseRequestOptions,
			MessageService,
			{ provide: 'config', useValue: { api: { baseUrl: '' }, features: {} } },
			{
				provide: Http,
				useFactory: (backend, options) => new Http(backend, options),
				deps: [ MockBackend, BaseRequestOptions ]
			},

			SignupService,
			SessionService,
		],
		imports: [ ]
	}));

	it("should send signup payload",
		inject([ MockBackend, SignupService ], (backend, signupService) => {
			var connection, error, signupModel;

			backend.connections.subscribe(c => connection = c);

			signupModel = new SignupModel(
				'username@email.com', 'Firstname', 'Lastname', 'password', true, true);
			signupService.submitSignup(signupModel)
				.subscribe(
					(res) => { error = false },
					(err) => { error = true }
				);

			connection.mockRespond(new Response(
				new ResponseOptions({ 'status': 200 })));

			expect(error).toBe(false);
		})
	);
});
