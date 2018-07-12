import { Injectable } from "@angular/core";
import { OAuthApiService } from "./oauth-api.service";
import { SessionService } from "./session.service";
import {
	ApiOAuth2AppAuthorization, ApiOAuth2AppInfo, ApiOAuth2ClientAuthorized,
	OAuth2RequestParams
} from "../model/oauth-api.model";
import { flatten } from "../util/array-reducers";
import { StandaloneEntitySet } from "../model/managed-entity-set";
import { OAuth2AppAuthorization } from "../model/oauth.model";
import { CommonEntityManager } from "../../entity-manager/common-entity-manager.service";
import {CommonDialogsService} from "./common-dialogs.service";

const OAUTH_STATE_STORAGE_NAME = "oauthState";

@Injectable()
export class OAuthManager {
	public readonly authorizedApps = new StandaloneEntitySet<OAuth2AppAuthorization, ApiOAuth2AppAuthorization>(
		() => new OAuth2AppAuthorization(this.commonEntityManager),
		apiModel => apiModel.entityId,
		() => this.oauthApi.listAuthorizations()
	);

	/**
	 * Metadata about the scope identifier returned from the server. Each grouping of scopes represents a logical
	 * category which will be presented to the user. The first rule in the category that matches a scope identifier
	 * from the server will be displayed.
	 */
	readonly scopeMetadata: ScopeGroupRule[][] = [
		[
			{ scopeId: "rw:issuer",       cssName: "permission-issuer",     label: "View and modify your Issuers" },
			{ scopeId: "r:issuer",        cssName: "permission-issuer",     label: "View your Issuers" },
		],
		[
			{ scopeId: "rw:backpack",     cssName: "permission-assertion",  label: "View and modify your Awarded Badges" },
			{ scopeId: "r:backpack",      cssName: "permission-assertion",  label: "View your awarded badges" },
		],
		[
			{ scopeId: "rw:profile",      cssName: "permission-profile",    label: "View and modify your profile and email addresses" },
			{ scopeId: "r:profile",       cssName: "permission-profile",    label: "View your profile and email addresses" },
		]
	];

	private _oAuthState: OAuthState | null = null;
	private get oAuthState() { return this._oAuthState }
	private set oAuthState(state: OAuthState) {
		this._oAuthState = state;
		try {
			window.localStorage[OAUTH_STATE_STORAGE_NAME] = JSON.stringify(state);
		} catch (e) {}
	}

	constructor(
		public oauthApi: OAuthApiService,
		private sessionService: SessionService,
		private commonEntityManager: CommonEntityManager,
		private commonDialogsService: CommonDialogsService
	) {
		this._oAuthState = window.localStorage[OAUTH_STATE_STORAGE_NAME] && JSON.parse(window.localStorage[OAUTH_STATE_STORAGE_NAME]);
	}

	get isAuthorizationInProgress() {
		return !! this.oAuthState;
	}

	get currentAuthorization(): ApiOAuth2AppInfo | null {
		return this.oAuthState && this.oAuthState.clientInfo || null;
	}

	presentationScopesForScopes(scopeIds: string[]) {
		const matchingGroups = this.scopeMetadata
			.map(group => ({ group, matchingRule: group.find(rule => scopeIds.indexOf(rule.scopeId) >= 0) }))
			.filter(g => !!g.matchingRule);

		const matchingGroupScopeIds = matchingGroups
			.map(g => g.group.map(r => r.scopeId))
			.reduce(flatten<string>(), []);

		const unmatchedScopeIds = scopeIds.filter(id => matchingGroupScopeIds.indexOf(id) < 0);

		return [
			... matchingGroups.map(g => g.matchingRule),
			... unmatchedScopeIds.map(scopeId => ({
				scopeId,
				cssName: "permission-unknown",
				label: this.currentAuthorization.scopes_descriptions ? (this.currentAuthorization.scopes_descriptions[scopeId] || scopeId) : scopeId
			}))
		];
	}

	public cancelCurrentAuthorization() {
		let redirectUrl = this.oAuthState.redirectUrl;
		redirectUrl += (redirectUrl.indexOf('?') < 0) ? '?' : '&';
		redirectUrl += "error=access_denied&error_code=200&error_description=Permissions+error&error_reason=user_denied";
		redirectUrl += "&state=" + encodeURIComponent(this.oAuthState.stateString);

		window.location.href = redirectUrl;
		this.oAuthState = null;
	}

	startOAuth2Authorization(
		request: OAuth2RequestParams
	): Promise<AuthAttemptResult> {
		this.oAuthState = null;

		return this.oauthApi.startAuthorization(request)
			.then(clientInfo => {
				if ("success_url" in clientInfo) {
					this.performRedirect((clientInfo as ApiOAuth2ClientAuthorized)["success_url"]);
					return AuthAttemptResult.SUCCESS;
				} else {
					this.oAuthState = { ... request, clientInfo: clientInfo as ApiOAuth2AppInfo };

					if (this.sessionService.isLoggedIn) {
						return AuthAttemptResult.AUTHORIZATION_REQUIRED;
					} else {
						return AuthAttemptResult.LOGIN_REQUIRED;
					}
				}
			})
	}

	authorizeCurrentApp(): Promise<ApiOAuth2ClientAuthorized> {
		return this.oauthApi.authorizeApp(this.oAuthState, this.oAuthState.clientInfo.scopes).then(
			response => {
				this.performRedirect(response.success_url);
				return response;
			}
		);
	}

	private performRedirect(successUrl: string) {
		this.clearPersistentAuthorization();
		const do_redirect = () => {
			window.location.href = successUrl;
		};

		if (this.commonDialogsService.newTermsDialog.isOpen) {
			this.commonDialogsService.newTermsDialog.agreedPromise.then(() => {
				do_redirect();
			})
		} else {
			do_redirect();
		}
	}

	private clearPersistentAuthorization() {
		try {
			window.localStorage.removeItem(OAUTH_STATE_STORAGE_NAME);
		} catch (e) {}
	}
}

interface OAuthState extends OAuth2RequestParams {
	readonly clientInfo?: ApiOAuth2AppInfo
}

export enum AuthAttemptResult {
	SUCCESS,
	LOGIN_REQUIRED,
	AUTHORIZATION_REQUIRED
}

export interface ScopeGroupRule {
	scopeId: string
	cssName: string
	label: string
}