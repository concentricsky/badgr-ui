import { AfterViewInit, Component, OnInit, Renderer2, ViewChild } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";

import { MessageService } from "./common/services/message.service";
import { SessionService } from "./common/services/session.service";
import { CommonDialogsService } from "./common/services/common-dialogs.service";
import { SystemConfigService } from "./common/services/config.service";
import { ShareSocialDialog } from "./common/dialogs/share-social-dialog.component";
import { ConfirmDialog } from "./common/dialogs/confirm-dialog.component";

import "../thirdparty/scopedQuerySelectorShim";
import { EventsService } from "./common/services/events.service";
import { OAuthManager } from "./common/services/oauth-manager.service";
import { EmbedService } from "./common/services/embed.service";
import { InitialLoadingIndicatorService } from "./common/services/initial-loading-indicator.service";
import { Angulartics2GoogleAnalytics } from "angulartics2";

import { ApiExternalToolLaunchpoint } from "app/externaltools/models/externaltools-api.model";
import { ExternalToolsManager } from "app/externaltools/services/externaltools-manager.service";


import { detect } from "detect-browser";
import {UserProfileManager} from "./common/services/user-profile-manager.service";
import {NewTermsDialog} from "./common/dialogs/new-terms-dialog.component";

// Shim in support for the :scope attribute
// See https://github.com/lazd/scopedQuerySelectorShim and
// https://stackoverflow.com/questions/3680876/using-queryselectorall-to-retrieve-direct-children/21126966#21126966

@Component({
	selector: "app",
	host: {
		'(document:click)': 'onDocumentClick($event)',
		'[class.app-is-hidden-chrome]': '! showAppChrome'
	},
	template: `
		<header class="header l-containerhorizontal" *ngIf="showAppChrome">

			<a class="logo" [class.logo-is-loading]="isRequestPending" [routerLink]="isOAuthAuthorizationInProcess ? null : ['/']">
				<picture>
					<source media="(min-width: 640px)" [srcset]="currentTheme.logoImg.desktop">
					<img [src]="currentTheme.logoImg.small" alt="Badgr logo">
				</picture>
			</a>

			<a class="header-x-menu"
			   href="javascript:void(0)"
			   onclick="document.getElementById('menu').scrollIntoView(false)">Main Navigation</a>
		</header>

		<!--<form-message></form-message>-->
		
		<div *ngIf="isUnsupportedBrowser" class="l-formmessage formmessage formmessage-is-{{status}}"
		     [class.formmessage-is-active]="isUnsupportedBrowser">
		    <p>The Browser you are using isn’t fully supported. Badgr may not display correctly and some features may not be accessible or function properly.</p>
		    <button type="button" (click)="dismissUnsupportedBrowserMessage()">Dismiss</button>
		</div>

		<article *ngIf="hasFatalError" class="emptyillustration l-containervertical">
			<h1 *ngIf="fatalMessage" class="title title-bold title-center title-is-smallmobile title-line-height-large emptyillustration-x-no-margin-bottom">{{fatalMessage}}</h1>
			<h1 *ngIf="fatalMessageDetail" class="title title-bold title-center title-is-smallmobile title-line-height-large">{{fatalMessageDetail}}</h1>
			<h1 *ngIf="!fatalMessage" class="title title-bold title-center title-is-smallmobile title-line-height-large emptyillustration-x-no-margin-bottom">Whoops! <span class='title title-x-linebreak'>The server has failed to respond.</span></h1>
			<h1 *ngIf="!fatalMessageDetail" class="title title-bold title-center title-is-smallmobile title-line-height-large">Please refresh and try again.</h1>
			<img [src]="unavailableImageSrc">
		</article>
		
		<router-outlet *ngIf="!hasFatalError"></router-outlet>

		<confirm-dialog #confirmDialog></confirm-dialog>
		<new-terms-dialog #newTermsDialog></new-terms-dialog>
		<share-social-dialog #shareSocialDialog></share-social-dialog>

		<footer class="wrap l-containerhorizontal" *ngIf="showAppChrome">
			<div class="footer">
				<ul>
					<li *ngIf="currentTheme.showPoweredByBadgr">Powered by <a href="https://badgr.io">Badgr</a></li>
					<li *ngIf="currentTheme.providedBy">
						Provided by <a href="{{ currentTheme.providedBy.url}}"target="_blank">{{ currentTheme.providedBy.name }}</a>
					</li>
					
					<li><a [href]="currentTheme.termsOfServiceLink ? currentTheme.termsOfServiceLink : 'http://info.badgr.io/terms-of-service.html'" target="_blank">Terms of Service</a></li>
					<li><a [href]="currentTheme.privacyPolicyLink ? currentTheme.privacyPolicyLink : 'http://info.badgr.io/privacy-policy.html'" target="_blank">Privacy Policy</a></li>
				</ul>
				<!--<a href="{{ apiBaseUrl }}/docs/" *ngIf="currentTheme.showApiDocsLink" target="_blank">API documentation</a>-->
				<a href="https://support.badgr.io/docs/" *ngIf="currentTheme.showApiDocsLink" target="_blank">Documentation</a>
			</div>
		</footer>

		<nav class="menu" id="menu" *ngIf="showAppChrome">
			<h1 class="visuallyhidden">Main Navigation</h1>

			<ul>
				<!-- Non-Authenticated Menu -->
				<ng-template [ngIf]="! loggedIn">
					<li class="menuitem" routerLinkActive="menuitem-is-active"><a [routerLink]="['/auth/login']">Sign In</a></li>
					<li class="menuitem" routerLinkActive="menuitem-is-active"><a [routerLink]="['/signup']">Create Account</a></li>
				</ng-template>

				<!-- Authenticated Menu -->
				<ng-template [ngIf]="loggedIn && ! isOAuthAuthorizationInProcess">
					<li class="menuitem" routerLinkActive="menuitem-is-active"><a [routerLink]="['/recipient/badges']">Backpack</a></li>
					<li class="menuitem" routerLinkActive="menuitem-is-active"><a [routerLink]="['/recipient/badge-collections']">Collections</a>
					</li>
					<li class="menuitem" routerLinkActive="menuitem-is-active"><a [routerLink]="['/issuer']">Issuers</a></li>
					<li class="menuitem" *ngIf="launchpoints?.length" routerLinkActive="menuitem-is-active">
						<button>Apps</button>
						<ul>
							<li class="menuitem menuitem-secondary" *ngFor="let lp of launchpoints"  routerLinkActive="menuitem-is-active">
								<a href="{{lp.launch_url}}" target="_blank">{{lp.label}}</a>
							</li>
						</ul>
					</li>
					<li class="menuitem" *ngIf="currentTheme.customMenu">
						<button>{{ currentTheme.customMenu.label }}</button>
						<ul>
							<li class="menuitem menuitem-secondary" *ngFor="let item of currentTheme.customMenu.items">
								<a [href]="item.url" target="_blank">{{ item.label }}</a></li>
						</ul>
					</li>
					<li class="menuitem" routerLinkActive="menuitem-is-active">
						<button>Account</button>
						<ul>
							<li class="menuitem menuitem-secondary" routerLinkActive="menuitem-is-active">
								<a [routerLink]="['/profile/profile']">Profile</a></li>
							<li class="menuitem menuitem-secondary" routerLinkActive="menuitem-is-active">
								<a [routerLink]="['/profile/app-integrations']">App Integrations</a></li>
							<li class="menuitem menuitem-secondary" routerLinkActive="menuitem-is-active">
								<a [routerLink]="['/auth/logout']">Sign Out</a></li>
						</ul>
					</li>
				</ng-template>
			</ul>
		</nav>
	`
})
export class AppComponent implements OnInit, AfterViewInit {
	title = "Badgr Angular";
	loggedIn: boolean = false;
	isUnsupportedBrowser: boolean = false;
	launchpoints: ApiExternalToolLaunchpoint[];

	copyrightYear = new Date().getFullYear();

	@ViewChild("confirmDialog")
	private confirmDialog: ConfirmDialog;

	@ViewChild("newTermsDialog")
	private newTermsDialog: NewTermsDialog;

	@ViewChild("shareSocialDialog")
	private shareSocialDialog: ShareSocialDialog;

	@ViewChild("issuerLink")
	private issuerLink: any;

	get showAppChrome() {
		return ! this.embedService.isEmbedded;
	}

	get currentTheme() { return this.configService.currentTheme }

	get apiBaseUrl() {
		return this.configService.apiConfig.baseUrl;
	}

	get hasFatalError() : boolean {
		return this.messageService.hasFatalError
	}
	get fatalMessage() : string {
		return (this.messageService.message ? this.messageService.message.message : undefined);
	}
	get fatalMessageDetail() : string {
		return (this.messageService.message ? this.messageService.message.detail : undefined);
	}

	readonly unavailableImageSrc = require("../breakdown/static/images/badgr-unavailable.svg");

	constructor(
		private sessionService: SessionService,
		private profileManager: UserProfileManager,
		private router: Router,
		private messageService: MessageService,
		private configService: SystemConfigService,
		private commonDialogsService: CommonDialogsService,
		private eventService: EventsService,
		private oAuthManager: OAuthManager,
		private embedService: EmbedService,
		private renderer: Renderer2,
		private externalToolsManager: ExternalToolsManager,
		private initialLoadingIndicatorService: InitialLoadingIndicatorService,
		private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics   // required for angulartics to work

	) {
		messageService.useRouter(router);

		this.initScrollFix();
		this.initAnalytics();

		if (sessionService.isLoggedIn) {
			profileManager.userProfilePromise.then(profile => {
				if (profile.agreedTermsVersion != profile.latestTermsVersion) {
					this.commonDialogsService.newTermsDialog.openDialog();
				}
			});
		}

		this.externalToolsManager.getToolLaunchpoints("navigation_external_launch").then(launchpoints => {
			this.launchpoints = launchpoints.filter(lp => Boolean(lp) );
		})

		if (this.embedService.isEmbedded) {
			// Enable the embedded indicator class on the body
			renderer.addClass(document.body, "embeddedcontainer")
		}

		var browser = detect();
		if (browser) {
			if (browser.name.toLowerCase() == "ie") {
				this.isUnsupportedBrowser = true;
			}
		}
	}

	dismissUnsupportedBrowserMessage() {
		this.isUnsupportedBrowser = false;
	}

	get isOAuthAuthorizationInProcess() {
		return this.oAuthManager.isAuthorizationInProgress;
	}

	onDocumentClick($event: MouseEvent) {
		this.eventService.documentClicked.next($event);
	}

	get isRequestPending() {
		return this.messageService.pendingRequestCount > 0;
	}

	private initScrollFix() {
		// Scroll the header into view after navigation, mainly for mobile where the menu is at the bottom of the display
		this.router.events.subscribe(url => {
			let header = document.querySelector("header") as HTMLElement;
			if (header) {
				header.scrollIntoView();
			}
		});
	}

	private initAnalytics() {
		if (this.configService.googleAnalyticsConfig.trackingId) {
			(function (i, s, o, g, r, a?, m?) {
				i[ 'GoogleAnalyticsObject' ] = r;
				i[ r ] = i[ r ] || function () {
					(i[ r ].q = i[ r ].q || []).push(arguments)
				}, i[ r ].l = 1 * (new Date() as any);
				a = s.createElement(o),
					m = s.getElementsByTagName(o)[ 0 ];
				a.async = 1;
				a.src = g;
				m.parentNode.insertBefore(a, m)
			})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

			window[ "ga" ]('create', this.configService.googleAnalyticsConfig.trackingId, 'auto');
		}
	}

	ngOnInit() {
		this.loggedIn = this.sessionService.isLoggedIn;

		this.sessionService.loggedin$.subscribe(
			loggedIn => setTimeout(() => this.loggedIn = loggedIn)
		);
	}

	ngAfterViewInit() {
		this.commonDialogsService.init(
			this.confirmDialog,
			this.shareSocialDialog,
			this.newTermsDialog
		);
	}
}
