export class SignupModel {
	constructor(
		public username: string,
		public firstName: string,
		public lastName: string,
		public password: string,
		public agreedTermsService: boolean,
		public marketingOptIn: boolean
	) { }
}
