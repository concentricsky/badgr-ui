import { Component, ViewChild, AfterViewInit, ElementRef, Renderer, Renderer2 } from "@angular/core";


import { registerDialog } from "dialog-polyfill/dialog-polyfill";
import { BaseDialog } from "./base-dialog";
import {SystemConfigService} from "../services/config.service";
import {UserProfileManager} from "../services/user-profile-manager.service";
import {UserProfile} from "../model/user-profile.model";

@Component({
	selector: 'new-terms-dialog',
	template: `
    <dialog class="dialog dialog-titled wrap wrap-light">
				<header class="dialog-x-titlebar">
						<h1>Updated Terms of Service</h1>
				</header>
				<div class="dialog-x-content">
						<p>We’ve updated our <a target="_blank" [href]="termsOfServiceLink">Terms of Service</a>. </p>
						
						<p *ngIf="profile && profile.latestTermsDescription">{{profile.latestTermsDescription}}</p>

						<label [class.formcheckbox-is-error]="isErrorState" class="formcheckbox l-marginBottom-2x" for="terms">
							<input name="terms" id="terms" type="checkbox" [(ngModel)]="agreedToTerms">
							<span class="formcheckbox-x-text">I have read and agree to the <a target="_blank" [href]="termsOfServiceLink">Terms of Service</a>.</span>
							<span *ngIf="isErrorState" class="formcheckbox-x-errortext">Please read and agree to the Terms of Service if you want to continue.</span>
						</label>

						<div class="l-childrenhorizontal l-childrenhorizontal-right">
								<a *ngIf="termsHelpLink" [href]="termsHelpLink">Need Help?</a>
								<button class="button" (click)="submitAgreement()">Continue</button>
						</div>
				</div>
    </dialog>
    `,
})
export class NewTermsDialog extends BaseDialog {

	agreedToTerms: boolean = false;

	hasSubmitted: boolean = false;

	profile: UserProfile;

	constructor(
		componentElem: ElementRef,
		renderer: Renderer2,
		private configService: SystemConfigService,
		private profileManager: UserProfileManager
	) {
		super(componentElem, renderer);
		this.profileManager.userProfilePromise.then(profile => {
			this.profile = profile;
		})
	}

	get termsOfServiceLink() {
		return this.configService.currentTheme.termsOfServiceLink ? this.configService.currentTheme.termsOfServiceLink : 'http://info.badgr.io/terms-of-service.html';
	}

	get termsHelpLink() {
		return this.configService.currentTheme.termsHelpLink;
	}

	get isErrorState(): boolean {
		return this.hasSubmitted && !this.agreedToTerms;
	}

	submitAgreement() {

		this.hasSubmitted = true;
		if (this.agreedToTerms ) {
			this.profile.agreeToLatestTerms().then(_ => {
				this.closeDialog();
			});
		}

	}

	openDialog() {
		this.showModal();
	}

	closeDialog() {
		this.closeModal();
	}
}
